const test = require('node:test');
const assert = require('node:assert/strict');

const proxyPath = require.resolve('../netlify/functions/se-proxy');
function loadHandler() { delete require.cache[proxyPath]; return require(proxyPath).handler; }
function event(method, path, headers = {}) { return { httpMethod: method, queryStringParameters: { path }, headers }; }
const channel = '5b9a7efe15cd280f04f5891b';

test('bloqueia mutação de pontos sem login Twitch', async () => {
  process.env.STREAMELEMENTS_JWT = 'test-token';
  const response = await loadHandler()(event('PUT', `/points/${channel}/user/100`));
  assert.equal(response.statusCode, 401);
});

test('permite consultar o ranking sem expor a credencial', async () => {
  process.env.STREAMELEMENTS_JWT = 'test-token';
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, options) => { request = { url, options }; return { status: 200, text: async () => '{"users":[]}' }; };
  try {
    const response = await loadHandler()(event('GET', `/points/${channel}/top%3Flimit%3D25`));
    assert.equal(response.statusCode, 200);
    assert.equal(request.options.headers.Authorization, 'Bearer test-token');
  } finally { global.fetch = originalFetch; }
});

test('aceita mutação somente para a conta e sessão ativas', async () => {
  process.env.STREAMELEMENTS_JWT = 'test-token';
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.includes('api.twitch.tv')) return { ok: true, json: async () => ({ data: [{ login: 'user' }] }) };
    if (url.includes('supabase.co')) return { ok: true, json: async () => [{ data: { _activeSessionId: 'session-1', _sessionLeaseUntil: Date.now() + 60000 }, updated_at: 'rev' }] };
    return { status: 200, text: async () => '{"ok":true}' };
  };
  try {
    const response = await loadHandler()(event('PUT', `/points/${channel}/user/100`, { authorization: 'Bearer twitch-token', 'x-garden-session': 'session-1' }));
    assert.equal(response.statusCode, 200);
    assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer test-token');
  } finally { global.fetch = originalFetch; }
});

test('rejeita outra tela mesmo usando a mesma conta', async () => {
  process.env.STREAMELEMENTS_JWT = 'test-token';
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (url.includes('api.twitch.tv')) return { ok: true, json: async () => ({ data: [{ login: 'user' }] }) };
    return { ok: true, json: async () => [{ data: { _activeSessionId: 'new-session', _sessionLeaseUntil: Date.now() + 60000 } }] };
  };
  try {
    const response = await loadHandler()(event('PUT', `/points/${channel}/user/100`, { authorization: 'Bearer twitch-token', 'x-garden-session': 'old-session' }));
    assert.equal(response.statusCode, 409);
  } finally { global.fetch = originalFetch; }
});
