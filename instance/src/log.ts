import chalk from "chalk";
import type { Instance } from "./index.js";
import { WorkspacesFeatureFlags } from "./systems/configuration.js";
import util from "node:util";

export enum LogType {
  INFO,
  WARNING,
  ERROR,
  SUCCESS,
  DEBUG,
  RAW,
  PROMPT,
}

class Logger {
  logHistory: {
    type: LogType;
    level: string;
    message: (string | Uint8Array<ArrayBufferLike>)[];
  }[] = [];
  private log: Log;
  private level: string;

  constructor(level: string, log: Log) {
    this.level = level;
    this.log = log;

    global.console.log = (...data: any[]): void => {
      if (!!process.stdout.cursorTo) {
        process.stdout.cursorTo(0, this._internal_getWindowSize()[1], () => {
          process.stdout.clearLine(1, () => {
            let writtenData = "";
            for (const d of data) {
              if (d.toString !== undefined) {
                writtenData += util.format(d);
              } else {
                writtenData += util.inspect(d, {
                  compact: false,
                  colors: true,
                  depth: 3,
                  breakLength:
                    this._internal_getWindowSize()[0] -
                    this.log.META_LENGTH +
                    6,
                });
              }
              writtenData += " ";
            }
            if (writtenData.endsWith("\n")) {
              process.stdout.write(writtenData, () => {
                this._internal_writePrompt();
              });
            } else {
              process.stdout.write(writtenData + "\n", () => {
                this._internal_writePrompt();
              });
            }
          });
        });
      } else {
        let writtenData = "";
        for (const d of data) {
          if (d.toString !== undefined) {
            writtenData += util.format(d);
          } else {
            writtenData += util.inspect(d, {
              compact: false,
              colors: true,
              depth: 3,
              breakLength:
                this._internal_getWindowSize()[0] - this.log.META_LENGTH + 6,
            });
          }
          writtenData += " ";
        }
        if (writtenData.endsWith("\n")) {
          process.stdout.write(writtenData);
        } else {
          process.stdout.write(writtenData + "\n");
        }
      }
    };

    return this;
  }

  emphasis(...message: (string | Uint8Array)[]) {
    return chalk.bold.magenta(message);
  }

  rawLog(...message: (string | Uint8Array)[]) {
    if (message.length === 0) {
      throw new Error("log message is empty");
    }

    return this.logMessage(LogType.RAW, ...message);
  }

  _internal_promptMessage(...message: any[]) {
    return this.logMessage(LogType.PROMPT, ...message);
  }

  removeCommandPrompt(cb: () => void) {
    process.stdout.cursorTo(0, process.stdout.getWindowSize()[1] - 1, () => {
      process.stdout.clearScreenDown();
      cb();
    });

    return this;
  }

  info(...message: (string | Uint8Array)[]) {
    if (this.level.length === 0) {
      throw new Error("log level is empty");
    }

    if (message.length === 0) {
      throw new Error("log message is empty");
    }

    return this.logMessage(LogType.INFO, ...message);
  }

  success(...message: (string | Uint8Array)[]) {
    if (this.level.length === 0) {
      throw new Error("log level is empty");
    }

    if (message.length === 0) {
      throw new Error("log message is empty");
    }

    return this.logMessage(LogType.SUCCESS, ...message);
  }

  warning(...message: (string | Uint8Array)[]) {
    if (this.level.length === 0) {
      throw new Error("log level is empty");
    }

    if (message.length === 0) {
      throw new Error("log message is empty");
    }

    return this.logMessage(LogType.WARNING, ...message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(...message: any[]) {
    if (message.length === 0) {
      this.logMessage(
        LogType.ERROR,
        "log",
        new Error("log message is empty").stack,
      );
    }

    this.logMessage(LogType.ERROR, ...message);

    return this;
  }

  debug(...message: (string | Uint8Array)[]) {
    // if (!this.log.instance.configurationManager.config.isDevMode) {
    //     return this;
    // }

    if (this.level.length === 0) {
      throw new Error("log level is empty");
    }

    if (message.length === 0) {
      throw new Error("log message is empty");
    }

    return this.logMessage(LogType.DEBUG, ...message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logMessage(type: LogType, ...message: any[]): this {
    this.logHistory.push({ type: type, level: this.level, message: message });

    let typeString = "";

    switch (type) {
      case LogType.INFO:
        typeString = chalk.bold(`${chalk.blue("INF")} ${chalk.white("|")}`);
        break;
      case LogType.WARNING:
        typeString = chalk.bold(`${chalk.yellow("WAR")} ${chalk.white("|")}`);
        break;
      case LogType.ERROR:
        typeString = chalk.bold(`${chalk.red("ERR")} ${chalk.white("|")}`);
        break;
      case LogType.SUCCESS:
        typeString = chalk.bold(`${chalk.green("SUC")} ${chalk.white("|")}`);
        break;
      case LogType.DEBUG:
        typeString = chalk.bold(`${chalk.magenta("DBG")} ${chalk.white("|")}`);
        break;
      case LogType.PROMPT:
        typeString = chalk.bold(`${chalk.cyan("PRM")} ${chalk.white("|")} `);
        break;
      case LogType.RAW:
        typeString = `     `;
        break;
    }

    this.writeMessage(type, typeString, ...message);

    return this;
  }

  _internal_getWindowSize(): [number, number] {
    let size = process?.stdout?.getWindowSize?.();

    return [size?.[0] || 120, size?.[1] || 60];
  }

  _internal_writePrompt() {
    if (
      !this.log.instance?.sys.configuration?.hasFeature(
        WorkspacesFeatureFlags.SlashCommands,
      ) ||
      !process.stdout.cursorTo
    )
      return this;

    process.stdout.cursorTo(0, this._internal_getWindowSize()[1], () => {
      process.stdout.write(
        `Workspaces Alpha ${this.log.instance.sys.configuration?.isDevMode ? `[${this.emphasis("Dev Mode")}] ` : ""}`,
        () => {
          // move the cursor to the metaLen+6th column of the 2nd from the bottom row
          process.stdout.cursorTo(
            this.log.META_LENGTH + 6,
            this._internal_getWindowSize()[1],
            () => {
              // write the prompt indicator to the stdout
              process.stdout.write(
                `> ${this.log.instance.sys.consoleCommands?.rlInterface?.line || ""}`,
              );
            },
          );
        },
      );
    });
  }

  private writeMessage(
    logType: LogType,
    typeString: string,
    ...message: any[]
  ) {
    if (logType === LogType.RAW) {
      process.stdout.write(
        chalk.bold(
          `${typeString}${chalk.yellow(this.level.toUpperCase().slice(0, this.log.META_LENGTH).padEnd(this.log.META_LENGTH))}  `,
        ) + message.join(" "),
      );

      return this;
    }

    if (logType === LogType.PROMPT) {
      process.stdout.cursorTo(0, this._internal_getWindowSize()[1], () => {
        process.stdout.clearLine(1, () => {
          process.stdout.write(
            chalk.bold(
              `${typeString}${chalk.yellow(this.level.toUpperCase().slice(0, this.log.META_LENGTH).padEnd(this.log.META_LENGTH))}  `,
            ) + message.join(" "),
          );
        });
      });

      return this;
    }

    console.log(
      typeString,
      chalk.bold(
        `${chalk.yellow(this.level.toUpperCase().slice(0, this.log.META_LENGTH).padEnd(this.log.META_LENGTH))} `,
      ),
      ...message,
    );

    return this;
  }
}

export type { Logger };

export default class Log {
  allLogHistory: {
    type: LogType;
    level: string;
    message: (string | Uint8Array<ArrayBufferLike>)[];
  }[] = [];
  system: Logger;
  instance: Instance;
  readonly META_LENGTH = 28;

  constructor(instance: Instance) {
    this.instance = instance;
    this.system = this.createLogger("system");

    return this;
  }

  createLogger(prefix: string): Logger {
    return new Logger(prefix, this);
  }
}
