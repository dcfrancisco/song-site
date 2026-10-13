const net = require('node:net');

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
  const sessionSecret = environment.DEV_SESSION_SECRET || '';
  const backendPort = Number(environment.PORT || 5001);
  const configuredOrigins = parseAllowedOrigins(environment.DEV_ALLOWED_ORIGINS);
  const deploymentMarker = environment.DEPLOYMENT_ENV || environment.WEBSITE_HOSTNAME || environment.CONTAINER_APP_NAME || '';
  const isDevelopmentAuth = authMode === 'development';
  const allowContainerDevelopmentAuth = String(environment.DEV_AUTH_CONTAINER_OVERRIDE || '').toLowerCase() === 'true';
  const allowedOrigins = isDevelopmentAuth
    ? [...new Set([...configuredOrigins, `http://localhost:${backendPort}`, `http://127.0.0.1:${backendPort}`])]
    : configuredOrigins;

  if (!['guest', 'development', 'entra'].includes(authMode)) {
    throw new Error('AUTH_MODE must be guest, development, or entra');
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

  if (authMode === 'entra' && nodeEnv !== 'test') {
    throw new Error('AUTH_MODE=entra requires the tenant-specific Entra verifier implementation before startup');
  }

  return {
    authMode,
    host,
    isDevelopmentAuth,
    sessionSecret,
    allowedOrigins,
    deploymentMarker: Boolean(deploymentMarker),
    allowContainerDevelopmentAuth,
    isLoopbackHost,
    isIpAddress: net.isIP,
  };
}

module.exports = { createAuthConfig, isLoopbackHost, parseAllowedOrigins };
