import * as nodeCrypto from "node:crypto";
import path from "node:path";
import type {Server} from "bun";
import {initTRPC, TRPCError} from "@trpc/server";
import type {FetchCreateContextFnOptions} from "@trpc/server/adapters/fetch";
import * as hiBase32 from "hi-base32";
import * as nodemailer from "nodemailer";
import * as OTPAuth from "otpauth";
import z from "zod";
import type {Instance} from "../../index.ts";
import type {AuditEntryInput} from "../audit.ts";
import {Authenticator} from "../authentication/authenticator.ts";
import {AuthorizedDeviceType, SESSION_VALID_TERM_MS, SessionCreationError} from "../authorization.ts";
import type ConfigurationSystem from "../configuration.ts";
import {WorkspacesFeatureFlags} from "../configuration.ts";
import {createPostgresDatabase, testPostgresConnection} from "../databaseCheck.ts";
import type {WorkspacesUser} from "../users.ts";
import {deleteCookie, getCookies, setCookie} from "../../utils/cookies.ts";
import {clientIp, isLocalRequest} from "../../utils/network.ts";

export const createOnlineWorkspaceTRPCContext = (instance: Instance) => (opt: FetchCreateContextFnOptions, server: Server<any>) => {
    return {
        rawRequest: {
            req: opt.req, resHeaders: opt.resHeaders, server: server,
        }, instance: instance,
    };
};

export const t = initTRPC.context<ReturnType<typeof createOnlineWorkspaceTRPCContext>>().create({
    sse: {
        ping: {
            // Enable periodic ping messages to keep connection alive
            enabled: true, // Send ping message every 2s
            intervalMs: 4000,
        }, client: {
            reconnectAfterInactivityMs: 5000,
        },
    },
});

/** what the web app looks for, to know to ask an administrator to set up two factor authentication */
export const TWO_FACTOR_REQUIRED_MESSAGE = "Two-factor authentication is required for administrators";

/** the procedures an administrator without two factor authentication is allowed to use, so they are able to set it up */
const TWO_FACTOR_SETUP_PROCEDURES = new Set([
    "authorization.enableTwoFactor",
    "authorization.confirmTwoFactor",
    "authorization.securityStatus",
    "authorization.logout",
    "authorization.logoutEverywhere",
    // so that the page which asks for it looks like the rest of the instance
    "theme.get",
]);

/** the cookie which keeps someone signed in, it can only be read by the backend and is only ever sent to this instance */
export const setSessionCookie = (headers: Headers, instance: Instance, sessionToken: string, domain?: string) => {
    setCookie(headers, {
        name: "Authorization",
        value: sessionToken,
        secure: true,
        httpOnly: true,
        maxAge: Math.floor(SESSION_VALID_TERM_MS / 1000),
        domain: domain ?? instance.sys.configuration.proxy.hostname,
        sameSite: "Strict",
        path: "/",
    });
};

export const publicProcedure = t.procedure.use(async (opt) => {
    return opt.next({
        ctx: {
            userId: "THIS CAN ONLY BE ACCESSED FROM A NON-PUBLIC PROCEDURE",
        },
    });
});
export const procedure = t.procedure.use(async (opt) => {
    const cookies = getCookies(opt.ctx.rawRequest.req.headers);

    if (!cookies.Authorization) {
        throw new TRPCError({
            code: "UNAUTHORIZED", message: "missing auth cookie",
        });
    }

    const userId = await opt.ctx.instance.sys.authorization.verifySession(decodeURIComponent(cookies.Authorization!), {allowTwoFactorSetup: true});

    if (userId === undefined) {
        throw new TRPCError({code: "UNAUTHORIZED", message: "invalid session"});
    }

    // administrators can only get as far as setting up two factor authentication until they have
    if (!TWO_FACTOR_SETUP_PROCEDURES.has(opt.path) && (await opt.ctx.instance.sys.authorization.requiresTwoFactorSetup(userId))) {
        throw new TRPCError({code: "FORBIDDEN", message: TWO_FACTOR_REQUIRED_MESSAGE});
    }

    return opt.next({
        ctx: {
            userId: userId, user: (): Promise<WorkspacesUser> => // @ts-ignore
                opt.ctx.instance.sys.users.getUserById(userId),
        },
    });
});
export const adminProcedure = procedure.use(async (opt) => {
    const user = await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId);

    if (!user) {
        throw new TRPCError({code: "UNAUTHORIZED", message: "invalid session"});
    }

    if (!(await user.isAdministrator())) {
        throw new TRPCError({
            code: "UNAUTHORIZED", message: "user lacks administrator permissions",
        });
    }

    const ip = clientIp(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server);
    let recorded = false;

    /** records what the administrator did in the audit log, a procedure which does not say anything more specific has a general entry made for it */
    const audit = (entry: Omit<AuditEntryInput, "actorId" | "ip">) => {
        recorded = true;
        opt.ctx.instance.sys.audit.record({...entry, actorId: user.userId, ip});
    };

    const result = await opt.next({ctx: {audit}});

    if (opt.type === "mutation" && !recorded) {
        opt.ctx.instance.sys.audit.record({action: `admin.${opt.path}`, actorId: user.userId, ip, outcome: result.ok ? "success" : "failure"});
    }

    return result;
});

const temporaryTwoFactorSecrets: Map<number, string> = new Map();
const EMAIL_CODE_LENGTH = 8;
const EMAIL_CODE_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const EMAIL_CODE_VALID_MS = 15 * 60 * 1000;
const EMAIL_CODE_RESEND_MS = 60 * 1000;
const EMAIL_CODE_MAX_ATTEMPTS = 5;
/** the codes sent to prove someone owns the address they are signing up with, they expire and can only be guessed at a few times */
const emailSignupVerificationCodes: Map<string, { code: string; expires: number; sentAt: number; attempts: number }> = new Map();

const normaliseEmailAddress = (emailAddress: string) => emailAddress.trim().toLowerCase();

const generateEmailCode = () => {
    let code = "";
    for (let i = 0; i < EMAIL_CODE_LENGTH; i++) code += EMAIL_CODE_CHARS[nodeCrypto.randomInt(EMAIL_CODE_CHARS.length)];
    return code;
};

/** @param consume the code can be used once, so a code which was right is forgotten */
const emailCodeIsCorrect = (emailAddress: string, given: string, consume = false) => {
    const key = normaliseEmailAddress(emailAddress);
    const entry = emailSignupVerificationCodes.get(key);

    if (!entry || entry.expires < Date.now() || entry.attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
        emailSignupVerificationCodes.delete(key);
        return false;
    }

    const a = Buffer.from(entry.code);
    const b = Buffer.from(given);

    if (a.length !== b.length || !nodeCrypto.timingSafeEqual(a, b)) {
        entry.attempts++;
        return false;
    }

    if (consume) emailSignupVerificationCodes.delete(key);

    return true;
};

const PASSWORD_RESET_CODE_LENGTH = 8;
const PASSWORD_RESET_CODE_VALID_MS = 15 * 60 * 1000;
const PASSWORD_RESET_RESEND_MS = 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const passwordResetCodes: Map<number, { code: string; expires: number; sentAt: number; attempts: number }> = new Map();

const generatePasswordResetCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < PASSWORD_RESET_CODE_LENGTH; i++) code += chars[nodeCrypto.randomInt(chars.length)];
    return code;
};

const passwordResetCodeMatches = (expected: string, given: string) => {
    const a = Buffer.from(expected);
    const b = Buffer.from(given.trim().toUpperCase());
    return a.length === b.length && nodeCrypto.timingSafeEqual(a, b);
};

export const getPasswordRequirementError = (instance: Instance, password: string, req: ConfigurationSystem["signupRequirements"] = instance.sys.configuration.signupRequirements): string | undefined => {
    const count = (re: RegExp) => password.match(re)?.length || 0;

    if (req.passwordMinimumLength !== undefined && password.length < req.passwordMinimumLength) return `Your password must be at least ${req.passwordMinimumLength} characters long`;
    if (count(/[a-z]/g) < (req.passwordContains?.minimumLowercase || 0)) return "Your password does not contain enough lowercase letters";
    if (count(/[A-Z]/g) < (req.passwordContains?.minimumUppercase || 0)) return "Your password does not contain enough uppercase letters";
    if (count(/[0-9]/g) < (req.passwordContains?.minimumNumbers || 0)) return "Your password does not contain enough numbers";
    if (count(/[^a-zA-Z0-9]/g) < (req.passwordContains?.minimumSymbols || 0)) return "Your password does not contain enough symbols";
    return undefined;
};


const SETUP_RECOMMENDED = {
    passwordMinimumLength: 8,
    passwordContains: {minimumUppercase: 1, minimumLowercase: 1, minimumNumbers: 1, minimumSymbols: 1},
    quotaSize: 1024 * 1024 * 1024,
};

/** applications which the instance cannot be administered without */
const SIGNUP_USERNAME = z.string().trim().toLowerCase().regex(/^[a-z0-9_.-]{2,32}$/, "Usernames are 2-32 characters of letters, numbers, '.', '_' or '-'");

const SETUP_REQUIRED_APPLICATIONS = ["uk.ewsgit.dashboard", "uk.ewsgit.settings", "uk.ewsgit.store"];

const mailServerInput = z.object({
    enabled: z.boolean(),
    host: z.string().trim().max(253),
    port: z.number().int().min(1).max(65535),
    secure: z.boolean(),
    auth: z.object({user: z.string().max(320), pass: z.string().max(1000)}),
});

const setupInput = z.object({
    token: z.string(),
    identity: z.object({
        displayName: z.string().trim().min(1).max(60),
        tagline: z.string().trim().max(120),
        metaDescription: z.string().trim().max(300),
        showLoginBackground: z.boolean(),
        showLoginBanner: z.boolean(),
        defaultTheme: z.object({lightMode: z.record(z.string(), z.string()), darkMode: z.record(z.string(), z.string())}).nullable(),
    }),
    administrator: z.object({
        username: z.string().trim().toLowerCase().regex(/^[a-z0-9_.-]{2,32}$/, "Usernames are 2-32 characters of letters, numbers, '.', '_' or '-'"),
        displayName: z.string().trim().min(1).max(60),
        email: z.string().trim().max(320).optional(),
        gender: z.enum(["female", "male", "other"]),
        pronouns: z.string().trim().max(40).optional(),
        password: z.string().min(1).max(1000),
    }),
    address: z.object({hostname: z.string().trim().min(1).max(253), secure: z.boolean()}),
    access: z.object({
        allowSignups: z.boolean(),
        displayProfilesAtLogon: z.boolean(),
        requireEmail: z.boolean(),
        requireTwoFactor: z.boolean(),
        passwordMinimumLength: z.number().int().min(1).max(128),
        passwordContains: z.object({
            minimumUppercase: z.number().int().min(0).max(32),
            minimumLowercase: z.number().int().min(0).max(32),
            minimumNumbers: z.number().int().min(0).max(32),
            minimumSymbols: z.number().int().min(0).max(32),
        }),
    }),
    mailServer: mailServerInput,
    newUsers: z.object({
        quotaSize: z.number().int().min(0),
        homeDirectories: z.array(z.string().trim().min(1).max(100).regex(/^[^/\\]+$/, "Folder names cannot contain slashes")).max(50),
        displayNameFormat: z.string().trim().min(1).max(100),
    }),
    applications: z.object({enabled: z.array(z.string()), quickShortcuts: z.array(z.string())}),
    termsOfUse: z.string().trim().min(1).max(20000),
    /** only accepted from localhost */
    developmentInstall: z.boolean().default(false),
});

let setupInProgress = false;

const assertSetupAvailable = (instance: Instance, token: string) => {
    if (instance.sys.configuration.setupComplete) {
        throw new TRPCError({code: "FORBIDDEN", message: "This instance has already been set up"});
    }

    if (!instance.sys.configuration.verifySetupToken(token)) {
        throw new TRPCError({code: "UNAUTHORIZED", message: "The setup token is incorrect"});
    }
};

const postgresInput = z.object({
    host: z.string().trim().min(1).max(253),
    port: z.number().int().min(1).max(65535),
    user: z.string().trim().min(1).max(63),
    password: z.string().max(1000),
    /** use the password which is already configured, as it is never sent to the browser */
    keepExistingPassword: z.boolean(),
    database: z.string().trim().min(1).max(63),
});

const resolvePostgresInput = (instance: Instance, input: z.infer<typeof postgresInput>) => ({
    host: input.host,
    port: input.port,
    user: input.user,
    database: input.database,
    password: input.keepExistingPassword ? instance.sys.configuration.databases.postgres.password : input.password,
});

/** The setup procedures which work without a database, these are all that exist while the instance is in setup mode. */
const setupBootstrapRouter = {
        status: publicProcedure
            .output(z.object({complete: z.boolean(), mode: z.enum(["setup", "full", "auto"])}))
            .query(async (opt) => ({complete: opt.ctx.instance.sys.configuration.setupComplete, mode: opt.ctx.instance.mode})),
        verifyToken: publicProcedure
            .input(z.object({token: z.string()}))
            .output(z.object({valid: z.boolean()}))
            .mutation(async (opt) => {
                if (opt.ctx.instance.sys.configuration.setupComplete) {
                    throw new TRPCError({code: "FORBIDDEN", message: "This instance has already been set up"});
                }

                // slows down guessing the token
                await Bun.sleep(500);

                return {valid: opt.ctx.instance.sys.configuration.verifySetupToken(opt.input.token)};
            }),
        database: {
            /** the database as it is configured, and whether it can be used, the password is never sent */
            current: publicProcedure
                .input(z.object({token: z.string()}))
                .query(async (opt) => {
                    assertSetupAvailable(opt.ctx.instance, opt.input.token);

                    const {host, port, user, database, password} = opt.ctx.instance.sys.configuration.databases.postgres;
                    const result = await testPostgresConnection({host, port, user, database, password});
                    const env = process.env;

                    return {
                        host, port, user, database,
                        hasPassword: password !== "",
                        environmentOverride: [env.ONLINEWORKSPACE_POSTGRES_DATABASE_USER, env.ONLINEWORKSPACE_POSTGRES_DATABASE_PASSWORD, env.ONLINEWORKSPACE_POSTGRES_DATABASE_HOST, env.ONLINEWORKSPACE_POSTGRES_DATABASE_PORT, env.ONLINEWORKSPACE_POSTGRES_DATABASE_NAME].some((v) => !!v),
                        connected: result.ok,
                        missingDatabase: !result.ok && result.missingDatabase,
                        error: result.ok ? undefined : result.error,
                    };
                }),
            test: publicProcedure
                .input(z.object({token: z.string(), postgres: postgresInput}))
                .output(z.object({ok: z.boolean(), missingDatabase: z.boolean(), error: z.string().optional()}))
                .mutation(async (opt) => {
                    assertSetupAvailable(opt.ctx.instance, opt.input.token);

                    const result = await testPostgresConnection(resolvePostgresInput(opt.ctx.instance, opt.input.postgres));

                    return result.ok ? {ok: true, missingDatabase: false} : {ok: false, missingDatabase: result.missingDatabase, error: result.error};
                }),
            /** Saves the database, creating it when asked to, then restarts into full mode so the rest of the setup has a database to use. */
            apply: publicProcedure
                .input(z.object({token: z.string(), postgres: postgresInput, createIfMissing: z.boolean()}))
                .output(z.union([z.object({type: z.literal("error"), message: z.string(), missingDatabase: z.boolean()}), z.object({type: z.literal("success"), restarting: z.boolean()})]))
                .mutation(async (opt) => {
                    const instance = opt.ctx.instance;
                    assertSetupAvailable(instance, opt.input.token);

                    const postgres = resolvePostgresInput(instance, opt.input.postgres);
                    let result = await testPostgresConnection(postgres);

                    if (!result.ok && result.missingDatabase) {
                        if (!opt.input.createIfMissing) return {type: "error" as const, message: `The database '${postgres.database}' does not exist`, missingDatabase: true};

                        const created = await createPostgresDatabase(postgres);
                        if (!created.ok) return {type: "error" as const, message: `The database could not be created: ${created.error}`, missingDatabase: true};

                        instance.log.system.info(`Created the database '${postgres.database}'`);
                        result = await testPostgresConnection(postgres);
                    }

                    if (!result.ok) return {type: "error" as const, message: result.error, missingDatabase: result.missingDatabase};

                    const changed = JSON.stringify(postgres) !== JSON.stringify(instance.sys.configuration.databases.postgres);
                    await instance.sys.configuration.setPostgresConfiguration(postgres);

                    const restarting = instance.mode === "setup" || changed;

                    // after the response has been sent, the restart closes the connection it is sent on
                    if (restarting) setTimeout(() => void instance.restart("full").catch((err) => instance.log.system.error("The restart failed", err)), 300);

                    return {type: "success" as const, restarting};
                }),
        },
};

export const setupModeRouter = t.router({setup: setupBootstrapRouter});

export const coreOnlineWorkspaceRouter = t.router({
    setup: {
        ...setupBootstrapRouter,
        defaults: publicProcedure
            .input(z.object({token: z.string()}))
            .query(async (opt) => {
                assertSetupAvailable(opt.ctx.instance, opt.input.token);

                const config = opt.ctx.instance.sys.configuration;

                return {
                    /** the development install question is only asked of whoever is on the machine the instance runs on */
                    canChooseDevelopmentInstall: isLocalRequest(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server),
                    identity: {...config.branding},
                    administrator: {username: "admin", displayName: "Administrator"},
                    access: {
                        allowSignups: false,
                        displayProfilesAtLogon: false,
                        requireEmail: false,
                        requireTwoFactor: false,
                        passwordMinimumLength: SETUP_RECOMMENDED.passwordMinimumLength,
                        passwordContains: SETUP_RECOMMENDED.passwordContains,
                    },
                    mailServer: {...config.mailServer, enabled: false},
                    newUsers: {...config.userDefault, quotaSize: SETUP_RECOMMENDED.quotaSize},
                    termsOfUse: config.termsOfUse.message,
                    applications: {
                        installed: opt.ctx.instance.sys.applications.availableApplications
                            .filter((a) => a.manifest !== undefined)
                            .map((a) => ({
                                id: a.manifest!.id,
                                displayName: a.manifest!.displayName ?? a.manifest!.id,
                                description: a.manifest!.description ?? "",
                                required: SETUP_REQUIRED_APPLICATIONS.includes(a.manifest!.id),
                            })),
                        quickShortcuts: config.defaultQuickShortcuts,
                    },
                };
            }),
        testMailServer: publicProcedure
            .input(z.object({token: z.string(), mailServer: mailServerInput}))
            .output(z.object({error: z.string().optional()}))
            .mutation(async (opt) => {
                assertSetupAvailable(opt.ctx.instance, opt.input.token);

                const {host, port, secure, auth} = opt.input.mailServer;
                const transporter = nodemailer.createTransport({host, port, secure, auth, connectionTimeout: 10000});

                try {
                    await transporter.verify();
                    return {};
                } catch (err) {
                    return {error: err instanceof Error ? err.message : "The mail server could not be reached"};
                } finally {
                    transporter.close();
                }
            }),
        complete: publicProcedure
            .input(setupInput)
            .output(z.union([z.object({type: z.literal("error"), message: z.string()}), z.object({type: z.literal("success"), signedIn: z.boolean()})]))
            .mutation(async (opt) => {
                const instance = opt.ctx.instance;
                assertSetupAvailable(instance, opt.input.token);

                if (setupInProgress) return {type: "error" as const, message: "The setup is already being applied"};
                setupInProgress = true;

                try {
                    const input = opt.input;
                    const config = instance.sys.configuration;

                    if (input.developmentInstall && !isLocalRequest(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server)) {
                        return {type: "error" as const, message: "A development install can only be chosen from localhost"};
                    }

                    // a minimum of 0 means the requirement is not enforced, which is represented by it being absent
                    const optional = (n: number) => (n > 0 ? n : undefined);
                    const signupRequirements: ConfigurationSystem["signupRequirements"] = {
                        email: input.access.requireEmail,
                        twoFactorAuthentication: input.access.requireTwoFactor,
                        passwordMinimumLength: input.access.passwordMinimumLength,
                        passwordContains: {
                            minimumUppercase: optional(input.access.passwordContains.minimumUppercase),
                            minimumLowercase: optional(input.access.passwordContains.minimumLowercase),
                            minimumNumbers: optional(input.access.passwordContains.minimumNumbers),
                            minimumSymbols: optional(input.access.passwordContains.minimumSymbols),
                        },
                    };

                    const passwordError = getPasswordRequirementError(instance, input.administrator.password, signupRequirements);
                    if (passwordError) return {type: "error" as const, message: passwordError};

                    if (input.access.requireEmail && !input.mailServer.enabled) {
                        return {type: "error" as const, message: "Requiring an email address needs a mail server to send the verification codes"};
                    }

                    // claim the administrator account, the default one is created at startup with an unknown password
                    let admin: WorkspacesUser | undefined = (await instance.sys.users.getAdministrators())[0];

                    if (admin === undefined) {
                        const userId = await instance.sys.users.createUser(input.administrator.username);
                        admin = userId === undefined ? undefined : await instance.sys.users.getUserById(userId);
                        await admin?.setIsAdministrator(true);
                    }

                    if (admin === undefined) return {type: "error" as const, message: "The administrator account could not be created"};

                    if ((await admin.getUsername()) !== input.administrator.username && !(await admin.setUsername(input.administrator.username))) {
                        return {type: "error" as const, message: "That username is not available"};
                    }

                    await admin.setDisplayName(input.administrator.displayName);
                    if (input.administrator.email) await admin.setEmail(input.administrator.email);
                    await admin.setGender(input.administrator.gender);
                    if (input.administrator.pronouns) await admin.setPronouns(input.administrator.pronouns);
                    await instance.sys.authentication.setSessionRequirementsForUser(admin.userId, [Authenticator.Password]);
                    await instance.sys.authorization.setPassword(admin.userId, input.administrator.password);

                    // applications, the required ones can never be removed
                    const unwanted = instance.sys.applications.availableApplications
                        .map((a) => a.manifest?.id)
                        .filter((id): id is string => id !== undefined && !SETUP_REQUIRED_APPLICATIONS.includes(id) && !input.applications.enabled.includes(id));

                    for (const id of unwanted) await instance.sys.applications.disableApplication(id);

                    const wantedIds = (id: string) => !unwanted.includes(id);
                    config.defaultApplications = config.defaultApplications.filter((a) => wantedIds(a.id));
                    config.defaultQuickShortcuts = input.applications.quickShortcuts.filter(wantedIds);

                    Object.assign(config.branding, input.identity);
                    config.proxy = {hostname: input.address.hostname, secure: input.address.secure};
                    config.signupRequirements = signupRequirements;
                    config.developmentInstall = input.developmentInstall;
                    config.mailServer = input.mailServer;
                    config.userDefault = input.newUsers;
                    config.termsOfUse = {message: input.termsOfUse, lastUpdated: Date.now()};

                    const setFeature = (flag: WorkspacesFeatureFlags, enabled: boolean) => {
                        config.enabledFeatures = config.enabledFeatures.filter((f) => f !== flag);
                        if (enabled) config.enabledFeatures.push(flag);
                    };
                    setFeature(WorkspacesFeatureFlags.AllowUserSignups, input.access.allowSignups);
                    setFeature(WorkspacesFeatureFlags.DisplayProfilesAtLogon, input.access.displayProfilesAtLogon);

                    await config.completeSetup();
                    instance.sys.audit.record({action: "instance.setup_completed", actorId: admin.userId, ip: clientIp(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server)});

                    const mail = await instance.sys.email.reconfigure();
                    if (!mail.ok) instance.log.system.warning(`The mail server configured during setup could not be reached: ${mail.error}`);

                    const session = await instance.sys.authorization.createPasswordSession(admin.userId, input.administrator.password, AuthorizedDeviceType.UnknownBrowser, undefined, clientIp(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server));

                    if (session === undefined || session in SessionCreationError) return {type: "success" as const, signedIn: false};

                    setSessionCookie(opt.ctx.rawRequest.resHeaders, instance, session as string, opt.ctx.rawRequest.req.headers.get("host")?.split(":")[0] || config.proxy.hostname);

                    return {type: "success" as const, signedIn: true};
                } finally {
                    setupInProgress = false;
                }
            }),
    },

    userSelect: {
        getOptions: publicProcedure.query(async (opt) => {
            return {
                showSignup: opt.ctx.instance.sys.configuration.hasFeature(WorkspacesFeatureFlags.AllowUserSignups),
                showProfiles: opt.ctx.instance.sys.configuration.hasFeature(WorkspacesFeatureFlags.DisplayProfilesAtLogon),
                showBackground: opt.ctx.instance.sys.configuration.branding.showLoginBackground,
                showBanner: opt.ctx.instance.sys.configuration.branding.showLoginBanner,
                tagline: opt.ctx.instance.sys.configuration.branding.tagline,
                displayName: opt.ctx.instance.sys.configuration.branding.displayName
            };
        }), signupRequirements: publicProcedure
            .output(z.object({
                email: z.boolean(),
                twoFactorAuthentication: z.boolean(),
                passwordMinimumLength: z.number().optional(),
                passwordContains: z
                    .object({
                        minimumUppercase: z.number().optional(),
                        minimumLowercase: z.number().optional(),
                        minimumNumbers: z.number().optional(),
                        minimumSymbols: z.number().optional(),
                    })
                    .optional(),
            }),)
            .query(async (opt) => {
                return opt.ctx.instance.sys.configuration.signupRequirements;
            }), signInRequirements: publicProcedure.input(z.string()).query(async (opt) => {
            const username = opt.input;

            const userId = (await opt.ctx.instance.sys.users.getUserByUsername(username))?.userId;

            // a user who does not exist looks like one who signs in with a password, so usernames cannot be found out
            if (userId === undefined) return [Authenticator.Password];

            return await opt.ctx.instance.sys.authentication.getSessionRequirements(userId);
        }),
        getProfiles: publicProcedure.output(z.object({
            username: z.string(), displayName: z.string(), passwordNote: z.string().optional(),
        }).array()).query(async opt => {
            const users = await opt.ctx.instance.sys.users.getAllUsers();

            return await Promise.all(users.map(async u => {
                return {
                    username: await u.getUsername(),
                    displayName: await u.getDisplayName(),
                    passwordNote: await u.getPasswordNote()
                }
            }));
        })
    }, authorization: {
        checkEmailAddressOwnership: publicProcedure
            .input(z.object({emailAddress: z.string().trim().max(320).email()}))
            .output(z.boolean().or(z.string()))
            .mutation(async (opt) => {
                const key = normaliseEmailAddress(opt.input.emailAddress);
                const existing = emailSignupVerificationCodes.get(key);

                if (existing && Date.now() - existing.sentAt < EMAIL_CODE_RESEND_MS) {
                    return "An email has already been sent, please wait a minute before sending another.";
                }

                const emailCode = generateEmailCode();
                emailSignupVerificationCodes.set(key, {code: emailCode, expires: Date.now() + EMAIL_CODE_VALID_MS, sentAt: Date.now(), attempts: 0});

                await opt.ctx.instance.sys.email.sendEmail(opt.input.emailAddress, "Email verification code", {
                    type: "string", content: `Email code for email '${opt.input.emailAddress}' is '${emailCode}'. It is valid for 15 minutes.`,
                });

                return true;
            }), validateEmailCode: publicProcedure.input(z.object({
            emailAddress: z.string(), emailCode: z.string()
        })).query(async (opt) => {
            return emailCodeIsCorrect(opt.input.emailAddress, opt.input.emailCode);
        }), isUsernameValid: publicProcedure.input(z.string()).query(async (opt) => {
            return (await opt.ctx.instance.sys.users.getUserByUsername(opt.input)) === undefined;
        }), signup: publicProcedure
            .input(z.union([z.object({
                username: SIGNUP_USERNAME,
                password: z.string().min(1).max(1000),
                emailAddress: z.string().trim().max(320),
                emailCode: z.string().max(100),
                displayName: z.string().trim().max(60),
                gender: z.string().max(20),
                pronouns: z.string().trim().max(40).optional(),
                bio: z.string().max(1000),
            }), z.object({
                username: SIGNUP_USERNAME,
                password: z.string().min(1).max(1000),
                displayName: z.string().trim().max(60),
                gender: z.string().max(20),
                pronouns: z.string().trim().max(40).optional(),
                bio: z.string().max(1000),
            }),]),)
            .output(z.union([z.object({type: z.literal("error"), message: z.string()}), z.object({
                type: z.literal("success"), notice: z.boolean().optional(),
            }),]),)
            .mutation(async (opt) => {
                if (!opt.ctx.instance.sys.configuration.hasFeature(WorkspacesFeatureFlags.AllowUserSignups)) {
                    return {
                        type: "error" as const, message: "This instance has disabled user signups",
                    };
                }

                const username = opt.input.username.toLowerCase();

                if (opt.ctx.instance.sys.configuration.signupRequirements.email) {
                    if (!("emailAddress" in opt.input)) {
                        return {
                            type: "error" as const, message: "This instance requires an email address for signups!",
                        };
                    }

                    if (!emailCodeIsCorrect(opt.input.emailAddress, opt.input.emailCode, true)) {
                        return {
                            type: "error" as const, message: "The email code did not match!",
                        };
                    }
                }

                const passwordError = getPasswordRequirementError(opt.ctx.instance, opt.input.password);

                if (passwordError) return {type: "error" as const, message: passwordError};

                const uid = await opt.ctx.instance.sys.users.createUser(username, opt.input.password);

                if (uid === undefined) {
                    return {
                        type: "error" as const, message: "Failed to create the user",
                    };
                }

                const user = await opt.ctx.instance.sys.users.getUserById(uid);

                if (user === undefined) {
                    return {
                        type: "error" as const, message: "Failed to fetch the user",
                    };
                }

                await user.setDisplayName(opt.input.displayName);

                if ("emailAddress" in opt.input) {
                    await user.setEmail(opt.input.emailAddress);
                }

                await user.setBio(opt.input.bio);

                if (opt.input.gender === "male" || opt.input.gender === "female" || opt.input.gender === "other") await user.setGender(opt.input.gender);

                if (opt.input.pronouns) await user.setPronouns(opt.input.pronouns);

                await user.setQuota(opt.ctx.instance.sys.configuration.userDefault.quotaSize);

                const session = await opt.ctx.instance.sys.authorization.createPasswordSession(user.userId, opt.input.password, AuthorizedDeviceType.UnknownBrowser, undefined, clientIp(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server),);

                if (session === undefined || session in SessionCreationError) {
                    return {
                        type: "error" as const, message: "Failed to create a session?",
                    };
                }

                setSessionCookie(opt.ctx.rawRequest.resHeaders, opt.ctx.instance, session as string);

                opt.ctx.instance.sys.audit.record({action: "auth.signup", actorId: user.userId, ip: clientIp(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server)});

                return {
                    type: "success" as const,
                };
            }), confirmTwoFactor: procedure.input(z.object({twoFactorCode: z.string()})).mutation(async (opt) => {
            const user = await opt.ctx.user();
            const secretString = temporaryTwoFactorSecrets.get(user.userId);

            if (secretString === undefined) {
                opt.ctx.instance.log.system.warning(`(${user.userId})${await user.getUsername()} Tried to confirm a two factor code, but they lacked a temporary secret?`,);

                return false;
            }

            const totp = new OTPAuth.TOTP({
                issuer: opt.ctx.instance.sys.configuration.proxy.hostname,
                label: `${opt.ctx.instance.sys.configuration.branding.displayName} (Workspace)`,
                algorithm: "SHA1",
                digits: 6,
                secret: secretString,
            });

            if (totp.validate({token: opt.input.twoFactorCode}) !== null) {
                temporaryTwoFactorSecrets.delete(user.userId);
                await opt.ctx.instance.sys.authorization.setTwoFactorAuthenticationSecret(user.userId, secretString);
                opt.ctx.instance.log.system.success(`(${user.userId})${await user.getUsername()} Setup two-factor authentication on their account!`);

                return true;
            }

            return false;
        }), enableTwoFactor: procedure
            .input(z.object({currentTwoFactorCode: z.string().optional()}).optional())
            .output(z
                .object({
                    twoFactorSecret: z.string(), twoFactorSecretURI: z.string(),
                })
                .optional(),)
            .mutation(async (opt) => {
                const generateSecretString = () => {
                    const buffer = nodeCrypto.randomBytes(15);
                    const base32 = hiBase32.encode(buffer).replace(/=/g, "").substring(0, 24);
                    return base32;
                };

                const user = await opt.ctx.user();

                // Replacing an existing authenticator requires proving you still hold the current one
                if (await opt.ctx.instance.sys.authorization.hasTwoFactorAuthenticationSecret(user.userId)) {
                    const currentCode = opt.input?.currentTwoFactorCode;

                    if (!currentCode || !(await opt.ctx.instance.sys.authorization.verifyTwoFactorCode(user.userId, currentCode))) {
                        opt.ctx.instance.log.system.warning(`User (${user.userId})${await user.getUsername()} tried to re-setup their two factor without a valid current code`,);

                        return undefined;
                    }
                }

                let secretString = generateSecretString();
                const prevSecretString = temporaryTwoFactorSecrets.get(user.userId);

                if (prevSecretString) {
                    secretString = prevSecretString;
                }

                const totp = new OTPAuth.TOTP({
                    issuer: opt.ctx.instance.sys.configuration.proxy.hostname,
                    label: `${opt.ctx.instance.sys.configuration.branding.displayName} (Workspace)`,
                    algorithm: "SHA1",
                    digits: 6,
                    secret: secretString,
                });

                temporaryTwoFactorSecrets.set(user.userId, secretString);

                return {
                    twoFactorSecretURI: totp.toString(), twoFactorSecret: secretString,
                };
            }), passwordResetRequest: publicProcedure
            .input(z.object({username: z.string()}))
            .output(z.object({emailEnabled: z.boolean()}))
            .mutation(async (opt) => {
                const instance = opt.ctx.instance;
                const emailEnabled = instance.sys.configuration.mailServer.enabled;

                // Always respond the same way so usernames cannot be probed
                if (!emailEnabled) return {emailEnabled};

                const user = await instance.sys.users.getUserByUsername(opt.input.username.toLowerCase());
                const emailAddress = await user?.getEmail();

                if (!user || !emailAddress) return {emailEnabled};

                const existing = passwordResetCodes.get(user.userId);
                if (existing && Date.now() - existing.sentAt < PASSWORD_RESET_RESEND_MS) return {emailEnabled};

                instance.sys.audit.record({action: "auth.password_reset_requested", actorId: user.userId, ip: clientIp(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server)});

                const code = generatePasswordResetCode();
                passwordResetCodes.set(user.userId, {
                    code, expires: Date.now() + PASSWORD_RESET_CODE_VALID_MS, sentAt: Date.now(), attempts: 0,
                });

                try {
                    await instance.sys.email.sendEmail(emailAddress, "Password reset code", {
                        type: "string",
                        content: `Someone requested a password reset for the account '${await user.getUsername()}'. Your code is '${code}' and is valid for 15 minutes. If this wasn't you, you can ignore this email and your password will not change.`,
                    });
                } catch (err) {
                    instance.log.system.error(err);
                }

                return {emailEnabled};
            }), passwordResetComplete: publicProcedure
            .input(z.object({
                username: z.string(), code: z.string(), newPassword: z.string(), twoFactorCode: z.string().optional(),
            }))
            .output(z.union([
                z.object({type: z.literal("success")},),
                z.object({type: z.literal("error"), message: z.string()}),
                z.object({type: z.literal("requirementsNotMet"), requireAny: z.enum(["totp"]).array()}),
            ]))
            .mutation(async (opt) => {
                const instance = opt.ctx.instance;
                const invalid = {type: "error" as const, message: "That code is invalid or has expired"};

                const user = await instance.sys.users.getUserByUsername(opt.input.username.toLowerCase());
                if (!user) return invalid;

                const entry = passwordResetCodes.get(user.userId);
                if (!entry || entry.expires < Date.now() || entry.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
                    passwordResetCodes.delete(user.userId);
                    return invalid;
                }

                if (!passwordResetCodeMatches(entry.code, opt.input.code)) {
                    entry.attempts++;
                    return invalid;
                }

                const requirementError = getPasswordRequirementError(instance, opt.input.newPassword);
                if (requirementError) return {type: "error" as const, message: requirementError};

                const ip = clientIp(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server);

                if (await instance.sys.authorization.hasTwoFactorAuthenticationSecret(user.userId)) {
                    if (!opt.input.twoFactorCode) return {type: "requirementsNotMet" as const, requireAny: ["totp" as const]};

                    if (!(await instance.sys.authorization.verifyTwoFactorCode(user.userId, opt.input.twoFactorCode, ip))) {
                        entry.attempts++;
                        return {type: "error" as const, message: "The two factor code was incorrect"};
                    }
                }

                if (!(await instance.sys.authorization.setPassword(user.userId, opt.input.newPassword))) {
                    return {type: "error" as const, message: "Failed to set the new password"};
                }

                passwordResetCodes.delete(user.userId);
                await instance.sys.authorization.endAllSessions(user.userId);
                instance.sys.audit.record({action: "auth.password_reset", actorId: user.userId, ip, details: {sessionsEnded: true}});

                return {type: "success" as const};
            }), passwordSignin: publicProcedure
            .input(z.object({
                username: z.string(), password: z.string(), twoFactorCode: z.string().optional(),
            }),)
            .output(z.union([z.object({
                type: z.literal("error"), message: z.string()
            }), z.object({type: z.literal("success")}), z.object({
                type: z.literal("requirementsNotMet"), requireAny: z.enum(["totp", "email"]).array(),
            }),]),)
            .mutation(async (opt) => {
                const authorization = opt.ctx.instance.sys.authorization;
                const ip = clientIp(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server);
                const username = opt.input.username.toLowerCase();
                const user = await opt.ctx.instance.sys.users.getUserByUsername(username);
                const incorrect = {type: "error" as const, message: "Incorrect username, password or code"};

                if (user === undefined) {
                    // takes as long as a real attempt does, and says the same thing, so usernames cannot be found out
                    await authorization.burnPasswordCheck();
                    opt.ctx.instance.sys.audit.record({action: "auth.login_failed", actorName: username.slice(0, 64), ip, outcome: "failure", details: {reason: "unknown user"}});

                    return incorrect;
                }

                if (await authorization.hasTwoFactorAuthenticationSecret(user.userId) && opt.input.twoFactorCode === undefined) {
                    // the code is only asked for by someone who knows the password
                    if (!(await authorization.verifyPassword(user.userId, opt.input.password, ip))) {
                        opt.ctx.instance.sys.audit.record({action: "auth.login_failed", actorId: user.userId, ip, outcome: "failure", details: {reason: "wrong password"}});

                        return incorrect;
                    }

                    return {
                        type: "requirementsNotMet" as const, requireAny: ["totp"],
                    };
                }

                const session = await authorization.createPasswordSession(user.userId, opt.input.password, AuthorizedDeviceType.UnknownBrowser, opt.input.twoFactorCode, ip);

                if (session in SessionCreationError) {
                    return {
                        type: "error" as const,
                        message: session === SessionCreationError.UserTimedOut
                            ? "Too many failed attempts. Please try again in 15 minutes."
                            : incorrect.message,
                    };
                }

                setSessionCookie(opt.ctx.rawRequest.resHeaders, opt.ctx.instance, session as string);

                return {
                    type: "success" as const,
                };
            }), passkeyRequestSignIn: publicProcedure
            .input(z.object({
                username: z.string(),
            }),)
            .query(async (opt) => {
                const user = await opt.ctx.instance.sys.users.getUserByUsername(opt.input.username.toLowerCase());

                if (user === undefined) {
                    return false;
                }

                return await opt.ctx.instance.sys.authorization.requestPasskeySession(user.userId);
            }), passkeyCompleteSignIn: publicProcedure
            .input(z.object({
                username: z.string(), passkeyResponse: z.any(),
            }),)
            .mutation(async (opt) => {
                const user = await opt.ctx.instance.sys.users.getUserByUsername(opt.input.username.toLowerCase());

                if (user === undefined) {
                    throw new TRPCError({
                        code: "NOT_FOUND", message: "Failed to find the user",
                    });
                }

                const session = await opt.ctx.instance.sys.authorization.createPasskeySession(user.userId, AuthorizedDeviceType.UnknownBrowser, opt.input.passkeyResponse, clientIp(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server),);

                if (session === undefined) {
                    return {
                        type: "error", message: "Failed to create a session?",
                    };
                }

                setSessionCookie(opt.ctx.rawRequest.resHeaders, opt.ctx.instance, session);

                return {
                    type: "success",
                };
            }), isAuthenticated: publicProcedure.output(z.object({authenticated: z.boolean()})).query(async (opt) => {
            const cookies = getCookies(opt.ctx.rawRequest.req.headers);

            if (!cookies.Authorization) {
                return {
                    authenticated: false,
                };
            }

            // an administrator who has to set up two factor authentication is signed in, they are just not let do anything else yet
            const userId = await opt.ctx.instance.sys.authorization.verifySession(decodeURIComponent(cookies.Authorization!), {allowTwoFactorSetup: true});

            if (userId === undefined) {
                return {
                    authenticated: false,
                };
            }

            return {
                authenticated: true,
            };
        }), securityStatus: procedure.output(z.object({twoFactorSetupRequired: z.boolean()})).query(async (opt) => {
            return {twoFactorSetupRequired: await opt.ctx.instance.sys.authorization.requiresTwoFactorSetup(opt.ctx.userId)};
        }), logoutEverywhere: procedure.output(z.object({sessionsEnded: z.boolean()})).mutation(async (opt) => {
            await opt.ctx.instance.sys.authorization.endAllSessions(opt.ctx.userId);
            deleteCookie(opt.ctx.rawRequest.resHeaders, "Authorization", {path: "/", domain: opt.ctx.instance.sys.configuration.proxy.hostname});
            opt.ctx.instance.sys.audit.record({action: "auth.logout_everywhere", actorId: opt.ctx.userId, ip: clientIp(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server)});

            return {sessionsEnded: true};
        }), logout: procedure.output(z.object({success: z.boolean()})).mutation(async (opt) => {
            const cookies = getCookies(opt.ctx.rawRequest.req.headers);

            if (!cookies.Authorization) {
                return {
                    success: false,
                };
            }

            deleteCookie(opt.ctx.rawRequest.resHeaders, "Authorization", {path: "/", domain: opt.ctx.instance.sys.configuration.proxy.hostname});

            await opt.ctx.instance.sys.authorization.endSessionByToken(decodeURIComponent(cookies.Authorization));
            opt.ctx.instance.sys.audit.record({action: "auth.logout", actorId: opt.ctx.userId, ip: clientIp(opt.ctx.rawRequest.req, opt.ctx.rawRequest.server)});

            return {
                success: true,
            };
        }),
    }, termsOfUse: publicProcedure.query(async (opt) => {
        const date = new Date(opt.ctx.instance.sys.configuration.termsOfUse.lastUpdated);

        const localeDateString: string = date.toLocaleDateString("en-GB", {
            day: "numeric", month: "long", year: "numeric",
        });

        const getOrdinalSuffix = (day: number): string => {
            if (day > 3 && day < 21) return "th";
            switch (day % 10) {
                case 1:
                    return "st";
                case 2:
                    return "nd";
                case 3:
                    return "rd";
                default:
                    return "th";
            }
        };

        const day: number = date.getDate();
        const formattedDate: string = `${day}${getOrdinalSuffix(day)} ${localeDateString.split(" ")[1]}, ${localeDateString.split(" ")[2]}`;

        return `Terms of Use: ${opt.ctx.instance.sys.configuration.branding.displayName}
Effective Date: ${formattedDate}

${opt.ctx.instance.sys.configuration.termsOfUse.message}`;
    }), app: {
        navigation: {
            getBranding: procedure
                .output(z.object({squareLogo: z.string().nullable(), squareLogoLink: z.string().nullable()}))
                .query(async (opt) => {
                    const squareLogoPath = path.join(opt.ctx.instance.sys.filesystem.FS_ROOT, "assets/square_logo.png");
                    const file = Bun.file(squareLogoPath);

                    if (!opt.ctx.instance.sys.configuration.branding.showSquareLogoInNavigation || !(await file.exists())) {
                        return {squareLogo: null, squareLogoLink: null};
                    }

                    // the modified time busts the browser cache when a new logo is uploaded
                    const branding = opt.ctx.instance.sys.configuration.branding;

                    return {
                        squareLogo: `/api/instance/square-logo?v=${file.lastModified}`,
                        squareLogoLink: branding.squareLogoLinkEnabled && branding.squareLogoLinkUrl ? branding.squareLogoLinkUrl : null,
                    };
                }),
            user: {
                name: procedure
                    .output(z.object({
                        username: z.string(), displayName: z.string(),
                    }),)
                    .query(async (opt) => {
                        const db = opt.ctx.instance.sys.database.postgres();

                        const user = (await db`SELECT username, display_name
                                               FROM users
                                               WHERE id = ${opt.ctx.userId};`)?.[0];

                        if (!user) {
                            throw new TRPCError({
                                code: "NOT_FOUND", cause: {message: "User does not exist"},
                            });
                        }

                        return {
                            username: user.username || "@",
                            displayName: user.display_name || user.username || "Unknown",
                        };
                    }),
            }, getApplications: procedure
                .output(z.array(z.object({
                    location: z.object({
                        type: z.union([z.literal("local"), z.literal("remote")]), value: z.string(),
                    }), icon: z.object({
                        type: z.union([z.literal("icon"), z.literal("image")]), value: z.string(),
                    }), label: z.string(), id: z.string(),
                }),),)
                .query(async (opt) => {
                    const applications = opt.ctx.instance.sys.applications.getEnabledApplications();

                    return applications.map((app) => {
                        let icon = {
                            type: "icon" as "icon" | "image", value: "indeterminate_question_box",
                        };

                        if (app.manifest?.icon) {
                            if (app.manifest.icon.type === "image") {
                                icon = {
                                    type: "image",
                                    value: `${opt.ctx.instance.sys.configuration.proxy.secure ? "https://" : "http://"}${opt.ctx.instance.sys.configuration.proxy.hostname}/api/application-icon/${app.manifest.id}`,
                                };
                            } else {
                                icon = {
                                    type: "icon",
                                    value: `${opt.ctx.instance.sys.configuration.proxy.secure ? "https://" : "http://"}${opt.ctx.instance.sys.configuration.proxy.hostname}/api/application-icon/${app.manifest.id}`,
                                };
                            }
                        }

                        return {
                            icon: icon, label: app.manifest?.displayName || "Unknown", location: {
                                type: "local", value: `/app/${app.manifest?.id}` || "/404",
                            }, id: app.manifest?.id || "unknown",
                        };
                    });
                }), getQuickShortcuts: procedure.query(async (opt) => {
                const a = opt.ctx.instance.sys.settings.applicationSettings["core"].find((s) => s.id === "quick_shortcuts");

                if (!a) throw "The core:quick_shortcuts setting is somehow missing???";

                const quickShortcuts = (await a.onValueChange(opt.ctx.userId)) as string[];

                const applications = opt.ctx.instance.sys.applications.getEnabledApplications();

                return quickShortcuts
                    .map((shortcut) => {
                        const app = applications.find((a) => a.manifest?.id === shortcut);

                        if (!app) return undefined;

                        let icon = {
                            type: "icon" as "icon" | "image", // TODO: replace this with an image link! (What does this mean?)
                            value: "indeterminate_question_box",
                        };

                        if (app.manifest?.icon) {
                            if (app.manifest.icon.type === "image") {
                                icon = {
                                    type: "image",
                                    value: `${opt.ctx.instance.sys.configuration.proxy.secure ? "https://" : "http://"}${opt.ctx.instance.sys.configuration.proxy.hostname}/api/application-icon/${app.manifest.id}`,
                                };
                            } else {
                                icon = {
                                    type: "icon",
                                    value: `${opt.ctx.instance.sys.configuration.proxy.secure ? "https://" : "http://"}${opt.ctx.instance.sys.configuration.proxy.hostname}/api/application-icon/${app.manifest.id}`,
                                };
                            }
                        }

                        return {
                            icon: icon, label: app.manifest?.displayName || "Unknown", location: {
                                type: "local", value: `/app/${app.manifest?.id}` || "/404",
                            }, id: app.manifest?.id || "unknown",
                        };
                    })
                    .filter((qs) => qs !== undefined);
            }),
        }, // notifications: {
        //   listener: procedure
        //     // @ts-ignore
        //     .subscription(async function* (opt) {
        //       for await (const [data] of on(opt.ctx.instance.sys.notifications.eventEmitter, WorkspacesNotificationEventEmitterEvent.SendNotification, {
        //         signal: opt.signal,
        //       })) {
        //         const notification = data as WorkspacesNotification;
        //         if (notification.recipient === opt.ctx.userId) {
        //           notifications.push(notification);

        //           yield notification;
        //         }
        //       }
        //     }),
        //   respond: procedure
        //     .input(
        //       z.object({
        //         uuid: z.string(),
        //         responseType: z.literal("button"),
        //         value: z.string(),
        //       }),
        //     )
        //     .output(
        //       z.object({
        //         ok: z.boolean(),
        //         action: z
        //           .object({ type: z.literal("navigate"), value: z.string() })
        //           .or(z.object({ type: z.literal("reload") }))
        //           .optional(),
        //       }),
        //     )
        //     .mutation(async (_) => {
        //       // const notification = notifications.find((n) => n.uuid === opt.input.uuid);

        //       // if (notification) {
        //       //   let output:
        //       //     | {
        //       //         type: "navigate";
        //       //         value: string;
        //       //       }
        //       //     | {
        //       //         type: "reload";
        //       //       };

        //       //   if (opt.input.responseType === "button") {
        //       //     output = notification.optionsCallbacks?.onButton(opt.input.value);
        //       //   }

        //       //   notifications = notifications.filter((n) => n.uuid !== notification.uuid);

        //       //   if (output !== undefined) {
        //       //     return { ok: true, action: output.action };
        //       //   } else {
        //       //     return { ok: true };
        //       //   }
        //       // }

        //       return { ok: false };
        //     }),
        // },
    }, theme: {
        get: procedure.output(z.any().or(z.literal(false))).query(async (opt) => {
            const db = opt.ctx.instance.sys.database.postgres();

            const themeValues = await db`SELECT color_scheme
                                         FROM public.users
                                         WHERE id = ${opt.ctx.userId}`;

            return themeValues?.[0]?.color_scheme || opt.ctx.instance.sys.configuration.branding.defaultTheme || false;
        }),
    },
});

export type WorkspacesTRPCRouter = typeof coreOnlineWorkspaceRouter;
