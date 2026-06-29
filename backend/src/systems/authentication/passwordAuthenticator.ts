import AuthenticationSystem from "../authentication.ts";

export default class PasswordAuthenticator {
  private authenticationSystem;
  isSecondFactor = false

  constructor(authenticationSystem: AuthenticationSystem) {
    this.authenticationSystem = authenticationSystem
  }

  setPassword(userId: number, password: string) {

  }

  _internalVerifyPassword(userId: number, password: string) {}
}
