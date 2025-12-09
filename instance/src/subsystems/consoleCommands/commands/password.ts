import Command, { type ICommandRuntimeParameters } from "../command.js";

export default class PasswordCommand extends Command {
    commandId = "password";
    flags = {};
    aliases = ["passwd"];
    shortDescription = "Set a user's password";

    async run(parameters: ICommandRuntimeParameters) {
        const self = this;

        let password = "";

        let username = await this.promptUser("Username", () => true);
        console.log(username);

        // self.log._internal_promptMessage("Username -> ");
        // self.instance.subSystems.consoleCommands.currentCommandInterface.cb = async (data) => {
        //     username = data.trim();
        //     if (username !== "") {
        //         self.log._internal_promptMessage("Password -> ");
        //         self.instance.subSystems.consoleCommands.currentCommandInterface.cb = async (data) => {
        //             password = data.trim();
        //             if (password !== "") {
        //                 const db = this.instance.subSystems.database.db();

        //                 const { id: userId } = (await db`SELECT id FROM users WHERE username = ${username}`)?.[0] || { id: undefined };

        //                 if (!userId) {
        //                     self.log.error(`No such user ${username}`);
        //                     return this.finishRun();
        //                 }

        //                 this.instance.subSystems.authorization.setPassword(userId, password);
        //                 self.log.success(`Set password for ${username}(${userId}) to '${password}'`);

        //                 return this.finishRun();
        //             } else {
        //                 self.log._internal_promptMessage("Password -> ");
        //             }
        //         };
        //     } else {
        //         self.log._internal_promptMessage("Username -> ");
        //     }
        // };

        return this.finishRun();
        return this.continueRun();
    }
}
