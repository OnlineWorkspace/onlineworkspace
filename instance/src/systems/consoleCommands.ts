import type { Instance } from "../index.js";
import System from "../system.js";
import * as readline from "readline";
import { promises as fs } from "fs";
import path from "path";
import Command, { type ICommandRuntimeParameters } from "./consoleCommands/command.js";
import ansiEscapes from "ansi-escapes";

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

        return this;
    }

    override async startup() {
        if (
            !this.instance.sys.configuration.hasFeature("slash_commands") ||
            !process.stdout.cursorTo
        )
            return true;

        const commands = await fs.readdir(
            path.join(this.instance.sys.filesystem.SRC_ROOT, "/systems/consoleCommands/commands/"),
        );
        for (const cmd of commands) {
            const importedCommand = await import(
                path.join(
                    this.instance.sys.filesystem.SRC_ROOT,
                    "/systems/consoleCommands/commands/",
                    cmd,
                )
            );
            this.commands.push(new importedCommand.default(cmd, this.instance));
            this.log.info(`Registered command ${cmd}`);
        }

        const self = this;

        this.currentCommandInterface = {
            active: false,
            cb: () => {},
            minCursorPositionOffset: 0,
        };

        await (async function () {
            readline.emitKeypressEvents(process.stdin);
            self.rlInterface = readline.createInterface({
                input: process.stdin,
                tabSize: 2,
                terminal: false,
                historySize: 30,
            });

            process.stdin.setRawMode(true);
            self.currentCommandInterface.active = false;

            const CURSOR_MIN_POS = () =>
                36 +
                (self.currentCommandInterface.active
                    ? self.currentCommandInterface.minCursorPositionOffset
                    : 0);
            let cursorPos = CURSOR_MIN_POS();
            let historyIndex = 0;
            let line = "";

            process.stdin.on("data", async (key) => {
                let keyStr = key.toString();

                if (keyStr === "\u0003") {
                    await self.instance.shutdown();
                    return;
                }
            });

            process.stdin.on("keypress", async (_str, key) => {
                if (key.name === "up") {
                    if (historyIndex === 0) {
                        return;
                    }

                    historyIndex--;

                    line = self.commandHistory[historyIndex].join(" ");
                    cursorPos = CURSOR_MIN_POS() + line.length;

                    process.stdout.cursorTo(CURSOR_MIN_POS());
                    process.stdout.clearLine(1);
                    process.stdout.write(line);
                    process.stdout.cursorTo(cursorPos);

                    return;
                } else if (key.name === "down") {
                    if (historyIndex + 1 > self.commandHistory.length - 1) {
                        line = "";
                        cursorPos = CURSOR_MIN_POS();

                        process.stdout.cursorTo(CURSOR_MIN_POS());
                        process.stdout.clearLine(1);
                        process.stdout.write(line);
                        process.stdout.cursorTo(cursorPos);

                        return;
                    }
                    historyIndex++;

                    line = self.commandHistory[historyIndex].join(" ");
                    cursorPos = CURSOR_MIN_POS() + line.length;

                    process.stdout.cursorTo(CURSOR_MIN_POS());
                    process.stdout.clearLine(1);
                    process.stdout.write(line);
                    process.stdout.cursorTo(cursorPos);

                    return;
                } else if (key.name === "left") {
                    if (cursorPos <= CURSOR_MIN_POS()) {
                        return;
                    }
                    cursorPos--;
                    process.stdout.moveCursor(-1, 0);
                    return;
                } else if (key.name === "right") {
                    if (cursorPos - CURSOR_MIN_POS() >= line.length) {
                        return;
                    }

                    cursorPos++;
                    process.stdout.moveCursor(1, 0);
                    return;
                } else if (key.name === "enter" || key.name === "return") {
                    cursorPos = CURSOR_MIN_POS();
                    process.stdout.cursorTo(CURSOR_MIN_POS(), 0);
                    process.stdout.write("\n");

                    if (self.currentCommandInterface.active) {
                        self.currentCommandInterface.cb(line);
                        line = "";
                        return;
                    }

                    line = line.trim();
                    let segments = line.split(" ");
                    let cmdId = segments.shift()?.toLowerCase();
                    // self.log.info("invoked_command", `> ${line}`);

                    if (!cmdId) {
                        self.log.info("Invalid CommandId");
                        line = "";
                        return;
                    }

                    self.commandHistory.push(line.split(" "));
                    historyIndex = self.commandHistory.length - 1;

                    let command = self.commands.find(
                        (cmd) => cmd.commandId === cmdId || cmd.aliases.includes(cmdId),
                    );

                    if (!command) {
                        self.log.info(
                            "command_manager",
                            `Unable to find the command with id '${cmdId}'`,
                        );
                        line = "";
                        return;
                    }

                    if (command.makeDevModeOnly && !self.instance.sys.configuration.isDevMode) {
                        self.log.info(
                            "command_manager",
                            `You are unable to execute the command '${command.commandId}' as this instance is not running in developer mode`,
                        );
                        line = "";
                        return;
                    }

                    line = "";
                    self.currentCommandInterface.active = true;

                    await self.executeCommand(cmdId, {
                        arguments: segments,
                        flags: {},
                        rawArgv: line.slice(cmdId.length + 1),
                    });

                    line = "";
                    return;
                } else if (key.name === "backspace") {
                    if (cursorPos <= CURSOR_MIN_POS()) {
                        return;
                    }
                    cursorPos--;
                    line =
                        line.slice(0, cursorPos - CURSOR_MIN_POS()) +
                        line.slice(cursorPos - (CURSOR_MIN_POS() - 1));
                    process.stdout.cursorTo(CURSOR_MIN_POS());
                    process.stdout.clearLine(1);
                    process.stdout.write(line);
                    process.stdout.write(ansiEscapes.cursorTo(cursorPos));
                    return;
                } else if (key.name === "space") {
                    cursorPos++;
                    process.stdout.write(" ");
                    line += " ";
                    return;
                }

                cursorPos++;
                line += key.sequence;
                process.stdout.write(key.sequence);
            });
        })();

        return true;
    }

    close() {
        this.rlInterface.close();

        return this;
    }

    async executeCommand(commandId: string, parameters: ICommandRuntimeParameters) {
        let com = this.commands.find(
            (com) => com.commandId === commandId || com.aliases.includes(commandId),
        );

        if (!com) {
            this.log.error(
                "command_manager",
                `Unable to execute command "${commandId}" as no such command exists.`,
            );

            return this;
        }

        await com.run(parameters);

        return this;
    }
}
