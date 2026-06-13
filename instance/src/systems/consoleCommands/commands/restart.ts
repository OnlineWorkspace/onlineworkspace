import Command, { type ICommandRuntimeParameters } from "../command.ts";

export default class RestartCommand extends Command {
  override commandId = "restart";
  flags = {};
  aliases = ["rs"];
  override shortDescription = "Restart the Workspaces instance";

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
