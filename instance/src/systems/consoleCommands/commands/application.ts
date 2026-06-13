import Command, { type ICommandRuntimeParameters } from "../command.ts";

export default class InstallApplicationCommand extends Command {
  override commandId = "application";
  flags = {};
  aliases = ["app"];
  override shortDescription = "Enable / Disable an application";

  async run(parameters: ICommandRuntimeParameters) {
    const targetId = parameters.arguments[0];

    if (!targetId) {
      this.instance.log.system.warning(`Failed to find application '${targetId}' please provide a valid id`);

      return this.finishRun();
    }

    switch (parameters.arguments[1]) {
      case "enable":
        this.instance.log.system.info(`Enabling application '${targetId}'`);
        await this.instance.sys.applications.enableApplication(targetId);
        break;
      case "disable":
        this.instance.log.system.info(`Disabling application '${targetId}'`);
        await this.instance.sys.applications.disableApplication(targetId);
        break;
      default:
        this.instance.log.system.warning(`You must provide either 'enable' or 'disable' as an action for the selected application.`);
    }

    return this.finishRun();
  }
}
