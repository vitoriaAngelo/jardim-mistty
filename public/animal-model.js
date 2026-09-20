(function (root) {
  'use strict';
  const catalog = {
    chicken: { name:'Galinha', home:'Galinheiro', product:'farm_egg', cost:2250, level:1, feed:1, minutes:4, color:'#e9d5a5' },
    cow: { name:'Vaca', home:'Estábulo', product:'farm_milk', cost:9000, level:5, feed:4, minutes:9, color:'#c4d5bd' },
    pig: { name:'Porco', home:'Chiqueirinho', product:'farm_bacon', cost:6000, level:4, feed:3, minutes:7, color:'#e2b9b8' },
    sheep: { name:'Ovelha', home:'Aprisco', product:'farm_wool', cost:8000, level:5, feed:3, minutes:8, color:'#d4c9e4' },
    duck: { name:'Pato', home:'Laguinho', product:'farm_duck_egg', cost:4000, level:3, feed:1, minutes:5, color:'#b8d4d2' },
  };
  const products = {
    farm_egg: { name:'Ovo', emoji:'🥚', sell:65 },
    farm_milk: { name:'Leite', emoji:'🥛', sell:220 },
    farm_bacon: { name:'Bacon', emoji:'🥓', sell:155 },
    farm_wool: { name:'Lã', emoji:'🧶', sell:175 },
    farm_duck_egg: { name:'Ovo de pato', emoji:'🥚', sell:95 },
  };
  for (const [id,p] of Object.entries(products)) products[id+'_golden'] = {...p,name:p.name+' dourado',sell:p.sell*2,golden:true,base:id};
  const rations = {
    normal:{name:'Normal',cost:20,color:'#d5bc91',description:'Recupera 20% da saúde do animal.'},
    premium:{name:'Premium',cost:90,color:'#e6c66f',description:'Recupera 50% da saúde do animal.'},
    super:{name:'Super Premium',cost:120,color:'#b9a0d7',description:'Com 80% de saúde ou mais, recupera até 100% e concede por 30 minutos 34% de chance de produzir 1 item extra.'},
    booster:{name:'Booster',cost:30,color:'#9cc8bc',description:'Dura 30 minutos e dá chance de produto dourado, que vale o dobro.'},
  };
  const MIN_HEALTH_TO_PRODUCE = 15;
  const ITEMS_PER_CYCLE = 5;
  const HEALTH_MS = 60000; // Um ponto por minuto, sem arredondar o estado salvo.
  const AGE_STAGE_DAYS = 30;
  const MAX_AGE_DAYS = AGE_STAGE_DAYS * 4;
  const AGE_STAGES = [
    { name:'Filhote', icon:'🐣' },
    { name:'Jovem', icon:'🐤' },
    { name:'Adulto', icon:'🐓' },
    { name:'Velho', icon:'🪶' },
  ];
  const level = (skills, key, max) => Math.min(max, Math.max(0, Number(skills[key]) || 0));
  function duration(id, skills = {}) {
    const reducedBySkills = catalog[id].minutes * 60000 * (1 - level(skills,'rotina_rural',5)*.04);
    return Math.max(1000, reducedBySkills - (skills.__animalBranchComplete === true ? 60000 : 0));
  }
  function count(n) { return Number.isFinite(Number(n)) ? Math.max(0, Math.floor(Number(n))) : 0; }
  function normalize(raw, now = Date.now()) {
    const state = {feed:count(raw?.feed), pets:{}, rations:{}, deaths:[]};
    for (const key of ['premium','super','booster']) state.rations[key]=count(raw?.rations?.[key]);
    for (const id of Object.keys(catalog)) {
      const source=raw?.pets?.[id]; if (!source) continue;
      const stamp=Number(source.healthUpdatedAt);
      const health=Number(source.health);
      state.pets[id]={
        name:typeof source.name==='string'?source.name.slice(0,15):'',
        health:Number.isFinite(health)?Math.max(0,Math.min(100,health)):100,
        healthUpdatedAt:Number.isFinite(stamp)&&stamp>=0?stamp:now,
        ageDays:Math.max(0,Number(source.ageDays)||(Number(source.ageMs)||0)/86400000),
        readyAt:Math.max(0,Number(source.readyAt)||0),
        cycleDuration:Math.max(1000,Number(source.cycleDuration)||duration(id)),
        ration:['normal','premium','super'].includes(source.ration)?source.ration:'normal',
        superUntil:Math.max(0,Number(source.superUntil)||0),
        superActive:Number(source.superUntil)>now&&(Number.isFinite(health)?health:100)>=80,
        boosterUntil:Math.max(0,Number(source.boosterUntil)||0),
        booster:source.booster===true,
        stock:count(source.stock),goldStock:count(source.goldStock),
        healthVersion:2
      };
      // Restitui refeições antigas ainda não consumidas; a nova regra não usa fila.
      if (source.healthVersion!==2 && Array.isArray(source.queue)) {
        for (const meal of source.queue) {
          if (meal?.ration==='premium'||meal?.ration==='super') state.rations[meal.ration]++;
          else state.feed++;
        }
      }
    }
    return state;
  }
  function status(pet) { return !pet?'empty':pet.health<15?'hungry':'producing'; }
  function lifeStage(pet) {
    const ageDays=Math.max(0,Number(pet?.ageDays)||0);
    const index=Math.min(AGE_STAGES.length-1,Math.floor(ageDays/AGE_STAGE_DAYS));
    const start=index*AGE_STAGE_DAYS, end=Math.min(MAX_AGE_DAYS,start+AGE_STAGE_DAYS);
    return { ...AGE_STAGES[index], index, ageDays, maxAgeDays:MAX_AGE_DAYS, progress:Math.min(100,ageDays/MAX_AGE_DAYS*100), stageProgress:Math.min(100,(ageDays-start)/(end-start)*100), remainingDays:Math.max(0,end-ageDays), next:index===AGE_STAGES.length-1?'fim da vida':'próxima fase' };
  }
  function itemsAtAge(ageDays) {
    const stage=Math.min(AGE_STAGES.length-1,Math.floor(Math.max(0,Number(ageDays)||0)/AGE_STAGE_DAYS));
    return [2,5,7,12][stage];
  }
  function advance(raw, now=Date.now(), skills={}, random=Math.random) {
    const state=normalize(raw,now);
    for (const [id,pet] of Object.entries(state.pets)) {
      const start=pet.healthUpdatedAt, end=Math.max(start,now);
      const healthAt=time=>Math.max(0,pet.health-Math.max(0,time-start)/HEALTH_MS);
      const healthDeathAt=start+pet.health*HEALTH_MS;
      const productionEnd=Math.min(start+Math.max(0,pet.health-15)*HEALTH_MS,healthDeathAt);
      const ms=duration(id,skills);
      const previousCycleDuration=Number(pet.cycleDuration)||duration(id);
      if(pet.readyAt>0&&previousCycleDuration!==ms){pet.readyAt+=ms-previousCycleDuration;pet.cycleDuration=ms;}
      if (!pet.readyAt && pet.health>=15) {pet.readyAt=start+ms;pet.cycleDuration=ms;}
      // Avalia os bônus no instante de cada produto, inclusive durante ausência.
      while (pet.readyAt>0 && pet.readyAt<=end && pet.readyAt<=productionEnd && pet.readyAt<healthDeathAt) {
        const time=pet.readyAt;
        const extra=pet.superUntil>time && healthAt(time)>=80 && random()<.34;
        const golden=pet.boosterUntil>time && random()<(.2+level(skills,'criador_dourado',5)*.04);
        pet[golden?'goldStock':'stock']+=itemsAtAge(pet.ageDays)+(extra?1:0);
        pet.readyAt+=ms;pet.cycleDuration=ms;
      }
      pet.health=healthAt(end);pet.healthUpdatedAt=end;
      pet.superActive=pet.superUntil>end&&pet.health>=80;
      if(pet.superUntil<=end)pet.superUntil=0;
      pet.booster=pet.boosterUntil>end;
      if(!pet.booster)pet.boosterUntil=0;
      if(pet.health<15)pet.readyAt=0;
      if(pet.health<=0){state.deaths.push({id,name:pet.name,reason:'health',stock:pet.stock,goldStock:pet.goldStock});delete state.pets[id];}
    }
    return state;
  }
  function advanceGameDay(raw) {
    const state=normalize(raw);
    for(const [id,pet] of Object.entries(state.pets)){
      pet.ageDays=Math.min(MAX_AGE_DAYS,pet.ageDays+1);
      if(pet.ageDays>=MAX_AGE_DAYS){state.deaths.push({id,name:pet.name,reason:'old-age',stock:pet.stock,goldStock:pet.goldStock});delete state.pets[id];}
    }
    return state;
  }
  function feed(raw,id,now=Date.now(),ration='normal',random=Math.random,skills={}) {
    const state=advance(raw,now,skills,random),pet=state.pets[id];
    if(!pet)throw new Error('Compre este animal primeiro.');
    if(!['normal','premium','super'].includes(ration))throw new Error('Escolha uma ração para alimentar.');
    if(ration==='super'&&pet.health<80)throw new Error('A Ração Super Premium só pode ser aplicada com 80% de vida ou mais.');
    if(ration==='normal'){if(state.feed<1)throw new Error('Compre mais ração na aba Rações da loja.');state.feed--;}
    else {if(state.rations[ration]<1)throw new Error('Esta ração acabou. Visite a aba Rações da loja.');state.rations[ration]--;}
    const recovery=ration==='super'?80:ration==='premium'?50+level(skills,'cuidado_especial',5)*10:20+level(skills,'trato_amigo',3)*5;
    pet.health=Math.min(100,pet.health+recovery);
    if(ration==='super')pet.superUntil=now+30*60000;
    pet.superActive=pet.superUntil>now&&pet.health>=80;
    pet.ration=ration;
    if(!pet.readyAt&&pet.health>=15){pet.cycleDuration=duration(id,skills);pet.readyAt=now+pet.cycleDuration;}
    return state;
  }
  function collect(raw,id,now=Date.now(),skills={},random=Math.random) {
    const state=advance(raw,now,skills,random),pet=state.pets[id];
    if(!pet||!pet.stock&&!pet.goldStock)throw new Error('O produto ainda não está pronto.');
    const items={};if(pet.stock)items[catalog[id].product]=pet.stock;
    if(pet.goldStock)items[catalog[id].product+'_golden']=pet.goldStock;
    const quantity=pet.stock+pet.goldStock;pet.stock=0;pet.goldStock=0;
    return {state,items,product:Object.keys(items)[0],quantity};
  }
  function boost(raw,id,now=Date.now(),random=Math.random,skills={}) {
    const state=advance(raw,now,skills,random),pet=state.pets[id];
    if(!pet)throw new Error('Compre este animal primeiro.');
    if(pet.booster)throw new Error('O Booster já está ativo. Aguarde o tempo terminar.');
    if(state.rations.booster<1)throw new Error('Compre Booster na aba Rações da loja.');
    state.rations.booster--;pet.booster=true;pet.boosterUntil=now+1800000;return state;
  }
  function rename(raw,id,name) {
    const state=advance(raw),pet=state.pets[id];if(!pet)throw new Error('Compre este animal primeiro.');
    pet.name=String(name||'').trim().slice(0,15);return state;
  }
  const api={catalog,products,rations,normalize,advance,advanceGameDay,status,lifeStage,itemsAtAge,feed,boost,collect,rename,duration,feedCost:20,itemsPerCycle:ITEMS_PER_CYCLE,ageStageDays:AGE_STAGE_DAYS,maxAgeDays:MAX_AGE_DAYS};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.FarmAnimals=api;
})(globalThis);
