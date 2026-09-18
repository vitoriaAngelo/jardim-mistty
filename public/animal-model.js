(function (root) {
  'use strict';
  const catalog = {
    chicken: { name:'Galinha', home:'Galinheiro', product:'farm_egg', cost:450, level:1, feed:1, minutes:3, color:'#e9d5a5' },
    cow: { name:'Vaca', home:'Estábulo', product:'farm_milk', cost:1800, level:5, feed:4, minutes:8, color:'#c4d5bd' },
    pig: { name:'Porco', home:'Chiqueirinho', product:'farm_bacon', cost:1200, level:4, feed:3, minutes:6, color:'#e2b9b8' },
    sheep: { name:'Ovelha', home:'Aprisco', product:'farm_wool', cost:1600, level:5, feed:3, minutes:7, color:'#d4c9e4' },
    duck: { name:'Pato', home:'Laguinho', product:'farm_duck_egg', cost:800, level:3, feed:1, minutes:4, color:'#b8d4d2' },
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
    normal:{name:'Normal',cost:20,color:'#d5bc91',description:'Recupera 20% da saúde. Galinha e pato: 1; vaca: 4; porco e ovelha: 3.'},
    premium:{name:'Premium',cost:90,color:'#e6c66f',description:'Recupera 50% da saúde do animal.'},
    super:{name:'Super Premium',cost:120,color:'#b9a0d7',description:'Recupera 80% da saúde e tem 34% de chance de produzir 1 item extra.'},
    booster:{name:'Booster',cost:30,color:'#9cc8bc',description:'Dura 30 minutos e dá chance de produto dourado, que vale o dobro.'},
  };
  const HEALTH_MAX = 100;
  const HEALTH_DECAY_PER_HOUR = 10;
  function healthAfterIdle(health, lastHealthAt, now) {
    const elapsedHours = Math.max(0, now - lastHealthAt) / 3600000;
    return Math.max(0, Math.round(health - elapsedHours * HEALTH_DECAY_PER_HOUR));
  }
  function normalize(raw) {
    const amount = Number(raw?.feed);
    const state = { feed: Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0, pets:{} };
    state.rations = {};
    for (const id of ['premium','super','booster']) {
      const count=Number(raw?.rations?.[id]);
      state.rations[id]=Number.isFinite(count)?Math.max(0,Math.floor(count)):0;
    }
    for (const id of Object.keys(catalog)) {
      if (raw?.pets?.[id]) {
        const readyAt = Number(raw.pets[id].readyAt);
        const savedHealth = Number(raw.pets[id].health);
        const savedHealthAt = Number(raw.pets[id].healthUpdatedAt);
        state.pets[id] = { name: typeof raw.pets[id].name === 'string' ? raw.pets[id].name.slice(0,15) : '', readyAt: Number.isFinite(readyAt) && readyAt > 0 ? readyAt : 0,
          health: Number.isFinite(savedHealth) ? Math.max(0, Math.min(HEALTH_MAX, savedHealth)) : HEALTH_MAX,
          healthUpdatedAt: Number.isFinite(savedHealthAt) && savedHealthAt > 0 ? savedHealthAt : Date.now(),
          quantity:raw.pets[id].quantity===2?2:1, ration:['normal','premium','super'].includes(raw.pets[id].ration)?raw.pets[id].ration:'normal', booster:raw.pets[id].booster===true, boosterUntil:Number(raw.pets[id].boosterUntil) || 0,
          golden:raw.pets[id].booster===true && raw.pets[id].golden===true,
          queue:Array.isArray(raw.pets[id].queue)?raw.pets[id].queue.map(meal=>({quantity:meal?.quantity===2?2:1,ration:['normal','premium','super'].includes(meal?.ration)?meal.ration:'normal',duration:Number.isFinite(Number(meal?.duration))?Number(meal.duration):null})):[],
          stock:count(raw.pets[id].stock),goldStock:count(raw.pets[id].goldStock) };
      }
    }
    return state;
  }
  function status(pet, now = Date.now()) {
    return !pet ? 'empty' : pet.readyAt>now ? 'producing' : pet.readyAt || pet.stock || pet.goldStock ? 'ready' : 'hungry';
  }
  function count(n) { n=Number(n);return Number.isSafeInteger(n)&&n>0?n:0; }
  function advance(raw,now=Date.now()) {
    const state=normalize(raw);
    for(const [id,pet] of Object.entries(state.pets)) {
      if (!pet.readyAt && !pet.queue.length) {
        pet.health = healthAfterIdle(pet.health, pet.healthUpdatedAt, now);
        pet.healthUpdatedAt = now;
        if (pet.health <= 0) { delete state.pets[id]; continue; }
      } else {
        pet.healthUpdatedAt = now;
      }
      if (pet.boosterUntil && pet.boosterUntil <= now) { pet.booster=false; pet.boosterUntil=0; pet.golden=false; }
      while(pet.readyAt>0 && pet.readyAt<=now) {
        pet[pet.golden?'goldStock':'stock']+=pet.quantity;
        const next=pet.queue.shift();
        pet.quantity=next?.quantity || 1;pet.ration=next?.ration || 'normal';pet.booster=false;pet.golden=false;
        pet.readyAt=next?pet.readyAt+(next.duration || catalog[id].minutes)*60000:0;
      }
    }
    return state;
  }
  function feed(raw, id, now = Date.now(), ration = 'normal', random = Math.random, skills = {}) {
    const state = advance(raw,now), animal = catalog[id];
    if (!animal || !state.pets[id]) throw new Error('Compre este animal primeiro.');
    if (!['normal','premium','super'].includes(ration)) throw new Error('Escolha uma ração para alimentar.');
    if (state.pets[id].readyAt && state.pets[id].queue.length >= 9) throw new Error('A fila já está cheia (máximo de 10 refeições).');
    const normalCost = Math.max(1, animal.feed - Number(skills.trato_amigo || 0));
    if (ration==='normal') {
      if (state.feed < normalCost) throw new Error('Compre mais ração na aba Rações da loja.');
      state.feed -= normalCost;
    } else {
      if (state.rations[ration]<1) throw new Error('Esta ração acabou. Visite a aba Rações da loja.');
      state.rations[ration]--;
    }
    const healthRecovery = ration === 'super' ? 80 : ration === 'premium' ? 50 : 20;
    const quantity=ration==='super' && random()<(.34 + Number(skills.cuidado_especial || 0) * .03) ? 2 : 1;
    const productionMinutes = catalog[id].minutes * (1 - Number(skills.rotina_rural || 0) * .04);
    state.pets[id].health = Math.min(HEALTH_MAX, state.pets[id].health + healthRecovery);
    state.pets[id].healthUpdatedAt = now;
    if(state.pets[id].readyAt) {
      state.pets[id].queue.push({quantity,ration,duration:productionMinutes});
    } else {state.pets[id].quantity=quantity;state.pets[id].ration=ration;state.pets[id].readyAt=now+productionMinutes*60000;}
    return state;
  }
  function collect(raw, id, now = Date.now()) {
    const state = advance(raw,now),pet=state.pets[id];
    if (!catalog[id] || !pet || !pet.stock&&!pet.goldStock) throw new Error('O produto ainda não está pronto.');
    const items={};
    if(pet.stock)items[catalog[id].product]=pet.stock;
    if(pet.goldStock)items[catalog[id].product+'_golden']=pet.goldStock;
    const quantity=pet.stock+pet.goldStock,product=Object.keys(items)[0];
    pet.stock=0;pet.goldStock=0;
    return {state,items,product,quantity};
  }
  function boost(raw,id,now=Date.now(),random=Math.random, skills = {}) {
    const state=advance(raw,now),pet=state.pets[id];
    if (!pet || !pet.readyAt && (pet.stock||pet.goldStock)) throw new Error('Inicie uma nova refeição antes de adicionar o Booster.');
    if (pet.booster) throw new Error('Este animal já recebeu Booster neste ciclo.');
    if (state.rations.booster<1) throw new Error('Compre Booster na aba Rações da loja.');
    state.rations.booster--;pet.booster=true;pet.boosterUntil=now+30*60000;pet.golden=random()<(.2 + Number(skills.criador_dourado || 0) * .04);
    return state;
  }
  function rename(raw,id,name) {
    const state=advance(raw), pet=state.pets[id];
    if (!pet) throw new Error('Compre este animal primeiro.');
    pet.name=String(name||'').trim().slice(0,15);
    return state;
  }
  const api = { catalog, products, rations, normalize, advance, status, feed, boost, collect, rename, feedCost:20 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FarmAnimals = api;
})(globalThis);
