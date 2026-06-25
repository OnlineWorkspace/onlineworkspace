import type {CommandModule} from "yargs";
import type {Instance} from "../../index.ts";

const command: CommandModule = {
  command: "applications",
  aliases: ["apps"],
  describe: "List installed applications",
  async handler(args) {
    const instance = (globalThis as unknown as { INSTANCE: Instance }).INSTANCE;
    const log = instance.log.system

    for (const app of instance.sys.applications.availableApplications) {
      log.info(`application ${log.emphasis(app.manifest?.id || "")} is ${app.enabled ? "enabled" : "disabled"}`)
    }
  }
};

export default command;
