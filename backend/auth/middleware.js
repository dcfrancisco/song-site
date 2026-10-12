const {
  COOKIE_NAME,
  createDevelopmentSession,
  getFixtureNames,
  getPublicFixture,
  parseCookieHeader,
  verifyDevelopmentSession,
} = require('./development');

function createAuthService(authConfig) {
  const sessions = new Map();

  function getSessionFromRequest(req) {
    if (!authConfig.isDevelopmentAuth) return null;
    const cookies = parseCookieHeader(req.get('cookie'));
    return verifyDevelopmentSession(cookies[COOKIE_NAME], authConfig.sessionSecret, sessions);
  }

  function attachPrincipal(req, _res, next) {
    const session = getSessionFromRequest(req);
    req.authSession = session;
    req.principal = session?.principal || null;
    next();
  }

  function isAllowedOrigin(req) {
    const origin = req.get('origin');
    return !origin || authConfig.allowedOrigins.includes(origin);
  }

  function isLoopbackRequest(req) {
    const address = String(req.socket?.remoteAddress || '').replace(/^::ffff:/, '');
    return authConfig.isLoopbackHost(address) || address === '::1' || authConfig.allowContainerDevelopmentAuth;
  }

  function requireCsrf(req, res, next) {
    if (authConfig.isDevelopmentAuth && req.principal?.provider === 'development') {
      if (!isAllowedOrigin(req) || req.get('x-csrf-token') !== req.authSession.csrfToken) {
        return res.status(403).json({ error: 'CSRF validation failed' });
      }
    }
    next();
  }

  function requirePermission(permission) {
    return (req, res, next) => {
      if (!req.principal) return res.status(401).json({ error: 'Authentication is required' });
      if (!req.principal.isActive || !req.principal.permissions.includes(permission)) {
        return res.status(403).json({ error: 'The authenticated identity lacks the required permission' });
      }
      next();
    };
  }

  function createSession(fixtureName) {
    const session = createDevelopmentSession(fixtureName, authConfig.sessionSecret);
    if (!session) return null;
    sessions.set(session.sessionId, session);
    return session;
  }

  function revokeSession(req) {
    if (req.authSession) sessions.delete(req.authSession.sessionId);
  }

  function sessionSummary(req) {
    return {
      mode: authConfig.authMode,
      authenticated: Boolean(req.principal),
      identity: req.principal
        ? {
            provider: req.principal.provider,
            subject: req.principal.subject,
            displayName: req.principal.displayName,
            email: req.principal.email,
            role: req.principal.role,
            permissions: [...req.principal.permissions],
          }
        : null,
      ...(req.authSession?.csrfToken ? { csrfToken: req.authSession.csrfToken } : {}),
      developmentFixtures: authConfig.isDevelopmentAuth
        ? getFixtureNames().map(getPublicFixture)
        : [],
    };
  }

  return {
    attachPrincipal,
    createSession,
    getSessionFromRequest,
    isLoopbackRequest,
    requireCsrf,
    requirePermission,
    revokeSession,
    sessionSummary,
    sessions,
  };
}

function serializeCookie(name, value, maxAge) {
  return `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict`;
}

function clearCookie(name) {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict`;
}

module.exports = { clearCookie, createAuthService, serializeCookie };
