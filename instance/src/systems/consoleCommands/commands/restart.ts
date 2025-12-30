import Command, { type ICommandRuntimeParameters } from "../command.js";

export default class RestartCommand extends Command {
    commandId = "restart";
    flags = {};
    aliases = ["rs"];
    shortDescription = "Restart the Workspaces instance";

    async run(parameters: ICommandRuntimeParameters) {
        // this.instance.log.info(
        //   "command_restart",
        //   "Restarting Workspaces instance...",
        // );

        this.instance.log.system.error("command_restart", "This command does not work as instance shutdown is unimplemented...");

        // TODO: implement a shutdown sequence
        // this.instance.shutdown()
        // this.instance.requestManager.app.server.close();
        // this.instance.commandManager.close();

        this.instance.shutdown();

        return this.finishRun();
    }
}
