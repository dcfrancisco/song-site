import { test, expect } from '@playwright/test';

const api = 'http://127.0.0.1:5001';
const payload = {
  schemaVersion: 1,
  hero: { title: 'Concurrency test', body: 'Body' },
  carousel: [],
  trainings: [],
  notices: [{ id: 'test', title: 'Notice', body: 'Body', order: 0 }],
  reminder: { title: 'Reminder', body: 'Body' },
};

test('CSRF is required and concurrent draft revisions return 409', async ({ request }) => {
  const publisherSession = await request.post(`${api}/api/v1/dev/session`, { data: { fixture: 'publisher' } });
  expect(publisherSession.ok()).toBeTruthy();
  const publisherCsrf = (await publisherSession.json()).csrfToken;
  const versions = await request.get(`${api}/api/v1/authoring/pages/announcement-page/versions`);
  expect(versions.ok()).toBeTruthy();
  const allVersions = await versions.json();
  const currentVersion = allVersions[0].version;
  const existingDraft = await request.get(`${api}/api/v1/authoring/pages/announcement-page/draft`);
  if ((await existingDraft.json()) !== null) {
    const discarded = await request.delete(`${api}/api/v1/authoring/pages/announcement-page/draft?expectedVersion=${currentVersion}`, { headers: { 'x-csrf-token': publisherCsrf } });
    expect(discarded.ok()).toBeTruthy();
  }

  const authorSession = await request.post(`${api}/api/v1/dev/session`, { data: { fixture: 'author' } });
  expect(authorSession.ok()).toBeTruthy();
  const csrf = (await authorSession.json()).csrfToken;
  const publicContent = await request.get(`${api}/api/v1/content/pages/announcement-page`);
  const expectedVersion = (await publicContent.json()).version;
  const csrfRejected = await request.put(`${api}/api/v1/authoring/pages/announcement-page/draft`, { data: { payload, expectedVersion } });
  expect(csrfRejected.status()).toBe(403);
  const first = await request.put(`${api}/api/v1/authoring/pages/announcement-page/draft`, { data: { payload, expectedVersion }, headers: { 'x-csrf-token': csrf } });
  expect(first.ok()).toBeTruthy();
  const stale = await request.put(`${api}/api/v1/authoring/pages/announcement-page/draft`, { data: { payload, expectedVersion }, headers: { 'x-csrf-token': csrf } });
  expect(stale.status()).toBe(409);
  const saved = await first.json();
  const cleanup = await request.delete(`${api}/api/v1/authoring/pages/announcement-page/draft?expectedVersion=${saved.version}`, { headers: { 'x-csrf-token': csrf } });
  expect(cleanup.ok()).toBeTruthy();
});
