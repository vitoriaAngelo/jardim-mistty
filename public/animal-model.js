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
    normal:{name:'Normal',cost:20,color:'#d5bc91',description:'Uma porção por unidade. Galinha e pato: 1; vaca: 4; porco e ovelha: 3.'},
    premium:{name:'Premium',cost:55,color:'#e6c66f',description:'Uma unidade alimenta completamente qualquer animal.'},
    super:{name:'Super Premium',cost:65,color:'#b9a0d7',description:'Alimenta completamente com 1 unidade e tem 35% de chance de produzir 1 item extra.'},
    booster:{name:'Booster',cost:15,color:'#9cc8bc',description:'Complemento: 20% de chance de produto dourado, que vale o dobro. Uma aplicação por animal a cada ciclo. Não substitui a refeição.'},
  };
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
        state.pets[id] = { readyAt: Number.isFinite(readyAt) && readyAt > 0 ? readyAt : 0,
          quantity:raw.pets[id].quantity===2?2:1, booster:raw.pets[id].booster===true,
          golden:raw.pets[id].booster===true && raw.pets[id].golden===true };
      }
    }
    return state;
  }
  function status(pet, now = Date.now()) {
    return !pet ? 'empty' : !pet.readyAt ? 'hungry' : pet.readyAt <= now ? 'ready' : 'producing';
  }
  function feed(raw, id, now = Date.now(), ration = 'normal', random = Math.random) {
    const state = normalize(raw), animal = catalog[id];
    if (!animal || status(state.pets[id], now) !== 'hungry') throw new Error('Este animal não precisa de comida agora.');
    if (!['normal','premium','super'].includes(ration)) throw new Error('Escolha uma ração para alimentar.');
    if (ration==='normal') {
      if (state.feed < animal.feed) throw new Error('Compre mais ração na aba Rações da loja.');
      state.feed -= animal.feed;
    } else {
      if (state.rations[ration]<1) throw new Error('Esta ração acabou. Visite a aba Rações da loja.');
      state.rations[ration]--;
    }
    state.pets[id].quantity = ration==='super' && random()<.35 ? 2 : 1;
    state.pets[id].readyAt = now + animal.minutes * 60000;
    return state;
  }
  function collect(raw, id, now = Date.now()) {
    const state = normalize(raw);
    if (!catalog[id] || status(state.pets[id], now) !== 'ready') throw new Error('O produto ainda não está pronto.');
    const pet=state.pets[id], quantity=pet.quantity;
    const product=catalog[id].product+(pet.golden?'_golden':'');
    state.pets[id] = {readyAt:0,quantity:1,booster:false,golden:false};
    return { state, product, quantity };
  }
  function boost(raw,id,now=Date.now(),random=Math.random) {
    const state=normalize(raw),pet=state.pets[id];
    if (!pet || status(pet,now)==='ready') throw new Error('Adicione o Booster antes de o produto ficar pronto.');
    if (pet.booster) throw new Error('Este animal já recebeu Booster neste ciclo.');
    if (state.rations.booster<1) throw new Error('Compre Booster na aba Rações da loja.');
    state.rations.booster--;pet.booster=true;pet.golden=random()<.2;
    return state;
  }
  const api = { catalog, products, rations, normalize, status, feed, boost, collect, feedCost:20 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FarmAnimals = api;
})(globalThis);
