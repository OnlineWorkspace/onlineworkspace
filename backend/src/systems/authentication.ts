import System from "../system.ts";
import {Instance} from "../index.ts";
import EmailAuthenticator from "./authentication/emailAuthenticator.ts";
import PasskeyAuthenticator from "./authentication/passkeyAuthenticator.ts";
import PasswordAuthenticator, {PasswordAuthenticatorRequestRequirements} from "./authentication/passwordAuthenticator.ts";
import TotpAuthenticator from "./authentication/totpAuthenticator.ts";
import {Authenticator, AuthenticatorRequestRequirements} from "./authentication/authenticator.ts";
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

    const requirementInt =
      (await db`SELECT session_requirements FROM users WHERE id = ${userId}`)?.[0]?.session_requirements as number || 0;

    if ((requirementInt & Authenticator.Password) !== 0)
      sessionRequirements.push(Authenticator.Password)

    if ((requirementInt & Authenticator.Passkey) !== 0)
      sessionRequirements.push(Authenticator.Passkey)

    if ((requirementInt & Authenticator.TOTP) !== 0)
      sessionRequirements.push(Authenticator.TOTP)

    if ((requirementInt & Authenticator.Email) !== 0)
      sessionRequirements.push(Authenticator.Email)

    return sessionRequirements;
  }

  private async generateSessionCredentials(userId: number, metadata: { ipAddress?: string, deviceType?: string } = {}) {
    const db = this.instance.sys.database.postgres();
    const sessionToken = crypto.getRandomValues(new Uint32Array(16)).join("");

    await db`INSERT INTO public.sessions (user_id, session_token, device_type, valid_until, ip_address, login_method) VALUES (${userId}, ${sessionToken}, ${metadata.deviceType || "web"}, ${
      Date.now() + SESSION_VALID_TERM_MS
    }, ${metadata.ipAddress || "Anonymous"}, 'password authentication')`;

    return `workspaces_session:${userId}:${sessionToken}`;
  }

  async createSession(userId: number, requirements: AuthenticatorRequestRequirements, metadata: { ipAddress?: string, deviceType?: string } = {}): Promise<string | undefined> {
    const requiredRequirements = await this.getSessionRequirements(userId)

    // we must have at least one requirement otherwise this account needs a requirement to be set by an administrator
    if (requiredRequirements === undefined) {
      return undefined;
    }

    let hasPrimaryFactor: boolean = false;
    let hasSecondaryFactor: boolean = false;

    for (const [authenticatorId, value] of Object.entries(requirements)) {
      const authenticator = this.authenticators[Number(authenticatorId) as Authenticator]

      switch (Number(authenticatorId) as Authenticator) {
        case Authenticator.Email: {
          const authenticatorProvider = authenticator as EmailAuthenticator

          // authenticatorProvider.verifyCode()
          // TODO: this
          break;
        }
        case Authenticator.Passkey: {
          const authenticatorProvider = authenticator as PasskeyAuthenticator
          // TODO: this
          break;
        }
        case Authenticator.Password: {
          const authenticatorProvider = authenticator as PasswordAuthenticator
          const requirementValue = value as PasswordAuthenticatorRequestRequirements

          if(await authenticatorProvider.verifyPassword(userId, requirementValue.password)) {
            hasPrimaryFactor = true;
          }

          break;
        }
        case Authenticator.TOTP: {
          const authenticatorProvider = authenticator as TotpAuthenticator
          // TODO: this
          break;
        }
      }
    }

    if (Authenticator.Password in requiredRequirements) {
      if (!await this.authenticators[Authenticator.Password].verifyPassword(userId, requirements[Authenticator.Password]))
        return undefined;
    }

    if (Authenticator.Passkey in requiredRequirements) {
      if (!await this.authenticators[Authenticator.Passkey].verifyPasskey(userId, requirements[Authenticator.Passkey]))
        return undefined;
    }

    if (!(hasPrimaryFactor && hasSecondaryFactor)) {
      this.log.warning("Only one factor provided for account session creation.")
      return undefined;
    }

      // return this.generateSessionCredentials(userId, metadata)
  }
}
