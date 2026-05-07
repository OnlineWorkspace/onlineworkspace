import * as nm from "nodemailer";
import type { Instance } from "../index.js";
import System from "../system.js";

export default class EmailSystem extends System {
  transporter!: nm.Transporter;

  constructor(instance: Instance) {
    super("email", instance);
  }

  async startup(): Promise<boolean> {
    this.transporter = nm.createTransport(this.instance.sys.configuration.mailServer);

    try {
      this.log.info(`Connecting to ${this.instance.sys.configuration.mailServer.host}:${this.instance.sys.configuration.mailServer.port}...`);
      await this.transporter.verify();
      return true;
    } catch (err) {
      return false;
    }
  }
}
