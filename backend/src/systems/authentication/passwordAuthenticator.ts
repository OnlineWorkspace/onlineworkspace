import AuthenticationSystem from "../authentication.ts";

export default class PasswordAuthenticator {
  private authenticationSystem;

  constructor(authenticationSystem: AuthenticationSystem) {
    this.authenticationSystem = authenticationSystem
  }
}
