const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('public/index.html', 'utf8');
const helperStart = html.indexOf('function selectedSellQuantity()');
const helperEnd = html.indexOf('// ─── TOOLS', helperStart);
const helpers = html.slice(helperStart, helperEnd);
const saleStart = html.indexOf('function sellTotal()');
const saleEnd = html.indexOf('function changeSellQty(', saleStart);
const sellTotal = html.slice(saleStart, saleEnd);

function marketHarness(skillLevel, selection) {
  const context = vm.createContext({
    G: { skillNodes: { feira_local: skillLevel } },
    SELL: selection,
    effectiveSellValue: () => 10,
  });
  vm.runInContext(`${helpers}\n${sellTotal}`, context);
  return context;
}

test('Feira Local soma itens de tipos diferentes e concede 30% ao vender 300', () => {
  const context = marketHarness(7, { tomato: 120, flower: 100, egg: 80 });
  assert.equal(context.selectedSellQuantity(), 300);
  assert.equal(context.localFairSaleBonus(context.selectedSellQuantity()), 0.30);
  assert.equal(context.sellTotal(), 3900);
});

test('Feira Local só conta a quantidade desta venda, sem exigir itens iguais', () => {
  const context = marketHarness(7, { tomato: 149, flower: 150 });
  assert.equal(context.localFairSaleBonus(context.selectedSellQuantity()), 0.25);
  assert.equal(context.sellTotal(), 3738);
});

test('níveis da Feira Local limitam o bônus e 350 itens chegam ao máximo de 35%', () => {
  const sixLevels = marketHarness(6, { tomato: 300 });
  const sevenLevels = marketHarness(7, { tomato: 350 });
  assert.equal(sixLevels.localFairSaleBonus(sixLevels.selectedSellQuantity()), 0.30);
  assert.equal(sevenLevels.localFairSaleBonus(sevenLevels.selectedSellQuantity()), 0.35);
});

test('venda abaixo de 50 itens não recebe bônus da Feira Local', () => {
  const context = marketHarness(7, { tomato: 49 });
  assert.equal(context.sellTotal(), 490);
});
