import AuthenticationSystem from "../authentication.ts";

export default class PasskeyAuthenticator {
  private authenticationSystem;

  constructor(authenticationSystem: AuthenticationSystem) {
    this.authenticationSystem = authenticationSystem
  }
}
