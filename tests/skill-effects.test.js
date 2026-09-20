const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('public/index.html', 'utf8');

test('Compostagem entrega adubos comuns nos marcos de 20 colheitas, conforme o nível', () => {
  const start = html.indexOf('function grantCompostHarvestReward()');
  const end = html.indexOf('// Retorna redução de tempo de crescimento', start);
  const context = vm.createContext({
    G: { skillHarvestCount:19, skillNodes:{compostagem:2}, fertilizerInventory:{} },
    FERTILIZERS:{ quick_grow:{name:'Rápido',emoji:'⚡'}, golden_soil:{name:'Dourada',emoji:'✨'}, premium_fert:{name:'Premium',emoji:'💎',premium:true} },
    Math:Object.assign(Object.create(Math), {random:()=>0}),
    toast:message=>{context.lastToast=message;},
  });
  vm.runInContext(html.slice(start,end), context);
  context.grantCompostHarvestReward();
  assert.equal(context.G.skillHarvestCount,20);
  assert.equal(context.G.fertilizerInventory.quick_grow,2);
  assert.equal(context.G.fertilizerInventory.premium_fert,undefined);
  assert.match(context.lastToast,/Compostagem/);
});

test('Solo Vivo encurta o intervalo por nível sem reduzir o número de etapas', () => {
  const reductionStart = html.indexOf('function skillGrowReduction()');
  const reductionEnd = html.indexOf('function skillWaterReduction()', reductionStart);
  const intervalStart = html.indexOf('function effectiveGrowInterval()');
  const intervalEnd = html.indexOf('// A quantidade de etapas',intervalStart);
  const levelFunction = html.slice(reductionStart,reductionEnd) + html.slice(intervalStart,intervalEnd) + 'function effectiveMaxGrowWithSkill(type) { return effectiveMaxGrow(type); }';
  const context = vm.createContext({ G:{skillNodes:{solo_vivo:0}}, effectiveMaxGrow:()=>20 });
  vm.runInContext(`const GROW_INTERVAL_MS=15000;${levelFunction}`,context);
  assert.equal(context.effectiveGrowInterval(),15000);
  context.G.skillNodes.solo_vivo=1;
  assert.equal(context.effectiveGrowInterval(),14550);
  context.G.skillNodes.solo_vivo=4;
  assert.equal(context.effectiveGrowInterval(),13200);
  assert.equal(context.effectiveMaxGrowWithSkill('potato'),20);
  assert.match(html,/Math\.floor\(elapsed \/ effectiveGrowInterval\(\)\)/);
  assert.match(html,/setInterval\(\(\) => \{\s*if \(!document\.hidden\) growTick\(\);\s*\}, effectiveGrowInterval\(\)\)/);
});

test('Venda Épica sorteia cada pacote separadamente e dobra todos os itens do tipo', () => {
  const start = html.indexOf('function sellTotal()');
  const end = html.indexOf('function changeSellQty(',start);
  const sequence=[.01,.11,.05];
  const context=vm.createContext({
    window:{},
    SELL:{potato:5,carrot:3,tomato:2},
    SELL_PEST:{potato:0,carrot:0,tomato:0},
    skillEpicSaleChance:()=>.1,
    ensureSaleTypes:()=>{},
    selectedSellQuantity:()=>10,
    localFairSaleBonus:()=>0,
    sellValueForSelection:(type,good,pest,epic)=>(good+pest)*10*(epic?2:1),
    Math:Object.assign(Object.create(Math),{random:()=>sequence.shift()}),
  });
  vm.runInContext(html.slice(start,end),context);
  context.rollEpicSaleTypes();
  assert.deepEqual(Array.from(context.window._epicSaleTypes),['potato','tomato']);
  assert.equal(context.sellTotal(),170);
});

test('Venda Épica anuncia os nomes e pacotes dobrados somente após a venda confirmada', () => {
  assert.match(html,/VOCÊ FEZ UMA VENDA ÉPICA!/);
  assert.match(html,/pacote ×\$\{item\.quantity\}/);
  assert.match(html,/if \(epicDetails\.length\) showEpicSalePopup\(epicDetails\)/);
  const sellAllStart=html.indexOf('function sellAll()');
  const sellAllEnd=html.indexOf('function applyOfflineProgress',sellAllStart);
  const sellAll=html.slice(sellAllStart,sellAllEnd);
  assert.ok(sellAll.indexOf('SELL[type] = Math.max') < sellAll.indexOf('rollEpicSaleTypes()'));
});
