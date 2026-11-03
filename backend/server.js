const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const config = require("./config");
const { checkPostgresConnection } = require("./postgres");
const { createAuthService, serializeCookie } = require("./auth/middleware");
const { COOKIE_NAME, SIGNED_OUT_SESSION_COOKIE_VALUE, parseCookieHeader } = require("./auth/development");
const { hashPassword, validatePasswordStrength, verifyPassword } = require("./auth/password");
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
app.use('/api', (req, res, next) => {
  if (req.path === '/v1/session' || req.path === '/v1/dev/session' || req.path === '/v1/auth/login') return next();
  return auth.requireAuthenticated(req, res, next);
});

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
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    swaggerOptions: {
      requestInterceptor: function requestInterceptor(request) {
        request.credentials = "include";
        return request;
      },
    },
  }));
}

app.get("/api/v1/session", async (req, res, next) => {
  const sessionCookieValue = parseCookieHeader(req.get("cookie"))[COOKIE_NAME];
  if (!req.principal && sessionCookieValue !== SIGNED_OUT_SESSION_COOKIE_VALUE && config.auth.defaultDevelopmentFixture) {
    try {
      const session = await auth.createDefaultSession(req);
      if (!session) return res.status(503).json({ error: "The configured local development identity is unavailable" });
      req.authSession = session;
      req.principal = session.principal;
      res.set("Set-Cookie", serializeCookie(COOKIE_NAME, session.cookieValue, 1800));
    } catch (error) {
      return next(error);
    }
  }
  res.json(auth.sessionSummary(req));
});

app.get('/api/v1/dashboard/summary', async (req, res, next) => {
  try { res.json(await database.getDashboardSummary(req.principal || null)); } catch (error) { next(error); }
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const loginFailures = new Map();

function loginKey(req, email) {
  return `${req.socket?.remoteAddress || ''}|${email}`;
}

function isLoginLocked(key) {
  const entry = loginFailures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.last > LOGIN_LOCK_MS) { loginFailures.delete(key); return false; }
  return entry.count >= LOGIN_MAX_FAILURES;
}

function recordLoginFailure(key) {
  const entry = loginFailures.get(key) || { count: 0, last: 0 };
  loginFailures.set(key, { count: entry.count + 1, last: Date.now() });
}

app.post("/api/v1/auth/login", requireObjectBody, async (req, res, next) => {
  try {
    if (!config.auth.isDevelopmentAuth || typeof database.getLoginCredentialByEmail !== 'function') {
      return res.status(404).json({ error: "Password sign-in is unavailable" });
    }
    const origin = req.get('origin');
    if (origin && !config.auth.allowedOrigins.includes(origin)) return res.status(403).json({ error: "Origin is not allowed" });
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = req.body.password;
    if (!EMAIL_PATTERN.test(email) || email.length > 255 || typeof password !== 'string') {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const key = loginKey(req, email);
    if (isLoginLocked(key)) return res.status(429).json({ error: "Too many failed attempts. Try again later." });
    const credential = await database.getLoginCredentialByEmail(email);
    const valid = verifyPassword(password, credential?.passwordHash);
    const session = valid && credential.isActive ? await auth.createUserSessionById(credential.id) : null;
    if (!session) {
      recordLoginFailure(key);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    loginFailures.delete(key);
    auth.revokeSession(req);
    res.set("Set-Cookie", serializeCookie(COOKIE_NAME, session.cookieValue, 1800));
    res.json({ ...auth.sessionSummary({ principal: session.principal }), csrfToken: session.csrfToken });
  } catch (error) { next(error); }
});

app.post('/api/v1/auth/change-password', auth.requireCsrf, requireObjectBody, async (req, res, next) => {
  try {
    if (!req.principal || typeof database.getLoginCredentialByEmail !== 'function') return res.status(404).json({ error: 'Password change is unavailable' });
    const { currentPassword, newPassword } = req.body;
    const problem = validatePasswordStrength(newPassword);
    if (problem || typeof currentPassword !== 'string') return res.status(400).json({ error: problem || 'Current password is required' });
    if (newPassword === currentPassword) return res.status(400).json({ error: 'New password must differ from the current password' });
    const credential = await database.getLoginCredentialByEmail(req.principal.email);
    if (!credential || credential.id !== req.principal.userId || !verifyPassword(currentPassword, credential.passwordHash)) {
      return res.status(403).json({ error: 'Current password is incorrect' });
    }
    await database.setUserPasswordHash(credential.id, hashPassword(newPassword), req.principal);
    res.status(204).end();
  } catch (error) { next(error); }
});

app.post('/api/v1/rbac/users', ...requireMutation('rbac:users:manage'), requireObjectBody, async (req, res, next) => {
  try {
    if (typeof database.createLocalUser !== 'function') return res.status(501).json({ error: 'User creation is not supported by this database driver' });
    const { displayName, email, password, roles = [] } = req.body;
    if (typeof displayName !== 'string' || displayName.trim().length < 1 || displayName.length > 255) return res.status(400).json({ error: 'displayName must be a non-empty string of 255 characters or fewer' });
    if (typeof email !== 'string' || email.length > 255 || !EMAIL_PATTERN.test(email.trim())) return res.status(400).json({ error: 'email must be a valid email value' });
    const passwordProblem = validatePasswordStrength(password);
    if (passwordProblem) return res.status(400).json({ error: passwordProblem });
    if (!Array.isArray(roles) || roles.length > 10 || roles.some(role => typeof role !== 'string' || role.length > 64)) return res.status(400).json({ error: 'roles must be an array of role names' });
    const created = await database.createLocalUser({ email: email.trim().toLowerCase(), displayName: displayName.trim(), passwordHash: hashPassword(password), roles: [...new Set(roles)] }, req.principal);
    if (created === null) return res.status(400).json({ error: 'One or more roles are invalid' });
    res.status(201).json(created);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === 'SQLITE_CONSTRAINT' || error.errcode === 2067 || error.code === '23505') return res.status(409).json({ error: 'Email is already in use' });
    next(error);
  }
});

app.get('/api/v1/rbac/users', auth.requirePermission('rbac:users:read'), async (req, res, next) => {
  try { res.json(await database.listRbacUsers()); } catch (error) { next(error); }
});

app.put('/api/v1/users/:userId', ...requireMutation('rbac:users:manage'), requireObjectBody, async (req, res, next) => {
  try {
    const { displayName, email, isActive } = req.body;
    if (displayName !== undefined && (typeof displayName !== 'string' || displayName.trim().length < 1 || displayName.length > 255)) return res.status(400).json({ error: 'displayName must be a non-empty string of 255 characters or fewer' });
    if (email !== undefined && (typeof email !== 'string' || email.trim().length < 3 || email.length > 255 || !email.includes('@'))) return res.status(400).json({ error: 'email must be a valid email value' });
    if (isActive !== undefined && typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive must be boolean' });
    if (req.params.userId === req.principal.userId && isActive === false) return res.status(403).json({ error: 'An administrator cannot deactivate their own account' });
    const updated = await database.updateUserProfile(req.params.userId, { displayName: displayName?.trim(), email: email?.trim(), isActive }, req.principal);
    if (updated === undefined) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === 'SQLITE_CONSTRAINT' || error.errcode === 2067 || error.code === '23505') return res.status(409).json({ error: 'Email is already in use' });
    next(error);
  }
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
  res.set("Set-Cookie", serializeCookie(COOKIE_NAME, SIGNED_OUT_SESSION_COOKIE_VALUE, 86400));
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
