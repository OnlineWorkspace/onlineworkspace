import type { Instance } from "../../index.ts";
import type { Logger } from "../../log.ts";

export type CommandFlags = { [key: string]: "string" | "boolean" };

export interface ICommandParameters {
  flags: Command["flags"];
}

export interface ICommandRuntimeParameters {
  flags: { [key: string]: string | boolean };
  arguments: string[];
  rawArgv: string;
}

export default abstract class Command {
  instance: Instance;
  abstract flags: CommandFlags;
  readonly commandId: string;
  abstract readonly aliases: string[];
  shortDescription: string = "short description was undefined";
  makeDevModeOnly: boolean = false;
  log: Logger;

  constructor(commandId: string, instance: Instance) {
    this.instance = instance;

    this.commandId = commandId;
    this.log = this.instance.log.createLogger(`${commandId}_command`);
  }

  promptUser(message: string, validate?: (value: string) => boolean | Promise<boolean>): Promise<string> {
    return new Promise<string>((resolve) => {
      const prompt = `${message} -> `;
      this.instance.sys.consoleCommands.currentCommandInterface.active = true;
      this.instance.sys.consoleCommands.currentCommandInterface.minCursorPositionOffset = prompt.length;
      this.instance.sys.consoleCommands.currentCommandInterface.cb = async (data) => {
        if (!validate) return resolve(data);

        if (await validate(data)) {
          return resolve(data);
        } else {
          this.log.error("invalid input");
          this.log._internal_promptMessage(message);
        }
      };
      this.log._internal_promptMessage(`${message} -> `);
    });
  }

  abstract run(parameters: ICommandRuntimeParameters): Promise<ReturnType<Command["finishRun"]> | ReturnType<Command["continueRun"]>>;

  finishRun() {
    this.instance.sys.consoleCommands.currentCommandInterface.active = false;

    return {
      runCompleted: true,
      sig: "this is a random string to ensure that the command's run() ended with this function." as const,
    };
  }

  continueRun() {
    return {
      runCompleted: false,
      sig: "this is a random string to ensure that the command's run() ended with this function." as const,
    };
  }
}
