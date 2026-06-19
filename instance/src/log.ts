import util from "node:util";
import chalk from "chalk";
import type { Instance } from "./index.ts";

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
  private log: Log;
  private level: string;

  constructor(level: string, log: Log) {
    this.level = level;
    this.log = log;
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
      this.logMessage(LogType.ERROR, "log", new Error("log message is empty").stack);
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

  // biome-ignore lint/suspicious/noExplicitAny: the message can be of any type
  private logMessage(type: LogType, ...message: any[]): this {
    this.writeMessage(type, ...message);

    return this;
  }

  private writeMessage(logType: LogType, ...message: any[]) {
    this.log.allLogHistory.push({
      type: logType,
      level: this.level,
      message: `${message}`,
    });

    return this;
  }
}

export type { Logger };

export default class Log {
  allLogHistory: {
    type: LogType;
    level: string;
    message: string;
  }[] = [];
  system: Logger;
  instance: Instance;
  readonly META_LENGTH = 28;

  constructor(instance: Instance) {
    this.instance = instance;
    this.system = this.createLogger("system");

    // biome-ignore lint/suspicious/noExplicitAny: data could be of any type
    global.console.log = (...data: any[]): void => {
      this.system.info(...data);
    };
  }

  createLogger(prefix: string): Logger {
    return new Logger(prefix, this);
  }
}
