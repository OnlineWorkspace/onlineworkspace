import AuthenticationSystem from "../authentication.ts";

export default class TotpAuthenticator {
  private authenticationSystem;

  constructor(authenticationSystem: AuthenticationSystem) {
    this.authenticationSystem = authenticationSystem
  }
}
