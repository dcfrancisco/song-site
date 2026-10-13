const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const YAML = require('yaml');

const serverSource = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
const openApi = YAML.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'openapi', 'song-site.yaml'), 'utf8'));

function openApiPath(expressPath) {
  return expressPath.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function declaredRoutes(method) {
  const pattern = new RegExp(`app\\.${method}\\(\\s*['"]([^'"]+)['"]`, 'g');
  return [...serverSource.matchAll(pattern)].map((match) => match[1]);
}

test('every mutation route is represented in OpenAPI', () => {
  const missing = ['post', 'put', 'patch', 'delete']
    .flatMap((method) => declaredRoutes(method).map((route) => `${method.toUpperCase()} ${route}`))
    .filter((route) => {
      const [, expressPath] = route.split(' ');
      return !openApi.paths?.[openApiPath(expressPath)];
    });

  assert.deepEqual(missing, [], `Mutation routes missing from OpenAPI: ${missing.join(', ')}`);
});

test('all OpenAPI mutation routes declare an operation', () => {
  const methods = new Set(['post', 'put', 'patch', 'delete']);
  const missing = Object.entries(openApi.paths || {}).flatMap(([route, operations]) =>
    [...methods].filter((method) => operations?.[method]).filter((method) => {
      const expressRoute = route.replace(/\{([A-Za-z0-9_]+)\}/g, ':$1');
      return !declaredRoutes(method).includes(expressRoute);
    }).map((method) => `${method.toUpperCase()} ${route}`),
  );

  assert.deepEqual(missing, [], `OpenAPI mutation operations missing from server.js: ${missing.join(', ')}`);
});
