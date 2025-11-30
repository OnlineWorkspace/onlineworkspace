# Tricolor Workspaces

---

A working environment for professionals and Home-Lab users.

> [!INFO]
> New icons are needed for all applications, the current icons are only intended to be placeholders

### Links

- Discord -> https://discord.gg/jcJeGEAYhY
- Source Code (git) -> https://github.com/tricolorsoftware/workspaces

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
10. Enjoy! :D

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
16. Enjoy! :D

## Installation Guide for Development Environments

---

> [!WARNING]
> Ignore this section if you are planning to use workspaces in production, instead please follow the `Installation Guide for Production Environments` section.

### Dependencies

| Dependency | NPM Package       | External Installation Guide | Optional |
| ---------- | ----------------- | --------------------------- | -------- |
| SolidJS    | solid             |                             | No       |
| Vite       | vite              |                             | No       |
| UIKit      | @tcsw/uikit-solid |                             | No       |
| Bun        |                   | https://bun.sh              | No       |
| Docker     |                   | https://www.docker.com/     | Yes      |
| PostgreSQL |                   | https://www.postgresql.org/ | No       |

### Installation

1. Choose either the `Full-Stack` or `UIKit` section to continue

#### Full-Stack (Workspaces)

1. Ensure all non-NPM dependencies are installed
    1. Linux (Ubuntu)
        1. Install PostgreSQL -> `sudo apt install postgresql postgresql-contrib`
        2. Start the PostgreSQL service -> `sudo systemctl enable --now postgresql`
        3. Switch to the postgres user -> `sudo su postgres`
        4. Open the PostgreSQL database with psql -> `psql`
        5. Create a PostgreSQL database with the following query -> `CREATE DATABASE tricolor_workspaces;`
        6. Change the PostgreSQL password with the following query -> `ALTER USER postgres WITH PASSWORD 'postgres';`
        7. Exit psql -> `exit;`
        8. Logout from the postgres user -> `exit`
    2. Windows
        1. Simply install postgreSQL with the setup file downloaded from the postgreSQL website
    3. MacOS
        1. Using Orbstack with Ubuntu follow the linux instructions above
2. Run `bun install` to install all NPM dependencies
3. Run `bun run web` and `bun run backend` to start up the web interface and backend in development mode
4. Enjoy! :D

#### UIKit (UI Library dev page)

1. Ensure all non-NPM dependencies are installed before continuing
2. Run `bun install` to install all NPM dependencies
3. cd into the UIKit directory `cd ./packages/uikit-solid`
4. Run `bun run dev-web` to start up the web interface and backend in development mode
5. Enjoy! :D
