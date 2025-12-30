import Command, { type ICommandRuntimeParameters } from "../command.js";
import chalk from "chalk";

export default class HelpCommand extends Command {
    commandId = "help";
    flags = {};
    aliases = [];
    shortDescription = "Display this help information";

    async run(parameters: ICommandRuntimeParameters) {
        const HELP_BANNER_TITLE = " Workspaces Help ";
        const LOG_WIDTH = process.stdout.getWindowSize()[0] - (this.instance.log.META_LENGTH + 8);

        this.instance.log.system.info(
            "-".repeat((LOG_WIDTH - HELP_BANNER_TITLE.length) / 2) +
                HELP_BANNER_TITLE +
                "-".repeat((LOG_WIDTH - HELP_BANNER_TITLE.length) / 2),
        );

        for (const command of this.instance.sys.consoleCommands.commands) {
            this.instance.log.system.info(
                `${this.instance.log.system.emphasis(command.commandId)}${command.aliases.length > 0 ? ", " : ""}${command.aliases.join(", ")} - ${command.shortDescription}`,
            );
            if (Object.keys(command.flags).length > 0) {
                this.instance.log.system.info(`  ${chalk.bold("flags")}:`);
                this.instance.log.system.info(`    ${JSON.stringify(command.flags)}`);
            }
        }

        return this.finishRun();
    }
}
