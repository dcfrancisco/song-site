const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const database = require("./database");
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

app.get("/api/tasks", (req, res) => {
  res.json(database.getTasks("tasks"));
});

app.post("/api/tasks", requireTemporaryContentWriteAccess, requireObjectBody, (req, res) => {
  res.status(201).json(database.createTask("tasks", req.body));
});

app.put("/api/tasks/:id", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("id"), (req, res) => {
  const task = database.updateTask("tasks", Number(req.params.id), req.body);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

app.get("/api/progress-status", (req, res) => {
  res.json({ progress: database.getProgress("tasks") });
});

app.get("/api/journey/items", (req, res) => {
  res.json(database.getJourneyItems());
});

app.put("/api/journey/items/:id", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("id"), (req, res) => {
  const item = database.updateJourneyItem(Number(req.params.id), req.body);
  if (!item) return res.status(404).json({ error: "Journey item not found" });
  res.json(item);
});

app.put("/api/tasks/:id/status", requireTemporaryContentWriteAccess, requireObjectBody, requireStatusAction, requireNumericParams("id"), (req, res) => {
  const task = database.updateTaskStatus("tasks", Number(req.params.id), req.body.action);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// ── Training Tracker ──────────────────────────────────────────────────────────

app.get("/api/training-tasks", (req, res) => {
  res.json(database.getTasks("training_tasks"));
});

app.post("/api/training-tasks", requireTemporaryContentWriteAccess, requireObjectBody, (req, res) => {
  res.status(201).json(database.createTask("training_tasks", req.body));
});

app.put("/api/training-tasks/:id", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("id"), (req, res) => {
  const task = database.updateTask("training_tasks", Number(req.params.id), req.body);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

app.get("/api/training-progress-status", (req, res) => {
  res.json({ progress: database.getProgress("training_tasks") });
});

app.put("/api/training-tasks/:id/status", requireTemporaryContentWriteAccess, requireObjectBody, requireStatusAction, requireNumericParams("id"), (req, res) => {
  const task = database.updateTaskStatus("training_tasks", Number(req.params.id), req.body.action);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});
// ── Leadership ───────────────────────────────────────────────────────────────

app.get("/api/leadership", (req, res) => {
  res.json(database.getLeadership());
});

app.put("/api/leadership/:section/:id", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("id"), (req, res) => {
  const updated = database.updateLeadershipItem(req.params.section, Number(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: "Leadership item not found" });
  res.json(database.getLeadership());
});

// ── Home ─────────────────────────────────────────────────────────────────────

app.get("/api/home/spotlight", (req, res) => {
  res.json(database.getHomeSpotlight());
});

app.put("/api/home/spotlight", requireTemporaryContentWriteAccess, requireObjectBody, (req, res) => {
  res.json(database.updateHomeSpotlight(req.body));
});

app.get("/api/home/announcements", (req, res) => {
  res.json(database.getAnnouncements());
});

app.put("/api/home/announcements/:id", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("id"), (req, res) => {
  const announcement = database.updateAnnouncement(Number(req.params.id), req.body);
  if (!announcement) return res.status(404).json({ error: "Announcement not found" });
  res.json(announcement);
});

// ── Song Links ───────────────────────────────────────────────────────────────

app.get("/api/song-links", (req, res) => {
  res.json(database.getSongLinks());
});

app.put("/api/song-links/:sectionId/:cardId", requireTemporaryContentWriteAccess, requireObjectBody, requireNumericParams("sectionId", "cardId"), (req, res) => {
  const updated = database.updateSongLink(Number(req.params.sectionId), Number(req.params.cardId), req.body);
  if (!updated) return res.status(404).json({ error: "Song link not found" });
  res.json(database.getSongLinks());
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
