import AuthenticationSystem from "../authentication.ts";

export default class EmailAuthenticator {
  private authenticationSystem;
  // string -> userId
  private readonly emailCodes: Record<string, { userId: number; expires: number }>;

  constructor(authenticationSystem: AuthenticationSystem) {
    this.authenticationSystem = authenticationSystem;
    this.emailCodes = {};
  }

  async generateCode(userId: number): Promise<string | undefined> {
    const user = await this.authenticationSystem.instance.sys.users.getUserById(
      userId,
    );

    if (!user) {
      return undefined;
    }

    const VALID_CODE_CHARS = "".split("");
    const CODE_LENGTH = 8;
    let code = "";

    for (let i = 0; i < CODE_LENGTH; i++) {
      code +=
        VALID_CODE_CHARS[Math.floor(Math.random() * VALID_CODE_CHARS.length)];
    }

    this.emailCodes[code] = { userId, expires: Date.now() };

    const fullName = await user.getFullName();
    const emailAddress = await user.getEmail();

    if (!emailAddress) {
      this.authenticationSystem.log.error(
        "Cannot send an auth code email to a user without an email address linked",
      );
      return undefined;
    }

    await this.authenticationSystem.instance.sys.email.sendEmail(
      emailAddress,
      "Email Auth Code",
      {
        type: "string",
        content:
          `Someone has just requested a login code for an account linked to this email address, ${fullName.forename} ${fullName.surname} (${await user
            .getUsername()}). If this was you, the code is '${code}' otherwise, you can change your login credentials or choose to ignore this email.`,
      },
    );

    return code;
  }

  verifyCode(userId: number, code: string) {
    if (
      this.emailCodes[code].userId !== userId ||
      this.emailCodes[code].expires < Date.now()
    ) {
      return false;
    }

    delete this.emailCodes[code];

    return true;
  }
}

export interface EmailAuthenticatorRequestRequirements {
  emailCode: string;
}
