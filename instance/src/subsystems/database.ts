import { SQL } from "bun";
import type { Instance } from "../index.js";
import SubSystem from "../subSystems.js";
import path from "path";

export default class DatabaseSubsystem extends SubSystem {
    databaseConnections: { [connectionId: string]: SQL };

    constructor(instance: Instance) {
        super("database", instance);

        this.databaseConnections = {};

        return this;
    }

    async startup(): Promise<boolean> {
        this.createPostgresConnection();

        return true;
    }

    getConnection(connectionId: string) {
        if (this.databaseConnections[connectionId]) return this.databaseConnections[connectionId];

        return this.createSQLiteConnection(connectionId);
    }

    // Get the instance's postgres database connection (The primary database)
    db() {
        return this.getConnection("postgres");
    }

    private createSQLiteConnection(connectionId: string) {
        let conPath = "sqlite://" + path.join(this.instance.subSystems.filesystem.FS_ROOT, connectionId) + ".sqlite";

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

    private createPostgresConnection() {
        const connectionString = `postgres://${this.instance.subSystems.configuration.databases.postgres.user}:${this.instance.subSystems.configuration.databases.postgres.password}@${this.instance.subSystems.configuration.databases.postgres.host}:${this.instance.subSystems.configuration.databases.postgres.port}/${this.instance.subSystems.configuration.databases.postgres.database}`;

        let con = new SQL(connectionString);

        this.databaseConnections[`postgres`] = con;

        return con;
    }
}
