const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const repositoryRoot = path.join(__dirname, '..', '..');
const baselineCandidates = [
  path.join(repositoryRoot, 'docker', 'postgres', 'init', '001-schema.sql'),
  path.join(__dirname, '..', 'postgres-init', '001-schema.sql'),
];
const migrationCandidates = [
  path.join(repositoryRoot, 'backend', 'migrations-postgres'),
  path.join(__dirname, '..', 'migrations-postgres'),
];

function firstExisting(candidates, kind) {
  const match = candidates.find(candidate => fs.existsSync(candidate));
  if (!match) throw new Error(`PostgreSQL ${kind} not found in expected locations`);
  return match;
}

function sslOptions() {
  return process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined;
}

async function applyMigration(client, version, sql) {
  const existing = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version]);
  if (existing.rowCount) return false;

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
    await client.query('COMMIT');
    console.log(`Applied PostgreSQL migration ${version}`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function migrate() {
  const connection = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
      };
  if (!connection.connectionString && (!connection.host || !connection.database || !connection.user || !connection.password)) {
    throw new Error('Set DATABASE_URL or PGHOST, PGDATABASE, PGUSER, and PGPASSWORD for PostgreSQL migrations');
  }

  const pool = new Pool({ ...connection, ssl: sslOptions() });
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const baselinePath = firstExisting(baselineCandidates, 'baseline schema');
    const migrationsPath = firstExisting(migrationCandidates, 'migrations directory');
    await applyMigration(client, '000-initial-schema', fs.readFileSync(baselinePath, 'utf8'));

    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
    for (const migrationFile of migrationFiles) {
      await applyMigration(client, migrationFile, fs.readFileSync(path.join(migrationsPath, migrationFile), 'utf8'));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(error => {
  console.error(`PostgreSQL migration failed: ${error.message}`);
  process.exitCode = 1;
});
