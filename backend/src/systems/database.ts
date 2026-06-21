import postgres from "postgres";
import type { Instance } from "../index.ts";
import System from "../system.ts";

export default class DatabaseSystem extends System {
  databaseConnections: { [connectionId: string]: postgres.Sql };

  constructor(instance: Instance) {
    super("database", instance);

    this.databaseConnections = {};
  }

  // private sqlite(connectionId: string) {
  //   if (this.databaseConnections[connectionId]) return this.databaseConnections[connectionId];

  //   const conPath = `sqlite://${path.join(this.instance.sys.filesystem.FS_ROOT, connectionId)}.sqlite`;

  //   const con = new SQL({
  //     adapter: "sqlite",
  //     readwrite: true,
  //     create: true,
  //     filename: conPath,
  //   });

  //   this.databaseConnections[connectionId] = con;

  //   return con;
  // }

  /**
   * Create or get an already active postgresql database connection
   * @returns postgres.Sql<{}>
   */
  postgres() {
    if (this.databaseConnections.postgres) return this.databaseConnections.postgres;

    this.log.info(
      `Connecting to database @ '${this.log.emphasis(this.instance.sys.configuration.databases.postgres.host)}' named '${this.log.emphasis(this.instance.sys.configuration.databases.postgres.database)}'`,
    );

    const con = postgres({
      db: this.instance.sys.configuration.databases.postgres.database,
      hostname: this.instance.sys.configuration.databases.postgres.host,
      port: this.instance.sys.configuration.databases.postgres.port,
      user: this.instance.sys.configuration.databases.postgres.user,
      password: this.instance.sys.configuration.databases.postgres.password,

      onnotice: (message) => {
        if (message.severity === "NOTICE") return;

        console.log(message);
      },
    });

    this.databaseConnections.postgres = con;

    this.log.info(
      `Established connection to database @ '${this.log.emphasis(this.instance.sys.configuration.databases.postgres.host)}' named '${this.log.emphasis(this.instance.sys.configuration.databases.postgres.database)}'`,
    );

    return con;
  }

  override async startup(): Promise<boolean> {
    this.log.info("Starting up...");
    return true;
  }
}
