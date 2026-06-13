import Command, { type ICommandRuntimeParameters } from "../command.ts";

export default class ExitCommand extends Command {
  override commandId = "users";
  flags = {};
  aliases = [];
  override shortDescription = "List all users";

  async run(parameters: ICommandRuntimeParameters) {
    const self = this;

    const log = self.instance.log.createLogger("users_command");

    const db = self.instance.sys.database.postgres();

    const users = await db`SELECT * FROM users ORDER BY id ASC`;

    log.info(`(ID) | @username | Forename + Surname`);
    for (const user of users) {
      log.info(`(${user.id}) @${user.username} -> ${user.forename} ${user.surname}`);
    }

    return this.finishRun();
  }
}
