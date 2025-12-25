import Command, { type ICommandRuntimeParameters } from "../command.js";

export default class PasswordCommand extends Command {
    commandId = "password";
    flags = {};
    aliases = ["passwd"];
    shortDescription = "Set a user's password";

    async run(parameters: ICommandRuntimeParameters) {
        const self = this;

        let username = await this.promptUser("Username", async (u) => {
            console.log("entered '" + u + "'");
            return (await this.instance.subSystems.users.getUserByUsername(u)) !== undefined;
        });
        let newPassword = await this.promptUser("Password", () => true);

        const userId = (await this.instance.subSystems.users.getUserByUsername(username))?.userId;

        if (!userId) return this.finishRun();

        await this.instance.subSystems.authorization.setPassword(userId, newPassword);

        return this.finishRun();
    }
}
