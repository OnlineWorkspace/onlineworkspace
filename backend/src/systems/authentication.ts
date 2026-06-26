import System from "../system.ts";
import {Instance} from "../index.ts";
import EmailAuthenticator from "./authentication/emailAuthenticator.ts";
import PasskeyAuthenticator from "./authentication/passkeyAuthenticator.ts";
import PasswordAuthenticator from "./authentication/passwordAuthenticator.ts";
import TotpAuthenticator from "./authentication/totpAuthenticator.ts";
import {Authenticator} from "./authentication/authenticator.ts";

export default class AuthenticationSystem extends System {
  authenticators;

  constructor(instance: Instance) {
    super("authentication", instance);

    this.authenticators = {
      [Authenticator.Email]: new EmailAuthenticator(this),
      [Authenticator.Passkey]: new PasskeyAuthenticator(this),
      [Authenticator.Password]: new PasswordAuthenticator(this),
      [Authenticator.TOTP]: new TotpAuthenticator(this)
    }
  }

  /*
    - getSessionRequirements(userId)
    - createSession(userId, parameters: { password, timedOneTimePassCode, passkey })
    - verifySession(authorizationCookie)
    - getUserAuthMethods(userId)
  */

  async getSessionRequirements(userId: number): Promise<Authenticator[] | undefined> {
    const user = await this.instance.sys.users.getUserById(userId)

    if (!user) return undefined

    user
  }
}
