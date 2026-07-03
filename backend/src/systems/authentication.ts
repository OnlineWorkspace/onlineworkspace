import System from "../system.ts";
import { Instance } from "../index.ts";
import EmailAuthenticator from "./authentication/emailAuthenticator.ts";
import PasskeyAuthenticator from "./authentication/passkeyAuthenticator.ts";
import PasswordAuthenticator from "./authentication/passwordAuthenticator.ts";
import TotpAuthenticator from "./authentication/totpAuthenticator.ts";
import { Authenticator } from "./authentication/authenticator.ts";
import {SESSION_VALID_TERM_MS} from "./authorization.ts";

export default class AuthenticationSystem extends System {
  authenticators;

  constructor(instance: Instance) {
    super("authentication", instance);

    this.authenticators = {
      [Authenticator.Email]: new EmailAuthenticator(this),
      [Authenticator.Passkey]: new PasskeyAuthenticator(this),
      [Authenticator.Password]: new PasswordAuthenticator(this),
      [Authenticator.TOTP]: new TotpAuthenticator(this),
    };
  }

  /*
    - getSessionRequirements(userId)
    - createSession(userId, parameters: { password, timedOneTimePassCode, passkey })
    - verifySession(authorizationCookie)
    - getUserAuthMethods(userId)
  */

  async setSessionRequirementsForUser(
    userId: number,
    sessionRequirements: Authenticator[],
  ) {
    try {
      const db = this.instance.sys.database.postgres();

      let requirementsInt = 0;

      for (const sessionReq of sessionRequirements) {
        requirementsInt |= sessionReq;
      }

      await db`UPDATE users
               SET session_requirements = ${requirementsInt}
               WHERE id = ${userId}`;

      return true;
    } catch (e) {
      this.log.error(e);

      return false;
    }
  }

  async getSessionRequirements(
    userId: number,
  ): Promise<Authenticator[] | undefined> {
    let sessionRequirements: Authenticator[] = [];

    const db = this.instance.sys.database.postgres();

    let requirementInt =
      await db`SELECT session_requirements FROM users WHERE id = ${userId}`;

    return sessionRequirements;
  }

  private async generateSessionCredentials(userId: number) {
    const sessionToken = crypto.getRandomValues(new Uint32Array(16)).join("");

    await db`INSERT INTO public.sessions (user_id, session_token, device_type, valid_until, ip_address, login_method) VALUES (${userId}, ${sessionToken}, ${deviceId}, ${
      Date.now() + SESSION_VALID_TERM_MS
    }, ${ipAddress || "Anonymous"}, 'password authentication')`;
  }

  async createSession(userId: number, requirements: Record<Authenticator, string>) {
    const requiredRequirements = await this.getSessionRequirements(userId)

    if (requiredRequirements === undefined) return this.generateSessionCredentials(userId)
  }
}
