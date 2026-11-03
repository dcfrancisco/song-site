const assert = require('node:assert/strict');
const test = require('node:test');
const { createDevelopmentSession, verifyDevelopmentSession } = require('./auth/development');
const { createAuthConfig } = require('./auth/config');

test('development session signatures are bound to server state and expire', () => {
  const sessions = new Map();
  const session = createDevelopmentSession('author', 'a'.repeat(32), 1000);
  sessions.set(session.sessionId, session);
  assert.ok(verifyDevelopmentSession(session.cookieValue, 'a'.repeat(32), sessions, 1000));
  assert.equal(verifyDevelopmentSession(`${session.cookieValue}x`, 'a'.repeat(32), sessions, 1000), null);
  assert.equal(verifyDevelopmentSession(session.cookieValue, 'a'.repeat(32), sessions, (session.expiresAt + 1) * 1000), null);
});

test('local password authentication is production-capable but demands a secret, https origins and secure cookies', () => {
  const base = { AUTH_MODE: 'local', NODE_ENV: 'production', SESSION_SECRET: 'a'.repeat(32), ALLOWED_ORIGINS: 'https://site.example.com' };
  const config = createAuthConfig(base);
  assert.equal(config.isSessionAuth, true);
  assert.equal(config.isDevelopmentAuth, false);
  assert.equal(config.sessionProvider, 'local');
  assert.equal(config.secureCookies, true);
  assert.deepEqual(config.allowedOrigins, ['https://site.example.com']);
  assert.throws(() => createAuthConfig({ ...base, SESSION_SECRET: 'short' }), /32 characters/);
  assert.throws(() => createAuthConfig({ ...base, ALLOWED_ORIGINS: '' }), /ALLOWED_ORIGINS/);
  assert.throws(() => createAuthConfig({ ...base, ALLOWED_ORIGINS: 'http://site.example.com' }), /https/);
  assert.throws(() => createAuthConfig({ ...base, DEV_DEFAULT_FIXTURE: 'administrator' }), /requires AUTH_MODE=development/);
});

test('development authentication rejects production and non-loopback deployment settings', () => {
  assert.throws(() => createAuthConfig({ AUTH_MODE: 'development', NODE_ENV: 'production', DEV_SESSION_SECRET: 'a'.repeat(32) }), /forbidden/);
  assert.throws(() => createAuthConfig({ AUTH_MODE: 'development', NODE_ENV: 'development', HOST: '0.0.0.0', DEV_SESSION_SECRET: 'a'.repeat(32) }), /loopback/);
  assert.throws(() => createAuthConfig({ AUTH_MODE: 'development', NODE_ENV: 'development', DEV_SESSION_SECRET: 'short' }), /32 characters/);
  assert.doesNotThrow(() => createAuthConfig({ AUTH_MODE: 'development', NODE_ENV: 'development', HOST: '0.0.0.0', DEV_AUTH_BIND_HOST: '0.0.0.0', DEV_AUTH_CONTAINER_OVERRIDE: 'true', DEV_SESSION_SECRET: 'a'.repeat(32) }));
});

test('default development identity requires a valid development-only fixture', () => {
  const config = createAuthConfig({
    AUTH_MODE: 'development',
    NODE_ENV: 'development',
    HOST: '127.0.0.1',
    DEV_SESSION_SECRET: 'a'.repeat(32),
    DEV_DEFAULT_FIXTURE: 'administrator',
  });
  assert.equal(config.defaultDevelopmentFixture, 'administrator');
  const emailConfig = createAuthConfig({
    AUTH_MODE: 'development',
    NODE_ENV: 'development',
    HOST: '127.0.0.1',
    DEV_SESSION_SECRET: 'a'.repeat(32),
    DEV_DEFAULT_FIXTURE: 'administrator',
    DEV_DEFAULT_EMAIL: 'admin@example.test',
  });
  assert.equal(emailConfig.defaultDevelopmentEmail, 'admin@example.test');
  assert.throws(() => createAuthConfig({ AUTH_MODE: 'guest', DEV_DEFAULT_FIXTURE: 'administrator' }), /requires AUTH_MODE=development/);
  assert.throws(() => createAuthConfig({
    AUTH_MODE: 'development',
    NODE_ENV: 'development',
    DEV_SESSION_SECRET: 'a'.repeat(32),
    DEV_DEFAULT_FIXTURE: 'admin',
  }), /configured development identity fixture/);
  assert.throws(() => createAuthConfig({
    AUTH_MODE: 'development',
    NODE_ENV: 'development',
    DEV_SESSION_SECRET: 'a'.repeat(32),
    DEV_DEFAULT_FIXTURE: 'administrator',
    DEV_DEFAULT_EMAIL: 'not-an-email',
  }), /valid email address/);
});
