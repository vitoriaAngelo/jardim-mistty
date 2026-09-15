const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('public/index.html', 'utf8');

function functionBody(name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `${name} não encontrado`);
  const end = source.indexOf('\nfunction ', start + 10);
  return source.slice(start, end === -1 ? undefined : end);
}

test('compras de flores, adubos, carrinho e mascotes confirmam cobrança antes de entregar', () => {
  for (const name of ['buyFlower', 'buyFertilizer', 'buyShopCart', 'buyMascot']) {
    const body = functionBody(name);
    assert.match(body, /await chargeGamePoints\(/, `${name} não usa cobrança centralizada`);
    assert.match(body, /await chargeGamePoints\([^;]+return/, `${name} entrega item sem confirmação`);
  }
});

test('a cobrança possui fallback para os dois formatos de retirada do StreamElements', () => {
  const start = source.indexOf('async function spendSEPoints');
  const end = source.indexOf('\nlet latestSalesItems', start);
  const body = source.slice(start, end);
  assert.match(body, /queueSEPointsMutation\(amount, 'DELETE'\)/);
  assert.match(source, /method === 'DELETE'/);
  assert.match(source, /`\$\{basePath\}\/\-\$\{seAmount\}`/);
});
