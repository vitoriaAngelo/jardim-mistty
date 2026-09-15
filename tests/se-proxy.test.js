const test = require('node:test');
const assert = require('node:assert/strict');

const proxyPath = require.resolve('../netlify/functions/se-proxy');

function loadHandler() {
  delete require.cache[proxyPath];
  return require(proxyPath).handler;
}

function event(method, path = '/points/channel/user/100') {
  return { httpMethod: method, queryStringParameters: { path } };
}

test('retorna erro seguro quando o token não está configurado', async () => {
  const previous = process.env.STREAMELEMENTS_JWT;
  delete process.env.STREAMELEMENTS_JWT;
  const response = await loadHandler()(event('GET'));
  assert.equal(response.statusCode, 500);
  assert.match(response.body, /not configured/);
  if (previous) process.env.STREAMELEMENTS_JWT = previous;
});

test('encaminha consulta de pontos usando o token do ambiente', async () => {
  process.env.STREAMELEMENTS_JWT = 'test-token';
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return { status: 200, text: async () => '{"points":100}' };
  };

  try {
    const response = await loadHandler()(event('GET', '/points/channel/user'));
    assert.equal(response.statusCode, 200);
    assert.equal(request.options.method, 'GET');
    assert.equal(request.options.headers.Authorization, 'Bearer test-token');
    assert.equal(response.body, '{"points":100}');
  } finally {
    global.fetch = originalFetch;
  }
});

test('preserva método e corpo nas mutações de pontos', async () => {
  process.env.STREAMELEMENTS_JWT = 'test-token';
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return { status: 200, text: async () => '{"ok":true}' };
  };

  try {
    const response = await loadHandler()({
      ...event('DELETE'),
      body: '{"reason":"purchase"}',
    });
    assert.equal(response.statusCode, 200);
    assert.equal(request.options.method, 'DELETE');
    assert.equal(request.options.body, '{"reason":"purchase"}');
  } finally {
    global.fetch = originalFetch;
  }
});
