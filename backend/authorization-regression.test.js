const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');

const serverSource = fs.readFileSync(require.resolve('./server'), 'utf8');
const openApiSource = fs.readFileSync(require.resolve('../docs/openapi/song-site.yaml'), 'utf8');

test('every legacy mutation route is protected by explicit backend permission middleware', () => {
  const routes = [
    "app.post(\"/api/tasks\"", "app.put(\"/api/tasks/:id\"", "app.put(\"/api/journey/items/:id\"", "app.put(\"/api/tasks/:id/status\"",
    "app.post(\"/api/training-tasks\"", "app.put(\"/api/training-tasks/:id\"", "app.put(\"/api/training-tasks/:id/status\"",
    "app.put(\"/api/leadership/:section/:id\"", "app.put(\"/api/home/spotlight\"", "app.put(\"/api/home/announcements/:id\"", "app.put(\"/api/song-links/:sectionId/:cardId\"",
  ];
  for (const route of routes) {
    const line = serverSource.split('\n').find(candidate => candidate.includes(route));
    assert.ok(line, `route exists: ${route}`);
    assert.match(line, /requireMutation\(/, `route is protected: ${route}`);
  }
  assert.doesNotMatch(serverSource, /NODE_ENV\s*!==\s*["']production/);
  assert.doesNotMatch(serverSource, /x-admin-key|TEMP_CONTENT_API_KEY/i);
});

test('authoring contract exposes the implemented session and content paths', () => {
  for (const path of [
    '/api/v1/session:',
    '/api/v1/content/pages/{pageKey}:',
    '/api/v1/authoring/pages/{pageKey}/draft:',
    '/api/v1/authoring/pages/{pageKey}/preview:',
    '/api/v1/authoring/pages/{pageKey}/publish:',
  ]) assert.match(openApiSource, new RegExp(path.replace(/[{}]/g, '\\$&')));
  assert.doesNotMatch(openApiSource, /temporaryAdminKey|X-Admin-Key|TEMP_CONTENT_API_KEY/);
});
