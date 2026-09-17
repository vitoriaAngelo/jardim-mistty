const test = require('node:test');
const assert = require('node:assert/strict');
const { activeSession } = require('../netlify/functions/_garden-store');
const { requireSameUser } = require('../netlify/functions/_auth');

test('sessão ativa exige o mesmo identificador e prazo válido', () => {
  const data = { _activeSessionId: 'abc', _sessionLeaseUntil: Date.now() + 10000 };
  assert.equal(activeSession(data, 'abc'), true);
  assert.equal(activeSession(data, 'outra'), false);
  assert.equal(activeSession({ ...data, _sessionLeaseUntil: Date.now() - 1 }, 'abc'), false);
});

test('uma conta Twitch não pode alterar o jardim de outra', () => {
  assert.doesNotThrow(() => requireSameUser({ username: 'misttylol' }, 'MisttyLol'));
  assert.throws(() => requireSameUser({ username: 'misttylol' }, 'outra_pessoa'), /não pertence/);
});
