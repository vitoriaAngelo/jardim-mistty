(function (root) {
  'use strict';
  const catalog = {
    chicken: { name:'Galinha', home:'Galinheiro', product:'farm_egg', cost:450, level:1, feed:1, minutes:3, color:'#e9d5a5' },
    cow: { name:'Vaca', home:'Estábulo', product:'farm_milk', cost:1800, level:5, feed:3, minutes:8, color:'#c4d5bd' },
    pig: { name:'Porco', home:'Chiqueirinho', product:'farm_bacon', cost:1200, level:4, feed:2, minutes:6, color:'#e2b9b8' },
    sheep: { name:'Ovelha', home:'Aprisco', product:'farm_wool', cost:1600, level:5, feed:2, minutes:7, color:'#d4c9e4' },
    duck: { name:'Pato', home:'Laguinho', product:'farm_duck_egg', cost:800, level:3, feed:1, minutes:4, color:'#b8d4d2' },
  };
  const products = {
    farm_egg: { name:'Ovo', emoji:'🥚', sell:65 },
    farm_milk: { name:'Leite', emoji:'🥛', sell:220 },
    farm_bacon: { name:'Bacon', emoji:'🥓', sell:155 },
    farm_wool: { name:'Lã', emoji:'🧶', sell:175 },
    farm_duck_egg: { name:'Ovo de pato', emoji:'🥚', sell:95 },
  };
  function normalize(raw) {
    const amount = Number(raw?.feed);
    const state = { feed: Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0, pets:{} };
    for (const id of Object.keys(catalog)) {
      if (raw?.pets?.[id]) {
        const readyAt = Number(raw.pets[id].readyAt);
        state.pets[id] = { readyAt: Number.isFinite(readyAt) && readyAt > 0 ? readyAt : 0 };
      }
    }
    return state;
  }
  function status(pet, now = Date.now()) {
    return !pet ? 'empty' : !pet.readyAt ? 'hungry' : pet.readyAt <= now ? 'ready' : 'producing';
  }
  function feed(raw, id, now = Date.now()) {
    const state = normalize(raw), animal = catalog[id];
    if (!animal || status(state.pets[id], now) !== 'hungry') throw new Error('Este animal não precisa de comida agora.');
    if (state.feed < animal.feed) throw new Error('Compre mais ração na aba Animais da loja.');
    state.feed -= animal.feed;
    state.pets[id].readyAt = now + animal.minutes * 60000;
    return state;
  }
  function collect(raw, id, now = Date.now()) {
    const state = normalize(raw);
    if (!catalog[id] || status(state.pets[id], now) !== 'ready') throw new Error('O produto ainda não está pronto.');
    state.pets[id].readyAt = 0;
    return { state, product:catalog[id].product, quantity:1 };
  }
  const api = { catalog, products, normalize, status, feed, collect, feedCost:20 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FarmAnimals = api;
})(globalThis);
