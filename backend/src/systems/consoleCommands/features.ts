import type {CommandModule} from "yargs";
import {WorkspacesFeatureFlags} from "../configuration.js";

const command: CommandModule = {
  command: "features <action> <featureId>",
  aliases: ["feature"],
  describe: "List all features this instance supports and their status",
  async handler(args) {
    const action = args.action as string;

    if (!action) {
      const features = WorkspacesFeatureFlags;

      let longestFeatureNameLength = 0;

      for (const feature of Object.values(features)) {
        longestFeatureNameLength = Math.max(longestFeatureNameLength, feature.length);
      }

      for (const feature of Object.values(features)) {
        const isFeatureEnabled = INSTANCE.sys.configuration.hasFeature(feature);
        INSTANCE.log.system.info(`${isFeatureEnabled ? INSTANCE.log.system.emphasis(feature.padEnd(longestFeatureNameLength + 1, " ")) : feature.padEnd(longestFeatureNameLength + 1, " ")} is ${isFeatureEnabled ? INSTANCE.log.system.emphasis("enabled") : "disabled"}`)
      }
    }

    switch (action) {
      case "enable":
        await INSTANCE.sys.configuration.enableFeature(args.featureId as string);
        break;
      case "disable":
        await INSTANCE.sys.configuration.disableFeature(args.featureId as string);
        break;
    }
  },
};

export default command;
