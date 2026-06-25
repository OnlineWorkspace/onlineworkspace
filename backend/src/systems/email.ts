import * as nm from "nodemailer";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export default class EmailSystem extends System {
  transporter!: nm.Transporter;

  constructor(instance: Instance) {
    super("email", instance);
  }

  async sendEmail(
    to: string,
    subject: string,
    content: { type: "string" | "html"; content: string },
  ) {
    await this.transporter.sendMail({
      to: to,
      from:
        `${this.instance.sys.configuration.displayName} <${this.instance.sys.configuration.mailServer.auth.user}>`,
      sender: this.instance.sys.configuration.mailServer.auth.user,
      subject,
      text: content.type === "string" ? content.content : undefined,
      html: content.type === "html" ? content.content : undefined,
    });
  }

  override async startup(): Promise<boolean> {
    this.transporter = nm.createTransport(
      this.instance.sys.configuration.mailServer,
    );

    try {
      this.log.info(
        `Connecting to ${this.instance.sys.configuration.mailServer.host}:${this.instance.sys.configuration.mailServer.port}...`,
      );
      await this.transporter.verify();

      // Don't send the online message when in DevMode as it is unnecessary and annoying
      if (this.instance.sys.configuration.isDevMode) return true;

      const allUsers = await this.instance.sys.users.getAllUsers();
      for (const user of allUsers) {
        if (await user.isAdministrator()) {
          const userEmail = await user.getEmail();

          if (userEmail === undefined || userEmail === "") continue;

          await this.sendEmail(userEmail, "Instance Online", {
            type: "string",
            content:
              `Your OnlineWorkspace instance '${this.instance.sys.configuration.displayName}' has just come online!`,
          });
        }
      }
      return true;
    } catch (err) {
      this.log.error(err);
      return false;
    }
  }

  override async stop(): Promise<boolean> {
    if (this.instance.sys.configuration.isDevMode) {
      this.transporter.close();

      return true;
    }

    const allUsers = await this.instance.sys.users.getAllUsers();
    for (const user of allUsers) {
      if (await user.isAdministrator()) {
        const userEmail = await user.getEmail();

        if (userEmail === undefined || userEmail === "") continue;

        await this.sendEmail(userEmail, "Instance Offline", {
          type: "string",
          content:
            `Your OnlineWorkspace instance '${this.instance.sys.configuration.displayName}' has just gone offline!`,
        });
      }
    }

    this.transporter.close();

    return true;
  }
}
