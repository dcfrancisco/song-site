const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const repositoryRoot = path.join(__dirname, '..', '..');
const baselinePath = path.join(repositoryRoot, 'docker', 'postgres', 'init', '001-schema.sql');
const migrationsPath = path.join(repositoryRoot, 'backend', 'migrations-postgres');

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
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for PostgreSQL migrations');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: sslOptions() });
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

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
