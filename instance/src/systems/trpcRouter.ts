import { initTRPC, TRPCError } from "@trpc/server";
import z from "zod";
import type { Instance } from "../index.js";
import { AuthorizedDeviceType } from "./authorization.js";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import {
  WorkspacesNotificationEventEmitterEvent,
  type WorkspacesNotification,
} from "./notifications.js";
import { on } from "node:events";
import type { Server } from "bun";
import type { WorkspacesUser } from "./users.js";
import * as nodeCrypto from "node:crypto";
import { encode as hiBase32Encode } from "hi-base32";
import * as OTPAuth from "otpauth";
import { WorkspacesFeatureFlags } from "./configuration.js";

export const createTRPCContext =
  (instance: Instance) =>
  (opt: FetchCreateContextFnOptions, server: Server<{}>) => {
    let originUrl = new URL(opt.req.url);

    originUrl.pathname = "";
    originUrl.search = "";
    originUrl.hash = "";

    return {
      rawRequest: {
        req: opt.req,
        resHeaders: opt.resHeaders,
        destinationHostname: originUrl.toString().slice(0, -1),
        server: server,
      },
      instance: instance,
    };
  };

export const t = initTRPC
  .context<ReturnType<typeof createTRPCContext>>()
  .create({
    sse: {
      ping: {
        // Enable periodic ping messages to keep connection alive
        enabled: true,
        // Send ping message every 2s
        intervalMs: 4000,
      },
      client: {
        reconnectAfterInactivityMs: 5000,
      },
    },
  });

export const publicProcedure = t.procedure.use(async (opt) => {
  return opt.next({
    ctx: {
      userId: "THIS CAN ONLY BE ACCESSED FROM A NON-PUBLIC PROCEDURE",
    },
  });
});
export const procedure = t.procedure.use(async (opt) => {
  // console.log(opt.ctx.req.headers);

  /*
    if (!ctx.user?.isAdmin) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    */

  const cookieString = opt.ctx.rawRequest.req.headers?.get("cookie");

  if (cookieString === null) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "missing auth cookie",
    });
  }

  const parsedCookie = Bun.Cookie.parse(cookieString);

  let userId = await opt.ctx.instance.sys.authorization.verifySession(
    decodeURIComponent(parsedCookie.value),
  );

  if (userId === undefined) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "invalid session" });
  }

  return opt.next({
    ctx: {
      userId: userId,
      user: (): Promise<WorkspacesUser> =>
        // @ts-ignore
        opt.ctx.instance.sys.users.getUserById(userId),
    },
  });
});
export const adminProcedure = procedure.use(async (opt) => {
  const user = await opt.ctx.instance.sys.users.getUserById(opt.ctx.userId);

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "invalid session" });
  }

  if (!(await user.isAdministrator())) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "user lacks administrator permissions",
    });
  }

  return opt.next();
});

let temporaryTwoFactorSecrets: Map<number, string> = new Map();
let emailSignupVerificationCodes: Map<string, string> = new Map();
let notifications: WorkspacesNotification[] = [];

export const workspacesRouter = t.router({
  authorization: {
    signupRequirements: publicProcedure
      .output(
        z.object({
          email: z.boolean(),
          twoFactorAuthentication: z.boolean(),
        }),
      )
      .query(async (opt) => {
        return opt.ctx.instance.sys.configuration.signupRequirements;
      }),
    checkEmailAddressOwnership: publicProcedure
      .input(z.object({ emailAddress: z.string() }))
      .output(z.boolean().or(z.string()))
      .mutation(async (opt) => {
        if (emailSignupVerificationCodes.has(opt.input.emailAddress)) {
          return "An email has already been sent, please wait 5 minutes before sending another.";
        }

        let emailCode = "";
        const CODE_LENGTH = 8;
        const CODE_VALID_CHARS =
          "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let i = CODE_LENGTH; i > 0; --i)
          emailCode +=
            CODE_VALID_CHARS[
              Math.floor(Math.random() * CODE_VALID_CHARS.length)
            ];

        emailSignupVerificationCodes.set(opt.input.emailAddress, emailCode);
        // TODO: send an email...
        opt.ctx.instance.log.system.info(
          `Email code for email '${opt.input.emailAddress}' is '${emailCode}'`,
        );

        return true;
      }),
    validateEmailCode: publicProcedure
      .input(z.object({ emailAddress: z.string(), emailCode: z.string() }))
      .query(async (opt) => {
        if (
          emailSignupVerificationCodes.get(opt.input.emailAddress) ===
          opt.input.emailCode
        ) {
          return true;
        }

        return false;
      }),
    isUsernameValid: publicProcedure.input(z.string()).query(async (opt) => {
      if (
        (await opt.ctx.instance.sys.users.getUserByUsername(opt.input)) ===
        undefined
      )
        return true;

      return false;
    }),
    canSignup: publicProcedure.query(async (opt) => {
      if (
        opt.ctx.instance.sys.configuration.hasFeature(
          WorkspacesFeatureFlags.AllowUserSignups,
        )
      )
        return true;

      return false;
    }),
    signup: publicProcedure
      .input(
        z.union([
          z.object({
            username: z.string(),
            password: z.string(),
            emailAddress: z.string(),
            emailCode: z.string(),
            displayName: z.string(),
            gender: z.string(),
            bio: z.string(),
          }),
          z.object({
            username: z.string(),
            password: z.string(),
            displayName: z.string(),
            gender: z.string(),
            bio: z.string(),
          }),
        ]),
      )
      .output(
        z.union([
          z.object({ type: z.literal("error"), message: z.string() }),
          z.object({
            type: z.literal("success"),
            sessionToken: z.string(),
            notice: z.boolean().optional(),
          }),
        ]),
      )
      .mutation(async (opt) => {
        if (
          !opt.ctx.instance.sys.configuration.hasFeature(
            WorkspacesFeatureFlags.AllowUserSignups,
          )
        )
          return {
            type: "error",
            message: "This instance has disabled user signups",
          };

        const username = opt.input.username.toLowerCase();

        if (opt.ctx.instance.sys.configuration.signupRequirements.email) {
          if (!("emailAddress" in opt.input)) {
            return {
              type: "error",
              message: "This instance requires an email address for signups!",
            };
          }

          if (
            opt.input.emailCode !==
            emailSignupVerificationCodes.get(opt.input.emailAddress)
          )
            return {
              type: "error",
              message: "The email code did not match!",
            };
        }

        const uid = await opt.ctx.instance.sys.users.createUser(
          username,
          opt.input.password,
        );

        if (uid === undefined)
          return {
            type: "error",
            message: "Failed to create the user",
          };

        const user = await opt.ctx.instance.sys.users.getUserById(uid);

        if (user === undefined)
          return {
            type: "error",
            message: "Failed to fetch the user",
          };

        let splitDisplayName = opt.input.displayName.split(" ");
        await user.setFullName(
          splitDisplayName[0],
          splitDisplayName.slice(1).join(" "),
        );

        if ("emailAddress" in opt.input) {
          await user.setEmail(opt.input.emailAddress);
        }

        await user.setBio(opt.input.bio);

        if (
          opt.input.gender === "male" ||
          opt.input.gender === "female" ||
          opt.input.gender === "other"
        )
          await user.setGender(opt.input.gender);

        // TODO: get default quota size from the instance config
        await user.setQuota(20);

        const session = await opt.ctx.instance.sys.authorization.createSession(
          user.userId,
          opt.input.password,
          AuthorizedDeviceType.UnknownBrowser,
          undefined,
          opt.ctx.rawRequest.server.requestIP(opt.ctx.rawRequest.req)?.address,
        );

        if (session === undefined) {
          return {
            type: "error",
            message: "Failed to create a session?",
          };
        }

        opt.ctx.rawRequest.resHeaders.set(
          "set-cookie",
          Bun.Cookie.from("Authorization", session, {
            secure: false,
          }).serialize(),
        );

        return {
          type: "success",
          sessionToken: session,
        };
      }),
    confirmTwoFactor: procedure
      .input(z.object({ twoFactorCode: z.string() }))
      .mutation(async (opt) => {
        const user = await opt.ctx.user();
        const secretString = temporaryTwoFactorSecrets.get(user.userId);

        if (secretString === undefined) {
          opt.ctx.instance.log.system.warning(
            `(${user.userId})${await user.getUsername()} Tried to confirm a two factor code, but they lacked a temporary secret?`,
          );

          return false;
        }

        let totp = new OTPAuth.TOTP({
          issuer: opt.ctx.instance.sys.configuration.webUrl[0],
          label: `${opt.ctx.instance.sys.configuration.displayName} (Workspace)`,
          algorithm: "SHA1",
          digits: 6,
          secret: secretString,
        });

        if (totp.validate({ token: opt.input.twoFactorCode }) !== null) {
          temporaryTwoFactorSecrets.delete(user.userId);
          await opt.ctx.instance.sys.authorization.setTwoFactorAuthenticationSecret(
            user.userId,
            secretString,
          );
          opt.ctx.instance.log.system.success(
            `(${user.userId})${await user.getUsername()} Setup two-factor authentication on their account!`,
          );

          return true;
        }

        return false;
      }),
    enableTwoFactor: procedure
      .output(
        z
          .object({
            twoFactorSecret: z.string(),
            twoFactorSecretURI: z.string(),
          })
          .optional(),
      )
      .mutation(async (opt) => {
        const generateSecretString = () => {
          const buffer = nodeCrypto.randomBytes(15);
          const base32 = hiBase32Encode(buffer)
            .replace(/=/g, "")
            .substring(0, 24);
          return base32;
        };

        const user = await opt.ctx.user();

        if (
          await opt.ctx.instance.sys.authorization.hasTwoFactorAuthenticationSecret(
            user.userId,
          )
        ) {
          opt.ctx.instance.log.system.warning(
            `User (${user.userId})${await user.getUsername()} has attempted to re-setup their two factor from the signup method... this is suspicious...`,
          );

          return undefined;
        }

        let secretString = generateSecretString();
        let prevSecretString = temporaryTwoFactorSecrets.get(user.userId);

        if (prevSecretString) {
          secretString = prevSecretString;
        }

        let totp = new OTPAuth.TOTP({
          issuer: opt.ctx.instance.sys.configuration.webUrl[0],
          label: `${opt.ctx.instance.sys.configuration.displayName} (Workspace)`,
          algorithm: "SHA1",
          digits: 6,
          secret: secretString,
        });

        temporaryTwoFactorSecrets.set(user.userId, secretString);

        return {
          twoFactorSecretURI: totp.toString(),
          twoFactorSecret: secretString,
        };
      }),
    signin: publicProcedure
      .input(
        z.object({
          username: z.string(),
          password: z.string(),
          twoFactorCode: z.string().optional(),
        }),
      )
      .output(
        z.union([
          z.object({ type: z.literal("error"), message: z.string() }),
          z.object({ type: z.literal("success"), sessionToken: z.string() }),
          z.object({ type: z.literal("twofactor") }),
        ]),
      )
      .mutation(async (opt) => {
        const username = opt.input.username.toLowerCase();
        const user =
          await opt.ctx.instance.sys.users.getUserByUsername(username);

        if (user === undefined)
          return {
            type: "error",
            message: "Failed to find the user",
          };

        if (
          await opt.ctx.instance.sys.authorization.hasTwoFactorAuthenticationSecret(
            user.userId,
          )
        ) {
          if (opt.input.twoFactorCode === undefined)
            return {
              type: "twofactor",
            };
        }

        const session = await opt.ctx.instance.sys.authorization.createSession(
          user.userId,
          opt.input.password,
          AuthorizedDeviceType.UnknownBrowser,
          opt.input.twoFactorCode,
          opt.ctx.rawRequest.server.requestIP(opt.ctx.rawRequest.req)?.address,
        );

        if (session === undefined) {
          return {
            type: "error",
            message: "Failed to create a session?",
          };
        }

        opt.ctx.rawRequest.resHeaders.set(
          "set-cookie",
          Bun.Cookie.from("Authorization", session, {
            secure: false,
          }).serialize(),
        );

        return {
          type: "success",
          sessionToken: session,
        };
      }),
    isAuthenticated: publicProcedure
      .output(z.object({ authenticated: z.boolean() }))
      .query(async (opt) => {
        const cookieString = opt.ctx.rawRequest.req.headers?.get("cookie");

        if (cookieString === null) {
          return {
            authenticated: false,
          };
        }

        const parsedCookie = Bun.Cookie.parse(cookieString);

        let userId = await opt.ctx.instance.sys.authorization.verifySession(
          decodeURIComponent(parsedCookie.value),
        );

        if (userId === undefined) {
          return {
            authenticated: false,
          };
        }

        return {
          authenticated: true,
        };
      }),
    logout: procedure
      .output(z.object({ success: z.literal(true) }))
      .mutation(async (opt) => {
        const cookieString = opt.ctx.rawRequest.req.headers?.get("cookie");

        if (cookieString === null) {
          return {
            success: true,
          };
        }

        const parsedCookie = Bun.Cookie.parse(cookieString);

        await opt.ctx.instance.sys.authorization.endSessionByToken(
          decodeURIComponent(parsedCookie.value),
        );

        return {
          success: true,
        };
      }),
  },
  termsOfUse: publicProcedure.query(async (opt) => {
    const date = new Date(
      opt.ctx.instance.sys.configuration.termsOfUse.lastUpdated,
    );

    const localeDateString: string = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
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

    return `Terms of Use: ${opt.ctx.instance.sys.configuration.displayName}
Effective Date: ${formattedDate}

${opt.ctx.instance.sys.configuration.termsOfUse.message}`;
  }),
  app: {
    navigation: {
      user: {
        name: procedure
          .output(
            z.object({
              username: z.string(),
              forename: z.string(),
              surname: z.string(),
            }),
          )
          .query(async (opt) => {
            const db = opt.ctx.instance.sys.database.postgres();

            const user = (
              await db`SELECT username, forename, surname FROM users WHERE id = ${opt.ctx.userId};`
            )?.[0];

            if (!user) {
              throw new TRPCError({
                code: "NOT_FOUND",
                cause: { message: "User does not exist" },
              });
            }

            return {
              username: user.username || "@",
              forename: user.forename || "Unknown",
              surname: user.surname || "",
            };
          }),
      },
      getApplications: procedure
        .output(
          z.array(
            z.object({
              location: z.object({
                type: z.union([z.literal("local"), z.literal("remote")]),
                value: z.string(),
              }),
              icon: z.object({
                type: z.union([z.literal("icon"), z.literal("image")]),
                value: z.string(),
              }),
              label: z.string(),
              id: z.string(),
            }),
          ),
        )
        .query(async (opt) => {
          let applications =
            opt.ctx.instance.sys.applications.getEnabledApplications();

          return applications.map((app) => {
            let icon = {
              type: "icon" as "icon" | "image",
              value: "indeterminate_question_box",
            };

            if (app.manifest?.icon) {
              if (app.manifest.icon.type === "image") {
                icon = {
                  type: "image",
                  value: `${opt.ctx.rawRequest.destinationHostname}/api/application/${app.manifest.id}/icon/`,
                };
              } else {
                icon = app.manifest.icon;
              }
            }

            return {
              icon: icon,
              label: app.manifest?.displayName || "Unknown",
              location: {
                type: "local",
                value: `/app/${app.manifest?.id}` || "/404",
              },
              id: app.manifest?.id || "unknown",
            };
          });
        }),
      getQuickShortcuts: procedure.query(async (opt) => {
        const a = opt.ctx.instance.sys.settings.applicationSettings[
          "core"
        ].find((s) => s.id === "quick_shortcuts");

        if (!a) throw "The core:quick_shortcuts setting is somehow missing???";

        const quickShortcuts = (await a.getValue(opt.ctx.userId)) as string[];

        let applications =
          opt.ctx.instance.sys.applications.getEnabledApplications();

        return quickShortcuts
          .map((shortcut) => {
            const app = applications.find((a) => a.manifest?.id === shortcut);

            if (!app) return undefined;

            let icon = {
              type: "icon" as "icon" | "image",
              value: "indeterminate_question_box",
            };

            if (app.manifest?.icon) {
              if (app.manifest.icon.type === "image") {
                icon = {
                  type: "image",
                  value: `${opt.ctx.rawRequest.destinationHostname}/api/application/${app.manifest.id}/icon/`,
                };
              } else {
                icon = app.manifest.icon;
              }
            }

            return {
              icon: icon,
              label: app.manifest?.displayName || "Unknown",
              location: {
                type: "local",
                value: `/app/${app.manifest?.id}` || "/404",
              },
              id: app.manifest?.id || "unknown",
            };
          })
          .filter((qs) => qs !== undefined);
      }),
    },
    notifications: {
      listener: procedure
        // @ts-ignore
        .subscription(async function* (opt) {
          for await (const [data] of on(
            opt.ctx.instance.sys.notifications.eventEmitter,
            WorkspacesNotificationEventEmitterEvent.SendNotification,
            {
              signal: opt.signal,
            },
          )) {
            const notification = data as WorkspacesNotification;
            if (notification.recipient === opt.ctx.userId) {
              notifications.push(notification);

              yield notification;
            }
          }
        }),
      respond: procedure
        .input(
          z.object({
            uuid: z.string(),
            responseType: z.literal("button"),
            value: z.string(),
          }),
        )
        .output(
          z.object({
            ok: z.boolean(),
            action: z
              .object({ type: z.literal("navigate"), value: z.string() })
              .or(z.object({ type: z.literal("reload") }))
              .optional(),
          }),
        )
        .mutation(async (opt) => {
          const notification = notifications.find(
            (n) => n.uuid === opt.input.uuid,
          );

          if (notification) {
            let output;

            if (opt.input.responseType === "button") {
              output = notification.optionsCallbacks?.onButton(opt.input.value);
            }

            notifications = notifications.filter(
              (n) => n.uuid !== notification.uuid,
            );

            if (output !== undefined) {
              return { ok: true, action: output.action };
            } else {
              return { ok: true };
            }
          }

          return { ok: false };
        }),
    },
  },
});

export type WorkspacesTRPCRouter = typeof workspacesRouter;
