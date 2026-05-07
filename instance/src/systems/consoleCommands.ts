import { promises as fs } from "node:fs";
import path from "node:path";
import * as readline from "node:readline";
import type { Instance } from "../index.js";
import System from "../system.js";
import type Command from "./consoleCommands/command.js";
import type { ICommandRuntimeParameters } from "./consoleCommands/command.js";

export default class ConsoleCommandsSystem extends System {
  rlInterface!: readline.Interface;
  commands: Command[];
  currentCommandInterface!: {
    active: boolean;
    cb: (data: string) => void;
    minCursorPositionOffset: number;
  };
  commandHistory: string[][];

  constructor(instance: Instance) {
    super("console_commands", instance);

    this.commands = [];
    this.commandHistory = [];
  }

  override async startup() {
    if (!this.instance.sys.configuration.hasFeature("slash_commands") || !process.stdout.cursorTo) return true;

    const commands = await fs.readdir(path.join(this.instance.sys.filesystem.SRC_ROOT, "/systems/consoleCommands/commands/"));
    for (const cmd of commands) {
      const importedCommand = await import(path.join(this.instance.sys.filesystem.SRC_ROOT, "/systems/consoleCommands/commands/", cmd));
      this.commands.push(new importedCommand.default(cmd, this.instance));
      this.log.info(`Registered command ${cmd}`);
    }

    this.currentCommandInterface = {
      active: false,
      cb: () => {},
      minCursorPositionOffset: 0,
    };

    await (async () => {
      readline.emitKeypressEvents(process.stdin);
      this.rlInterface = readline.createInterface({
        input: process.stdin,
        terminal: false,
      });

      if (process.stdin.isTTY) process.stdin.setRawMode(true);
      this.currentCommandInterface.active = false;

      const CURSOR_MIN_POS = () => 36 + (this.currentCommandInterface.active ? this.currentCommandInterface.minCursorPositionOffset : 0);

      let cursorPos = CURSOR_MIN_POS();
      let historyIndex = this.commandHistory.length;
      let line = "";

      const renderLine = () => {
        process.stdout.cursorTo(CURSOR_MIN_POS());
        process.stdout.clearLine(1);
        process.stdout.write(line);
        process.stdout.cursorTo(cursorPos);
      };

      process.stdin.on("keypress", async (str, key) => {
        if (key.ctrl && key.name === "c") {
          await this.instance.shutdown();
          return;
        }

        const relativePos = cursorPos - CURSOR_MIN_POS();

        if (key.name === "up") {
          if (historyIndex > 0) {
            historyIndex--;
            line = this.commandHistory[historyIndex].join(" ");
            cursorPos = CURSOR_MIN_POS() + line.length;
            renderLine();
          }
          return;
        } else if (key.name === "down") {
          if (historyIndex < this.commandHistory.length - 1) {
            historyIndex++;
            line = this.commandHistory[historyIndex].join(" ");
          } else {
            historyIndex = this.commandHistory.length;
            line = "";
          }
          cursorPos = CURSOR_MIN_POS() + line.length;
          renderLine();
          return;
        } else if (key.name === "left") {
          if (cursorPos > CURSOR_MIN_POS()) {
            cursorPos--;
            process.stdout.moveCursor(-1, 0);
          }
          return;
        } else if (key.name === "right") {
          if (relativePos < line.length) {
            cursorPos++;
            process.stdout.moveCursor(1, 0);
          }
          return;
        } else if (key.name === "enter" || key.name === "return") {
          process.stdout.write("\n");
          const executedLine = line;
          line = "";
          cursorPos = CURSOR_MIN_POS();

          if (this.currentCommandInterface.active) {
            this.currentCommandInterface.cb(executedLine);
            return;
          }

          const trimmed = executedLine.trim();
          if (!trimmed) return;

          const segments = trimmed.split(" ");
          const cmdId = segments[0].toLowerCase();

          this.commandHistory.push(segments);
          historyIndex = this.commandHistory.length;

          const command = this.commands.find((cmd) => cmd.commandId === cmdId || cmd.aliases.includes(cmdId));

          if (!command) {
            this.log.info("command_manager", `Unable to find command '${cmdId}'`);
            return;
          }

          if (command.makeDevModeOnly && !this.instance.sys.configuration.isDevMode) {
            this.log.info("command_manager", `Dev mode required for '${cmdId}'`);
            return;
          }

          this.currentCommandInterface.active = true;
          await this.executeCommand(cmdId, {
            arguments: segments.slice(1),
            flags: {},
            rawArgv: trimmed.slice(cmdId.length).trim(),
          });

          this.currentCommandInterface.active = false;
          return;
        } else if (key.name === "backspace") {
          if (cursorPos > CURSOR_MIN_POS()) {
            line = line.slice(0, relativePos - 1) + line.slice(relativePos);
            cursorPos--;
            renderLine();
          }
          return;
        }

        if (str && str.length === 1 && !key.ctrl && !key.meta) {
          line = line.slice(0, relativePos) + str + line.slice(relativePos);
          cursorPos++;
          renderLine();
        }
      });
    })();

    return true;
  }

  close() {
    this.rlInterface.close();

    return this;
  }

  async executeCommand(commandId: string, parameters: ICommandRuntimeParameters) {
    const com = this.commands.find((com) => com.commandId === commandId || com.aliases.includes(commandId));

    if (!com) {
      this.log.error("command_manager", `Unable to execute command "${commandId}" as no such command exists.`);

      return this;
    }

    await com.run(parameters);

    return this;
  }
}
