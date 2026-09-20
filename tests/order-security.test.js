const test = require('node:test');
const assert = require('node:assert/strict');
const { validOrder, validateOrdersTransition } = require('../netlify/functions/garden-save')._test;
const pageSource = require('node:fs').readFileSync('public/index.html', 'utf8');

const normalOrder = { id:'order-1', type:'potato', qty:5, rarity:'A', reward:285, xp:110 };
const base = { seasonIdx:0, ordersSeasonKey:'0', orderSearches:1, orderDeliveries:0, orderPaidReset:false, orders:[normalOrder], harvested:{ potato:10 }, xp:0, skillNodes:{} };

test('calcula pedidos na mesma ordem de arredondamento do cliente', () => {
  const state = { selectedMascot:'apple', skillNodes:{ etiqueta_dourada:1 } };
  const daisyOrder = { id:'daisy-1', type:'daisy', qty:1, rarity:'A', reward:75, xp:70 };
  assert.equal(validOrder(daisyOrder, 0, state), true);
  assert.equal(validOrder({ ...daisyOrder, reward:76 }, 0, state), false);
});

test('bloqueia limites e recompensas adulteradas dos pedidos', () => {
  assert.throws(() => validateOrdersTransition(base, { ...base, orderDeliveries:5 }), /Limite de entregas/);
  assert.throws(() => validateOrdersTransition(base, { ...base, orderSearches:4 }), /Limite de atualizações/);
  assert.throws(() => validateOrdersTransition(base, { ...base, orders:[{ ...normalOrder, reward:999999 }] }), /Pedido adulterado/);
});

test('bloqueia F5 que reduz contadores e entrega sem estoque', () => {
  assert.throws(() => validateOrdersTransition({ ...base, orderSearches:3 }, { ...base, orderSearches:0 }), /não pode ser reduzido/);
  assert.throws(() => validateOrdersTransition(base, { ...base, orders:[], orderDeliveries:1, harvested:{ potato:9 }, xp:110 }), /Estoque insuficiente/);
});

test('aceita uma entrega legítima e uma única compra extra', () => {
  assert.doesNotThrow(() => validateOrdersTransition(base, { ...base, orders:[], orderDeliveries:1, harvested:{ potato:5 }, xp:110 }));
  assert.doesNotThrow(() => validateOrdersTransition({ ...base, orderSearches:3 }, { ...base, orderSearches:0, orderPaidReset:true }));
});

test('abrir o popup não consome uma atualização de pedidos', () => {
  const start = pageSource.indexOf('function openOrders');
  const end = pageSource.indexOf('\nfunction closeOrders', start);
  const body = pageSource.slice(start, end);
  assert.doesNotMatch(body, /refreshOrders\s*\(/);
  assert.match(body, /renderOrders\s*\(/);
});

test('entrega restaura o estoque local quando a confirmação do servidor falha', () => {
  const html = pageSource;
  assert.match(html, /const deliverySnapshot = JSON\.parse\(JSON\.stringify/);
  assert.match(html, /catch \(error\) \{\s*Object\.assign\(G, deliverySnapshot\)/);
});

test('venda ignora pedidos locais atrasados sem apagar a venda', async () => {
  const originalFetch = global.fetch;
  const revision = '2026-09-18T10:00:00.000Z';
  const stored = {
    ...base, orderSearches: 0, orders: [normalOrder], harvested: { potato: 7 },
    _activeSessionId: 'launch-2.0:tela-venda', _sessionLeaseUntil: Date.now() + 60000,
  };
  let saved;
  global.fetch = async (url, options = {}) => {
    if (url.includes('api.twitch.tv')) return { ok: true, json: async () => ({ data: [{ login: 'misttylol' }] }) };
    if (options.method === 'PATCH') {
      saved = JSON.parse(options.body).data;
      return { ok: true, json: async () => [{ data: saved, updated_at: revision }] };
    }
    return { ok: true, json: async () => [{ data: stored, updated_at: revision }] };
  };
  try {
    const handler = require('../netlify/functions/garden-save').handler;
    const response = await handler({
      httpMethod: 'POST', headers: { authorization: 'Bearer token', 'x-garden-session': 'launch-2.0:test' },
      body: JSON.stringify({ username: 'misttylol', sessionId: 'launch-2.0:tela-venda', expectedRevision: revision,
        data: { ...stored, orderSearches: 1, orders: [{ ...normalOrder, reward: 999999 }], harvested: { potato: 0 }, lastSale: { total: 399 } } }),
    });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(saved.harvested, { potato: 0 });
    assert.equal(saved.orderSearches, 0);
    assert.deepEqual(saved.orders, [normalOrder]);
  } finally { global.fetch = originalFetch; }
});

test('ação explícita de pedidos continua bloqueando recompensa adulterada', async () => {
  const originalFetch = global.fetch;
  const revision = '2026-09-18T10:00:00.000Z';
  const stored = { ...base, orderSearches: 0, _activeSessionId: 'launch-2.0:tela-venda', _sessionLeaseUntil: Date.now() + 60000 };
  global.fetch = async (url, options = {}) => {
    if (url.includes('api.twitch.tv')) return { ok: true, json: async () => ({ data: [{ login: 'misttylol' }] }) };
    if (options.method === 'PATCH') throw new Error('Não deveria gravar');
    return { ok: true, json: async () => [{ data: stored, updated_at: revision }] };
  };
  try {
    const handler = require('../netlify/functions/garden-save').handler;
    const response = await handler({
      httpMethod: 'POST', headers: { authorization: 'Bearer token', 'x-garden-session': 'launch-2.0:test' },
      body: JSON.stringify({ username: 'misttylol', sessionId: 'launch-2.0:tela-venda', expectedRevision: revision, orderAction: true,
        data: { ...stored, orderSearches: 1, orders: [{ ...normalOrder, reward: 999999 }] } }),
    });
    assert.equal(response.statusCode, 500);
    assert.match(JSON.parse(response.body).error, /Pedido adulterado/);
  } finally { global.fetch = originalFetch; }
});

test('badge de habilidades desaparece ao gastar o último ponto', () => {
  assert.match(pageSource, /\.st-sp-badge\.hidden\s*\{\s*display\s*:\s*none\s*!important/);
  const start = pageSource.indexOf('function renderSkillTreeBadge');
  const end = pageSource.indexOf('\nfunction renderSkillTree', start);
  const body = pageSource.slice(start, end);
  assert.match(body, /badge\.textContent\s*=\s*''/);
  assert.match(body, /badge\.classList\.add\('hidden'\)/);
});
