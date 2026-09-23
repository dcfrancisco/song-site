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

test('supports org-chart node CRUD in the existing leadership storage boundary', () => {
  const created = database.createLeadershipOrgChartNode({
    name: 'Chief Executive Officer',
    role: 'Executive Leadership',
    parentId: null,
    sortOrder: 0,
  });

  assert.equal(created.id, 1);
  assert.deepEqual(database.getLeadershipOrgChart(), [created]);

  const updated = database.updateLeadershipOrgChartNode(created.id, {
    name: 'Chief Technology Officer',
    role: 'Technology Leadership',
    parentId: null,
    sortOrder: 0,
  });
  assert.deepEqual(updated, {
    id: created.id,
    name: 'Chief Technology Officer',
    role: 'Technology Leadership',
    parentId: null,
    sortOrder: 0,
  });
  assert.equal(database.getLeadershipOrgChart()[0].name, 'Chief Technology Officer');

  assert.equal(database.deleteLeadershipOrgChartNode(created.id), true);
  assert.deepEqual(database.getLeadershipOrgChart(), []);
  assert.equal(database.deleteLeadershipOrgChartNode(created.id), false);
});

test.after(() => {
  database.close();
  fs.rmSync(testDirectory, { recursive: true, force: true });
});
