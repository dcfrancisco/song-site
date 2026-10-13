const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'song-site-server-'));
process.env.DB_DRIVER = 'sqlite';
process.env.DATABASE_PATH = path.join(directory, 'server.sqlite');
process.env.AUTH_MODE = 'development';
process.env.NODE_ENV = 'test';
process.env.DEV_SESSION_SECRET = 'server-test-secret-that-is-at-least-32-characters';
process.env.DEV_ALLOWED_ORIGINS = 'http://localhost:4200';
process.env.HOST = '127.0.0.1';

const { app, database } = require('./server');
let server;
let baseUrl;

const payload = { schemaVersion: 1, hero: { title: 'API test', body: 'Body' }, carousel: [], trainings: [], notices: [{ id: 'notice', title: 'Notice', body: 'Body', order: 0 }], reminder: { title: 'Reminder', body: 'Body' } };

async function request(method, url, body, cookie, csrf) {
  const response = await fetch(`${baseUrl}${url}`, { method, headers: { 'content-type': 'application/json', origin: 'http://localhost:4200', ...(cookie ? { cookie } : {}), ...(csrf ? { 'x-csrf-token': csrf } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { response, json: response.status === 204 ? null : await response.json(), cookie: response.headers.get('set-cookie') };
}

before(async () => { server = http.createServer(app); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); baseUrl = `http://127.0.0.1:${server.address().port}`; });
after(async () => { await new Promise(resolve => server.close(resolve)); database.close(); fs.rmSync(directory, { recursive: true, force: true }); });

test('guest cannot mutate and author cannot publish, while publisher can publish', async () => {
  let result = await request('PUT', '/api/v1/authoring/pages/announcement-page/draft', { payload });
  assert.equal(result.response.status, 401);
  result = await request('POST', '/api/v1/dev/session', { fixture: 'author' });
  assert.equal(result.response.status, 200);
  const cookie = result.cookie.split(';')[0];
  const csrf = result.json.csrfToken;
  const published = await request('GET', '/api/v1/content/pages/announcement-page');
  result = await request('PUT', '/api/v1/authoring/pages/announcement-page/draft', { payload, expectedVersion: published.json.version }, cookie, csrf);
  assert.equal(result.response.status, 200);
  const draftVersion = result.json.version;
  result = await request('POST', '/api/v1/authoring/pages/announcement-page/publish', { expectedVersion: draftVersion }, cookie, csrf);
  assert.equal(result.response.status, 403);
  await request('DELETE', '/api/v1/dev/session', undefined, cookie);
  result = await request('POST', '/api/v1/dev/session', { fixture: 'publisher' });
  const publisherCookie = result.cookie.split(';')[0];
  result = await request('POST', '/api/v1/authoring/pages/announcement-page/publish', { expectedVersion: draftVersion }, publisherCookie, result.json.csrfToken);
  assert.equal(result.response.status, 200);
  assert.equal(result.json.state, 'published');
});

test('forged development cookies do not create an authenticated principal', async () => {
  const result = await request('GET', '/api/v1/session', undefined, 'song_site_dev_session=forged');
  assert.equal(result.response.status, 200);
  assert.equal(result.json.authenticated, false);
});

test('administrator role assignment changes effective permissions', async () => {
  let result = await request('POST', '/api/v1/dev/session', { fixture: 'administrator' });
  assert.equal(result.response.status, 200);
  const adminCookie = result.cookie.split(';')[0];
  const adminCsrf = result.json.csrfToken;
  result = await request('PUT', '/api/v1/rbac/users/dev-author/roles', { roles: [] }, adminCookie, adminCsrf);
  assert.equal(result.response.status, 200);
  result = await request('POST', '/api/v1/dev/session', { fixture: 'author' });
  const authorCookie = result.cookie.split(';')[0];
  result = await request('PUT', '/api/v1/authoring/pages/announcement-page/draft', { payload }, authorCookie, result.json.csrfToken);
  assert.equal(result.response.status, 403);
  result = await request('PUT', '/api/v1/rbac/users/dev-author/roles', { roles: ['author'] }, adminCookie, adminCsrf);
  assert.equal(result.response.status, 200);
});
