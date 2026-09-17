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

test('badge de habilidades desaparece ao gastar o último ponto', () => {
  assert.match(pageSource, /\.st-sp-badge\.hidden\s*\{\s*display\s*:\s*none\s*!important/);
  const start = pageSource.indexOf('function renderSkillTreeBadge');
  const end = pageSource.indexOf('\nfunction renderSkillTree', start);
  const body = pageSource.slice(start, end);
  assert.match(body, /badge\.textContent\s*=\s*''/);
  assert.match(body, /badge\.classList\.add\('hidden'\)/);
});
