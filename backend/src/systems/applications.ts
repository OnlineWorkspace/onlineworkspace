import { Buffer } from "node:buffer";
import { promises as fs, existsSync as fsExistsSync } from "node:fs";
import path from "node:path";
import type { Instance } from "../index.ts";
import System from "../system.ts";
import type { OnlineWorkspaceApplication } from "./applications/application.ts";
import type { WorkspacesApplicationServiceStatus } from "./applications/serviceStatus.ts";
import { WorkspacesNotificationPriority } from "./notifications.ts";

const APPLICATIONS_CONFIG_FILE_PATH = (subsystem: System) => path.join(subsystem.instance.sys.filesystem.SYSTEM_PATH, "applications.json");
const APPLICATIONS_TSX_FILE_PATH = (subsystem: System) => path.join(subsystem.instance.sys.filesystem.SYSTEM_PATH, "vite", "Applications.tsx");

interface AvailableWorkspacesApplication {
  id: string;
  path: string;
  enabled: boolean;
  status?: WorkspacesApplicationServiceStatus[];
  manifest?: OnlineWorkspaceApplication;
}

export default class ApplicationsSystem extends System {
  availableApplications: AvailableWorkspacesApplication[];
  enabledApplications: string[];

  constructor(instance: Instance) {
    super("applications", instance);

    this.availableApplications = [];
    this.enabledApplications = [];
  }

  getEnabledApplications(): AvailableWorkspacesApplication[] {
    return this.enabledApplications
      .map((a) => this.availableApplications.find((aa) => aa.manifest?.id === a))
      .filter((a) => a !== undefined) as AvailableWorkspacesApplication[];
  }

  async updateWebRouter() {
    let applicationsInfill = ``;
    let applicationImportsInfill = ``;
    let ind = 0;
    for (const app of this.availableApplications) {
      if (this.enabledApplications.find((a) => a === app.manifest?.id)) {
        if (app.manifest?.modules.web) {
          applicationImportsInfill += `const App${ind}Router = lazy(() => import("${path.relative(path.join(this.instance.sys.filesystem.SYSTEM_PATH, "vite"), path.join(app.path, app.manifest.modules.web.path, "/App.tsx")).replaceAll("\\", "/")}"));`;
          applicationsInfill += `<Suspense fallback={<UKCircularProgressIndicator/>}><Route path="${app.manifest.id}/*"><App${ind}Router/></Route></Suspense>`;
          ind++;
        }
      }
    }

    if (this.availableApplications.length === 0) {
      applicationsInfill = `<Route path="*" component={() => <div style={{ "text-align": "center" }}>How peculiar. You have no applications installed, please ask an administrator to install some via the command-line interface.</div>}/>`;
    }

    const applicationsWebRouterTemplate = `import { Route } from "@solidjs/router";import { type Component, lazy, Suspense } from "solid-js";import UKCircularProgressIndicator from "@ewsgit/uikit-solid/src/components/circularProgressIndicator/UKCircularProgressIndicator.tsx";${applicationImportsInfill};const ApplicationsRouter: Component = () => {return (<>${applicationsInfill}</>);};export default ApplicationsRouter`;

    await fs.writeFile(APPLICATIONS_TSX_FILE_PATH(this), applicationsWebRouterTemplate);

    return true;
  }

  override async startup(): Promise<boolean> {
    try {
      if (!fsExistsSync(APPLICATIONS_CONFIG_FILE_PATH(this))) await fs.writeFile(APPLICATIONS_CONFIG_FILE_PATH(this), JSON.stringify([]));

      this.availableApplications = JSON.parse((await fs.readFile(APPLICATIONS_CONFIG_FILE_PATH(this))).toString());

      for (const defaultApplication of this.instance.sys.configuration.defaultApplications) {
        if (!this.availableApplications.find((aa) => aa.path.endsWith(defaultApplication.id))) {
          this.log.info(`The instance is missing default application '${defaultApplication.id}', installing it now...`);
          await this.installApplication(defaultApplication.uri);
          await this.enableApplication(defaultApplication.id);
        }
      }

      for (const app of this.availableApplications) {
        await this.loadApplication(app.path);

        if (app.enabled) {
          await this.enableApplication(app.manifest!.id);
        }
      }

      for (const app of this.availableApplications) {
        this.log.info(`application '${app.manifest?.id}' is ${app.enabled ? "enabled" : "disabled"}`);
      }

      await this.updateWebRouter();

      if (!fsExistsSync(path.join(this.instance.sys.filesystem.SYSTEM_PATH, "vite", "package.json"))) {
        await fs.writeFile(
          path.join(this.instance.sys.filesystem.SYSTEM_PATH, "vite", "package.json"),
          `{
  "name": "workspaces-fs",
  "author": "Ewsgit",
  "dependencies": {
    "@solidjs/router": "^0.16.1",
    "solid-js": "^1.9.11",
    "vite": "^8.0.8",
    "vite-plugin-solid": "^2.11.8"
  }
}`,
        );

        const command = new Deno.Command("deno", {
          args: ["install"],
          cwd: path.join(this.instance.sys.filesystem.SYSTEM_PATH, "vite"),
          stdout: "piped",
          stderr: "piped",
        });

        const child = command.spawn();

        // @ts-ignore don't know why typescript hates this
        for await (const msg of child.stdout) {
          this.log.info(`Applications Initial Startup -> ${Buffer.from(msg).toString()}`);
        }

        // @ts-ignore don't know why typescript hates this
        for await (const msg of child.stderr) {
          this.log.info(`Applications Initial Startup -> ${Buffer.from(msg).toString()}`);
        }

        await fs.cp(
          path.join(this.instance.sys.filesystem.WEB_ROOT, "tsconfig.app.json"),
          path.join(this.instance.sys.filesystem.SYSTEM_PATH, "vite", "tsconfig.json"),
        );
        await fs.writeFile(
          path.join(this.instance.sys.filesystem.SYSTEM_PATH, "vite", "tsconfig.json"),
          (await fs.readFile(path.join(this.instance.sys.filesystem.SYSTEM_PATH, "vite", "tsconfig.json")))
            .toString()
            .replace(`"include": ["src"]`, `"include": ["./Applications.tsx"]`),
        );
      }

      return true;
    } catch (err) {
      this.log.error(err);
      return false;
    }
  }

  private async saveApplicationsConfig(): Promise<this> {
    const data = this.availableApplications.map((a) => {
      return {
        path: a.path,
        enabled: a.enabled,
      };
    });

    await fs.writeFile(APPLICATIONS_CONFIG_FILE_PATH(this), JSON.stringify(data));

    return this;
  }

  // Install an application (fetch all files & add it to /fs/applications.json)
  // Supports the following URIs 'file', 'ssh' & 'https'
  // file - adds to /fs/applications.json, the application is not copied
  // ssh - clones as a git repository to /fs/applicatons & adds to /fs/applications.json
  // https - downloads as a zip file and extracts to /fs/applications & adds to /fs/applications.json
  async installApplication(applicationURI: string): Promise<boolean> {
    let applicationPath: string = path.join(this.instance.sys.filesystem.FS_ROOT, "application-failed-to-install");

    if (applicationURI.startsWith("local:")) {
      applicationPath = path.join(this.instance.sys.filesystem.SRC_ROOT, "../../applications/", applicationURI.slice("local:".length));
    }

    if (applicationURI.startsWith("file:")) {
      applicationPath = path.resolve(process.cwd(), applicationURI.slice("file:".length));
    }

    if (applicationURI.startsWith("ssh:")) {
      this.log.warning("installApplication() is Unimplemented for 'ssh:'.");
      return false;
    }

    if (applicationURI.startsWith("https:")) {
      this.log.warning("installApplication() is Unimplemented for 'https:'.");
      return false;
    }

    if (this.availableApplications.find((a) => a.path === applicationPath)) {
      this.log.warning(`Cannot install application at path -> '${applicationPath}' as it is already installed!`);
      return false;
    }

    this.log.info(`Installing application at path -> '${applicationPath}'`);

    await this.loadApplication(applicationPath);

    await this.saveApplicationsConfig();

    for (const administrator of (await this.instance.sys.users.getAllUsers()).filter((u) => u.isAdministrator())) {
      this.instance.sys.notifications.send(
        administrator.userId,
        "instance.system.application.install",
        WorkspacesNotificationPriority.Important,
        {
          title: "Installed Application",
          icon: "check",
          body: `The application '${applicationURI}' was installed`,
        },
        {
          buttons: [
            {
              id: "dismiss",
              label: "Dismiss",
              type: "filled",
            },
          ],
        },
      );
    }

    return true;
  }

  // Uninstall an application by its applicationId
  async uninstallApplication(applicationId: string): Promise<boolean> {
    const application = this.availableApplications.find((a) => a.manifest?.id === applicationId);

    if (!application) {
      this.log.error(`Cannot find application '${applicationId}' to uninstall.`);

      return false;
    }

    this.availableApplications = this.availableApplications.filter((a) => a.manifest?.id !== applicationId);

    await this.saveApplicationsConfig();

    for (const administrator of (await this.instance.sys.users.getAllUsers()).filter((u) => u.isAdministrator())) {
      this.instance.sys.notifications.send(
        administrator.userId,
        "instance.system.application.uninstall",
        WorkspacesNotificationPriority.Important,
        {
          title: "Uninstalled Application",
          icon: "check",
          body: `The application '${applicationId}' was uninstalled`,
        },
        {
          buttons: [
            {
              id: "dismiss",
              label: "Dismiss",
              type: "filled",
            },
          ],
        },
      );
    }

    return true;
  }

  // Load an application into Workspaces by its installation path
  // This does NOT enable the application, just registers it as available to enable
  async loadApplication(applicationPath: string): Promise<boolean> {
    const APPLICATION_MANIFEST_PATH = path.join(applicationPath, "manifest.json");

    const applicationManifest = JSON.parse((await fs.readFile(APPLICATION_MANIFEST_PATH)).toString());

    const alreadyRegisteredApplication = this.availableApplications.find((a) => a.path === applicationPath);

    if (alreadyRegisteredApplication) {
      alreadyRegisteredApplication.manifest = applicationManifest;
      alreadyRegisteredApplication.path = applicationPath;
      alreadyRegisteredApplication.status = [];

      return true;
    }

    this.availableApplications.push({
      id: applicationManifest.id,
      enabled: false,
      path: applicationPath,
      manifest: applicationManifest,
      status: [],
    });

    return true;
  }

  // Enable an application by its id
  // Loads the specified backend and web frontend
  async enableApplication(applicationId: string): Promise<boolean> {
    const app = this.availableApplications.find((a) => a.manifest?.id === applicationId);

    if (app) {
      app.enabled = true;
      const startTime = performance.now();
      this.log.info(`Enabling application '${this.log.emphasis(applicationId)}'...`);

      if (!this.enabledApplications.find((a) => a === app.manifest?.id)) {
        this.enabledApplications.push(app.manifest!.id);
      }

      await this.saveApplicationsConfig();
      await this.updateWebRouter();

      if (app.manifest?.modules.internal) {
        try {
          // @ts-ignore
          globalThis.instance = this.instance;
          await import(`file://${path.join(app.path, app.manifest.modules.internal.path)}`);
        } catch (err) {
          this.log.error("problem with application's deno internal module ->", err);
        }
      }

      if (app.manifest?.modules.deno) {
        // FIXME: this should use the requested args from the module.
        const permissionArgs = ["-A"]

        const command = new Deno.Command("deno", {
          args: [...permissionArgs, app.manifest.modules.deno.path],
          stdout: "piped",
          stderr: "piped",
          stdin: "piped",
          cwd: app.path
        })

        const child = command.spawn();

        const MODULE_LOG_PREFIX = `${app.manifest.id} module:deno -> `;

        // @ts-ignore typescript hates this valid code.
        for await (const msg of child.stdout) {
          let bufMsg = MODULE_LOG_PREFIX + Buffer.from(msg).toString();

          if (bufMsg.endsWith("\n")) {
            bufMsg = bufMsg.slice(0, -1);
          }

          this.log.info(bufMsg);
        }

        // @ts-ignore typescript hates this valid code.
        for await (const msg of child.stderr) {
          let bufMsg = MODULE_LOG_PREFIX + Buffer.from(msg).toString();

          if (bufMsg.endsWith("\n")) {
            bufMsg = bufMsg.slice(0, -1);
          }

          this.log.error(bufMsg);
        }
      }

      if (app.manifest?.modules.external) {
        const command = new Deno.Command(app.manifest.modules.external.path, {
          stdout: "piped",
          stderr: "piped",
          stdin: "piped",
          cwd: app.path
        });

        const child = command.spawn();

        const MODULE_LOG_PREFIX = `${app.manifest.id} module:external -> `;

        // @ts-ignore typescript hates this valid code.
        for await (const msg of child.stdout) {
          let bufMsg = MODULE_LOG_PREFIX + Buffer.from(msg).toString();

          if (bufMsg.endsWith("\n")) {
            bufMsg = bufMsg.slice(0, -1);
          }

          this.log.info(bufMsg);
        }

        // @ts-ignore typescript hates this valid code.
        for await (const msg of child.stderr) {
          let bufMsg = MODULE_LOG_PREFIX + Buffer.from(msg).toString();

          if (bufMsg.endsWith("\n")) {
            bufMsg = bufMsg.slice(0, -1);
          }

          this.log.error(bufMsg);
        }
      }

      for (const administrator of (await this.instance.sys.users.getAllUsers()).filter((u) => u.isAdministrator())) {
        this.instance.sys.notifications.send(
          administrator.userId,
          "instance.system.application.enable",
          WorkspacesNotificationPriority.Important,
          {
            title: "Enabled Application",
            icon: "check",
            body: `The application ${app?.manifest?.displayName}(${app?.manifest?.id}) was enabled`,
          },
          {
            buttons: [
              {
                id: "dismiss",
                label: "Dismiss",
                type: "tonal",
              },
              {
                id: "reload",
                label: "Reload",
                type: "filled",
              },
            ],
          },
          {
            onButton(optionId) {
              if (optionId === "reload") {
                return {
                  action: {
                    type: "reload",
                  },
                };
              }
            },
          },
        );
      }

      this.log.info(`Enabled application '${this.log.emphasis(applicationId)}' took ${(performance.now() - startTime).toFixed(2)}ms`);
      return true;
    } else {
      this.log.error(`Couldn't find application with id '${this.log.emphasis(applicationId)}'`);
      return false;
    }
  }

  // Disable an application by its id
  // doesn't take effect until the instance is restarted. When finished, it will prompt the administrator to restart
  async disableApplication(applicationId: string): Promise<boolean> {
    const app = this.availableApplications.find((a) => a.manifest?.id === applicationId);

    if (app) {
      app.enabled = false;
      this.log.info(`Disabled application '${applicationId}'`);
      await this.instance.promptForRestart(`Disable application '${applicationId}'`);
      this.enabledApplications = this.enabledApplications.filter((a) => a !== app.manifest?.id);
    } else {
      this.log.error(`Couldn't find application with id '${applicationId}'`);
    }

    await this.saveApplicationsConfig();
    await this.updateWebRouter();

    const self = this;

    for (const administrator of (await this.instance.sys.users.getAllUsers()).filter((u) => u.isAdministrator()))
      this.instance.sys.notifications.send(
        administrator.userId,
        "instance.system.application.disable",
        WorkspacesNotificationPriority.Important,
        {
          title: "Restart Now?",
          icon: "warning",
          body: "Please restart the instance to disable any previously-enabled applications.",
        },
        {
          buttons: [
            {
              id: "restart",
              label: "Restart Now",
              type: "filled",
            },
            {
              id: "later",
              label: "Later",
              type: "tonal",
            },
          ],
        },
        {
          onButton(id) {
            if (id === "restart") {
              self.instance.shutdown();

              return {
                action: {
                  type: "reload",
                },
              };
            }
          },
        },
      );

    return true;
  }

  async getApplicationStatus(applicationId: string): Promise<{ installed: true, enabled: boolean } | { installed: false }> {
    const app = this.availableApplications.find((a) => a.manifest?.id === applicationId);

    if (app) {
      return { installed: true as const, enabled: app.enabled };
    } else {
      return { installed: false as const };
    }
  }
}
