const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('servidor rejeita imediatamente sessões de uma geração anterior', async () => {
  const originalFetch = global.fetch;
  let twitchCalled = false;
  global.fetch = async () => { twitchCalled = true; return { ok:true, json:async()=>({ data:[{ login:'misttylol' }] }) }; };
  try {
    delete require.cache[require.resolve('../netlify/functions/_auth')];
    const { authenticateTwitch } = require('../netlify/functions/_auth');
    await assert.rejects(
      authenticateTwitch({ headers:{ authorization:'Bearer token', 'x-garden-session':'launch-1.0:old-tab' } }),
      error => error.statusCode === 401 && error.code === 'SESSION_REVOKED'
    );
    assert.equal(twitchCalled, false);
  } finally { global.fetch = originalFetch; }
});

test('nova geração de sessão é enviada em todas as requisições autenticadas', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.match(html, /GLOBAL_SESSION_VERSION = 'launch-2\.0'/);
  assert.match(html, /gardenSessionId = `\$\{GLOBAL_SESSION_VERSION\}:\$\{crypto\.randomUUID\(\)\}`/);
  assert.match(html, /sessionStorage\.setItem\('garden_session_id', gardenSessionId\)/);
  assert.match(html, /function handleRevokedSession[\s\S]*login-overlay/);
});
