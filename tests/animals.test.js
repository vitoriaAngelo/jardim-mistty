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
    assert.equal(fed.feed, 9);
    assert.equal(fed.pets[id].readyAt, 1000+animal.minutes*60000);
    assert.equal(model.feed(fed,id,1001).pets[id].queue.length,1);
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
  assert.deepEqual(model.normalize(null), { feed:0, pets:{},rations:{premium:0,super:0,booster:0} });
  assert.throws(() => model.feed({feed:0,pets:{cow:{readyAt:0}}},'cow'));
  assert.deepEqual(model.normalize({feed:Infinity,pets:{unknown:{}}}), {feed:0,pets:{},rations:{premium:0,super:0,booster:0}});
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
  assert.equal(ctx.G.livestock.feed,0);
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

test('Premium alimenta a vaca com uma unidade e preserva ração normal antiga',()=>{
  const state=model.feed({feed:7,rations:{premium:1},pets:{cow:{readyAt:0}}},'cow',100,'premium');
  assert.equal(state.feed,7);assert.equal(state.rations.premium,0);
  assert.equal(state.pets.cow.quantity,1);
});
test('Super Premium sorteia 34% com saúde suficiente e mantém resultado após recarregar',()=>{
  for(const [roll,expected] of [[.339,2],[.34,1],[.99,1]]) {
    const state=model.feed({rations:{super:1},pets:{pig:{readyAt:0}}},'pig',100,'super',()=>roll);
    const loaded=model.normalize(JSON.parse(JSON.stringify(state)));
    assert.equal(model.collect(loaded,'pig',9999999).quantity,expected);
  }
});
test('Super Premium sem saúde acima de 80% produz apenas o item normal',()=>{
  const state=model.feed({rations:{super:1},pets:{chicken:{readyAt:0,health:80}}},'chicken',100,'super',()=>0);
  assert.equal(state.pets.chicken.quantity,1);
  assert.equal(state.pets.chicken.health,100);
});
test('Booster combina com Super Premium, não repete e produto dourado vale o dobro',()=>{
  let state=model.feed({rations:{super:1,booster:2},pets:{cow:{readyAt:0}}},'cow',100,'super',()=>0);
  state=model.boost(state,'cow',200,()=>0);
  assert.throws(()=>model.boost(state,'cow',201,()=>0));
  assert.equal(state.rations.booster,1);
  const result=model.collect(model.normalize(JSON.parse(JSON.stringify(state))),'cow',999999);
  assert.equal(result.quantity,2);assert.equal(result.product,'farm_milk_golden');
  assert.equal(model.products[result.product].sell,model.products.farm_milk.sell*2);
  assert.equal(result.state.pets.cow.booster,true);
});
test('Booster antes da refeição não alimenta; após produzir não pode ser aplicado',()=>{
  const state=model.boost({rations:{booster:1},pets:{duck:{readyAt:0}}},'duck',100,()=>.2);
  assert.equal(model.status(state.pets.duck),'hungry');assert.equal(state.pets.duck.golden,false);
  assert.throws(()=>model.boost({rations:{booster:1},pets:{duck:{readyAt:10}}},'duck',100));
});

test('reserva produz todos os ciclos offline, para sem comida e não duplica no F5',()=>{
  let state={feed:5,pets:{chicken:{readyAt:0}}};
  for(let i=0;i<5;i++)state=model.feed(state,'chicken',1000);
  assert.equal(state.feed,0);assert.equal(state.pets.chicken.queue.length,4);
  state=model.advance(JSON.parse(JSON.stringify(state)),1000+3*180000+500);
  assert.equal(state.pets.chicken.stock,3);assert.equal(state.pets.chicken.queue.length,1);
  const again=model.advance(JSON.parse(JSON.stringify(state)),1000+3*180000+500);
  assert.deepEqual(again,state);
  state=model.advance(state,1000+30*180000);
  assert.equal(state.pets.chicken.stock,5);assert.equal(state.pets.chicken.readyAt,0);
  const result=model.collect(state,'chicken',1000+30*180000);
  assert.deepEqual(result.items,{farm_egg:5});
  assert.throws(()=>model.collect(result.state,'chicken',999999999));
});
test('coleta de comuns e dourados preserva ciclo em andamento e Booster não se repete',()=>{
  let state={feed:3,rations:{super:1,booster:1},pets:{pig:{readyAt:0}}};
  state=model.feed(state,'pig',1000,'super',()=>0);
  state=model.boost(state,'pig',1001,()=>0);
  state=model.feed(state,'pig',1002);
  state.rations.premium=1;state=model.feed(state,'pig',1003,'premium');
  const result=model.collect(state,'pig',1000+2*360000+10);
  assert.deepEqual(result.items,{farm_bacon:1,farm_bacon_golden:2});
  assert.equal(result.state.pets.pig.readyAt,1000+3*360000);
  assert.equal(result.state.pets.pig.booster,true);
});
test('nova refeição após pausa inicia agora e não produz retroativamente',()=>{
  let state=model.feed({feed:2,pets:{duck:{readyAt:0}}},'duck',1000);
  state=model.feed(state,'duck',10000000);
  assert.equal(state.pets.duck.stock,1);
  assert.equal(state.pets.duck.readyAt,10000000+240000);
});
