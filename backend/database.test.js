const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'song-site-backend-'));
process.env.DATABASE_PATH = path.join(testDirectory, 'song-site.sqlite');
process.env.AUTH_MODE = 'local';
process.env.NODE_ENV = 'development';
process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters';
process.env.ALLOWED_ORIGINS = 'http://localhost:4200';
process.env.DEFAULT_ADMIN_PASSWORD = 'Test-Only-Song-Password-2026!';

const database = require('./database');
const { verifyPassword } = require('./auth/password');

test('loads the existing leadership sections from the migration-backed store', () => {
  const leadership = database.getLeadership();

  assert.ok(leadership.marketLeads.length > 0);
  assert.ok(leadership.practiceLeads.length > 0);
  assert.equal(leadership.orgChart, undefined);
});

test('local password mode seeds the administrator credential for a fresh SQLite database', () => {
  const credential = database.getLoginCredentialByEmail('dcfran@gmail.com');

  assert.ok(credential);
  assert.equal(verifyPassword(process.env.DEFAULT_ADMIN_PASSWORD, credential.passwordHash), true);
});

test.after(() => {
  database.close();
  fs.rmSync(testDirectory, { recursive: true, force: true });
});
