import {EmailAuthenticatorRequestRequirements} from "./emailAuthenticator.ts";
import {PasskeyAuthenticatorRequestRequirements} from "./passkeyAuthenticator.ts";
import {PasswordAuthenticatorRequestRequirements} from "./passwordAuthenticator.ts";
import {TotpAuthenticatorRequestRequirements} from "./totpAuthenticator.ts";

export enum Authenticator {
  Email = 1 << 0,
  Passkey = 1 << 1,
  Password = 1 << 2,
  TOTP = 1 << 3,
}

export type AuthenticatorRequestRequirements = {
  [Authenticator.Email]?: EmailAuthenticatorRequestRequirements,
  [Authenticator.Passkey]?: PasskeyAuthenticatorRequestRequirements,
  [Authenticator.Password]?: PasswordAuthenticatorRequestRequirements,
  [Authenticator.TOTP]?: TotpAuthenticatorRequestRequirements
}
