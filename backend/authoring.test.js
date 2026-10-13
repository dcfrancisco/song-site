const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'song-site-authoring-'));
process.env.DB_DRIVER = 'sqlite';
process.env.DATABASE_PATH = path.join(testDirectory, 'authoring.sqlite');
const database = require('./database');

const valid = () => ({ schemaVersion: 1, hero: { title: 'Updated', body: 'Updated body' }, carousel: [], trainings: [], notices: [{ id: 'n1', title: 'Notice', body: 'Body', order: 0 }], reminder: { title: 'Reminder', body: 'Remember' } });
const author = { subject: 'dev-author', provider: 'development' };
const publisher = { subject: 'dev-publisher', provider: 'development' };

test('author saves a draft, publisher publishes it, and versions remain immutable', () => {
  const published = database.getPublishedContent('announcement-page');
  assert.equal(published.state, 'published');
  const draft = database.saveContentDraft('announcement-page', valid(), author, published.version);
  assert.equal(draft.state, 'draft');
  assert.throws(() => database.publishContent('announcement-page', publisher, published.version), /changed since/);
  const next = database.publishContent('announcement-page', publisher, draft.version);
  assert.equal(next.state, 'published');
  assert.equal(database.getPublishedContent('announcement-page').payload.hero.title, 'Updated');
  assert.equal(database.listContentVersions('announcement-page').some(version => version.version === next.version && version.state === 'published'), true);
});

test('stale draft writes fail with a conflict and invalid preview fails validation', () => {
  const current = database.getPublishedContent('announcement-page');
  assert.throws(() => database.saveContentDraft('announcement-page', valid(), author, current.version - 1), /changed since/);
  assert.throws(() => database.previewContent('announcement-page', { schemaVersion: 1 }), /Content validation failed/);
});

test('restore creates a new draft with a restore audit event', () => {
  const current = database.getPublishedContent('announcement-page');
  const restored = database.restoreContentVersion('announcement-page', 1, publisher, current.version);
  assert.equal(restored.state, 'draft');
  assert.ok(restored.version > current.version);
  assert.equal(database.listContentAuditEvents('announcement-page')[0].action, 'restored');
});

test.after(() => { database.close(); fs.rmSync(testDirectory, { recursive: true, force: true }); });
