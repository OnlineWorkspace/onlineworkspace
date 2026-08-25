import type { CommandModule } from "yargs";

const command: CommandModule = {
  command: "users",
  describe: "List all users of this instance",
  async handler() {
    const users = await INSTANCE.sys.users.getAllUsers();

    for (const user of users) {
      INSTANCE.log.system.info(`(${user.userId}) @${await user.getUsername()} "${await user.getForename()} ${await user.getSurname()}"`)
    }
  },
};

export default command;
