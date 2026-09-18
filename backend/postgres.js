const { Pool } = require("pg");
const config = require("./config");

let pool;

function getPostgresPool() {
  if (pool) return pool;
  if (config.databaseDriver !== "postgres") {
    throw new Error("Set DB_DRIVER=postgres before using PostgreSQL operations");
  }
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required for PostgreSQL operations");
  }

  const connection = config.databaseUrl
    ? { connectionString: config.databaseUrl }
    : {
        host: config.postgres.host,
        port: config.postgres.port,
        database: config.postgres.database,
        user: config.postgres.user,
        password: config.postgres.password
      };

  pool = new Pool({
    ...connection,
    max: config.postgres.poolMax,
    connectionTimeoutMillis: config.postgres.connectionTimeoutMs,
    idleTimeoutMillis: config.postgres.idleTimeoutMs,
    ssl: config.postgres.ssl ? { rejectUnauthorized: false } : undefined
  });

  return pool;
}

async function checkPostgresConnection() {
  const client = await getPostgresPool().connect();
  try {
    const result = await client.query("SELECT 1 AS connected");
    return result.rows[0].connected === 1;
  } finally {
    client.release();
  }
}

async function closePostgresPool() {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}

module.exports = {
  getPostgresPool,
  checkPostgresConnection,
  closePostgresPool
};
