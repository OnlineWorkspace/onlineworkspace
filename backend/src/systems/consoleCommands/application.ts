import type {CommandModule} from "yargs";
import type {Instance} from "../../index.ts";

const command: CommandModule = {
  command: "application <appid> <action>",
  aliases: ["app"],
  describe: "Manage an application",
  async handler(args) {
    const appId = args.appid as string;
    const instance = (globalThis as unknown as { INSTANCE: Instance }).INSTANCE;
    const log = instance.log.system

    if (!instance.sys.applications.availableApplications.find(a => a.manifest?.id === appId)) {
      log.warning(`No such application with id ${log.emphasis(appId)}`)
      return;
    }

    switch (args.action) {
      case "uninstall":
        if (await instance.sys.applications.uninstallApplication(appId)) {
          log.success(`Uninstalled application ${log.emphasis(appId)}`);
        } else {
          log.error(`Failed to uninstall application ${log.emphasis(appId)}`);
        }
        break;
      case "enable":
        if (await instance.sys.applications.enableApplication(appId)) {
          log.success(`Enabled application ${log.emphasis(appId)}`);
        } else {
          log.error(`Failed to enable application ${log.emphasis(appId)}`);
        }
        break;
      case "disable":
        if (await instance.sys.applications.disableApplication(appId)) {
          log.success(`Disabled application ${log.emphasis(appId)}`);
        } else {
          log.error(`Failed to disable application ${log.emphasis(appId)}`);
        }
        break;
      case "status":
        const status = await instance.sys.applications.getApplicationStatus(appId)

        if (status.installed) {
          log.info(`application ${log.emphasis(appId)} is ${status.enabled ? "enabled" : "disabled"}`)
        } else {
          log.info(`no application with id ${log.emphasis(appId)} is installed.`)
        }
        break;
    }
  },
};

export default command;
