import AuthenticationSystem from "../authentication.ts";

export interface TotpAuthenticatorRequestRequirements {
  totpCode: string;
}

export default class TotpAuthenticator {
  private authenticationSystem;

  constructor(authenticationSystem: AuthenticationSystem) {
    this.authenticationSystem = authenticationSystem
  }
}
