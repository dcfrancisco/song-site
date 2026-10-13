const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const config = require("./config");
const { checkPostgresConnection } = require("./postgres");
const { clearCookie, createAuthService, serializeCookie } = require("./auth/middleware");
const { COOKIE_NAME } = require("./auth/development");
const database = config.databaseDriver === "postgres"
  ? require("./postgres-database")
  : require("./database");
const app = express();
const PORT = Number(process.env.PORT || 5001);
const auth = createAuthService(config.auth, database);
const { ContentConflictError, ContentValidationError } = require('./content/errors');

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || config.auth.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed"));
  },
}));
app.use(express.json({ limit: "256kb" }));
app.use(auth.attachPrincipal);

app.get("/health/live", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/health/ready", async (_req, res) => {
  try {
    if (config.databaseDriver === "postgres") {
      await checkPostgresConnection();
    }
    res.status(200).json({ status: "ready", database: config.databaseDriver });
  } catch (error) {
    res.status(503).json({ status: "not_ready", database: config.databaseDriver, error: error.message });
  }
});

function requireObjectBody(req, res, next) {
  if (!req.body || Array.isArray(req.body) || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body must be a JSON object" });
  }
  next();
}

function requireMutation(permission) {
  return [auth.requirePermission(permission), auth.requireCsrf];
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

app.get("/api/v1/session", (req, res) => {
  res.json(auth.sessionSummary(req));
});

app.post("/api/v1/dev/session", requireObjectBody, async (req, res, next) => {
  if (!config.auth.isDevelopmentAuth || !auth.isLoopbackRequest(req)) {
    return res.status(404).json({ error: "Development authentication is unavailable" });
  }
  const session = await auth.createSession(req.body.fixture);
  if (!session) return res.status(400).json({ error: "Unknown development identity fixture" });
  res.set("Set-Cookie", serializeCookie(COOKIE_NAME, session.cookieValue, 1800));
  res.json({
    ...auth.sessionSummary({ principal: session.principal }),
    csrfToken: session.csrfToken,
  });
});

app.get('/api/v1/rbac/users', auth.requirePermission('rbac:users:read'), async (req, res, next) => {
  try { res.json(await database.listRbacUsers()); } catch (error) { next(error); }
});

app.put('/api/v1/rbac/users/:userId/roles', ...requireMutation('rbac:users:manage'), requireObjectBody, async (req, res, next) => {
  try {
    if (!Array.isArray(req.body.roles) || req.body.roles.some(role => typeof role !== 'string' || role.length > 64)) return res.status(400).json({ error: 'roles must be an array of role names' });
    if (req.params.userId === req.principal.userId) return res.status(403).json({ error: 'An administrator cannot change their own roles' });
    const updated = await database.assignRbacRoles(req.params.userId, req.body.roles, req.principal);
    if (updated === undefined) return res.status(404).json({ error: 'User not found' });
    if (updated === null) return res.status(400).json({ error: 'One or more roles are invalid' });
    res.json(updated);
  } catch (error) { next(error); }
});

app.delete("/api/v1/dev/session", (req, res) => {
  if (!config.auth.isDevelopmentAuth || !auth.isLoopbackRequest(req)) {
    return res.status(404).json({ error: "Development authentication is unavailable" });
  }
  auth.revokeSession(req);
  res.set("Set-Cookie", clearCookie(COOKIE_NAME));
  res.status(204).end();
});

function requireAnnouncementPage(req, res, next) {
  if (req.params.pageKey !== 'announcement-page') return res.status(404).json({ error: 'Unknown authoring page' });
  next();
}

app.get('/api/v1/content/pages/:pageKey', requireAnnouncementPage, async (req, res, next) => {
  try {
    const content = await database.getPublishedContent(req.params.pageKey);
    if (!content) return res.status(404).json({ error: 'Published content not found' });
    res.json(content);
  } catch (error) { next(error); }
});

app.get('/api/v1/authoring/pages/:pageKey/draft', requireAnnouncementPage, auth.requirePermission('content:announcement-page:edit'), async (req, res, next) => {
  try { res.json(await database.getDraftContent(req.params.pageKey)); } catch (error) { next(error); }
});

app.put('/api/v1/authoring/pages/:pageKey/draft', ...requireMutation('content:announcement-page:edit'), requireObjectBody, requireAnnouncementPage, async (req, res, next) => {
  try { res.status(200).json(await database.saveContentDraft(req.params.pageKey, req.body.payload, req.principal, req.body.expectedVersion)); } catch (error) { next(error); }
});

app.post('/api/v1/authoring/pages/:pageKey/preview', ...requireMutation('content:announcement-page:edit'), requireObjectBody, requireAnnouncementPage, async (req, res, next) => {
  try { res.json(await database.previewContent(req.params.pageKey, req.body.payload)); } catch (error) { next(error); }
});

app.post('/api/v1/authoring/pages/:pageKey/publish', ...requireMutation('content:announcement-page:publish'), requireObjectBody, requireAnnouncementPage, async (req, res, next) => {
  try { res.json(await database.publishContent(req.params.pageKey, req.principal, req.body.expectedVersion)); } catch (error) { next(error); }
});

app.delete('/api/v1/authoring/pages/:pageKey/draft', ...requireMutation('content:announcement-page:edit'), requireAnnouncementPage, async (req, res, next) => {
  try { res.json(await database.discardContentDraft(req.params.pageKey, req.principal, req.query.expectedVersion)); } catch (error) { next(error); }
});

app.get('/api/v1/authoring/pages/:pageKey/versions', requireAnnouncementPage, auth.requirePermission('content:history:read'), async (req, res, next) => {
  try { res.json(await database.listContentVersions(req.params.pageKey)); } catch (error) { next(error); }
});

app.post('/api/v1/authoring/pages/:pageKey/versions/:versionId/restore', ...requireMutation('content:restore'), requireObjectBody, requireAnnouncementPage, requireNumericParams('versionId'), async (req, res, next) => {
  try { res.json(await database.restoreContentVersion(req.params.pageKey, Number(req.params.versionId), req.principal, req.body.expectedVersion)); } catch (error) { next(error); }
});

app.get("/api/tasks", async (req, res, next) => {
  try { res.json(await database.getTasks("tasks")); } catch (error) { next(error); }
});

app.post("/api/tasks", ...requireMutation("journey:manage"), requireObjectBody, async (req, res, next) => {
  try { res.status(201).json(await database.createTask("tasks", req.body)); } catch (error) { next(error); }
});

app.put("/api/tasks/:id", ...requireMutation("journey:manage"), requireObjectBody, requireNumericParams("id"), async (req, res, next) => {
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

app.put("/api/journey/items/:id", ...requireMutation("journey:manage"), requireObjectBody, requireNumericParams("id"), async (req, res, next) => {
  try {
  const item = await database.updateJourneyItem(Number(req.params.id), req.body);
  if (!item) return res.status(404).json({ error: "Journey item not found" });
  res.json(item);
  } catch (error) { next(error); }
});

app.put("/api/tasks/:id/status", ...requireMutation("journey:manage"), requireObjectBody, requireStatusAction, requireNumericParams("id"), async (req, res, next) => {
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

app.post("/api/training-tasks", ...requireMutation("journey:manage"), requireObjectBody, async (req, res, next) => {
  try { res.status(201).json(await database.createTask("training_tasks", req.body)); } catch (error) { next(error); }
});

app.put("/api/training-tasks/:id", ...requireMutation("journey:manage"), requireObjectBody, requireNumericParams("id"), async (req, res, next) => {
  try {
  const task = await database.updateTask("training_tasks", Number(req.params.id), req.body);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
  } catch (error) { next(error); }
});

app.get("/api/training-progress-status", async (req, res, next) => {
  try { res.json({ progress: await database.getProgress("training_tasks") }); } catch (error) { next(error); }
});

app.put("/api/training-tasks/:id/status", ...requireMutation("journey:manage"), requireObjectBody, requireStatusAction, requireNumericParams("id"), async (req, res, next) => {
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

app.put("/api/leadership/:section/:id", ...requireMutation("leadership:edit"), requireObjectBody, requireNumericParams("id"), async (req, res, next) => {
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

app.put("/api/home/spotlight", ...requireMutation("content:home:edit"), requireObjectBody, async (req, res, next) => {
  try { res.json(await database.updateHomeSpotlight(req.body)); } catch (error) { next(error); }
});

app.get("/api/home/announcements", async (req, res, next) => {
  try { res.json(await database.getAnnouncements()); } catch (error) { next(error); }
});

app.put("/api/home/announcements/:id", ...requireMutation("content:home:edit"), requireObjectBody, requireNumericParams("id"), async (req, res, next) => {
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

app.put("/api/song-links/:sectionId/:cardId", ...requireMutation("content:song-links:edit"), requireObjectBody, requireNumericParams("sectionId", "cardId"), async (req, res, next) => {
  try {
  const updated = await database.updateSongLink(Number(req.params.sectionId), Number(req.params.cardId), req.body);
  if (!updated) return res.status(404).json({ error: "Song link not found" });
  res.json(await database.getSongLinks());
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  if (error.message === "Origin is not allowed") return res.status(403).json({ error: "Origin is not allowed" });
  if (error instanceof ContentConflictError) return res.status(409).json({ error: error.message, currentVersion: error.currentVersion });
  if (error instanceof ContentValidationError) return res.status(422).json({ error: error.message, errors: error.errors });
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

if (require.main === module) {
  app.listen(PORT, config.auth.host, () => {
    console.log(`Server running at http://${config.auth.host}:${PORT}`);

    if (config.databaseDriver === "postgres") {
      const source = config.databaseUrl ? "DATABASE_URL" : "PG* variables";
      console.log(`Database configured: PostgreSQL ${config.postgres.host}:${config.postgres.port}/${config.postgres.database} ssl=${config.postgres.ssl} source=${source}`);
      checkPostgresConnection()
        .then(() => console.log("Database connection: PostgreSQL ready"))
        .catch((error) => console.error(`Database connection: PostgreSQL unavailable (${error.message})`));
    } else {
      console.log(`Database configured: SQLite ${config.databasePath}`);
    }
  });
}

module.exports = { app, database };
