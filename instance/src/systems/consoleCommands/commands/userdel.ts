import Command, { type ICommandRuntimeParameters } from "../command.js";

export default class ExitCommand extends Command {
    commandId = "userdel";
    flags = {};
    aliases = [];
    shortDescription = "Delete a user";

    async run(parameters: ICommandRuntimeParameters) {
        const self = this;

        let username = "";

        const log = self.instance.log.createLogger("userdel_command");
        log._internal_promptMessage("Username -> ");
        self.instance.sys.consoleCommands.currentCommandInterface.cb = async (data) => {
            username = data.trim();
            if (username !== "") {
                let user = await self.instance.sys.users.getUserByUsername(username);

                if (!user) {
                    username = "";
                    log._internal_promptMessage("Username -> ");
                    return this.continueRun();
                }

                await user.delete();

                log.success(`User '${username}' was deleted successfully!`);

                return this.finishRun();
            } else {
                log._internal_promptMessage("Username -> ");
            }
        };

        return this.continueRun();
    }
}
