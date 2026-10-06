import console from "node:console";
import crypto from "node:crypto";
import utils from "node:util";
import {
  type AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import * as OTPAuth from "otpauth";
import type { Instance } from "../index.ts";
import System from "../system.ts";
import { WorkspacesNotificationPriority } from "./notifications.ts";

export enum AuthorizedDeviceType {
  Desktop,
  Mobile,
  UnknownBrowser,
}

export enum SessionCreationError {
  InvalidCredentials,
  MissingUser,
  UserTimedOut,
  GenericError,
}

// failed logins allowed before an address is temporarily locked out of an account, and how long the lock lasts
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
// failures from every address added together, so an account can still not be guessed at by many addresses at once
const MAX_FAILED_LOGIN_ATTEMPTS_ANY_ADDRESS = 30;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
// how long an administrator's two factor status is remembered for
const SECURITY_STATUS_CACHE_MS = 15 * 1000;

// the number of ms that a login session is valid for
export const SESSION_VALID_TERM_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_HASH_ITERATIONS = 600_000;

export default class AuthorizationSystem extends System {
  private temporaryPasskeyCreationChallenges: Map<number, PublicKeyCredentialCreationOptionsJSON>;
  private temporaryPasskeyAuthenticationChallenges: Map<number, PublicKeyCredentialRequestOptionsJSON>;
  /** keyed by `userId:address`, and by `userId` for the failures from all addresses */
  private loginAttemptCount: Map<string, { amount: number; lastAttempt: number }>;
  private securityStatus: Map<number, { requiresTwoFactor: boolean; at: number }> = new Map();

  constructor(instance: Instance) {
    super("authorization", instance);

    this.temporaryPasskeyCreationChallenges = new Map();
    this.temporaryPasskeyAuthenticationChallenges = new Map();
    this.loginAttemptCount = new Map();
  }

  /** Someone signing in as a user from the same address too many times locks that address out of the account, not the account itself, so a stranger cannot lock the owner out. */
  private isLoginLockedOut(userId: number, ipAddress: string = "unknown"): boolean {
    const locked = (key: string, limit: number) => {
      const attempts = this.loginAttemptCount.get(key);

      if (!attempts) return false;

      if (Date.now() - attempts.lastAttempt >= LOGIN_LOCKOUT_MS) {
        this.loginAttemptCount.delete(key);
        return false;
      }

      return attempts.amount >= limit;
    };

    return locked(`${userId}:${ipAddress}`, MAX_FAILED_LOGIN_ATTEMPTS) || locked(`${userId}`, MAX_FAILED_LOGIN_ATTEMPTS_ANY_ADDRESS);
  }

  /**
    Checks a TOTP code against the user's stored two-factor secret.
    Failures count towards the login lockout so a code cannot be brute-forced.
    @returns {true} the code is valid
    @returns {false} the code is invalid, the user has no secret, or they are locked out
  */
  async verifyTwoFactorCode(userId: number, code: string, ipAddress?: string): Promise<boolean> {
    if (this.isLoginLockedOut(userId, ipAddress)) return false;

    const db = this.instance.sys.database.postgres();
    const secret = (await db`SELECT two_factor_secret FROM public.users WHERE id = ${userId}`)?.[0]?.two_factor_secret as string | null | undefined;

    if (!secret) return false;

    const totp = new OTPAuth.TOTP({
      issuer: this.instance.sys.configuration.proxy.hostname,
      label: `${this.instance.sys.configuration.branding.displayName} (Workspace)`,
      algorithm: "SHA1",
      digits: 6,
      secret,
    });

    if (totp.validate({ token: code }) === null) {
      this.recordFailedLogin(userId, ipAddress);
      return false;
    }

    return true;
  }

  private recordFailedLogin(userId: number, ipAddress: string = "unknown") {
    for (const key of [`${userId}:${ipAddress}`, `${userId}`]) {
      const attempts = this.loginAttemptCount.get(key);
      const stillCounting = attempts && Date.now() - attempts.lastAttempt < LOGIN_LOCKOUT_MS;

      this.loginAttemptCount.set(key, { amount: (stillCounting ? attempts.amount : 0) + 1, lastAttempt: Date.now() });
    }

    if (this.isLoginLockedOut(userId, ipAddress)) {
      this.instance.sys.audit?.record({ action: "auth.lockout", actorId: userId, ip: ipAddress, outcome: "failure", details: { minutes: LOGIN_LOCKOUT_MS / 60000 } });
    }
  }

  private clearFailedLogins(userId: number, ipAddress: string = "unknown") {
    this.loginAttemptCount.delete(`${userId}:${ipAddress}`);
    this.loginAttemptCount.delete(`${userId}`);
  }

  /**
    Checks a password against the user's, failures count towards the lockout in the same way as when signing in.
    Used to confirm that it is really the user, before something which would be bad if it was someone else at their computer.
  */
  async verifyPassword(userId: number, password: string, ipAddress?: string): Promise<boolean> {
    if (this.isLoginLockedOut(userId, ipAddress)) return false;

    const db = this.instance.sys.database.postgres();
    const hashed = (await db`SELECT hashed_password FROM public.users WHERE id = ${userId}`)?.[0]?.hashed_password as string | null | undefined;

    if (!hashed || !(await this._internalVerifyPassword(password, hashed))) {
      this.recordFailedLogin(userId, ipAddress);
      return false;
    }

    return true;
  }

  /** Spends the same time as checking a password does, so that a username which does not exist cannot be told apart from a wrong password by how long the answer takes. */
  async burnPasswordCheck(): Promise<void> {
    await this._internalDeriveBits("burn", crypto.getRandomValues(new Uint8Array(16)));
  }

  private async _internalHashPassword(password: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await this._internalDeriveBits(password, salt);
    return `${salt.toBase64()}:${hash.toBase64()}`;
  }

  private async _internalVerifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, expected] = hashedPassword.split(":").map((part) => Uint8Array.fromBase64(part));
    const actual = await this._internalDeriveBits(password, salt);
    if (actual.byteLength !== expected.byteLength) return false;
    return crypto.timingSafeEqual(actual, expected);
  }

  private async _internalDeriveBits(password: string, salt: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt,
        iterations: PASSWORD_HASH_ITERATIONS,
      },
      key,
      256,
    );
    return new Uint8Array(bits);
  }

  /**
   * Creates a new password-authed session for a user.
   *
   * @param {number} userId
   * @param {string} password
   * @param {AuthorizedDeviceType} deviceId - The type of device making the request.
   * @param {string} [otpCode] - The optional one-time password (OTP) code for two-factor authentication.
   * @param {string} [ipAddress] - The optional IP address of the client initiating the session.
   * @returns {Promise<string | SessionCreationError>} A promise that resolves to the new session's `sessionToken` string,
   * or a `SessionCreationError` if the session could not be created.
   */
  async createPasswordSession(
    userId: number,
    password: string,
    deviceId: AuthorizedDeviceType,
    otpCode?: string,
    ipAddress?: string,
  ): Promise<string | SessionCreationError> {
    if (this.isLoginLockedOut(userId, ipAddress)) {
      this.instance.sys.audit?.record({ action: "auth.login_failed", actorId: userId, ip: ipAddress, outcome: "failure", details: { reason: "locked out" } });
      return SessionCreationError.UserTimedOut;
    }

    try {
      const db = this.instance.sys.database.postgres();

      if (!(await this._internalVerifyPassword(password, (await db`SELECT hashed_password FROM public.users WHERE id = ${userId}`)?.[0]?.hashed_password))) {
        this.recordFailedLogin(userId, ipAddress);
        this.instance.sys.audit?.record({ action: "auth.login_failed", actorId: userId, ip: ipAddress, outcome: "failure", details: { reason: "wrong password" } });

        return SessionCreationError.InvalidCredentials;
      }

      if (await this.instance.sys.authorization.hasTwoFactorAuthenticationSecret(userId)) {
        if (!otpCode) {
          console.log("no otp code provided when creating session?");
          return SessionCreationError.GenericError;
        }

        const totp = new OTPAuth.TOTP({
          issuer: this.instance.sys.configuration.proxy.hostname,
          label: `${this.instance.sys.configuration.branding.displayName} (Workspace)`,
          algorithm: "SHA1",
          digits: 6,
          secret: (await db`SELECT two_factor_secret FROM public.users WHERE id = ${userId}`)?.[0]?.two_factor_secret,
        });

        if (totp.validate({ token: otpCode }) === null) {
          this.recordFailedLogin(userId, ipAddress);
          this.instance.sys.audit?.record({ action: "auth.login_failed", actorId: userId, ip: ipAddress, outcome: "failure", details: { reason: "wrong two factor code" } });

          return SessionCreationError.InvalidCredentials;
        }
      }

      this.clearFailedLogins(userId, ipAddress);

      const sessionToken = crypto.getRandomValues(new Uint32Array(16)).join("");

      await db`INSERT INTO public.sessions (user_id, session_token, device_type, valid_until, ip_address, login_method) VALUES (${userId}, ${sessionToken}, ${deviceId}, ${
        Date.now() + SESSION_VALID_TERM_MS
      }, ${ipAddress || "Anonymous"}, 'password authentication')`;
      this.instance.sys.audit?.record({ action: "auth.login", actorId: userId, ip: ipAddress, details: { method: "password" } });

      const user = await this.instance.sys.users.getUserById(userId);

      if (await user?.isAdministrator()) {
        if (password === "password") {
          this.log.warning(`User (${userId})${await user?.getUsername()} has the default password! Please tell them to change it!`);

          setTimeout(() => {
            this.instance.sys.notifications.send(
              userId,
              "authorization.createSession",
              WorkspacesNotificationPriority.Urgent,
              {
                title: "Change Your Password",
                icon: "key",
                body: "Please change your password from the default!",
              },
              {
                buttons: [
                  {
                    id: "change-password",
                    label: "Change Password",
                    type: "filled",
                  },
                ],
              },
              {
                onButton(_id) {
                  return {
                    action: {
                      type: "navigate",
                      value: "/app/uk.ewsgit.settings/authentication/reset-password",
                    },
                  };
                },
              },
            );
          }, 5000);
        }
      }

      return `workspaces_session:${userId}:${sessionToken}`;
    } catch (err) {
      this.log.warning(`Failed to create session. -> ${userId} @ ${AuthorizedDeviceType[deviceId]}`, utils.inspect(err));

      return SessionCreationError.GenericError;
    }
  }

  /**
    Verifies that a sessionToken exists and is valid.
    An administrator who has not set up two factor authentication can only use their session to set it up, so everything which
    checks a session refuses theirs, unless it says that it is part of setting it up (`allowTwoFactorSetup`).
    @returns {number} the userId of the session
    @returns {undefined} the session is invalid
  */
  async verifySession(sessionToken: string, options: { allowTwoFactorSetup?: boolean } = {}): Promise<number | undefined> {
    const [_, userId, token] = sessionToken.split(":");

    const sessionsDb = this.instance.sys.database.postgres();

    const session = (await sessionsDb`SELECT session_id, valid_until FROM public.sessions WHERE user_id = ${userId} AND session_token = ${token}`)?.[0];

    if (Number(session?.valid_until) < Date.now()) {
      await sessionsDb`DELETE FROM public.sessions WHERE user_id = ${userId} AND session_token = ${token}`;
      return undefined;
    }

    if (session?.session_id === undefined) return undefined;

    if (!options.allowTwoFactorSetup && (await this.requiresTwoFactorSetup(Number(userId)))) return undefined;

    return Number(userId);
  }

  /**
    Administrators must use two factor authentication, a passkey counts as it is both something you have and something you are.
    @returns {true} the user is an administrator who has neither
  */
  async requiresTwoFactorSetup(userId: number): Promise<boolean> {
    const cached = this.securityStatus.get(userId);

    if (cached && Date.now() - cached.at < SECURITY_STATUS_CACHE_MS) return cached.requiresTwoFactor;

    const user = await this.instance.sys.users.getUserById(userId);
    const requiresTwoFactor = !!user && (await user.isAdministrator()) && !(await this.hasTwoFactorAuthenticationSecret(userId)) && !(await this.hasPasskey(userId));

    this.securityStatus.set(userId, { requiresTwoFactor, at: Date.now() });

    return requiresTwoFactor;
  }

  /** forget what is known about whether the user needs to set up two factor, for when something which changes it happens */
  forgetSecurityStatus(userId: number) {
    this.securityStatus.delete(userId);
  }

  /**
    Removes a user's session and invalidates it's token
    @returns {true} the session is removed, and it's token is invalidated
    @returns {undefined} the sessionToken is invalid
  */
  async endSessionByToken(sessionToken: string): Promise<boolean | undefined> {
    const [_, userId, token] = sessionToken.split(":");

    const sessionsDb = this.instance.sys.database.postgres();

    await sessionsDb`DELETE FROM public.sessions WHERE user_id = ${userId} AND session_token = ${token}`;

    return true;
  }

  /**
    Removes a user's session and invalidates it's token
    @returns {true} the session is removed, and it's token is invalidated
    @returns {undefined} the sessionToken is invalid
  */
  async endSessionById(userId: number, sessionId: number): Promise<boolean | undefined> {
    const sessionsDb = this.instance.sys.database.postgres();

    await sessionsDb`DELETE FROM public.sessions WHERE user_id = ${userId} AND session_id = ${sessionId}`;

    return true;
  }

  /**
    Removes all of a user's sessions and invalidates their tokens
    @param exceptSessionToken a session to keep, as the raw token (the last part of `workspaces_session:[user]:[token]`)
    @returns {true} all sessions removed
  */
  async endAllSessions(userId: number, exceptSessionToken?: string): Promise<boolean> {
    const sessionsDb = this.instance.sys.database.postgres();

    if (exceptSessionToken) {
      await sessionsDb`DELETE FROM public.sessions WHERE user_id = ${userId} AND session_token <> ${exceptSessionToken}`;
    } else {
      await sessionsDb`DELETE FROM public.sessions WHERE user_id = ${userId}`;
    }

    return true;
  }

  /**
    Sets a user's password to password
    @returns {true} successful
    @returns {false} failed
  */
  async setPassword(userId: number, password: string): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    if (!(await this.instance.sys.users.doesUserExist(userId))) {
      return false;
    }

    const hashedPassword = await this._internalHashPassword(password);

    await db`UPDATE public.users SET hashed_password = ${hashedPassword} WHERE id = ${userId}`;

    return true;
  }

  /**
    Returns whether a user has a password set or not
    @returns {true} if they have a password
    @returns {false} if they lack a password
  */
  async hasPassword(userId: number): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    if (!(await this.instance.sys.users.doesUserExist(userId))) {
      return false;
    }

    const [{ exists }] = await db`
      SELECT (hashed_password IS NOT NULL) as exists
      FROM public.users
      WHERE id = ${userId}
    `;

    return !!exists;
  }

  /**
    Sets a user's two-factor authentication secret
    @returns {true} successful
    @returns {false} failed
  */
  async setTwoFactorAuthenticationSecret(userId: number, secret: string): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    if (!(await this.instance.sys.users.doesUserExist(userId))) {
      return false;
    }

    try {
      await db`UPDATE public.users SET two_factor_secret = ${secret} WHERE id = ${userId}`;
    } catch (_) {
      return false;
    }

    this.forgetSecurityStatus(userId);
    this.instance.sys.audit?.record({ action: "auth.two_factor_enabled", actorId: userId });

    return true;
  }

  /**
    Returns whether a user has a two-factor authentication secret or not
    @returns {true} if they have a factor authentication secret
    @returns {false} if they lack a factor authentication secret
  */
  async hasTwoFactorAuthenticationSecret(userId: number): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    if (!(await this.instance.sys.users.doesUserExist(userId))) {
      return false;
    }

    const [{ exists }] = await db`
      SELECT (two_factor_secret IS NOT NULL) as exists
      FROM public.users
      WHERE id = ${userId}
    `;

    return !!exists;
  }

  /**
    Returns whether a user has a passkey or not
    @returns {true} if they have a passkey
    @returns {false} if they lack a passkey
  */
  async hasPasskey(userId: number): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    if (!(await this.instance.sys.users.doesUserExist(userId))) {
      return false;
    }

    const userPasskeys = await db`SELECT COUNT(*) FROM public.passkeys WHERE user_id = ${userId}`;

    return Number(userPasskeys[0].count) > 0;
  }

  /**
    Issues a new Passkey challenge for the provided userId.
    @param {number} userId target userId for the passkey
  */
  async requestNewPasskey(userId: number) {
    const db = this.instance.sys.database.postgres();

    const userPasskeys = (await db`SELECT * FROM public.passkeys WHERE user_id = ${userId}`) as {
      passkey_id: string;
      transports: string;
    }[];

    const passkeyCreationOptions: PublicKeyCredentialCreationOptionsJSON = await generateRegistrationOptions({
      rpName: this.instance.sys.configuration.branding.displayName,
      rpID: this.instance.sys.configuration.proxy.hostname,
      userName: (await (await this.instance.sys.users.getUserById(userId))?.getUsername()) || `${userId}`,
      excludeCredentials: userPasskeys.map((passkey) => {
        return {
          id: passkey.passkey_id,
          transports: passkey.transports.split(",") as AuthenticatorTransportFuture[],
        };
      }),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    this.temporaryPasskeyCreationChallenges.set(userId, passkeyCreationOptions);

    return passkeyCreationOptions;
  }

  /**
    Register a new passkey for the provided userId,
    the user's temporary Passkey response is required as the input param
  */
  // biome-ignore lint/suspicious/noExplicitAny: the input is a WebAuthn response
  // which is very complex and would require a lot of work to type, so we'll just
  // use any here as it is handled by a library, and we don't need to worry about the types
  async registerPasskey(userId: number, input: any) {
    const db = this.instance.sys.database.postgres();
    const expectedChallenge = this.temporaryPasskeyCreationChallenges.get(userId);
    if (!expectedChallenge) {
      return false;
    }

    const verification = await verifyRegistrationResponse({
      response: input,
      expectedChallenge: expectedChallenge.challenge,
      expectedOrigin: `${this.instance.sys.configuration.proxy.secure ? "https://" : "http://"}${this.instance.sys.configuration.proxy.hostname}`,
      expectedRPID: this.instance.sys.configuration.proxy.hostname,
    });

    const registrationInfo = verification.registrationInfo!;
    const credential = registrationInfo.credential;

    await db`INSERT INTO public.passkeys (
      passkey_id,
      public_key,
      user_id,
      webauthn_user_id,
      counter,
      device_type,
      backed_up,
      transports
    ) VALUES (
      ${credential.id},
      ${credential.publicKey},
      ${userId},
      ${expectedChallenge.user.id},
      ${credential.counter},
      ${registrationInfo.credentialDeviceType},
      ${registrationInfo.credentialBackedUp},
      ${credential.transports || []}
    )`;

    this.temporaryPasskeyCreationChallenges.delete(userId);
    this.forgetSecurityStatus(userId);
    this.instance.sys.audit?.record({ action: "auth.passkey_added", actorId: userId });

    return verification.verified;
  }

  async requestPasskeySession(userId: number) {
    const db = this.instance.sys.database.postgres();
    const userPasskeys = (await db`SELECT * FROM public.passkeys WHERE user_id = ${userId}`) as {
      passkey_id: string;
      transports: string;
    }[];

    const passkeyOptions: PublicKeyCredentialRequestOptionsJSON = await generateAuthenticationOptions({
      rpID: this.instance.sys.configuration.proxy.hostname,
      allowCredentials: userPasskeys.map((passkey) => {
        return {
          id: passkey.passkey_id,
          transports: passkey.transports.split(",") as AuthenticatorTransportFuture[],
        };
      }),
    });

    this.temporaryPasskeyAuthenticationChallenges.set(userId, passkeyOptions);

    return passkeyOptions;
  }

  // biome-ignore lint/suspicious/noExplicitAny: the input is a webauthn response which is very complex and would require a lot of work to type, so we'll just use any here as it is handled by a library and we don't need to worry about the types
  async createPasskeySession(userId: number, deviceId: AuthorizedDeviceType, input: any, ipAddress?: string) {
    const db = this.instance.sys.database.postgres();
    const expectedChallenge = this.temporaryPasskeyAuthenticationChallenges.get(userId);
    if (!expectedChallenge) {
      return undefined;
    }

    const passkey = (await db`SELECT * FROM public.passkeys WHERE user_id = ${userId} AND passkey_id = ${input.id}`)?.[0];
    if (!passkey) {
      return undefined;
    }

    const verification = await verifyAuthenticationResponse({
      response: input,
      expectedChallenge: expectedChallenge.challenge,
      expectedOrigin: `${this.instance.sys.configuration.proxy.secure ? "https://" : "http://"}${this.instance.sys.configuration.proxy.hostname}`,
      expectedRPID: this.instance.sys.configuration.proxy.hostname,
      credential: {
        id: passkey.id,
        publicKey: passkey.public_key,
        counter: passkey.counter,
        transports: passkey.transports.split(",") as AuthenticatorTransportFuture[],
      },
    });

    if (verification.verified) {
      const sessionToken = crypto.getRandomValues(new Uint32Array(16)).join("");

      await db`INSERT INTO public.sessions (user_id, session_token, device_type, valid_until, ip_address, login_method) VALUES (${userId}, ${sessionToken}, ${deviceId}, ${
        Date.now() + SESSION_VALID_TERM_MS
      }, ${ipAddress || "Anonymous"}, 'passkey')`;
      this.instance.sys.audit?.record({ action: "auth.login", actorId: userId, ip: ipAddress, details: { method: "passkey" } });
      await db`UPDATE public.passkeys SET last_used_timestamp = NOW(), counter = ${passkey.counter + 1} WHERE passkey_id = ${passkey.passkey_id}`;

      return `workspaces_session:${userId}:${sessionToken}`;
    }

    return undefined;
  }

  async removePasskey(userId: number, passkeyId: string) {
    const db = this.instance.sys.database.postgres();

    await db`DELETE FROM public.passkeys WHERE user_id = ${userId} AND passkey_id = ${passkeyId}`;
    this.forgetSecurityStatus(userId);
    this.instance.sys.audit?.record({ action: "auth.passkey_removed", actorId: userId });
  }

  /**
    Removes a user's authenticator app and passkeys, for when they have lost them. Their sessions are ended.
    Administrators have to set up a factor again before they can use the instance.
    @returns {false} the user does not exist
  */
  async resetTwoFactor(userId: number): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    if (!(await this.instance.sys.users.doesUserExist(userId))) return false;

    await db`UPDATE public.users SET two_factor_secret = NULL WHERE id = ${userId}`;
    await db`DELETE FROM public.passkeys WHERE user_id = ${userId}`;
    await this.endAllSessions(userId);
    this.forgetSecurityStatus(userId);

    return true;
  }

  override async startup() {
    // loop through all users, check for any session tokens which are expired and remove them from the user's valid sessions pool

    const db = this.instance.sys.database.postgres();

    // init the sessions database
    //
    // session_id - the id of the session (number)
    // user_id - the id of the user (number)
    // session_token - the session's access token in the format 'workspaces_session:[user_id]:[token]' (string)
    // device_type - the session's device type (AuthorizedDeviceType)
    // valid_until - the epoch time which when reached, the session will be invalid (number)
    // ip_address - the ip address of the session (string)
    // login_method - the authentication method used to log in (string)
    await db`CREATE TABLE IF NOT EXISTS Sessions (
      session_id SERIAL PRIMARY KEY,
      user_id INTEGER,
      session_token TEXT,
      device_type INTEGER,
      valid_until BIGINT,
      ip_address TEXT DEFAULT 'Anonymous',
      login_method TEXT,
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
    )`;

    // init the passkeys database
    // passkey_id - the id of the passkey (Base64URLString)
    // public_key - the passkey's public key (Uint8Array)
    // user_id - the id of the user who owns the passkey (number)
    // webauthn_user_id - the webauthn user id associated with the passkey (string)
    // counter - the passkey's counter for preventing replay attacks (number)
    // device_type - the type of device the passkey is used on (CredentialDeviceType)
    // backed_up - whether the passkey has been backed up or not (boolean)
    // transports - the transports supported by the passkey (string array stored as a CSV string -> AuthenticatorTransportFuture[])
    // creation_timestamp - the timestamp of when the passkey was created (Date)
    // last_used_timestamp - the timestamp of when the passkey was last used (Date)
    await db`CREATE TABLE IF NOT EXISTS Passkeys (
      passkey_id TEXT PRIMARY KEY,
      public_key BYTEA,
      user_id INTEGER,
      webauthn_user_id TEXT,
      counter BIGINT,
      device_type VARCHAR(32),
      backed_up BOOLEAN DEFAULT FALSE,
      transports VARCHAR(255),
      creation_timetamp TIMESTAMPTZ DEFAULT NOW(),
      last_used_timestamp TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
    )`;

    return true;
  }
}
