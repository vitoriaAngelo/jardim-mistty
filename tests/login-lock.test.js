const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

test('botão de login está novamente habilitado no preview', () => {
  assert.match(html, /id="login-twitch-button"[^>]*class="login-twitch-btn"[^>]*onclick="loginWithTwitch\(\)"/);
  assert.match(html, /Entrar com Twitch/);
  assert.match(html, /Use sua conta Twitch para entrar no jardim\./);
  assert.doesNotMatch(html, /id="login-twitch-button"[^>]*disabled/);
});

test('função de login inicia a conexão sem bloqueio de manutenção', () => {
  const start = html.indexOf('function loginWithTwitch()');
  const end = html.indexOf('// ── Handle OAuth callback', start);
  const loginFunction = html.slice(start, end);
  assert.doesNotMatch(loginFunction, /loginButton\?\.disabled/);
  assert.match(loginFunction, /setLoginLoading\(true/);
});
