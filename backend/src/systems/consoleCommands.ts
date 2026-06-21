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
      const importedCommand = (await import(`file://${path.join(this.instance.sys.filesystem.SRC_ROOT, "/systems/consoleCommands/", cmd)}`)).default;
      this.commands.push(importedCommand);
      this.log.info(`Registered command ${this.log.emphasis(importedCommand.command)}`);
    }

    return true;
  }

  async executeCommandFromString(command: string) {
    this.log.debug(`Calling command "${command}"`);
    const yar = yargs(command)
      .scriptName("")
      .fail(() => 0)
      .exitProcess(false);

    for (const cmd of this.commands) {
      yar.command(cmd);
    }

    try {
      await yar.parseAsync();
    } catch (_) {
      // do nothing
    }
  }

  async executeCommand(commandId: string, parameters: string[]) {
    await this.executeCommandFromString(`${commandId} ${parameters.join(" ")}`);

    return this;
  }
}
