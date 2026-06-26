import AuthenticationSystem from "../authentication.ts";

export default class EmailAuthenticator {
  private authenticationSystem;

  constructor(authenticationSystem: AuthenticationSystem) {
    this.authenticationSystem = authenticationSystem
  }
}
