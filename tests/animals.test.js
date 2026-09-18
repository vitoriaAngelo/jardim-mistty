const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const model = require('../public/animal-model');

for (const [id, animal] of Object.entries(model.catalog)) {
  test(`${animal.name}: alimentação, espera offline, coleta única e novo ciclo`, () => {
    const original = { feed:10, pets:{ [id]:{ readyAt:0 } } };
    const fed = model.feed(original, id, 1000);
    assert.equal(original.feed, 10);
    assert.equal(fed.feed, 10-animal.feed);
    assert.equal(fed.pets[id].readyAt, 1000+animal.minutes*60000);
    assert.throws(() => model.feed(fed,id,1001));
    assert.throws(() => model.collect(fed,id,1001));
    const loaded = model.normalize(JSON.parse(JSON.stringify(fed)));
    const result = model.collect(loaded,id,1000+animal.minutes*60000);
    assert.equal(result.product, animal.product);
    assert.equal(result.quantity,1);
    assert.equal(model.status(result.state.pets[id]), 'hungry');
    assert.throws(() => model.collect(result.state,id,Date.now()));
    assert.ok(model.products[result.product].sell > animal.feed*model.feedCost);
  });
}
test('sem ração não inicia produção e conta nova começa vazia', () => {
  assert.deepEqual(model.normalize(null), { feed:0, pets:{} });
  assert.throws(() => model.feed({feed:0,pets:{cow:{readyAt:0}}},'cow'));
  assert.deepEqual(model.normalize({feed:Infinity,pets:{unknown:{}}}), {feed:0,pets:{}});
});
function harness(charge = async () => true) {
  const context = vm.createContext({ FarmAnimals:model, G:{livestock:model.normalize(),harvested:{}}, gardenHydrated:true,
    currentLevel:()=>30, chargeGamePoints:charge, saveGardenToSE:async()=>{}, toast:()=>{},
    renderHarvested:()=>{}, setInterval:()=>{}, document:{getElementById:()=>null}, Date, console });
  vm.runInContext(fs.readFileSync('public/animals.js','utf8'),context);
  return context;
}
test('cobrança recusada não entrega animal nem ração', async () => {
  const ctx = harness(async()=>false);
  await ctx.animalAction('buy','chicken');
  await ctx.animalAction('ration');
  assert.equal(Object.keys(ctx.G.livestock.pets).length,0);
  assert.equal(ctx.G.livestock.feed,0);
});
test('compra repetida não duplica animal e coleta entra no estoque do mercado', async () => {
  let charges = 0;
  const ctx = harness(async()=>{charges++;return true;});
  await ctx.animalAction('buy','chicken');
  await ctx.animalAction('buy','chicken');
  assert.equal(charges,1);
  await ctx.animalAction('ration');
  await ctx.animalAction('feed','chicken');
  assert.equal(ctx.G.livestock.feed,4);
  ctx.G.livestock.pets.chicken.readyAt = Date.now()-1;
  await ctx.animalAction('collect','chicken');
  await ctx.animalAction('collect','chicken');
  assert.equal(ctx.G.harvested.farm_egg,1);
});
test('cliques simultâneos não cobram duas vezes', async () => {
  let resolveCharge, charges=0;
  const ctx=harness(()=>{ charges++;return new Promise(resolve=>{resolveCharge=resolve;}); });
  const first=ctx.animalAction('buy','cow');
  await ctx.animalAction('buy','cow');
  resolveCharge(true); await first;
  assert.equal(charges,1);
  assert.ok(ctx.G.livestock.pets.cow);
});
