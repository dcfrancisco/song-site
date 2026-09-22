const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const databaseDriver = (process.env.DB_DRIVER || "sqlite").toLowerCase();
if (!["sqlite", "postgres"].includes(databaseDriver)) {
  throw new Error("DB_DRIVER must be sqlite or postgres");
}

module.exports = {
  databaseDriver,
  databasePath: process.env.DATABASE_PATH || path.join(__dirname, "..", ".local", "song-site.sqlite"),
  databaseUrl: process.env.DATABASE_URL || "",
  postgres: {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "song_site",
    user: process.env.PGUSER || "",
    password: process.env.PGPASSWORD || "",
    poolMax: Number(process.env.PG_POOL_MAX || 10),
    connectionTimeoutMs: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5000),
    idleTimeoutMs: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    ssl: process.env.PGSSL === "true"
  }
};
