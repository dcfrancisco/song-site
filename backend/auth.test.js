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

test('development authentication rejects production and non-loopback deployment settings', () => {
  assert.throws(() => createAuthConfig({ AUTH_MODE: 'development', NODE_ENV: 'production', DEV_SESSION_SECRET: 'a'.repeat(32) }), /forbidden/);
  assert.throws(() => createAuthConfig({ AUTH_MODE: 'development', NODE_ENV: 'development', HOST: '0.0.0.0', DEV_SESSION_SECRET: 'a'.repeat(32) }), /loopback/);
  assert.throws(() => createAuthConfig({ AUTH_MODE: 'development', NODE_ENV: 'development', DEV_SESSION_SECRET: 'short' }), /32 characters/);
  assert.doesNotThrow(() => createAuthConfig({ AUTH_MODE: 'development', NODE_ENV: 'development', HOST: '0.0.0.0', DEV_AUTH_BIND_HOST: '0.0.0.0', DEV_AUTH_CONTAINER_OVERRIDE: 'true', DEV_SESSION_SECRET: 'a'.repeat(32) }));
});
