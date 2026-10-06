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

  /** The headers which are put on everything the instance serves, a header which the instance sets itself is left alone. */
  private securityHeaderBlock() {
    const configuration = this.instance.sys.configuration;
    const lines = [
      "?X-Content-Type-Options nosniff",
      "?X-Frame-Options DENY",
      "?Referrer-Policy same-origin",
      "?Cross-Origin-Opener-Policy same-origin",
      '?Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"',
      "-Server",
    ];

    if (configuration.proxy.secure) lines.push('?Strict-Transport-Security "max-age=31536000; includeSubDomains"');

    const policy = this.instance.sys.security?.contentSecurityPolicy();

    if (policy) lines.push(`?Content-Security-Policy "${policy}"`);

    return `  header {\n${lines.map((line) => `    ${line}`).join("\n")}\n  }\n`;
  }

  async generateCaddyFile() {
    const OUTPUT_PATH = path.join(this.instance.sys.filesystem.SYSTEM_PATH, "Caddyfile");

    let outputString = "";
    const domainOutputStrings: { [domain: string]: string } = {};

    for (const proxy of this.proxies) {
      if (!domainOutputStrings[proxy.alternateDomain || "default"]) domainOutputStrings[proxy.alternateDomain || "default"] = this.securityHeaderBlock();

      // the proxy's own view of the client is what everything which limits or records an address relies on, `remote_host` is the address without the port
      domainOutputStrings[proxy.alternateDomain || "default"] += `  reverse_proxy ${proxy.from !== "" ? `${proxy.from} ` : ""}${proxy.to} {
      header_up X-Real-IP {remote_host}
      header_up X-Forwarded-For {remote_host}
  }
`;
    }

    for (const domain of Object.keys(domainOutputStrings)) {
      let actualDomain = domain;

      if (actualDomain === "default") {
        actualDomain = this.instance.sys.configuration.proxy.hostname;
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
