import { promises as fs } from "node:fs";
import path from "node:path";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export default class ReverseProxySystem extends System {
  proxies: { from: string; to: string; alternateDomain?: string }[] = [];

  constructor(instance: Instance) {
    super("reverse_proxy", instance);
  }

  addNewProxy(from: string, to: string, alternateDomain?: string) {
    this.proxies.push({ from, to, alternateDomain });

    return this;
  }

  async generateCaddyFile() {
    const OUTPUT_PATH = path.join(this.instance.sys.filesystem.SYSTEM_PATH, "Caddyfile");

    let outputString = "";
    const domainOutputStrings: { [domain: string]: string } = {};

    for (const proxy of this.proxies) {
      if (!domainOutputStrings[proxy.alternateDomain || "default"]) domainOutputStrings[proxy.alternateDomain || "default"] = "";

      domainOutputStrings[proxy.alternateDomain || "default"] += `  reverse_proxy ${proxy.from !== "" ? `${proxy.from} ` : ""}${proxy.to} {
      header_up X-Real-IP {remote}
      header_up X-Forwarded-For {remote}
  }
`;
    }

    for (const domain of Object.keys(domainOutputStrings)) {
      let actualDomain = domain;

      if (actualDomain === "default") {
        actualDomain = this.instance.sys.configuration.proxyUrl;
      }

      outputString += `${actualDomain} {
${domainOutputStrings[domain]}}
`;
    }

    await fs.writeFile(
      OUTPUT_PATH,
      `## Begin OnlineWorkspace -----
${outputString}## End OnlineWorkspace -----`,
    );

    return this;
  }

  override async startup(): Promise<boolean> {
    // the default backend
    this.addNewProxy("/api/*", "http://localhost:3563");
    // web ui
    this.addNewProxy("", "http://localhost:5173");

    await this.generateCaddyFile();

    return true;
  }
}
