import crypto from "node:crypto";
import type AuthenticationSystem from "../authentication.ts";

const PASSWORD_HASH_ITERATIONS = 600_000;

export default class PasswordAuthenticator {
  private authenticationSystem;

  constructor(authenticationSystem: AuthenticationSystem) {
    this.authenticationSystem = authenticationSystem;
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

  async setPassword(userId: number, password: string) {
    const db = this.authenticationSystem.instance.sys.database.postgres();

    if (!(await this.authenticationSystem.instance.sys.users.doesUserExist(userId))) {
      return false;
    }

    const hashedPassword = await this._internalHashPassword(password);

    await db`UPDATE public.users SET hashed_password = ${hashedPassword} WHERE id = ${userId}`;

    return true;
  }

  async verifyPassword(userId: number, password: string) {
    const db = this.authenticationSystem.instance.sys.database.postgres();

    const hashed_password = (await db`SELECT hashed_password FROM users WHERE id = ${userId}`)?.[0]?.hashed_password as string | undefined;

    if (!hashed_password) return false;

    return await this._internalVerifyPassword(password, hashed_password);
  }

  /*async createSession(
    userId: number,
    password: string,
    deviceId: AuthorizedDeviceType,
    otpCode?: string,
    ipAddress?: string,
  ): Promise<string | SessionCreationError> {
    if(this.loginAttemptCount.has(userId)) {
    }

    try {
      const db = this.instance.sys.database.postgres();

      if (
        !(await this._internalVerifyPassword(
          password,
          (await db`SELECT hashed_password FROM public.users WHERE id = ${userId}`)
            ?.[0]?.hashed_password,
        ))
      ) {
        if(this.loginAttemptCount.has(userId)) {
          this.loginAttemptCount.set(userId, {amount: this.loginAttemptCount.get(userId)!.amount + 1, lastAttempt: Date.now()})
        }

        return SessionCreationError.InvalidCredentials;
      }

      if (
        await this.instance.sys.authorization.hasTwoFactorAuthenticationSecret(
          userId,
        )
      ) {
        if (!otpCode) {
          console.log("no otp code provided when creating session?");
          return SessionCreationError.GenericError;
        }

        const totp = new OTPAuth.TOTP({
          issuer: this.instance.sys.configuration.proxy.hostname,
          label: `${this.instance.sys.configuration.branding.displayName} (Workspace)`,
          algorithm: "SHA1",
          digits: 6,
          secret:
          (await db`SELECT two_factor_secret FROM public.users WHERE id = ${userId}`)
            ?.[0]?.two_factor_secret,
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
          this.log.warning(
            `User (${userId})${await user
              ?.getUsername()} has the default password! Please tell them to change it!`,
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
                        "/app/uk.ewsgit.settings/authentication/reset-password",
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
        `Failed to create session. -> ${userId} @ ${
          AuthorizedDeviceType[deviceId]
        }`,
        utils.inspect(err),
      );

      return SessionCreationError.GenericError;
    }
  }*/
}

export interface PasswordAuthenticatorRequestRequirements {
  password: string;
}
