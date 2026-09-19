const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('servidor aceita novamente sessões sem marcador de geração', async () => {
  const originalFetch = global.fetch;
  let twitchCalled = false;
  global.fetch = async () => { twitchCalled = true; return { ok:true, json:async()=>({ data:[{ login:'misttylol' }] }) }; };
  try {
    delete require.cache[require.resolve('../netlify/functions/_auth')];
    const { authenticateTwitch } = require('../netlify/functions/_auth');
    const auth = await authenticateTwitch({ headers:{ authorization:'Bearer token', 'x-garden-session':'old-tab' } });
    assert.equal(auth.username, 'misttylol');
    assert.equal(twitchCalled, true);
  } finally { global.fetch = originalFetch; }
});

test('cliente cria uma sessão nova sem apagar o login já autorizado', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.doesNotMatch(html, /GLOBAL_SESSION_VERSION/);
  assert.match(html, /gardenSessionId = crypto\.randomUUID\(\)/);
  assert.match(html, /sessionStorage\.setItem\('garden_session_id', gardenSessionId\)/);
  assert.doesNotMatch(html, /mistty-session-version/);
});
