export interface PostgresConnectionConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export type PostgresTestResult = { ok: true } | { ok: false; missingDatabase: boolean; error: string };

/** the names which can be safely used (quoted) in a CREATE DATABASE statement */
export const POSTGRES_DATABASE_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,62}$/;

const TIMEOUT_MS = 8000;

const connect = (config: PostgresConnectionConfig, database: string) =>
  new Bun.SQL({
    db: database,
    hostname: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    max: 1,
    connectionTimeout: TIMEOUT_MS / 1000,
  });

const withTimeout = <T>(promise: Promise<T>): Promise<T> =>
  Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`The database did not respond within ${TIMEOUT_MS / 1000} seconds`)), TIMEOUT_MS))]);

const describe = (err: unknown) => (err instanceof Error && err.message ? err.message : "The database could not be reached");

/** Checks that a postgres database can be connected to, nothing is created or changed. */
export const testPostgresConnection = async (config: PostgresConnectionConfig): Promise<PostgresTestResult> => {
  const sql = connect(config, config.database);

  try {
    await withTimeout(sql`SELECT 1`);
    return { ok: true };
  } catch (err) {
    // 3D000 is postgres' invalid_catalog_name, the server is fine but there is no database of that name
    return { ok: false, missingDatabase: (err as { errno?: string })?.errno === "3D000", error: describe(err) };
  } finally {
    await sql.close().catch(() => undefined);
  }
};

/** Creates the configured database through the server's maintenance database. */
export const createPostgresDatabase = async (config: PostgresConnectionConfig): Promise<{ ok: true } | { ok: false; error: string }> => {
  if (!POSTGRES_DATABASE_NAME_PATTERN.test(config.database)) {
    return { ok: false, error: "Database names can only contain letters, numbers and underscores, and cannot start with a number" };
  }

  const sql = connect(config, "postgres");

  try {
    await withTimeout(sql.unsafe(`CREATE DATABASE "${config.database}"`));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: describe(err) };
  } finally {
    await sql.close().catch(() => undefined);
  }
};
