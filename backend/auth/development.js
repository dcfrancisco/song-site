const crypto = require('node:crypto');

const COOKIE_NAME = 'song_site_dev_session';
const SESSION_TTL_SECONDS = 30 * 60;

const FIXTURES = Object.freeze({
  developer: Object.freeze({
    subject: 'dev-developer',
    displayName: 'Local Developer',
    email: 'developer@local.song-site',
    role: 'developer',
    permissions: Object.freeze([
      'content:announcement-page:edit',
      'content:history:read',
      'journey:read',
    ]),
  }),
  author: Object.freeze({
    subject: 'dev-author',
    displayName: 'Local Author',
    email: 'author@local.song-site',
    role: 'author',
    permissions: Object.freeze([
      'content:announcement-page:edit',
      'content:history:read',
      'leadership:edit',
    ]),
  }),
  publisher: Object.freeze({
    subject: 'dev-publisher',
    displayName: 'Local Publisher',
    email: 'publisher@local.song-site',
    role: 'publisher',
    permissions: Object.freeze([
      'content:announcement-page:edit',
      'content:announcement-page:publish',
      'content:history:read',
      'content:restore',
      'leadership:edit',
      'leadership:publish',
    ]),
  }),
  administrator: Object.freeze({
    subject: 'dev-administrator',
    displayName: 'Local Administrator',
    email: 'administrator@local.song-site',
    role: 'administrator',
    permissions: Object.freeze([
      'content:announcement-page:edit',
      'content:announcement-page:publish',
      'content:history:read',
      'content:restore',
      'leadership:edit',
      'leadership:publish',
      'journey:manage',
    ]),
  }),
});

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createDevelopmentSession(fixtureName, secret, now = Date.now()) {
  const fixture = FIXTURES[fixtureName];
  if (!fixture) return null;

  const id = crypto.randomBytes(32).toString('base64url');
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const csrfToken = crypto.randomBytes(32).toString('base64url');
  const value = `${id}.${expiresAt}`;
  return {
    fixtureName,
    sessionId: id,
    expiresAt,
    csrfToken,
    cookieValue: `${base64Url(id)}.${expiresAt}.${sign(value, secret)}`,
    principal: {
      provider: 'development',
      issuer: 'local.song-site',
      subject: fixture.subject,
      displayName: fixture.displayName,
      email: fixture.email,
      role: fixture.role,
      permissions: [...fixture.permissions],
      isActive: true,
    },
  };
}

function parseCookieHeader(header) {
  return String(header || '').split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator <= 0) return cookies;
    cookies[part.slice(0, separator).trim()] = part.slice(separator + 1).trim();
    return cookies;
  }, {});
}

function verifyDevelopmentSession(cookieValue, secret, sessions, now = Date.now()) {
  const [encodedId, expiresAtValue, signature] = String(cookieValue || '').split('.');
  if (!encodedId || !expiresAtValue || !signature) return null;

  const sessionId = Buffer.from(encodedId, 'base64url').toString();
  const expiresAt = Number(expiresAtValue);
  const expectedSignature = sign(`${sessionId}.${expiresAt}`, secret);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1000) || !safeEqual(signature, expectedSignature)) {
    return null;
  }

  const session = sessions.get(sessionId);
  if (!session || session.expiresAt !== expiresAt) return null;
  return session;
}

function getFixtureNames() {
  return Object.keys(FIXTURES);
}

function getPublicFixture(fixtureName) {
  const fixture = FIXTURES[fixtureName];
  if (!fixture) return null;
  return {
    name: fixtureName,
    displayName: fixture.displayName,
    role: fixture.role,
    permissions: [...fixture.permissions],
  };
}

module.exports = {
  COOKIE_NAME,
  FIXTURES,
  SESSION_TTL_SECONDS,
  createDevelopmentSession,
  getFixtureNames,
  getPublicFixture,
  parseCookieHeader,
  verifyDevelopmentSession,
};
