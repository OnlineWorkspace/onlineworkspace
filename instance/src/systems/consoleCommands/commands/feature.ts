import Command, { type ICommandRuntimeParameters } from "../command.ts";
import chalk from "chalk";
import { WorkspacesFeatureFlags } from "../../configuration.ts";

export default class EnableFeatureCommand extends Command {
  override commandId = "feature";
  flags = {};
  aliases = [];
  override shortDescription = "Manage instance enabled features";

  async run(parameters: ICommandRuntimeParameters) {
    const action = await this.promptUser("Action", (a) => {
      switch (a.toLowerCase()) {
        case "enable":
        case "disable":
        case "help":
        case "list":
          return true;
        default:
          return false;
      }
    });

    switch (action.toLowerCase()) {
      case "enable": {
        const featureId = await this.promptUser("FeatureId");

        this.instance.log.system.info(`Enabling feature '${featureId}'`);

        await this.instance.sys.configuration.enableFeature(featureId);
        break;
      }
      case "disable": {
        const featureId = await this.promptUser("FeatureId");

        this.instance.log.system.info(`Disabling feature '${featureId}'`);

        await this.instance.sys.configuration.disableFeature(featureId);
        break;
      }
      case "help": {
        this.instance.log.system.info(`Available commands: 'enable', 'disable', 'help', 'list'`);
        break;
      }
      case "list": {
        for (const feat of Object.values(WorkspacesFeatureFlags)) {
          this.log.info(`Feature: ${feat} -> ${this.instance.sys.configuration.hasFeature(feat)}`);
        }

        this.log.info(`Enabled features -> ${this.instance.sys.configuration.enabledFeatures.join(", ")}`);
        break;
      }
    }

    return this.finishRun();
  }
}
