import path from "path";
import type { Instance } from "../index.js";
import System from "../system.js";
import { promises as fs } from "fs";
import type { WorkspacesApplication } from "./applications/application.js";
import type { WorkspacesApplicationServiceStatus } from "./applications/serviceStatus.js";
import { WorkspacesNotificationPriority } from "./notifications.js";

const APPLICATIONS_CONFIG_FILE_PATH = (subsystem: System) =>
    path.join(subsystem.instance.sys.filesystem.FS_ROOT, "applications.json");

export const DEFAULT_APPLICATIONS: string[] = ["uk.tcsw.store", "uk.tcsw.dashboard", "uk.tcsw.settings"];

interface AvailableWorkspacesApplication {
    path: string;
    enabled: boolean;
    status?: WorkspacesApplicationServiceStatus[];
    manifest?: WorkspacesApplication;
}

export default class ApplicationsSystem extends System {
    availableApplications: AvailableWorkspacesApplication[];
    enabledApplications: string[];

    constructor(instance: Instance) {
        super("applications", instance);

        this.availableApplications = [];
        this.enabledApplications = [];

        return this;
    }

    getEnabledApplications(): AvailableWorkspacesApplication[] {
        return this.enabledApplications
            .map((a) => this.availableApplications.find((aa) => aa.manifest?.id === a))
            .filter((a) => a !== undefined);
    }

    async updateWebRouter() {
        let applicationsInfill = ``;
        let applicationImportsInfill = ``;
        let ind = 0;
        for (const app of this.availableApplications) {
            if (this.enabledApplications.find((a) => a === app.manifest?.id)) {
                if (app.manifest?.modules.web) {
                    applicationImportsInfill += `const App${ind}Router = lazy(() => import("${path.relative(path.join(this.instance.sys.filesystem.FS_ROOT), path.join(app.path, app.manifest.modules.web.path, "/App.tsx")).replaceAll("\\", "/")}"));`;
                    applicationsInfill += `<Suspense fallback={<UKIndeterminateSpinner/>}><Route path="${app.manifest.id}/*"><App${ind}Router/></Route></Suspense>`;
                    ind++;
                }
            }
        }

        if (this.availableApplications.length === 0) {
            applicationsInfill = `<Route path="*" component={() => <div style={{ "text-align": "center" }}>How peculiar. You have no applications installed, please ask an administrator to install some via the command-line interface.</div>}/>`;
        }

        let applicationsWebRouterTemplate = `import { Route } from "@solidjs/router";import { type Component, lazy, Suspense } from "solid-js";import UKIndeterminateSpinner from "@tcsw/uikit-solid/src/components/indeterminateSpinner/UKIndeterminateSpinner.tsx";${applicationImportsInfill};const ApplicationsRouter: Component = () => {return (<>${applicationsInfill}</>);};export default ApplicationsRouter`;

        await fs.writeFile(
            path.join(this.instance.sys.filesystem.FS_ROOT, "Applications.tsx"),
            applicationsWebRouterTemplate,
        );

        return true;
    }

    async startup(): Promise<boolean> {
        try {
            if (!(await fs.exists(APPLICATIONS_CONFIG_FILE_PATH(this))))
                await fs.writeFile(APPLICATIONS_CONFIG_FILE_PATH(this), JSON.stringify([]));

            // TODO: maybe check if the `applications.json` file is valid JSON?

            this.availableApplications = JSON.parse(
                (await fs.readFile(APPLICATIONS_CONFIG_FILE_PATH(this))).toString(),
            );

            for (const defaultApp of DEFAULT_APPLICATIONS) {
                if (!this.availableApplications.find((aa) => aa.path.endsWith(defaultApp))) {
                    this.log.info(`The instance is missing default application '${defaultApp}', installing from local`);
                    await this.installApplication(`local:${defaultApp}`);
                    await this.enableApplication(defaultApp);
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

            if (!(await fs.exists(path.join(this.instance.sys.filesystem.FS_ROOT, "package.json")))) {
                await fs.writeFile(
                    path.join(this.instance.sys.filesystem.FS_ROOT, "package.json"),
                    `{
    "name": "workspaces-fs",
    "author": "Tricolor Software",
    "dependencies": {
        "@solidjs/router": "^0.15.3",
        "solid-js": "^1.9.8",
        "vite": "^7.1.2",
        "vite-plugin-solid": "^2.11.8"
    }
}`,
                );

                const child = Bun.spawn({
                    cwd: this.instance.sys.filesystem.FS_ROOT,
                    cmd: ["bun", "install"],
                    stdout: "pipe",
                    stderr: "pipe",
                });

                // @ts-ignore
                for await (const msg of child.stdout) {
                    this.log.info("Applications Initial Startup -> " + Buffer.from(msg).toString());
                }

                // @ts-ignore
                for await (const msg of child.stderr) {
                    this.log.error("Applications Initial Startup -> " + Buffer.from(msg).toString());
                }

                await fs.cp(
                    path.join(this.instance.sys.filesystem.SRC_ROOT, "web/tsconfig.app.json"),
                    path.join(this.instance.sys.filesystem.FS_ROOT, "tsconfig.json"),
                );
                await fs.writeFile(
                    path.join(this.instance.sys.filesystem.FS_ROOT, "tsconfig.json"),
                    (await fs.readFile(path.join(this.instance.sys.filesystem.FS_ROOT, "tsconfig.json")))
                        .toString()
                        .replace(`"include": ["src"]`, `"include": ["./Applications.tsx"]`),
                );
            }

            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    private async saveApplicationsConfig(): Promise<this> {
        let data = this.availableApplications.map((a) => {
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
            applicationPath = path.join(
                this.instance.sys.filesystem.SRC_ROOT,
                "../../applications/",
                applicationURI.slice("local:".length),
            );
        }

        if (applicationURI.startsWith("file:")) {
            applicationPath = applicationURI.slice("file:".length);
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

    // Load an application into Workspaces by it's installation path
    // This does NOT enable the application, just registers it as available to enable
    async loadApplication(applicationPath: string): Promise<boolean> {
        const APPLICATION_MANIFEST_PATH = path.join(applicationPath, "manifest.json");

        let applicationManifest = JSON.parse((await fs.readFile(APPLICATION_MANIFEST_PATH)).toString());

        let alreadyRegisteredApplication = this.availableApplications.find((a) => a.path === applicationPath);

        if (alreadyRegisteredApplication) {
            alreadyRegisteredApplication.manifest = applicationManifest;
            alreadyRegisteredApplication.path = applicationPath;
            alreadyRegisteredApplication.status = [];

            return true;
        }

        this.availableApplications.push({
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
        let app = this.availableApplications.find((a) => a.manifest?.id === applicationId);

        if (app) {
            app.enabled = true;

            if (!this.enabledApplications.find((a) => a === app.manifest?.id)) {
                this.enabledApplications.push(app.manifest?.id!);
            }

            this.log.info(`Enabled application '${applicationId}'`);
        } else {
            this.log.error(`Couldn't find application with id '${applicationId}'`);
        }

        await this.saveApplicationsConfig();
        await this.updateWebRouter();

        if (app?.manifest?.modules.bun) {
            try {
                // @ts-ignore
                globalThis.instance = this.instance;
                await import(path.join(app.path, app.manifest.modules.bun.path));
            } catch (err) {
                console.error("problem with application's bun module ->", err);
            }
        }

        if (app?.manifest?.modules.script) {
            let child = Bun.spawn({
                stderr: "pipe",
                stdout: "pipe",
                stdin: "pipe",
                cmd: [app.manifest.modules.script.path],
                cwd: app.path,
                env: process.env,
            });

            const MODULE_LOG_PREFIX = `${app.manifest.id} -> `;

            // @ts-ignore
            for await (const msg of child.stdout) {
                let bufMsg = MODULE_LOG_PREFIX + Buffer.from(msg).toString();

                if (bufMsg.endsWith("\n")) {
                    bufMsg = bufMsg.slice(0, -1);
                }

                this.log.info(bufMsg);
            }

            // @ts-ignore
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

        return true;
    }

    // Disable an application by its id
    // doesn't take effect until the instance is restarted. When finished, it will prompt the administrator to restart
    async disableApplication(applicationId: string): Promise<boolean> {
        let app = this.availableApplications.find((a) => a.manifest?.id === applicationId);

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

        return false;
    }
}
