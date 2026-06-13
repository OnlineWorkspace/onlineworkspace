import Command, { type ICommandRuntimeParameters } from "../command.ts";

export default class PasswordCommand extends Command {
  override commandId = "password";
  flags = {};
  aliases = ["passwd"];
  override shortDescription = "Set a user's password";

  async run(parameters: ICommandRuntimeParameters) {
    const self = this;

    let username = await this.promptUser("Username", async (u) => {
      console.log("entered '" + u + "'");
      return (await this.instance.sys.users.getUserByUsername(u)) !== undefined;
    });
    let newPassword = await this.promptUser("Password", () => true);

    const userId = (await this.instance.sys.users.getUserByUsername(username))?.userId;

    if (!userId) return this.finishRun();

    await this.instance.sys.authorization.setPassword(userId, newPassword);

    return this.finishRun();
  }
}
