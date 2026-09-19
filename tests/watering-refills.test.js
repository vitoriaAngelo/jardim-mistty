const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const pageSource = fs.readFileSync('public/index.html', 'utf8');
const saveSource = fs.readFileSync('netlify/functions/garden-save.js', 'utf8');

test('recargas pagas do regador têm limite de sete por ciclo de estação', () => {
  assert.match(pageSource, /const MAX_WATERING_REFILLS_PER_SEASON = 7/);
  assert.match(pageSource, /G\.wateringRefillsUsed >= MAX_WATERING_REFILLS_PER_SEASON/);
  assert.match(pageSource, /G\.wateringRefillsUsed = Math\.min\(MAX_WATERING_REFILLS_PER_SEASON, G\.wateringRefillsUsed \+ 1\)/);
  assert.match(pageSource, /wateringRefillsUsed: Number\(G\.wateringRefillsUsed\) \|\| 0/);
});

test('limite só aumenta após cobrança confirmada e bloqueia cliques simultâneos', () => {
  const start = pageSource.indexOf('async function buyWaterRefillFromNotice()');
  const end = pageSource.indexOf('\n// ─── TOOLS', start);
  const body = pageSource.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(body, /if \(waterRefillPurchaseInFlight\) return/);
  assert.ok(body.indexOf("chargeGamePoints(cost, 'Recarga do regador')") < body.indexOf('G.wateringRefillsUsed = Math.min'));
});

test('contador renova ao virar a estação e é salvo no banco por usuário', () => {
  assert.match(pageSource, /G\.seasonCycle = Math\.max\(0, Number\(G\.seasonCycle\) \|\| 0\) \+ 1/);
  assert.match(pageSource, /wateringRefillsSeasonCycle: Number\(G\.wateringRefillsSeasonCycle\) \|\| 0/);
  assert.match(pageSource, /G\.wateringRefillsSeasonCycle = Number\.isFinite\(Number\(save\.wateringRefillsSeasonCycle\)\)/);
  assert.match(saveSource, /'seasonCycle','wateringRefillsUsed','wateringRefillsSeasonCycle'/);
});

test('recuperação automática de água não altera o contador de recargas pagas', () => {
  const start = pageSource.indexOf('function refillWateringCapacity()');
  const end = pageSource.indexOf('\nfunction renderWateringCapacity()', start);
  const body = pageSource.slice(start, end);
  assert.doesNotMatch(body, /wateringRefillsUsed/);
});
