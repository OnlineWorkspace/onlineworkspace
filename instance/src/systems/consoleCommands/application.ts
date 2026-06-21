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

const command: CommandModule = {
  command: "application <appid> <action>",
  aliases: ["app"],
  describe: "Manage an application",
  handler(args) {
    switch (args.action) {
    }
  },
};

export default command;
