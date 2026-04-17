import path from "node:path";
import { SQL } from "bun";
import type { Instance } from "../index.js";
import System from "../system.js";

export default class DatabaseSystem extends System {
  databaseConnections: { [connectionId: string]: SQL };

  constructor(instance: Instance) {
    super("database", instance);

    this.databaseConnections = {};
  }

  private sqlite(connectionId: string) {
    if (this.databaseConnections[connectionId]) return this.databaseConnections[connectionId];

    const conPath = `sqlite://${path.join(this.instance.sys.filesystem.FS_ROOT, connectionId)}.sqlite`;

    const con = new SQL({
      adapter: "sqlite",
      readwrite: true,
      create: true,
      filename: conPath,
    });

    this.databaseConnections[connectionId] = con;

    return con;
  }

  postgres() {
    if (this.databaseConnections.postgres) return this.databaseConnections.postgres;

    const connectionString = `postgres://${this.instance.sys.configuration.databases.postgres.user}:${this.instance.sys.configuration.databases.postgres.password}@${this.instance.sys.configuration.databases.postgres.host}:${this.instance.sys.configuration.databases.postgres.port}/${this.instance.sys.configuration.databases.postgres.database}`;
    this.log.info(`Connecting to database @ '${this.instance.sys.configuration.databases.postgres.host}' named '${this.instance.sys.configuration.databases.postgres.database}'`)
    const con = new SQL(connectionString);

    this.databaseConnections.postgres = con;

    return con;
  }
}
