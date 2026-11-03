const net = require('node:net');
const { getFixtureNames } = require('./development');

function isLoopbackHost(host) {
  return host === '127.0.0.1' || host === '::1' || host === 'localhost';
}

function parseAllowedOrigins(value) {
  return String(value || 'http://localhost:4200,http://127.0.0.1:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createAuthConfig(environment = process.env) {
  const nodeEnv = String(environment.NODE_ENV || 'development').toLowerCase();
  const authMode = String(environment.AUTH_MODE || (nodeEnv === 'production' ? 'guest' : 'guest')).toLowerCase();
  const host = environment.HOST || (nodeEnv === 'development' ? '127.0.0.1' : '0.0.0.0');
  const sessionSecret = environment.SESSION_SECRET || environment.DEV_SESSION_SECRET || '';
  const defaultDevelopmentFixture = String(environment.DEV_DEFAULT_FIXTURE || '').trim();
  const defaultDevelopmentEmail = String(environment.DEV_DEFAULT_EMAIL || '').trim().toLowerCase();
  const backendPort = Number(environment.PORT || 5001);
  const configuredOrigins = parseAllowedOrigins(environment.DEV_ALLOWED_ORIGINS);
  const deploymentMarker = environment.DEPLOYMENT_ENV || environment.WEBSITE_HOSTNAME || environment.CONTAINER_APP_NAME || '';
  const isDevelopmentAuth = authMode === 'development';
  const isLocalAuth = authMode === 'local';
  const isSessionAuth = isDevelopmentAuth || isLocalAuth;
  const allowContainerDevelopmentAuth = String(environment.DEV_AUTH_CONTAINER_OVERRIDE || '').toLowerCase() === 'true';
  const allowedOrigins = isDevelopmentAuth
    ? [...new Set([...configuredOrigins, `http://localhost:${backendPort}`, `http://127.0.0.1:${backendPort}`])]
    : isLocalAuth ? (environment.ALLOWED_ORIGINS || environment.DEV_ALLOWED_ORIGINS ? parseAllowedOrigins(environment.ALLOWED_ORIGINS || environment.DEV_ALLOWED_ORIGINS) : []) : configuredOrigins;

  if (!['guest', 'development', 'local', 'entra'].includes(authMode)) {
    throw new Error('AUTH_MODE must be guest, development, local, or entra');
  }

  if (isLocalAuth) {
    if (sessionSecret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
    if (!allowedOrigins.length) throw new Error('AUTH_MODE=local requires ALLOWED_ORIGINS to list the browser origin(s) of the site');
    if (nodeEnv === 'production' && allowedOrigins.some((origin) => !/^https:\/\//.test(origin) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
      throw new Error('AUTH_MODE=local requires https origins in production');
    }
  }

  if (isDevelopmentAuth) {
    if (nodeEnv === 'production') throw new Error('Development authentication is forbidden when NODE_ENV=production');
    if (deploymentMarker) throw new Error('Development authentication is forbidden in deployed environments');
    if ((!isLoopbackHost(host) || !isLoopbackHost(environment.DEV_AUTH_BIND_HOST || host)) && !(allowContainerDevelopmentAuth && ['development', 'test'].includes(nodeEnv))) {
      throw new Error('Development authentication must bind to a loopback host');
    }
    if (sessionSecret.length < 32) throw new Error('DEV_SESSION_SECRET must contain at least 32 characters');
    if (allowedOrigins.some((origin) => !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
      throw new Error('Development authentication allows only loopback browser origins');
    }
  }

  if (defaultDevelopmentFixture && !isDevelopmentAuth) {
    throw new Error('DEV_DEFAULT_FIXTURE requires AUTH_MODE=development');
  }
  if (defaultDevelopmentFixture && !getFixtureNames().includes(defaultDevelopmentFixture)) {
    throw new Error('DEV_DEFAULT_FIXTURE must name a configured development identity fixture');
  }
  if (defaultDevelopmentEmail && (!defaultDevelopmentFixture || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(defaultDevelopmentEmail))) {
    throw new Error('DEV_DEFAULT_EMAIL requires a default development fixture and a valid email address');
  }

  if (authMode === 'entra' && nodeEnv !== 'test') {
    throw new Error('AUTH_MODE=entra requires the tenant-specific Entra verifier implementation before startup');
  }

  return {
    authMode,
    host,
    isDevelopmentAuth,
    isLocalAuth,
    isSessionAuth,
    sessionProvider: isLocalAuth ? 'local' : 'development',
    secureCookies: nodeEnv === 'production',
    defaultDevelopmentFixture,
    defaultDevelopmentEmail,
    sessionSecret,
    allowedOrigins,
    deploymentMarker: Boolean(deploymentMarker),
    allowContainerDevelopmentAuth,
    isLoopbackHost,
    isIpAddress: net.isIP,
  };
}

module.exports = { createAuthConfig, isLoopbackHost, parseAllowedOrigins };
