# Workspace (To be renamed)

---

A working environment for the Home-Lab.

> [!INFO]
> Workspace is in need of a permanent name, any suggestions would be appreciated in the discord.

> [!WARNING]
> Workspaces is not yet intended for production use. Although early adoption for testing purposes is appreciated.

### Links

- Discord -> https://discord.gg/jcJeGEAYhY
- Source Code (GitHub) -> https://github.com/tricolorsoftware/workspaces

### Showcase

<details>
  <summary><b>View Screenshots</b></summary>

Login Page

![login.png](metaAssets/preview_screenshots/login.png)

Signup Page

![signup.png](metaAssets/preview_screenshots/signup.png)

App Navigation Rail

![app navigation rail](metaAssets/app_navigation_rail.avif)

Dashboard

![dashboard.png](metaAssets/preview_screenshots/dashboard.png)

Files Grid

![files_grid.png](metaAssets/preview_screenshots/files_grid.png)

Settings Profile Page (Mobile mode)

![mobile_settings_profile.png](metaAssets/preview_screenshots/mobile_settings_profile.png)

Settings Overview Page

![settings_overview.png](metaAssets/preview_screenshots/settings_overview.png)

Settings Customize Wallpaper Page

![settings_wallpaper.png](metaAssets/preview_screenshots/settings_wallpaper.png)

Store Application Page

![store_application.png](metaAssets/preview_screenshots/store_application.png)

</details>

<!--
## Installation Guide for Production Environments (Docker)

---

### Dependencies

| Dependency | External Installation Guide | Optional |
| ---------- | --------------------------- | -------- |
| Docker     | https://www.docker.com/     | No       |

### Installation

1. Ensure all dependencies are installed before continuing
2. Ensure that the installation environment is running a supported version of Linux
3. `cd /`
4. create a directory to house the Workspaces filesystem root e.g.: `sudo mkdir /tricolor/workspaces`
5. change into the newly created directory `cd /tricolor/workspaces`
6. clone the workspaces docker configuration from git `git clone git@github.com:tricolorsoftware/workspaces-docker.git .`
7. edit `docker-compose.yaml` to your desired configuration from [Insert link to relevant documentation here] before continuing.
8. run `docker-compose up` to start the workspaces docker image and install all remaining dependencies
9. open your browser and head to `https://[server-ip]` and follow the on-screen instructions to complete the setup.
-->

<!--
## Installation Guide for Production Environments (Manual)

---

### Dependencies

| Dependency | External Installation Guide      | Optional |
| ---------- | -------------------------------- | -------- |
| Bun        | https://bun.sh                   | No       |
| PostgreSQL | https://www.postgresql.org/      | No       |


1. Ensure all dependencies are installed before continuing
2. Ensure that the installation environment is running a supported version of Linux
3. `cd /`
4. create a directory to house the Workspaces filesystem root e.g.: `sudo mkdir /var/www/workspaces`
5. change into the newly created directory `cd /var/www/workspaces`
6. clone the workspaces docker configuration from git `git clone git@github.com:tricolorsoftware/workspaces.git .`
7. run `bun install`
8. create a postgresql database called `tricolor_workspaces`
9. change into the `instance` directory
10. copy `meta/backend.service` to `/etc/systemd/system/workspaces-backend.service`.
11. run `systemctl enable workspaces-backend --now` to start the backend
12. change into the project root `/var/www/workspaces`
13. run `bun build-web`
14. choose a webserver of your choice to serve `/var/www/workspaces/instance/web/dist` (caddy is fast & easy to use)
15. open your browser and head to `https://[server-ip]` and login as the user `admin` with password `password` to finish setup.
-->


## Installation Guide for Development Environments

---

> [!TIP]
> If you are struggling with the following instructions, please ask for help in the project's discord server which can be found in the links section.

### Dependencies

| Dependency | NPM Package | External Installation Guide      | Optional |
|------------|-------------|----------------------------------|----------|
| Bun        |             | https://bun.sh                   | No       |
| PostgreSQL |             | https://www.postgresql.org/      | No       |
| Caddy      |             | https://caddyserver.com/download | No       |

> [!IMPORTANT]
> Please ensure all non-optional dependencies are installed before proceeding.

1. Ensure all non-NPM dependencies are installed
    - Ubuntu Linux
        1. Install PostgreSQL -> `sudo apt install postgresql postgresql-contrib`
        2. Start the PostgreSQL service -> `sudo systemctl enable --now postgresql`
        3. Switch to the postgres user -> `sudo su postgres`
        4. Open PostgreSQL with psql -> `psql`
        5. Create a PostgreSQL database with the following query -> `CREATE DATABASE tricolor_workspaces;`
        6. Change the PostgreSQL password with the following query -> `ALTER USER postgres WITH PASSWORD 'postgres';`
        7. Exit psql -> `exit;`
        8. Logout from the postgres user -> `exit`
        9. Install Caddy -> `sudo apt install caddy`
    - Windows
        1. Simply install postgreSQL with the setup file downloaded from the postgreSQL website
        2. Open your database viewer of choice (DBeaver Community Edition is recommended)
        3. Create the `tricolor_workspaces` table
        4. Download the caddy executable from the caddy website, this can be placed anywhere but in the repo root directory is recommended for ease of use
    - MacOS
        1. Using Orbstack with an Ubuntu container, follow the Ubuntu Linux instructions above
2. Run `bun install` inside the project root directory to install all NPM dependencies
3. Ensure all autoinstall configuration is set before proceeding, if you want a vanilla setup this step can be skipped (see [Autoinstall Configuration](#autoinstall-configuration) section in the documentation for more details)
4. Run `bun run dev` to start up the web interface and backend in development mode
5. If on Linux or MacOS, ensure that caddy is allowed to bind to ports lower than 1024 by running `sudo setcap 'cap_net_bind_service=+ep' $(which caddy)`.
6. Run `caddy run`(Linux) or `.\caddy.exe run`(Windows) to start the caddy server with the provided configuration (this will serve the web interface on `https://localhost` by default)

## Autoinstall Configuration

---

To automatically configure a workspaces instance on the first run, create a directory called `autoinstall` in the project root and place a `config.json` file inside with the following structure:

```json
{
  "enabledFeatures": ["slash_commands"],
  "databases": {
    "postgres": {
      "user": "postgres",
      "password": "postgres",
      "host": "localhost",
      "port": 5432,
      "database": "tricolor_workspaces"
    }
  },
  "backendUrl": "https://localhost",
  "webUrl": ["https://localhost"],
  "signupRequirements": {
    "email": false,
    "twoFactorAuthentication": false
  },
  "displayName": "Workspace",
  "mailserver": {
    "host": "smtp.example.com",
    "port": 587,
    "secure": true,
    "auth": {
      "user": "user",
      "pass": "password"
    }
  },
  "termsOfUse": {
    "message": "1. Acceptance of Terms\n    - By logging in, you agree to these rules. If you do not agree, please do not use the service.\n2. Account Security\n    - You are the gatekeeper of your account. Keep your password private, as you are responsible for all activity that happens under your login.\n3. Content Ownership\n    - What is yours remains yours. We claim no ownership over the files, photos, or data you upload to this instance.\n4. Acceptable Use\n    - Do not use this space for anything illegal, malicious, or harmful. This includes uploading malware or attempting to disrupt the service for others.\n5. Privacy and Access\n    - We value your privacy. We will not access your stored data unless it is strictly necessary for technical support or required by legal authorities.\n6. Storage and Maintenance\n    - While we strive for 100% uptime, this service is provided \"as is.\" We may occasionally perform maintenance that results in temporary downtime.\n7. Personal Responsibility\n    - Hardware and software can fail. You agree to maintain your own external backups of any mission-critical data. We are not liable for data loss.\n8. Termination\n    - We reserve the right to suspend or close accounts that violate these terms or compromise the security of the server.\n9. Policy Updates\n    - These terms may change. If we make significant updates, we will post a notification within the app or send an email.",
    "lastUpdated": 1774139372136
  },
  "defaultQuickShortcuts": [
    "uk.tcsw.dashboard",
    "uk.tcsw.store",
    "uk.tcsw.settings",
    "uk.tcsw.photos",
    "uk.tcsw.files"
  ]
}
```

Any fields provided in the `config.json` file will override the default settings. By leaving out any fields, the default values will be used instead. This allows you to only modify the settings you want to change while leaving the rest of the default configuration intact.

Instance branding assets can be added to the `autoinstall` directory and should be located and named as follows:
- `autoinstall/assets/login/banner.png`
