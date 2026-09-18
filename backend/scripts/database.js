const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, "..", "..", ".local", "song-site.sqlite");

function loadDatabase() {
  return require("../database");
}

function run(command) {
  if (command === "reset") {
    if (fs.existsSync(databasePath)) fs.rmSync(databasePath, { force: true });
    console.log(`Removed ${databasePath}`);
    return;
  }

  const database = loadDatabase();
  try {
    if (command === "check") {
      const tasks = database.getTasks("tasks").length;
      const trainingTasks = database.getTasks("training_tasks").length;
      console.log(`SQLite database ready: ${tasks} tasks, ${trainingTasks} training tasks`);
      return;
    }

    if (command === "migrate") {
      console.log(`Database migration complete: ${databasePath}`);
      return;
    }

    if (command === "seed") {
      console.log(`Database data is migration-backed; no JSON seed files are required: ${databasePath}`);
      return;
    }

    throw new Error(`Unknown database command: ${command}`);
  } finally {
    database.close();
  }
}

run(process.argv[2] || "check");
