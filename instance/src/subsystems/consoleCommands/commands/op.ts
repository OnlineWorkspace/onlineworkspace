import Command, { type ICommandRuntimeParameters } from "../command.js";

export default class ExitCommand extends Command {
    commandId = "op";
    flags = {};
    aliases = [];
    shortDescription = "Make a user into an administrator";

    async run(parameters: ICommandRuntimeParameters) {
        const self = this;

        let username = "";

        const log = self.instance.log.createLogger("op_command");
        log._internal_promptMessage("Username -> ");
        self.instance.subSystems.consoleCommands.currentCommandInterface.cb = async (data) => {
            username = data.trim();
            if (username !== "") {
                let user = await self.instance.subSystems.users.getUserByUsername(username);

                if (!user) {
                    log.error(`Invaid user '${username}'`);
                    username = "";
                    log._internal_promptMessage("Username -> ");
                    return this.continueRun();
                }

                await user.setIsAdministrator(true);

                log.success(`User '${username}' was promoted to administrator successfully!`);

                return this.finishRun();
            } else {
                log._internal_promptMessage("Username -> ");
            }
        };

        return this.continueRun();
    }
}
