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

// the number of ms that a login session is valid for
export const SESSION_VALID_TERM_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_HASH_ITERATIONS = 600_000;

export default class AuthorizationSystem extends System {
  private temporaryPasskeyCreationChallenges: Map<number, PublicKeyCredentialCreationOptionsJSON>;
  private temporaryPasskeyAuthenticationChallenges: Map<number, PublicKeyCredentialRequestOptionsJSON>;
  private loginAttemptCount: Map<number, { amount: number; lastAttempt: number }>;

  constructor(instance: Instance) {
    super("authorization", instance);

    this.temporaryPasskeyCreationChallenges = new Map();
    this.temporaryPasskeyAuthenticationChallenges = new Map();
    this.loginAttemptCount = new Map();
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
    if (this.loginAttemptCount.has(userId)) {
    }

    try {
      const db = this.instance.sys.database.postgres();

      if (!(await this._internalVerifyPassword(password, (await db`SELECT hashed_password FROM public.users WHERE id = ${userId}`)?.[0]?.hashed_password))) {
        if (this.loginAttemptCount.has(userId)) {
          this.loginAttemptCount.set(userId, { amount: this.loginAttemptCount.get(userId)!.amount + 1, lastAttempt: Date.now() });
        }

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
          return SessionCreationError.InvalidCredentials;
        }
      }

      const sessionToken = crypto.getRandomValues(new Uint32Array(16)).join("");

      await db`INSERT INTO public.sessions (user_id, session_token, device_type, valid_until, ip_address, login_method) VALUES (${userId}, ${sessionToken}, ${deviceId}, ${
        Date.now() + SESSION_VALID_TERM_MS
      }, ${ipAddress || "Anonymous"}, 'password authentication')`;

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
    Verifies that a sessionToken exists and is valid
    @returns {number} the userId of the session
    @returns {undefined} the session is invalid
  */
  async verifySession(sessionToken: string): Promise<number | undefined> {
    const [_, userId, token] = sessionToken.split(":");

    const sessionsDb = this.instance.sys.database.postgres();

    const session = (await sessionsDb`SELECT session_id, valid_until FROM public.sessions WHERE user_id = ${userId} AND session_token = ${token}`)?.[0];

    if (Number(session?.valid_until) < Date.now()) {
      await sessionsDb`DELETE FROM public.sessions WHERE user_id = ${userId} AND session_token = ${token}`;
      return undefined;
    }

    if (session?.session_id !== undefined) return Number(userId);

    return undefined;
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
      await db`UPDATE public.passkeys SET last_used_timestamp = NOW(), counter = ${passkey.counter + 1} WHERE passkey_id = ${passkey.passkey_id}`;

      return `workspaces_session:${userId}:${sessionToken}`;
    }

    return undefined;
  }

  removePasskey(userId: number, passkeyId: string) {
    const db = this.instance.sys.database.postgres();

    return db`DELETE FROM public.passkeys WHERE user_id = ${userId} AND passkey_id = ${passkeyId}`;
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
