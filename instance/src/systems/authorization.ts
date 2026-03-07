import type { Instance } from "../index.js";
import System from "../system.js";
import { WorkspacesNotificationPriority } from "./notifications.js";
import utils from "node:util";
import * as OTPAuth from "otpauth";

export enum AuthorizedDeviceType {
  Desktop,
  Mobile,
  UnknownBrowser,
}

// the number of ms that a login session is valid for
export const SESSION_VALID_TERM_MS = 7 * 24 * 60 * 60 * 1000;

export default class AuthorizationSystem extends System {
  constructor(instance: Instance) {
    super("authorization", instance);

    return this;
  }

  // Creates a new session for a user
  // @returns {string} the new session's sessionToken
  async createSession(
    userId: number,
    password: string,
    deviceId: AuthorizedDeviceType,
    otpCode?: string,
    ipAddress?: string,
  ): Promise<string | undefined> {
    try {
      const db = this.instance.sys.database.postgres();

      if (
        !(await Bun.password.verify(
          password,
          (
            await db`SELECT hashed_password FROM tricolor_workspaces.public.users WHERE id = ${userId}`
          )?.[0]?.hashed_password,
        ))
      ) {
        return undefined;
      }

      if (
        await this.instance.sys.authorization.hasTwoFactorAuthenticationSecret(
          userId,
        )
      ) {
        if (!otpCode) {
          console.log("no otp code provided when creating session?");
          return undefined;
        }

        let totp = new OTPAuth.TOTP({
          issuer: this.instance.sys.configuration.webUrl[0],
          label: `${this.instance.sys.configuration.displayName} (Workspace)`,
          algorithm: "SHA1",
          digits: 6,
          secret: (
            await db`SELECT two_factor_secret FROM tricolor_workspaces.public.users WHERE id = ${userId}`
          )?.[0]?.two_factor_secret,
        });

        if (totp.validate({ token: otpCode }) === null) {
          return undefined;
        }
      }

      const sessionToken = crypto.getRandomValues(new Uint32Array(16)).join("");

      await db`INSERT INTO tricolor_workspaces.public.sessions (user_id, session_token, device_type, valid_until, ip_address) VALUES (${userId}, ${sessionToken}, ${deviceId}, ${Date.now() + SESSION_VALID_TERM_MS}, ${ipAddress || "Anonymous"})`;

      const user = await this.instance.sys.users.getUserById(userId);

      if (await user?.isAdministrator()) {
        if (password === "password") {
          this.log.warning(
            `User (${userId})${await user?.getUsername()} has the default password! Please tell them to change it!`,
          );

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
                      value:
                        "/app/uk.tcsw.settings/authentication/reset-password",
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
      this.log.warning(
        `Failed to create session. -> ${userId} @ ${AuthorizedDeviceType[deviceId]}`,
        utils.inspect(err),
      );

      return undefined;
    }
  }

  // Verifies that a sessionToken exists and is vaild
  // @returns {number} the userId of the session
  // @returns {undefined} the session is invalid
  async verifySession(sessionToken: string): Promise<number | undefined> {
    const [_, userId, token] = sessionToken.split(":");

    const sessionsDb = this.instance.sys.database.postgres();

    const session = (
      await sessionsDb`SELECT session_id, valid_until FROM tricolor_workspaces.public.sessions WHERE user_id = ${userId} AND session_token = ${token}`
    )?.[0];

    if (Number(session?.valid_until) < Date.now()) {
      await sessionsDb`DELETE FROM tricolor_workspaces.public.sessions WHERE user_id = ${userId} AND session_token = ${token}`;
      return undefined;
    }

    if (session?.session_id !== undefined) return Number(userId);

    return undefined;
  }

  // Removes a user's session and invalidates it's token
  // @returns {true} the session is removed, and it's token is invalidated
  // @returns {undefined} the sessionToken is invalid
  async endSessionByToken(sessionToken: string): Promise<boolean | undefined> {
    const [_, userId, token] = sessionToken.split(":");

    const sessionsDb = this.instance.sys.database.postgres();

    await sessionsDb`DELETE FROM tricolor_workspaces.public.sessions WHERE user_id = ${userId} AND session_token = ${token}`;

    return true;
  }

  // Removes a user's session and invalidates it's token
  // @returns {true} the session is removed, and it's token is invalidated
  // @returns {undefined} the sessionToken is invalid
  async endSessionById(
    userId: number,
    sessionId: number,
  ): Promise<boolean | undefined> {
    const sessionsDb = this.instance.sys.database.postgres();

    await sessionsDb`DELETE FROM tricolor_workspaces.public.sessions WHERE user_id = ${userId} AND session_id = ${sessionId}`;

    return true;
  }

  // Sets a user's password to password
  // @returns {true} successful
  // @returns {false} failed
  async setPassword(userId: number, password: string): Promise<boolean> {
    const db = this.instance.sys.database.postgres();

    if (!(await this.instance.sys.users.doesUserExist(userId))) {
      return false;
    }

    const hashedPassword = await Bun.password.hash(password);

    await db`UPDATE tricolor_workspaces.public.users SET hashed_password = ${hashedPassword} WHERE id = ${userId}`;

    return true;
  }

  // Returns whether a user has a password set or not
  // @returns {true} if they have a password
  // @returns {false} if they lack a password
  async hasPassword(userId: number) {
    const db = this.instance.sys.database.postgres();

    if (!(await this.instance.sys.users.doesUserExist(userId))) {
      return false;
    }

    let [{ exists }] = await db`
            SELECT (hashed_password IS NOT NULL) as exists
            FROM tricolor_workspaces.public.users
            WHERE id = ${userId}
        `;

    return !!exists;
  }

  // Sets a user's two-factor authentication secret
  // @returns {true} successful
  // @returns {false} failed
  async setTwoFactorAuthenticationSecret(userId: number, secret: string) {
    const db = this.instance.sys.database.postgres();

    if (!(await this.instance.sys.users.doesUserExist(userId))) {
      return false;
    }

    try {
      await db`UPDATE tricolor_workspaces.public.users SET two_factor_secret = ${secret} WHERE id = ${userId}`;
    } catch (err) {
      return false;
    }

    return true;
  }

  // Returns whether a user has a two-factor authentication secret or not
  // @returns {true} if they have a factor authentication secret
  // @returns {false} if they lack a factor authentication secret
  async hasTwoFactorAuthenticationSecret(userId: number) {
    const db = this.instance.sys.database.postgres();

    if (!(await this.instance.sys.users.doesUserExist(userId))) {
      return false;
    }

    let [{ exists }] = await db`
            SELECT (two_factor_secret IS NOT NULL) as exists
            FROM tricolor_workspaces.public.users
            WHERE id = ${userId}
        `;

    return !!exists;
  }

  // Returns whether a user has a passkey or not
  // @returns {true} if they have a passkey
  // @returns {false} if they lack a passkey
  async hasPasskey(userId: number) {
    const db = this.instance.sys.database.postgres();

    if (!(await this.instance.sys.users.doesUserExist(userId))) {
      return false;
    }

    const userPasskeys =
      await db`SELECT passkeys FROM tricolor_workspaces.public.users WHERE id = ${userId}`;

    return userPasskeys?.[0]?.passkeys?.length > 0;
  }

  async startup() {
    // loop through all users, check for any session tokens which are expired and remove them from the user's valud sessions pool

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
            FOREIGN KEY (user_id) REFERENCES tricolor_workspaces.public.users(id) ON DELETE CASCADE
        )`;

    return true;
  }
}
