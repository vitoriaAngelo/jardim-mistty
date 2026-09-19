const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const model=require('../public/animal-model');
const start=1000000;
const state=(health=100)=>({feed:20,rations:{premium:5,super:5,booster:5},pets:{chicken:{health,healthUpdatedAt:start,readyAt:0}}});
function harness(charge = async () => true) {
  const context = vm.createContext({ FarmAnimals:model, G:{livestock:model.normalize(),harvested:{},skillNodes:{}}, effectiveAnimalSkills:()=>({}), gardenHydrated:true,
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


test('saúde cai gradualmente; atualizações frequentes e F5 não mudam a perda',()=>{
  let s=state();
  for(let i=1;i<=600;i++)s=model.advance(s,start+i*1000,{},()=>1);
  assert.ok(Math.abs(s.pets.chicken.health-90)<1e-8);
  const once=model.advance(state(),start+600000,{},()=>1);
  assert.equal(s.pets.chicken.stock,once.pets.chicken.stock);
  const loaded=model.normalize(JSON.parse(JSON.stringify(s)),start+600000);
  assert.ok(Math.abs(model.advance(loaded,start+1200000).pets.chicken.health-80)<1e-8);
});
test('todos os animais produzem continuamente sem novas refeições',()=>{
  for(const [id,a]of Object.entries(model.catalog)){
    let s={pets:{[id]:{health:100,healthUpdatedAt:start}}};
    s=model.advance(s,start+3*a.minutes*60000,{},()=>1);
    assert.equal(s.pets[id].stock,3);assert.ok(s.pets[id].readyAt>start+3*a.minutes*60000);
  }
});
test('15 produz, abaixo de 15 pausa e não recupera ciclos atrasados ao alimentar',()=>{
  let s=state(15);s.pets.chicken.readyAt=start;
  s=model.advance(s,start,{},()=>1);assert.equal(s.pets.chicken.stock,1);
  s=model.advance(s,start+60000);assert.equal(s.pets.chicken.readyAt,0);
  assert.equal(model.status(s.pets.chicken),'hungry');
  s=model.feed(s,'chicken',start+60000,'normal',()=>1);
  assert.equal(s.pets.chicken.readyAt,start+60000+180000);
  assert.equal(s.pets.chicken.stock,1);
});
test('zero remove animal e estoque não recolhido, permitindo nova compra',()=>{
  const s=state(1);s.pets.chicken.stock=7;
  assert.equal(model.advance(s,start+60000).pets.chicken,undefined);
});
test('rações recuperam 20, 50 e 80 e consomem uma unidade sem criar fila',()=>{
  for(const [ration,recovery]of [['normal',20],['premium',50],['super',80]]){
    const s=model.feed(state(10),'chicken',start,ration);
    assert.equal(s.pets.chicken.health,10+recovery);
    assert.equal(s.pets.chicken.queue,undefined);
    assert.equal(ration==='normal'?s.feed:s.rations[ration],ration==='normal'?19:4);
  }
});
test('Super Premium exige saúde acima de 80 na conclusão e mantém chance fixa',()=>{
  for(const [health,roll,expected]of [[84,.339,2],[83,.1,1],[84,.34,1]]){
    let s=state(health);s.pets.chicken.superActive=true;
    s=model.advance(s,start+180000,{criador_dourado:5},()=>roll);
    assert.equal(s.pets.chicken.stock,expected);
  }
  let s=model.feed(state(20),'chicken',start,'super',()=>0);
  s=model.feed(s,'chicken',start,'normal',()=>0);
  s=model.feed(s,'chicken',start,'super',()=>0);
  s=model.advance(s,start+180000,{criador_dourado:5},()=>.34);
  assert.equal(s.pets.chicken.stock,1);
});
test('booster funciona em vários ciclos e expira exatamente após 30 minutos',()=>{
  let s=model.boost(state(),'chicken',start,()=>0);
  assert.throws(()=>model.boost(s,'chicken',start+1),/ativo/);
  s=model.advance(s,start+1800000,{},()=>0);
  assert.equal(s.pets.chicken.goldStock,9);assert.equal(s.pets.chicken.stock,1);
  assert.equal(s.pets.chicken.booster,false);
  const again=model.advance(JSON.parse(JSON.stringify(s)),start+1800000,{},()=>0);
  assert.deepEqual(again,s);
});
test('refeições antigas são devolvidas uma única vez e o estoque preservado',()=>{
  let s=state();s.pets.chicken.stock=3;s.pets.chicken.queue=[{ration:'normal'},{ration:'super'}];
  s=model.normalize(s,start);assert.equal(s.feed,21);assert.equal(s.rations.super,6);
  assert.equal(s.pets.chicken.stock,3);assert.deepEqual(model.normalize(s,start),s);
});
test('Rotina Rural reduz duração e mantém ciclos consecutivos',()=>{
  let s=model.advance(state(),start+144000,{rotina_rural:5},()=>1);
  assert.equal(s.pets.chicken.stock,1);assert.equal(s.pets.chicken.readyAt,start+288000);
});
test('bônus de domínio dos animais reduz um minuto e a redefinição restaura o ciclo',()=>{
  const producing=state();producing.pets.chicken.readyAt=start+180000;producing.pets.chicken.cycleDuration=180000;
  let s=model.advance(producing,start+30000,{__animalBranchComplete:true},()=>1);
  assert.equal(s.pets.chicken.cycleDuration,120000);
  assert.equal(s.pets.chicken.readyAt,start+120000);
  s=model.advance(s,start+60000,{},()=>1);
  assert.equal(s.pets.chicken.cycleDuration,180000);
  assert.equal(s.pets.chicken.readyAt,start+180000);
});
