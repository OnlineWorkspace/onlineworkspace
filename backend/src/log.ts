import util from "node:util";
import type { Instance } from "./index.ts";
import { WorkspacesFeatureFlags } from "./systems/configuration.ts";

export enum LogType {
  INFO,
  WARNING,
  ERROR,
  SUCCESS,
  DEBUG,
}

export enum LogMessageStyle {
  EMPHASIZED = "%em%",
  NORMAL = "%no%",
  RESET = "%re%",
  CUSTOM = "%cu%",
  END_CUSTOM = "%ec%",
}

class Logger {
  private log: Log;
  private level: string;

  constructor(level: string, log: Log) {
    this.level = level;
    this.log = log;
  }

  emphasis(...message: (string | Uint8Array)[]) {
    return `${LogMessageStyle.EMPHASIZED}${message}${LogMessageStyle.RESET}`;
  }

  // biome-ignore lint/suspicious/noExplicitAny: can be of any type
  info(...message: any[]) {
    return this.logMessage(LogType.INFO, ...message);
  }

  // biome-ignore lint/suspicious/noExplicitAny: can be of any type
  success(...message: any[]) {
    return this.logMessage(LogType.SUCCESS, ...message);
  }

  // biome-ignore lint/suspicious/noExplicitAny: can be of any type
  warning(...message: any[]) {
    return this.logMessage(LogType.WARNING, ...message);
  }

  // biome-ignore lint/suspicious/noExplicitAny: can be of any type
  error(...message: any[]) {
    this.logMessage(LogType.ERROR, ...message);

    return this;
  }

  // biome-ignore lint/suspicious/noExplicitAny: can be of any type
  debug(...message: any[]) {
    // if (!this.log.instance.configurationManager.config.isDevMode) {
    //     return this;
    // }

    return this.logMessage(LogType.DEBUG, ...message);
  }

  // biome-ignore lint/suspicious/noExplicitAny: the message can be of any type
  private logMessage(type: LogType, ...message: any[]): this {
    const useColor = !(globalThis as unknown as { INSTANCE: Instance })?.INSTANCE?.sys?.configuration?.hasFeature?.(WorkspacesFeatureFlags.ExperimentalTerminalGui)

    this.writeMessage(
      type,
      message.length === 1
        ? typeof message[0] === "string"
          ? message[0]
          : util.inspect(message, { colors: useColor, compact: false })
        : util.inspect(message, { colors: useColor, compact: false }),
    );

    return this;
  }

  private writeMessage(logType: LogType, message: string) {
    const messageContent = {
      type: logType,
      level: this.level,
      message: message,
    };

    this.log.allLogHistory.push(messageContent);

    for (const listener of this.log._internal_onNewMessageListeners) {
      listener(messageContent);
    }

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
  _internal_onNewMessageListeners: ((message: { type: LogType; level: string; message: string }) => void)[];

  constructor(instance: Instance) {
    this.instance = instance;
    this.system = this.createLogger("system");
    this._internal_onNewMessageListeners = [];

    global.backup = {};
    global.backup.console = {};
    global.backup.console.log = global.console.log;
    global.backup.console.info = global.console.info;
    global.backup.console.warn = global.console.warn;
    global.backup.console.error = global.console.error;
    global.backup.console.debug = global.console.debug;

    // biome-ignore lint/suspicious/noExplicitAny: data could be of any type
    global.console.log = (...data: any[]): void => {
      this.system.info(...data);
    };
    // biome-ignore lint/suspicious/noExplicitAny: data could be of any type
    global.console.info = (...data: any[]): void => {
      this.system.info(...data);
    };
    // biome-ignore lint/suspicious/noExplicitAny: data could be of any type
    global.console.warn = (...data: any[]): void => {
      this.system.warning(...data);
    };
    // biome-ignore lint/suspicious/noExplicitAny: data could be of any type
    global.console.error = (...data: any[]): void => {
      this.system.error(...data);
    }; // biome-ignore lint/suspicious/noExplicitAny: data could be of any type
    global.console.debug = (...data: any[]): void => {
      this.system.debug(...data);
    };
  }

  createLogger(prefix: string): Logger {
    return new Logger(prefix, this);
  }
}
