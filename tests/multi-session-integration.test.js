const test = require('node:test');
const assert = require('node:assert/strict');

const channel = '5b9a7efe15cd280f04f5891b';
const authHeaders = (sessionId) => ({ authorization: 'Bearer twitch-token', 'x-garden-session': `launch-2.0:${sessionId}` });

test('preflight do login libera o cabeçalho de sessão enviado pelo navegador', async () => {
  delete require.cache[require.resolve('../netlify/functions/garden-session')];
  const handler = require('../netlify/functions/garden-session').handler;
  const response = await handler({ httpMethod: 'OPTIONS', headers: {} });
  assert.equal(response.statusCode, 200);
  assert.match(response.headers['Access-Control-Allow-Headers'], /X-Garden-Session/i);
});

test('a segunda tela assume a conta e invalida a sessão anterior', async () => {
  const originalFetch = global.fetch;
  let row = {
    data: { farmName: 'Jardim seguro', _activeSessionId: 'launch-2.0:tela-1', _sessionLeaseUntil: Date.now() + 60000 },
    updated_at: '2026-09-16T10:00:00.000Z',
  };
  global.fetch = async (url, options = {}) => {
    if (url.includes('api.twitch.tv')) return { ok: true, json: async () => ({ data: [{ login: 'misttylol' }] }) };
    if (options.method === 'PATCH') {
      const body = JSON.parse(options.body);
      row = { data: body.data, updated_at: body.updated_at };
      return { ok: true, json: async () => [row] };
    }
    return { ok: true, json: async () => [row] };
  };

  try {
    delete require.cache[require.resolve('../netlify/functions/garden-session')];
    const handler = require('../netlify/functions/garden-session').handler;
    const response = await handler({
      httpMethod: 'POST', headers: authHeaders('tela-2'),
      body: JSON.stringify({ username: 'misttylol', sessionId: 'launch-2.0:tela-2' }),
    });
    assert.equal(response.statusCode, 200);
    assert.equal(row.data._activeSessionId, 'launch-2.0:tela-2');
    assert.ok(row.data._sessionLeaseUntil > Date.now());
  } finally { global.fetch = originalFetch; }
});

test('a tela invalidada não consegue alterar pontos', async () => {
  process.env.STREAMELEMENTS_JWT = 'server-secret';
  const originalFetch = global.fetch;
  let streamElementsCalled = false;
  global.fetch = async (url) => {
    if (url.includes('api.twitch.tv')) return { ok: true, json: async () => ({ data: [{ login: 'misttylol' }] }) };
    if (url.includes('supabase.co')) return { ok: true, json: async () => [{ data: { _activeSessionId: 'launch-2.0:tela-2', _sessionLeaseUntil: Date.now() + 60000 } }] };
    streamElementsCalled = true;
    return { status: 200, text: async () => '{"ok":true}' };
  };

  try {
    delete require.cache[require.resolve('../netlify/functions/se-proxy')];
    const handler = require('../netlify/functions/se-proxy').handler;
    const response = await handler({
      httpMethod: 'PUT', headers: authHeaders('tela-1'),
      queryStringParameters: { path: `/points/${channel}/misttylol/9999` },
    });
    assert.equal(response.statusCode, 409);
    assert.equal(streamElementsCalled, false);
  } finally { global.fetch = originalFetch; }
});

test('uma gravação com versão antiga é rejeitada antes de sobrescrever o jardim', async () => {
  const originalFetch = global.fetch;
  const current = {
    data: { _activeSessionId: 'launch-2.0:tela-2', _sessionLeaseUntil: Date.now() + 60000, plots: [], orders: [] },
    updated_at: '2026-09-16T11:00:00.000Z',
  };
  let patchCalled = false;
  global.fetch = async (url, options = {}) => {
    if (url.includes('api.twitch.tv')) return { ok: true, json: async () => ({ data: [{ login: 'misttylol' }] }) };
    if (options.method === 'PATCH') { patchCalled = true; return { ok: true, json: async () => [] }; }
    return { ok: true, json: async () => [current] };
  };

  try {
    delete require.cache[require.resolve('../netlify/functions/garden-save')];
    const handler = require('../netlify/functions/garden-save').handler;
    const response = await handler({
      httpMethod: 'POST', headers: authHeaders('tela-2'),
      body: JSON.stringify({
        username: 'misttylol', sessionId: 'launch-2.0:tela-2', expectedRevision: 'versao-antiga',
        data: { plots: [], orders: [], savedAt: Date.now() },
      }),
    });
    assert.equal(response.statusCode, 409);
    assert.equal(JSON.parse(response.body).code, 'STALE_STATE');
    assert.equal(patchCalled, false);
  } finally { global.fetch = originalFetch; }
});

test('a mesma tela renova a sessão depois de ficar suspensa', async () => {
  const originalFetch = global.fetch;
  const revision = '2026-09-17T10:00:00.000Z';
  const current = {
    data: { _activeSessionId: 'launch-2.0:tela-1', _sessionLeaseUntil: Date.now() - 60000, plots: [], orders: [] },
    updated_at: revision,
  };
  global.fetch = async (url, options = {}) => {
    if (url.includes('api.twitch.tv')) return { ok: true, json: async () => ({ data: [{ login: 'misttylol' }] }) };
    if (options.method === 'PATCH') {
      const body = JSON.parse(options.body);
      return { ok: true, json: async () => [{ data: body.data, updated_at: body.updated_at }] };
    }
    return { ok: true, json: async () => [current] };
  };

  try {
    delete require.cache[require.resolve('../netlify/functions/garden-save')];
    const handler = require('../netlify/functions/garden-save').handler;
    const response = await handler({
      httpMethod: 'POST', headers: authHeaders('tela-1'),
      body: JSON.stringify({
        username: 'misttylol', sessionId: 'launch-2.0:tela-1', expectedRevision: revision,
        data: { plots: [], orders: [], savedAt: Date.now() },
      }),
    });
    assert.equal(response.statusCode, 200);
  } finally { global.fetch = originalFetch; }
});
