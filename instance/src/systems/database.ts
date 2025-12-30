import { SQL } from "bun";
import type { Instance } from "../index.js";
import System from "../system.js";
import path from "path";

export default class DatabaseSystem extends System {
    databaseConnections: { [connectionId: string]: SQL };

    constructor(instance: Instance) {
        super("database", instance);

        this.databaseConnections = {};

        return this;
    }

    private sqlite(connectionId: string) {
        if (this.databaseConnections[connectionId]) return this.databaseConnections[connectionId];

        let conPath =
            "sqlite://" + path.join(this.instance.sys.filesystem.FS_ROOT, connectionId) + ".sqlite";

        let con = new SQL({
            // NOTE: use SQLite for now, in the future we should switch to postgres / a better alternative
            adapter: "sqlite",
            readwrite: true,
            create: true,
            filename: conPath,
        });

        this.databaseConnections[connectionId] = con;

        return con;
    }

    postgres() {
        if (this.databaseConnections["postgres"]) return this.databaseConnections["postgres"];

        const connectionString = `postgres://${this.instance.sys.configuration.databases.postgres.user}:${this.instance.sys.configuration.databases.postgres.password}@${this.instance.sys.configuration.databases.postgres.host}:${this.instance.sys.configuration.databases.postgres.port}/${"tricolor_workspaces"}`;
        let con = new SQL(connectionString);

        this.databaseConnections[`postgres`] = con;

        return con;
    }
}
