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

| Dependency | External Installation Guide | Optional |
| ---------- | --------------------------- | -------- |
| Bun        | https://bun.sh              | No       |
| PostgreSQL | https://www.postgresql.org/ | No       |

### Installation

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

| Dependency | NPM Package       | External Installation Guide | Optional |
| ---------- | ----------------- | --------------------------- | -------- |
| Bun        |                   | https://bun.sh              | No       |
| PostgreSQL |                   | https://www.postgresql.org/ | No       |

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
    - Windows
        1. Simply install postgreSQL with the setup file downloaded from the postgreSQL website
        2. Open your database viewer of choice (DBeaver Community Edition is recommended)
        3. Create the `tricolor_workspaces` table
    - MacOS
        1. Using Orbstack with Ubuntu follow the Ubuntu Linux instructions above
2. Run `bun install` inside the project root directory to install all NPM dependencies
3. Run `bun run dev` to start up the web interface and backend in development mode
