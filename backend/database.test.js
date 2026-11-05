const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { hashPassword, verifyPassword } = require('./auth/password');

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'song-site-backend-'));
process.env.DATABASE_PATH = path.join(testDirectory, 'song-site.sqlite');

const database = require('./database');

test('loads the existing leadership sections from the migration-backed store', () => {
  const leadership = database.getLeadership();

  assert.ok(leadership.marketLeads.length > 0);
  assert.ok(leadership.practiceLeads.length > 0);
  assert.equal(leadership.orgChart, undefined);
});

test('SQLite initializes the configured administrator password only when it is unset', () => {
  const email = 'dcfran@gmail.com';
  const initialPassword = 'Test-Only-Song-Password-2026!';
  const credentialBeforeBootstrap = database.getLoginCredentialByEmail(email);
  assert.ok(credentialBeforeBootstrap);
  assert.equal(credentialBeforeBootstrap.passwordHash, null);

  assert.equal(database.setInitialAdministratorPassword(email, hashPassword(initialPassword)), true);
  const credential = database.getLoginCredentialByEmail(email);
  assert.ok(credential);
  assert.equal(verifyPassword(initialPassword, credential.passwordHash), true);
  assert.equal(database.setInitialAdministratorPassword(email, hashPassword('Another-Test-Password-2026!')), false);
  assert.equal(verifyPassword(initialPassword, database.getLoginCredentialByEmail(email).passwordHash), true);
});

test.after(() => {
  database.close();
  fs.rmSync(testDirectory, { recursive: true, force: true });
});
