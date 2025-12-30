import { Instance } from "../index.js";
import System from "../system.js";
import * as nm from "nodemailer";

export default class EmailSystem extends System {
    transporter!: nm.Transporter;

    constructor(instance: Instance) {
        super("email", instance);

        return this;
    }

    async startup(): Promise<boolean> {
        this.transporter = nm.createTransport(this.instance.sys.configuration.mailserver);

        try {
            await this.transporter.verify();
            return true;
        } catch (err) {
            return false;
        }
    }
}
