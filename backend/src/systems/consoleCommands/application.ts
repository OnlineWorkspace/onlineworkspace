// import Command, { type ICommandRuntimeParameters } from "../command.ts";

// export default class ExitCommand extends Command {
//   override commandId = "exit";
//   flags = {};
//   aliases = [];
//   override shortDescription = "Terminate the Workspaces instance";

//   async run(parameters: ICommandRuntimeParameters) {
//     await this.instance.shutdown();

//     // Note: do not remove this line of code or Typescript will complain
//     return this.finishRun();
//   }
// }

import type { CommandModule } from "yargs";
import type { Instance } from "../../index.ts";

const command: CommandModule = {
  command: "application <appid> <action>",
  aliases: ["app"],
  describe: "Manage an application",
  async handler(args) {
    const appId = args.appid as string;
    const instance = (globalThis as unknown as { INSTANCE: Instance }).INSTANCE;

    switch (args.action) {
      case "uninstall":
        await instance.sys.applications.uninstallApplication(appId);
        break;
      case "enable":
        await instance.sys.applications.enableApplication(appId);
        break;
      case "disable":
        await instance.sys.applications.disableApplication(appId);
        break;
      case "status":
        await instance.sys.applications.getApplicationStatus(appId);
        break;
    }
  },
};

export default command;
