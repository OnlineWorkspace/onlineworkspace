import Command, { type ICommandRuntimeParameters } from "../command.js";
import chalk from "chalk";
import { WorkspacesFeatureFlags } from "../../configuration.js";

export default class EnableFeatureCommand extends Command {
    commandId = "enable_feature";
    flags = {};
    aliases = [];
    shortDescription = "Enable a feature by its id";

    async run(parameters: ICommandRuntimeParameters) {
        if (!parameters.arguments[0]) {
            this.instance.log.system.warning(`Failed to enable invalid feature`);

            for (const feat of Object.values(WorkspacesFeatureFlags)) {
                this.log.info(`Feature: ${feat} -> ${this.instance.sys.configuration.hasFeature(feat)}`);
            }

            return this.finishRun();
        }

        const featureId = parameters.arguments[0];

        this.instance.log.system.info(`Enabling feature '${featureId}'`);

        await this.instance.sys.configuration.enableFeature(featureId);

        return this.finishRun();
    }
}
