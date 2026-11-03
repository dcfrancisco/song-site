const {
  COOKIE_NAME,
  createDevelopmentSession,
  createUserSession,
  parseCookieHeader,
  verifyDevelopmentSession,
} = require('./development');

function createAuthService(authConfig, identityStore) {
  const sessions = new Map();

  async function getSessionFromRequest(req) {
    if (!authConfig.isSessionAuth) return null;
    const cookies = parseCookieHeader(req.get('cookie'));
    const session = verifyDevelopmentSession(cookies[COOKIE_NAME], authConfig.sessionSecret, sessions);
    if (!session || !identityStore?.getPrincipalBySubject) return session;
    const principal = await identityStore.getPrincipalBySubject(session.principal.subject, authConfig.sessionProvider);
    if (!principal) return null;
    session.principal = principal;
    return applyDefaultDevelopmentEmail(session);
  }

  async function attachPrincipal(req, _res, next) {
    const session = await getSessionFromRequest(req);
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
    if (authConfig.isSessionAuth && req.principal?.provider === authConfig.sessionProvider) {
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

  function requireAuthenticated(req, res, next) {
    if (!req.principal) return res.status(401).json({ error: 'Authentication is required' });
    if (!req.principal.isActive) return res.status(403).json({ error: 'The authenticated identity is inactive' });
    next();
  }

  function applyDefaultDevelopmentEmail(session) {
    if (session && session.fixtureName === authConfig.defaultDevelopmentFixture && authConfig.defaultDevelopmentEmail) {
      session.principal = { ...session.principal, email: authConfig.defaultDevelopmentEmail };
    }
    return session;
  }

  async function createSession(fixtureName) {
    const session = createDevelopmentSession(fixtureName, authConfig.sessionSecret);
    if (!session) return null;
    if (identityStore?.getPrincipalBySubject) {
      session.principal = await identityStore.getPrincipalBySubject(session.principal.subject, authConfig.sessionProvider);
      if (!session.principal || !session.principal.isActive) return null;
    }
    applyDefaultDevelopmentEmail(session);
    sessions.set(session.sessionId, session);
    return session;
  }

  async function createUserSessionById(userId) {
    const session = createUserSession(userId, authConfig.sessionSecret);
    session.principal = await identityStore.getPrincipalBySubject(userId, authConfig.sessionProvider);
    if (!session.principal || !session.principal.isActive) return null;
    sessions.set(session.sessionId, session);
    return session;
  }

  async function createDefaultSession(req) {
    if (!authConfig.isDevelopmentAuth || !authConfig.defaultDevelopmentFixture || !isLoopbackRequest(req)) return null;
    return createSession(authConfig.defaultDevelopmentFixture);
  }

  function revokeSession(req) {
    if (req.authSession) sessions.delete(req.authSession.sessionId);
  }

  function sessionSummary(req) {
    return {
      mode: authConfig.authMode,
      authenticated: Boolean(req.principal),
      ...(req.principal?.mustChangePassword ? { mustChangePassword: true } : {}),
      identity: req.principal
        ? {
            provider: req.principal.provider,
            subject: req.principal.subject,
            displayName: req.principal.displayName,
            email: req.principal.email,
            role: req.principal.role,
            roles: [...(req.principal.roles || [])],
            permissions: [...req.principal.permissions],
          }
        : null,
      ...(req.authSession?.csrfToken ? { csrfToken: req.authSession.csrfToken } : {}),
    };
  }

  return {
    attachPrincipal,
    createSession,
    createUserSessionById,
    createDefaultSession,
    getSessionFromRequest,
    isLoopbackRequest,
    requireCsrf,
    requireAuthenticated,
    requirePermission,
    revokeSession,
    sessionSummary,
    sessions,
  };
}

function serializeCookie(name, value, maxAge, secure = false) {
  return `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;
}

function clearCookie(name) {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict`;
}

module.exports = { clearCookie, createAuthService, serializeCookie };
