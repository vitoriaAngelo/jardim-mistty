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
    SELL_PEST: {},
    window: { _epicSaleTypes: [] },
    ensureSaleTypes() {},
    effectiveSellValue: () => 10,
    sellValueForSelection: (type,good,pest) => (good + pest * .5) * 10,
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

test('setas por item limpam ou selecionam todo o estoque somente daquele item', () => {
  const start = html.indexOf('function setSellAllItemQty(');
  const end = html.indexOf('function levelPackReward(', start);
  const context = vm.createContext({
    G: { harvested: { tomato: 12, flower: 8 } },
    SELL: { tomato: 3, flower: 2 },
    renderSellAllConfirm() {},
  });
  vm.runInContext(html.slice(start, end), context);
  context.setSellAllItemQty('tomato', false);
  assert.deepEqual({ ...context.SELL }, { tomato: 0, flower: 2 });
  context.setSellAllItemQty('flower', true);
  assert.deepEqual({ ...context.SELL }, { tomato: 0, flower: 8 });
});

test('indicador da Feira Local aparece dentro do popup logo abaixo do total', () => {
  const popupStart = html.indexOf('function renderSellAllConfirm()');
  const popupEnd = html.indexOf('function adjustSellAllQty(', popupStart);
  const popupSource = html.slice(popupStart, popupEnd);
  assert.match(popupSource, /market-total-pts[\s\S]*market-fair-indicator/);

  const marketStart = html.indexOf('function renderHarvested()');
  const marketEnd = html.indexOf('// ─── RANKING', marketStart);
  assert.doesNotMatch(html.slice(marketStart, marketEnd), /market-fair-indicator/);
});
