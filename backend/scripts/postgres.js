const { checkPostgresConnection, closePostgresPool } = require("../postgres");

async function run() {
  try {
    const connected = await checkPostgresConnection();
    console.log(connected ? "PostgreSQL connection ready" : "PostgreSQL connection check failed");
    process.exitCode = connected ? 0 : 1;
  } catch (error) {
    console.error(`PostgreSQL connection failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await closePostgresPool();
  }
}

run();
