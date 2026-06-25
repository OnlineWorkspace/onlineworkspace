import type { CommandModule } from "yargs";

const command: CommandModule = {
  command: "exit",
  describe: "Shutdown the OnlineWorkspace Instance",
  handler() {
    global.INSTANCE.shutdown();
  },
};

export default command;
