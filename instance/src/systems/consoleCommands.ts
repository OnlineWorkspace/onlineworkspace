import { promises as fs } from "node:fs";
import path from "node:path";
import yargs, { type CommandModule } from "yargs";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export default class ConsoleCommandsSystem extends System {
  commands: CommandModule[];

  constructor(instance: Instance) {
    super("console_commands", instance);

    this.commands = [];
  }

  override async startup() {
    if (!this.instance.sys.configuration.hasFeature("slash_commands") || !process.stdout.cursorTo) return true;

    const commands = await fs.readdir(path.join(this.instance.sys.filesystem.SRC_ROOT, "/systems/consoleCommands/"));

    for (const cmd of commands) {
      const importedCommand = await import(`file://${path.join(this.instance.sys.filesystem.SRC_ROOT, "/systems/consoleCommands/", cmd)}`);
      this.commands.push(importedCommand);
      this.log.info(`Registered command ${cmd}`);
    }

    return true;
  }

  async executeCommandFromString(command: string) {
    this.log.debug(`Calling yargs with "${command}"`);
    await yargs(command).strict().parseAsync();
  }

  async executeCommand(commandId: string, parameters: string[]) {
    await this.executeCommandFromString(`${commandId} ${parameters.join(" ")}`);

    return this;
  }
}
