import Command, { type ICommandRuntimeParameters } from "../command.ts";

export default class InstallApplicationCommand extends Command {
  override commandId = "install_application";
  flags = {};
  aliases = [];
  override shortDescription = "Install an application by a uri";

  async run(parameters: ICommandRuntimeParameters) {
    if (!parameters.arguments[0]) {
      this.instance.log.system.warning(`Failed to install application '' please provide a valid uri`);

      return this.finishRun();
    }

    const applicationURI = parameters.arguments[0];

    this.instance.log.system.info(`Installing application '${applicationURI}'`);

    await this.instance.sys.applications.installApplication(applicationURI);

    return this.finishRun();
  }
}
