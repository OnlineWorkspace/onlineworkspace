import Command, { type ICommandRuntimeParameters } from "../command.js";

export default class ExitCommand extends Command {
    commandId = "stop";
    flags = {};
    aliases = [];
    shortDescription = "Terminate the Workspaces instance";

    async run(parameters: ICommandRuntimeParameters) {
        await this.instance.shutdown();

        // Note: do not remove this line of code or Typescript will complain
        return this.finishRun();
    }
}
