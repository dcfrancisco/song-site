const { checkPostgresConnection, getPostgresPool, closePostgresPool } = require("../postgres");

async function run() {
  await checkPostgresConnection();
  const result = await getPostgresPool().query(`
    SELECT
      EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS has_vector,
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') AS has_tasks
  `);
  const checks = result.rows[0];
  if (!checks.has_vector || !checks.has_tasks) {
    throw new Error("PostgreSQL is reachable but the required pgvector/schema checks failed");
  }
  console.log("PostgreSQL ready: pgvector extension and tasks table are present");
}

run()
  .catch((error) => {
    console.error(`PostgreSQL check failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => closePostgresPool());
