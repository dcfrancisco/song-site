const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'song-site-backend-'));
process.env.DATABASE_PATH = path.join(testDirectory, 'song-site.sqlite');

const database = require('./database');

test('loads the existing leadership sections from the migration-backed store', () => {
  const leadership = database.getLeadership();

  assert.ok(leadership.marketLeads.length > 0);
  assert.ok(leadership.practiceLeads.length > 0);
  assert.equal(leadership.orgChart, undefined);
});

test.after(() => {
  database.close();
  fs.rmSync(testDirectory, { recursive: true, force: true });
});
