import AuthenticationSystem from "../authentication.ts";

export default class PasskeyAuthenticator {
  private authenticationSystem;

  constructor(authenticationSystem: AuthenticationSystem) {
    this.authenticationSystem = authenticationSystem
  }

  /*
    - setPasskey()
    - generatePasskey()
    - private verifyIntermediaryPasskey(generatedPasskeySecret, userProvidedPasskey)
    - private verifyPasskey()
  */

  async verifyPasskey(): Promise<boolean> {
    return false;
  }
}

export interface PasskeyAuthenticatorRequestRequirements {
  webAuthnResponse: any;
}
