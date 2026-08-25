import type {CommandModule} from "yargs";
import {WorkspacesFeatureFlags} from "../configuration.js";

const command: CommandModule = {
  command: "features <action> <featureId>",
  aliases: ["feature"],
  describe: "List all features this instance supports and their status",
  async handler() {
    const features = WorkspacesFeatureFlags;

    let longestFeatureNameLength = 0;

    for (const feature of Object.values(features)) {
      longestFeatureNameLength = Math.max(longestFeatureNameLength, feature.length);
    }

    for (const feature of Object.values(features)) {
      const isFeatureEnabled = INSTANCE.sys.configuration.hasFeature(feature);
      INSTANCE.log.system.info(`${isFeatureEnabled ? INSTANCE.log.system.emphasis(feature.padEnd(longestFeatureNameLength + 1, " ")) : feature.padEnd(longestFeatureNameLength + 1, " ")} is ${isFeatureEnabled ? INSTANCE.log.system.emphasis("enabled") : "disabled"}`)
    }
  },
};

export default command;
