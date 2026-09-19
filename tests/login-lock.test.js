const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

test('botão de login fica bloqueado e informa a indisponibilidade', () => {
  assert.match(html, /id="login-twitch-button"[^>]*class="login-twitch-btn login-disabled"[^>]*disabled[^>]*aria-disabled="true"/);
  assert.match(html, /Login temporariamente bloqueado/);
  assert.match(html, /O acesso ao jardim está temporariamente indisponível\./);
  assert.doesNotMatch(html, /id="login-twitch-button"[^>]*onclick="loginWithTwitch\(\)"/);
});

test('função de login também recusa execução enquanto o botão está desativado', () => {
  const start = html.indexOf('function loginWithTwitch()');
  const end = html.indexOf('// ── Handle OAuth callback', start);
  const loginFunction = html.slice(start, end);
  assert.match(loginFunction, /if \(loginButton\?\.disabled\) return;/);
});
