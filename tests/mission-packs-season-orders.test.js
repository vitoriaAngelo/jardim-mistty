const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const backend = fs.readFileSync('netlify/functions/garden-save.js', 'utf8');

test('entregar todas as missões diárias concede um pack de cada tipo uma vez', () => {
  const start = html.indexOf('function missionProgress(');
  const end = html.indexOf('\nfunction openMissionsModal', start);
  const body = html.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(body, /MISSION_DEFS\.every\(mission => G\.missions\.claimed\[mission\.id\]\)/);
  assert.match(body, /G\.packInventory\.normal = Number\(G\.packInventory\.normal \|\| 0\) \+ 1/);
  assert.match(body, /G\.packInventory\.prismatic = Number\(G\.packInventory\.prismatic \|\| 0\) \+ 1/);
  assert.match(body, /if \(!G\.missions\.completionRewardClaimed\)/);
  assert.match(body, /renderPackInventory\(\)/);
});

test('recompensa diária pode ser recebida novamente só depois que as missões renovarem', () => {
  assert.match(html, /G\.missions\.completionRewardClaimed = false/);
  assert.match(html, /G\.missions\.resetAt = Date\.now\(\) \+ MISSION_DAY_MS/);
});

test('virada da estação recria pedidos após a entrega da cota de quatro', () => {
  const start = html.indexOf('function advanceSeasonDay()');
  const end = html.indexOf('\nfunction checkOutOfSeasonPlants', start);
  const body = html.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(body, /const ordersCompleted = \(G\.orderDeliveries \|\| 0\) >= 4/);
  assert.match(body, /if \(ordersCompleted\) \{\s*resetOrdersForSeason\(false\)/);
  assert.match(body, /saveGardenToSE\(ordersCompleted\)/);
});

test('reinício da cota de pedidos é persistido como ação explícita', () => {
  assert.match(backend, /function validateOrdersTransition\(/);
  assert.match(html, /async function saveGardenToSENow\(retryStale = true, orderAction = false\)/);
});
