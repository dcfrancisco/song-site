const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const config = require("./config");
const database = config.databaseDriver === "postgres"
  ? require("./postgres-database")
  : require("./database");
const app = express();
const PORT = Number(process.env.PORT || 5001);

app.use(cors());
app.use(express.json());

function requireTemporaryContentWriteAccess(req, res, next) {
  if (process.env.NODE_ENV !== "production") return next();
  const configuredKey = process.env.TEMP_CONTENT_API_KEY;
  if (!configuredKey || req.get("x-admin-key") !== configuredKey) {
    return res.status(403).json({ error: "Content write access is not configured for this client" });
  }
  next();
}

function requireObjectBody(req, res, next) {
  if (!req.body || Array.isArray(req.body) || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body must be a JSON object" });
  }
  next();
}

function requireNumericParams(...names) {
  return (req, res, next) => {
    if (names.some((name) => !Number.isInteger(Number(req.params[name])))) {
      return res.status(400).json({ error: "Route identifiers must be integers" });
    }
    next();
  };
}

function requireStatusAction(req, res, next) {
  if (!["start", "complete"].includes(req.body.action)) {
    return res.status(400).json({ error: "Action must be start or complete" });
  }
  next();
}

const swaggerEnabled = process.env.NODE_ENV === "development" && process.env.SWAGGER_UI === "true";
if (swaggerEnabled) {
  const openApiPath = path.join(__dirname, "..", "docs", "openapi", "song-site.yaml");
  const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, "utf8"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
}

app.get("/api/tasks", async (req, res, next) => {
  try { res.json(await database.getTasks("tasks")); } catch (error) { next(error); }
});

app.post("/api/tasks", requireTemporaryContentWriteAccess, requireObjectBody, async (req, res, next) => {
  try { res.status(201).json(await database.createTask("tasks", req.body)); } catch (error) { next(error); }
});

app.put("/api/tasks/:id", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("id"), async (req, res, next) => {
  try {
  const task = await database.updateTask("tasks", Number(req.params.id), req.body);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
  } catch (error) { next(error); }
});

app.get("/api/progress-status", async (req, res, next) => {
  try { res.json({ progress: await database.getProgress("tasks") }); } catch (error) { next(error); }
});

app.get("/api/journey/items", async (req, res, next) => {
  try { res.json(await database.getJourneyItems()); } catch (error) { next(error); }
});

app.put("/api/journey/items/:id", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("id"), async (req, res, next) => {
  try {
  const item = await database.updateJourneyItem(Number(req.params.id), req.body);
  if (!item) return res.status(404).json({ error: "Journey item not found" });
  res.json(item);
  } catch (error) { next(error); }
});

app.put("/api/tasks/:id/status", requireTemporaryContentWriteAccess, requireObjectBody, requireStatusAction, requireNumericParams("id"), async (req, res, next) => {
  try {
  const task = await database.updateTaskStatus("tasks", Number(req.params.id), req.body.action);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
  } catch (error) { next(error); }
});

// ── Training Tracker ──────────────────────────────────────────────────────────

app.get("/api/training-tasks", async (req, res, next) => {
  try { res.json(await database.getTasks("training_tasks")); } catch (error) { next(error); }
});

app.post("/api/training-tasks", requireTemporaryContentWriteAccess, requireObjectBody, async (req, res, next) => {
  try { res.status(201).json(await database.createTask("training_tasks", req.body)); } catch (error) { next(error); }
});

app.put("/api/training-tasks/:id", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("id"), async (req, res, next) => {
  try {
  const task = await database.updateTask("training_tasks", Number(req.params.id), req.body);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
  } catch (error) { next(error); }
});

app.get("/api/training-progress-status", async (req, res, next) => {
  try { res.json({ progress: await database.getProgress("training_tasks") }); } catch (error) { next(error); }
});

app.put("/api/training-tasks/:id/status", requireTemporaryContentWriteAccess, requireObjectBody, requireStatusAction, requireNumericParams("id"), async (req, res, next) => {
  try {
  const task = await database.updateTaskStatus("training_tasks", Number(req.params.id), req.body.action);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
  } catch (error) { next(error); }
});
// ── Leadership ───────────────────────────────────────────────────────────────

app.get("/api/leadership", async (req, res, next) => {
  try { res.json(await database.getLeadership()); } catch (error) { next(error); }
});

app.put("/api/leadership/:section/:id", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("id"), async (req, res, next) => {
  try {
  const updated = await database.updateLeadershipItem(req.params.section, Number(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: "Leadership item not found" });
  res.json(await database.getLeadership());
  } catch (error) { next(error); }
});

// ── Home ─────────────────────────────────────────────────────────────────────

app.get("/api/home/spotlight", async (req, res, next) => {
  try { res.json(await database.getHomeSpotlight()); } catch (error) { next(error); }
});

app.put("/api/home/spotlight", requireTemporaryContentWriteAccess, requireObjectBody, async (req, res, next) => {
  try { res.json(await database.updateHomeSpotlight(req.body)); } catch (error) { next(error); }
});

app.get("/api/home/announcements", async (req, res, next) => {
  try { res.json(await database.getAnnouncements()); } catch (error) { next(error); }
});

app.put("/api/home/announcements/:id", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("id"), async (req, res, next) => {
  try {
  const announcement = await database.updateAnnouncement(Number(req.params.id), req.body);
  if (!announcement) return res.status(404).json({ error: "Announcement not found" });
  res.json(announcement);
  } catch (error) { next(error); }
});

// ── Song Links ───────────────────────────────────────────────────────────────

app.get("/api/song-links", async (req, res, next) => {
  try { res.json(await database.getSongLinks()); } catch (error) { next(error); }
});

app.put("/api/song-links/:sectionId/:cardId", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("sectionId", "cardId"), async (req, res, next) => {
  try {
  const updated = await database.updateSongLink(Number(req.params.sectionId), Number(req.params.cardId), req.body);
  if (!updated) return res.status(404).json({ error: "Song link not found" });
  res.json(await database.getSongLinks());
  } catch (error) { next(error); }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
