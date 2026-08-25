import type { CommandModule } from "yargs";

const command: CommandModule = {
  command: "exit",
  describe: "Shutdown the OnlineWorkspace Instance",
  async handler() {
    await INSTANCE.shutdown();
  },
};

export default command;
