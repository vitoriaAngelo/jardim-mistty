/* Desenhos vetoriais próprios, compartilhados entre loja e cercadinhos. */
const lowHealthAnimalWarnings = new Set();
function animalArt(id) {
  const eye = (x,y) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="3.3" fill="#535442"/><circle cx="${x+.6}" cy="${y-1}" r=".7" fill="#fff"/>`;
  const shapes = {
    chicken: `<path d="M49 97L30 74 32 99 44 108" fill="#c99c75"/><ellipse cx="77" cy="94" rx="34" ry="28" fill="#fff5dc"/><path d="M64 91q-20 2-12 20 23 4 26-12" fill="#e9d8ac"/><circle cx="95" cy="72" r="20" fill="#fff5dc"/><path d="M83 55q-8-17 3-15 5-10 10 1 11-6 10 10" fill="#cf8a85"/><path d="m111 73 13 6-13 6" fill="#d4a358"/>${eye(102,69)}<path d="M68 118v10m20-10v10M62 129h13m7 0h13" stroke="#bc9460" stroke-width="3" stroke-linecap="round"/><ellipse cx="103" cy="80" rx="4" ry="2" fill="#ebc1ae"/>`,
    cow: `<path d="M48 113v18m21-16v16m30-18v18m16-21v21" stroke="#ddd8c4" stroke-width="10" stroke-linecap="round"/><ellipse cx="76" cy="97" rx="38" ry="26" fill="#f2eee1"/><path d="M52 77q26-10 24 10t-25 16q-16-7 1-26m43 9q22-4 20 15t-18 12" fill="#8d9380"/><path d="M98 60 94 45q12 0 15 15m15 1 10-15q7 11-1 23" fill="#ceb68b"/><ellipse cx="94" cy="72" rx="14" ry="8" fill="#b0baa0"/><ellipse cx="134" cy="74" rx="13" ry="8" fill="#b0baa0"/><rect x="99" y="59" width="33" height="44" rx="16" fill="#f2eee1"/>${eye(107,76)}${eye(123,76)}<ellipse cx="116" cy="94" rx="20" ry="12" fill="#dcb8ac"/><circle cx="109" cy="94" r="2" fill="#a78176"/><circle cx="123" cy="94" r="2" fill="#a78176"/>`,
    pig: `<path d="M50 114v14m49-14v14" stroke="#d4a1a1" stroke-width="11" stroke-linecap="round"/><path d="M36 98q-18-17-16-1t15 1" fill="none" stroke="#d4a1a1" stroke-width="4"/><ellipse cx="72" cy="99" rx="38" ry="28" fill="#e8c0bf"/><path d="M83 75 80 51 103 63m7 1 23-12-6 26" fill="#d9a6aa"/><circle cx="106" cy="89" r="29" fill="#efccca"/>${eye(95,83)}${eye(119,83)}<ellipse cx="107" cy="100" rx="17" ry="11" fill="#d9a2a6"/><ellipse cx="101" cy="100" rx="2" ry="3" fill="#a4777d"/><ellipse cx="113" cy="100" rx="2" ry="3" fill="#a4777d"/>`,
    sheep: `<path d="M48 112v18m22-17v17m30-18v18" stroke="#979380" stroke-width="8" stroke-linecap="round"/><g fill="#f5efde" stroke="#ded7c1" stroke-width="1.5"><circle cx="48" cy="91" r="20"/><circle cx="59" cy="75" r="19"/><circle cx="81" cy="73" r="21"/><circle cx="98" cy="86" r="22"/><circle cx="86" cy="106" r="23"/><circle cx="59" cy="108" r="22"/></g><ellipse cx="104" cy="89" rx="22" ry="28" fill="#b2ac97"/><ellipse cx="87" cy="76" rx="13" ry="7" fill="#b2ac97"/><ellipse cx="125" cy="76" rx="13" ry="7" fill="#b2ac97"/>${eye(97,86)}${eye(113,86)}<path d="m101 99 4 3 4-3" fill="none" stroke="#706b5a" stroke-width="2"/><g fill="#f7f1e2"><circle cx="96" cy="64" r="9"/><circle cx="107" cy="61" r="10"/><circle cx="117" cy="65" r="8"/></g>`,
    duck: `<ellipse cx="78" cy="125" rx="55" ry="11" fill="#9fc9c2" opacity=".7"/><path d="M49 103 31 90q-2 27 37 29" fill="#e2dac2"/><ellipse cx="78" cy="103" rx="34" ry="22" fill="#f5edcf"/><path d="M93 100V77q0-22 17-22t15 23q-1 18-19 31" fill="#b4c7a2"/><ellipse cx="126" cy="78" rx="14" ry="6" fill="#d7ac6f"/>${eye(115,68)}<path d="M57 99q13-10 28 3-2 15-21 11" fill="#d6c9a7"/><path d="M40 133h33m26-2h29" stroke="#d8ece3" stroke-width="2" stroke-linecap="round"/>`,
  };
  return `<svg viewBox="0 0 160 160" role="img" aria-label="${FarmAnimals.catalog[id].name}"><ellipse cx="80" cy="133" rx="61" ry="14" fill="#aaba8d" opacity=".4"/><path d="M18 51 39 30 62 51" fill="none" stroke="#b2a081" stroke-width="5" stroke-linecap="round"/><path d="M25 48v42h32V48" fill="#d7c8a9" opacity=".5"/><g class="animal-body">${shapes[id]}</g><g fill="#c5b48e" stroke="#a18e70" stroke-width="1.5"><rect x="15" y="130" width="130" height="6" rx="2"/><rect x="15" y="143" width="130" height="5" rx="2"/><rect x="22" y="120" width="8" height="35" rx="3"/><rect x="75" y="123" width="8" height="32" rx="3"/><rect x="130" y="120" width="8" height="35" rx="3"/></g></svg>`;
}
function animalProductArt(type) {
  const golden=FarmAnimals.products[type]?.golden;
  if (golden) type=FarmAnimals.products[type].base;
  const shapes = {
    farm_egg: '<path d="M30 8C19 8 12 29 12 38a18 18 0 0 0 36 0C48 29 41 8 30 8Z" fill="#efd9b4" stroke="#b89b72" stroke-width="2"/><ellipse cx="23" cy="28" rx="4" ry="8" fill="#fff5df"/>',
    farm_duck_egg: '<path d="M30 5C18 5 10 28 10 38a20 20 0 0 0 40 0C50 28 42 5 30 5Z" fill="#c7ddd0" stroke="#88a896" stroke-width="2"/><g fill="#a5beaa"><circle cx="24" cy="35" r="2"/><circle cx="35" cy="42" r="2"/><circle cx="37" cy="28" r="1.5"/></g><ellipse cx="23" cy="23" rx="3" ry="6" fill="#edf5e6"/>',
    farm_milk: '<path d="M23 8h14v12l8 10v22q-15 5-30 0V30l8-10Z" fill="#e4eee6" stroke="#8fa49b" stroke-width="2"/><path d="M17 32h26v18q-13 4-26 0Z" fill="#fffaf0"/><rect x="21" y="6" width="18" height="7" rx="2" fill="#a5baa2"/><rect x="21" y="34" width="18" height="13" rx="4" fill="#d6dec2"/><path d="M30 37q-10 10 0 8 9 2 0-8" fill="#fffdf5"/>',
    farm_wool: '<g fill="#eee6da" stroke="#beb3a3" stroke-width="1.5"><circle cx="21" cy="24" r="12"/><circle cx="36" cy="22" r="13"/><circle cx="43" cy="37" r="12"/><circle cx="28" cy="42" r="13"/><circle cx="15" cy="37" r="11"/></g><path d="M16 38q15-16 29-5M19 45q14-13 29-7M18 20q17 9 18 29" fill="none" stroke="#c7bda9" stroke-width="2"/><path d="M39 48q17-1 13 8" fill="none" stroke="#bdb09d" stroke-width="3"/>',
    farm_bacon: '<path d="M11 14q10-6 19 0t19 0v12q-10 6-19 0t-19 0Z" fill="#cb9390" stroke="#b57b79"/><path d="M11 19q10-6 19 0t19 0" fill="none" stroke="#f3d4ba" stroke-width="4"/><path d="M9 34q10-6 19 0t22 0v13q-12 6-22 0t-19 0Z" fill="#cb9390" stroke="#b57b79"/><path d="M9 40q10-6 19 0t22 0" fill="none" stroke="#f3d4ba" stroke-width="4"/>',
    feed: '<path d="M18 10h24l-3 10q13 13 10 31-19 8-38 0-3-18 10-31Z" fill="#d5bc91" stroke="#a18a62" stroke-width="2"/><path d="M19 19h22" stroke="#806e52" stroke-width="3"/><ellipse cx="30" cy="37" rx="12" ry="11" fill="#f2e5c5"/><path d="M30 45V29m0 8-6-4m6 9 7-5" stroke="#899767" stroke-width="2" fill="none"/>',
  };
  return `<span class="animal-product-art ${golden?'animal-golden':''}"><svg viewBox="0 0 60 60" aria-hidden="true">${shapes[type] || ''}</svg>${golden?'<span class="animal-gold-tag">✦ Dourado · 2×</span>':''}</span>`;
}
function rationArt(type) {
  return animalProductArt('feed').replace('#d5bc91',FarmAnimals.rations[type].color);
}
function openRationShop() { openShop();switchShopTab('racoes'); }
const rationShopQty = {};
function changeRationQty(id, delta) { rationShopQty[id] = Math.max(1, Math.min(99, Number(rationShopQty[id] || 1) + delta)); renderRationShop(); }
function setRationShopQty(id, value, input) {
  const parsed=Number(value);
  if(!Number.isInteger(parsed)||parsed<1){if(input&&value==='')input.value=rationShopQty[id]||1;return;}
  const qty=Math.max(1,Math.min(99,parsed));rationShopQty[id]=qty;
  if(input&&qty!==parsed)input.value=qty;
  const ration=FarmAnimals.rations[id],button=document.querySelector(`[data-ration-buy="${id}"]`);
  if(button&&ration)button.textContent=`Comprar · ${(ration.cost*qty).toLocaleString('pt-BR')} pts`;
}
function buyRationFromShop(id) { return animalAction('ration',id,'normal',rationShopQty[id]||1); }
function renderRationShop() {
  const root=document.getElementById('ration-shop');if(!root)return;
  const state=animalState();
  root.innerHTML='<p class="animal-note">Digite a quantidade desejada (até 99) ou use − e +. O valor total é atualizado antes da compra.</p><div class="animal-shop-grid">'+Object.entries(FarmAnimals.rations).map(([id,r])=>{const qty=Number(rationShopQty[id]||1);return `<article class="animal-shop-card">${rationArt(id)}<h4>Ração ${r.name}</h4><p class="animal-shop-details">${r.description}</p><p>Na despensa: ${id==='normal'?state.feed:state.rations[id]}</p><div class="ration-quantity"><button type="button" aria-label="Diminuir quantidade" onclick="changeRationQty('${id}',-1)">−</button><input type="number" min="1" max="99" step="1" value="${qty}" aria-label="Quantidade de Ração ${r.name}" oninput="setRationShopQty('${id}',this.value,this)"><button type="button" aria-label="Aumentar quantidade" onclick="changeRationQty('${id}',1)">+</button></div><button class="animal-action" data-ration-buy="${id}" onclick="buyRationFromShop('${id}')" ${animalActionInFlight?'disabled':''}>Comprar · ${(r.cost*qty).toLocaleString('pt-BR')} pts</button></article>`;}).join('')+'</div>';
}
function feedAnimalChoice(id, ration = 'normal') { return animalAction('feed', id, ration); }
let animalActionInFlight = false;
function switchFarmTab(tab) {
  const animals = tab === 'animals';
  document.getElementById('plots-grid').hidden = animals;
  document.getElementById('animal-yard').hidden = !animals;
  document.getElementById('farm-tab-plants').setAttribute('aria-selected', String(!animals));
  document.getElementById('farm-tab-animals').setAttribute('aria-selected', String(animals));
  if (animals) renderAnimalYard();
}
function openAnimalShop() { openShop(); switchShopTab('animais'); }
function settleAnimalState(next, options = {}) {
  G.livestock=next;
  const notify=options.notify!==false;
  const livingPets=G.livestock.pets||{};
  for(const id of [...lowHealthAnimalWarnings])if(!livingPets[id]||Number(livingPets[id].health)>15)lowHealthAnimalWarnings.delete(id);
  const lowHealthNames=[];
  if(notify)for(const [id,pet] of Object.entries(livingPets)){
    if(Number(pet.health)<=15&&!lowHealthAnimalWarnings.has(id)){
      lowHealthAnimalWarnings.add(id);
      const name=pet.name||FarmAnimals.catalog[id]?.name||'Seu animal';
      lowHealthNames.push(`${name} (${Math.floor(Math.max(0,Number(pet.health)||0))}%)`);
    }
  }
  if(lowHealthNames.length)toast(`⚠️ Vida baixa: ${lowHealthNames.join(', ')}. Dê ração para evitar mortes.`,5000);
  let delivered=false;
  const deaths=G.livestock.deaths||[];
  deaths.forEach(death => {
    const animal=FarmAnimals.catalog[death.id], name=death.name||animal?.name||'Seu animal';
    const reason=death.reason==='old-age'?'chegou ao fim da vida e faleceu de idade avançada':'faleceu: a vida chegou a 0%';
    const normal=Math.max(0,Number(death.stock)||0), golden=Math.max(0,Number(death.goldStock)||0);
    if(animal&&(normal||golden)){
      G.harvested[animal.product]=(G.harvested[animal.product]||0)+normal;
      G.harvested[animal.product+'_golden']=(G.harvested[animal.product+'_golden']||0)+golden;
      if(golden>0&&['farm_egg','farm_duck_egg'].includes(animal.product)){
        const eggType=animal.product==='farm_duck_egg'?'duck_egg':'egg';
        G.recentGoldenEggFinds=[{animalName:String(name).trim().slice(0,40),eggType,quantity:Math.min(1000,golden),at:Date.now()},...(Array.isArray(G.recentGoldenEggFinds)?G.recentGoldenEggFinds:[]).filter(item=>Number(item?.at)>Date.now()-86400000)].slice(0,20);
      }
      delivered=true;
    }
    if(notify)toast(`🕊️ ${name} ${reason}.${normal+golden?` ${normal+golden} produtos que já havia produzido foram enviados ao Mercado.`:''}`,5500);
  });
  for (const [id, pet] of Object.entries(G.livestock.pets || {})) {
    const animal = FarmAnimals.catalog[id];
    const produced = (pet.stock || 0) + (pet.goldStock || 0);
    if (!produced || !animal) continue;
    const normal = pet.stock || 0, golden = pet.goldStock || 0;
    G.harvested[animal.product] = (G.harvested[animal.product] || 0) + normal;
    G.harvested[animal.product + '_golden'] = (G.harvested[animal.product + '_golden'] || 0) + golden;
    if (golden > 0 && ['farm_egg','farm_duck_egg'].includes(animal.product)) {
      const eggType = animal.product === 'farm_duck_egg' ? 'duck_egg' : 'egg';
      const find = { animalName:String(pet.name || animal.name).trim().slice(0,40), eggType, quantity:Math.min(1000,golden), at:Date.now() };
      G.recentGoldenEggFinds = [find, ...(Array.isArray(G.recentGoldenEggFinds) ? G.recentGoldenEggFinds : []).filter(item => Number(item?.at) > Date.now() - 86400000)].slice(0,20);
    }
    pet.stock = 0; pet.goldStock = 0;
    delivered = true;
    if(notify)toast(`🐾 ${pet.name || animal.name} produziu ${produced} ${FarmAnimals.products[animal.product].name}${golden ? ' · ✨ dourado!' : ''}`, 3500);
  }
  if (delivered) {
    renderHarvested();
  }
  if(options.persist!==false&&(delivered||deaths.length))saveGardenToSE().catch(error=>console.warn('Progresso animal aguardando sincronização:',error));
  return G.livestock;
}
function animalState(at=Date.now(),options={}) { return settleAnimalState(FarmAnimals.advance(G.livestock,at,effectiveAnimalSkills()),options); }
function advanceAnimalGameDay(at=Date.now(),options={}) {
  animalState(at,{...options,persist:false});
  const next=settleAnimalState(FarmAnimals.advanceGameDay(G.livestock,effectiveAnimalSkills()),{...options,persist:false});
  if(options.persist!==false)saveGardenToSE().catch(error=>console.warn('Idade dos animais aguardando sincronização:',error));
  return next;
}
function animalTime(ms) { const seconds = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(seconds/60)}min ${String(seconds%60).padStart(2,'0')}s`; }
function renderAnimalYard() {
  const root = document.getElementById('animal-yard'); if (!root) return;
  const state = animalState(), now = Date.now();
  root.innerHTML = `<div class="animal-intro"><div><h3>Um cantinho de carinho</h3><p>Alimente, espere e recolha. Cada bichinho tem seu próprio lar.</p></div></div><div class="animal-pens">${Object.entries(FarmAnimals.catalog).map(([id,a]) => {
    const pet = state.pets[id], status = FarmAnimals.status(pet, now), product = FarmAnimals.products[a.product];
    const boosterRemaining=pet?.booster?Math.max(0,pet.boosterUntil-now):0;
    const superRemaining=pet?.superUntil>now?Math.max(0,pet.superUntil-now):0;
    const petName=pet?.name || a.name;
    const health = pet ? Math.floor(Math.max(0, Math.min(100, Number(pet.health ?? 100)))) : 0;
    const life = pet ? FarmAnimals.lifeStage(pet) : null;
    const message = status === 'empty' ? 'Um lar esperando companhia' : status === 'hungry' ? '🌾 Animal com pouca comida' : '';
    const action = status === 'empty' ? 'openAnimalShop()' : '';
    const progress = status === 'ready' ? 100 : status === 'producing' ? 100*(1-(pet.readyAt-now)/(pet.cycleDuration || a.minutes*60000)) : 0;
    const rationButton=(r,label,qty)=>{const healthBlocked=r==='super'&&pet.health<80;return `<button type="button" class="animal-feed-choice ration-${r} animal-feed-tooltip ${qty?'':'empty'}" data-tooltip="${healthBlocked?'Requer pelo menos 80% de vida. ':''}Adicionar ${label} — ${FarmAnimals.rations[r].description}" aria-label="Adicionar ${label}" onclick="feedAnimalChoice('${id}','${r}')" ${qty&&!healthBlocked&&!animalActionInFlight?'':'disabled'}>${rationArt(r)}<small>${qty}</small></button>`};
    const boosterChoice=pet?`<button type="button" class="animal-feed-choice ration-booster animal-feed-tooltip ${state.rations.booster?'':'empty'}" data-tooltip="Adicionar Booster — ${FarmAnimals.rations.booster.description}" aria-label="Adicionar Booster" onclick="animalAction('booster','${id}')" ${state.rations.booster&&!pet.booster&&status!=='ready'&&!animalActionInFlight?'':'disabled'}>${rationArt('booster')}<small>${state.rations.booster}</small></button>`:'';
    const choice=pet?`<div class="animal-feed-picker" aria-label="Escolha uma ração">${rationButton('normal','Ração Normal',state.feed)}${rationButton('premium','Ração Premium',state.rations.premium)}${rationButton('super','Ração Super Premium',state.rations.super)}${boosterChoice}</div>`:'';
    const reserve='';
    const collect='';
    const boosterStatus=pet?`<div class="animal-booster-status ${pet.booster?'active':''}"><div class="animal-booster-heading"><span>✦ Booster</span><b class="animal-booster-time">${pet.booster?`ativo · ${animalTime(boosterRemaining)}`:'inativo'}</b></div><div class="animal-booster-bar"><span style="width:${pet.booster?Math.max(0,Math.min(100,boosterRemaining/(30*60000)*100)):0}%"></span></div></div>`:'';
    const superStatus=pet?`<div class="animal-super-status ${pet.superActive?'active':superRemaining?'paused':''}"><div class="animal-booster-heading"><span>✦ Super Premium</span><b class="animal-super-time">${superRemaining?`${pet.superActive?'ativo':'pausado'} · ${animalTime(superRemaining)}`:'inativo'}</b></div><div class="animal-booster-bar animal-super-bar"><span style="width:${Math.max(0,Math.min(100,superRemaining/(30*60000)*100))}%"></span></div></div>`:'';
    const productionLabel=pet?(status==='producing'?`Próximo ${product.name.toLowerCase()} em ${animalTime(pet.readyAt-now)}`:'Produção pausada'):'';
    const ageSummary=pet?`<div class="animal-age-summary age-stage-${life.index}" title="${life.name}: ${Math.floor(life.ageDays)} de 120 dias do jogo"><div class="animal-age-heading"><span>${life.icon} ${life.name} · ${FarmAnimals.itemsAtAge(pet.ageDays)} itens/ciclo</span><b>${Math.floor(life.ageDays)} / 120 dias do jogo</b></div><div class="animal-age-bar"><span style="width:${life.progress}%"></span></div><small>${life.index===3?`Fim da vida em ${Math.ceil(life.remainingDays)} dias do jogo`:`Próxima fase em ${Math.ceil(life.remainingDays)} dias do jogo`}</small></div>`:'';
    return `<article class="animal-pen ${status}${pet?.booster?' booster-active':''}">${collect}<span class="animal-home">${a.home}</span>${pet?`<input class="animal-name-input" maxlength="15" value="${petName.replace(/"/g,'&quot;')}" aria-label="Nome do animal" onchange="animalAction('rename','${id}',this.value)" />${ageSummary}${boosterStatus}${superStatus}<div class="animal-production-summary"><div class="animal-production-bar"><span style="width:${Math.max(0,progress)}%"></span></div><small>${productionLabel}</small></div>`:`<h4>${a.name}</h4>`}<div class="animal-scene ${status}">${animalArt(id)}</div>${pet?`<div class="animal-health" title="Vida do animal: ${health}%"><span style="width:${health}%"></span><b>${health}%</b></div>`:''}${pet||message?`<div class="animal-status" data-animal-status="${id}" data-cycle="${pet?`${pet.readyAt}:${health}:${life.index}:${pet.booster?'booster':''}:${pet.boosterUntil||0}:${pet.superActive?'super':''}:${pet.superUntil||0}`:''}">${message}</div>`:''}${reserve}${choice}${status==='empty'?`<button class="animal-action" onclick="${action}">Conhecer na loja</button>`:''}</article>`;
  }).join('')}</div><p class="animal-note">As fases duram 30 dias do jogo cada: Filhote produz 2 itens, Jovem 5, Adulto 7 e Velho 12 por ciclo. O animal cresce enquanto estiver vivo e falece ao completar 120 dias do jogo ou se a vida chegar a 0%. Super Premium pode adicionar 1 item ao rendimento da fase quando o bônus ativar. O estoque já produzido permanece no Mercado.</p><button class="animal-action" onclick="openRationShop()">Comprar rações e Booster</button>`;
}
function renderAnimalShop() {
  const root = document.getElementById('animal-shop'); if (!root) return;
  const state = animalState();
  root.innerHTML = `<p class="animal-note">Cada compra inclui o animal e seu cercadinho. Um de cada espécie por fazenda. A produção cresce com a idade: 2, 5, 7 e 12 itens por ciclo, conforme os dias do jogo. Compre comida na aba Rações; os produtos recolhidos ficam no Mercado.</p><div class="animal-shop-grid">${Object.entries(FarmAnimals.catalog).map(([id,a]) => {
    const owned = !!state.pets[id], locked = currentLevel() < a.level, p = FarmAnimals.products[a.product];
    const habitatOwned=G.animalPremiumHabitats?.[id]===true, habitatLocked=currentLevel()<a.premiumHabitatLevel;
    const habitatLabel=habitatOwned?'Habitat Premium habilitado':habitatLocked?`Libera no nível ${a.premiumHabitatLevel}`:`Comprar · ${a.premiumHabitatCost.toLocaleString('pt-BR')} pts`;
    return `<article class="animal-shop-card"><div class="animal-scene">${animalArt(id)}</div><h4>${a.name}</h4><span class="animal-home">${a.home} incluído</span><div>${animalProductArt(a.product)}</div><div class="animal-shop-details">Produção por ciclo: 2 / 5 / 7 / 12 itens conforme a idade · ${a.minutes} min<br>Ração recupera a saúde do animal<br>Venda base: ${p.sell} pts cada · Nível ${a.level}</div><button class="animal-action" onclick="animalAction('buy','${id}')" ${owned||locked||animalActionInFlight?'disabled':''}>${owned?'Já mora na fazenda':locked?`Libera no nível ${a.level}`:`Comprar · ${a.cost.toLocaleString('pt-BR')} pts`}</button><div class="animal-habitat-premium"><strong>🏡 Habitat Premium</strong><small>Compra única · impede a morte por saúde ou idade.</small><button class="animal-action animal-habitat-action" onclick="buyPremiumAnimalHabitat('${id}')" ${habitatOwned||habitatLocked||animalActionInFlight?'disabled':''}>${habitatLabel}</button></div></article>`;
  }).join('')}</div>`;
}
async function buyPremiumAnimalHabitat(id) {
  if (animalActionInFlight || !gardenHydrated) return;
  const a=FarmAnimals.catalog[id];
  if (!a || G.animalPremiumHabitats?.[id]===true) return;
  if (currentLevel()<a.premiumHabitatLevel) { toast(`🔒 O Habitat Premium da ${a.name} libera no nível ${a.premiumHabitatLevel}.`,3500); return; }
  animalActionInFlight=true;
  try {
    if (!await chargeGamePoints(a.premiumHabitatCost, `Habitat Premium: ${a.name}`)) return;
    G.animalPremiumHabitats={...(G.animalPremiumHabitats||{}),[id]:true};
    renderAnimalShop(); renderAnimalYard();
    try { await saveGardenToSE(); } catch (error) { delete G.animalPremiumHabitats[id]; throw error; }
    toast(`🏡 Habitat Premium da ${a.name} habilitado permanentemente!`,4000);
  } catch (error) { toast(`⚠️ Não foi possível habilitar o habitat: ${error.message}`,5000); }
  finally { animalActionInFlight=false; renderAnimalShop(); renderAnimalYard(); }
}
async function animalAction(action, id, ration = 'normal', quantity = 1) {
  if (animalActionInFlight || !gardenHydrated) return;
  animalActionInFlight = true;
  try {
    let state = animalState();
    const a = FarmAnimals.catalog[id];
    if (action === 'buy') {
      if (!a || state.pets[id] || currentLevel() < a.level) return;
      if (!await chargeGamePoints(a.cost, `Animal: ${a.name} e ${a.home}`)) return;
      state = animalState(); state.pets[id] = { readyAt:0 };
      G.livestock = state;
    } else if (action === 'ration') {
      const r=FarmAnimals.rations[id || 'normal']; const qty=Math.max(1,Math.min(99,Number(quantity)||1));if(!r)return;
      if (!await chargeGamePoints(r.cost*qty, `Ração ${r.name} · ${qty} unidade${qty===1?'':'s'}`)) return;
      state = animalState(); if(!id||id==='normal')state.feed+=qty;else state.rations[id]+=qty;G.livestock = state;
    } else if (action === 'feed') {
      G.livestock = FarmAnimals.feed(state, id, Date.now(), ration, Math.random, effectiveAnimalSkills());
    } else if (action === 'booster') {
      G.livestock = FarmAnimals.boost(state,id,Date.now(),Math.random,effectiveAnimalSkills());
    } else if (action === 'collect') {
      const result = FarmAnimals.collect(state, id, Date.now(), effectiveAnimalSkills());
      G.livestock = result.state;
      for(const [product,quantity] of Object.entries(result.items)) G.harvested[product]=(G.harvested[product]||0)+quantity;
      if (result.items[a.product+'_golden']) toast(`✨ ${state.pets[id].name || a.name} produziu ${result.items[a.product+'_golden']} produto dourado na fazenda!`, 4500);
    } else if (action === 'rename') {
      G.livestock = FarmAnimals.rename(state, id, ration);
      renderAnimalYard();
      await saveGardenToSE();
      toast(`🏷️ Nome salvo: ${G.livestock.pets[id].name || a.name}`, 2200);
      return;
    } else return;
    renderAnimalYard(); renderAnimalShop(); renderHarvested();
    try { await saveGardenToSE(); }
    catch (error) { toast(`⚠️ A ação foi mantida nesta tela, mas ainda não foi salva: ${error.message}`, 6000); return; }
    toast(action === 'collect' ? '🧺 Produtos recolhidos! Confira o Mercado.' : action === 'feed' ? '💚 Saúde recuperada! O animal produzirá enquanto estiver com 15% ou mais de saúde.' : action === 'buy' ? `${a.name} chegou ao seu cercadinho!` : action==='booster'?'✦ Booster aplicado por 30 minutos!':'🌾 Ração guardada na despensa.', 3000);
  } catch (error) { toast(error.message, 4000); }
  finally { animalActionInFlight = false; renderAnimalYard(); renderAnimalShop(); renderRationShop(); }
}
setInterval(() => {
  const root = document.getElementById('animal-yard');
  if (!gardenHydrated || document.hidden) return;
  const state = animalState();
  if (!root || root.hidden) return;
  let changed = false, persistChange = false;
  for (const el of root.querySelectorAll('[data-animal-status]')) {
    const id = el.dataset.animalStatus, pet = state.pets[id];
    if(!pet && el.dataset.cycle){changed=true;persistChange=true;}
    const stage=pet?FarmAnimals.lifeStage(pet).index:'';
    if(pet && el.dataset.cycle!==`${pet.readyAt}:${Math.floor(Math.max(0,Math.min(100,Number(pet.health ?? 100))))}:${stage}:${pet.booster?'booster':''}:${pet.boosterUntil||0}:${pet.superActive?'super':''}:${pet.superUntil||0}`){changed=true;if(Number(el.dataset.cycle.split(':')[2])!==stage)persistChange=true;}
    const boosterTime=el.closest('.animal-pen')?.querySelector('.animal-booster-time');
    const boosterBar=el.closest('.animal-pen')?.querySelector('.animal-booster-bar span');
    if (boosterTime && boosterBar) {
      const remaining=pet?.booster?Math.max(0,pet.boosterUntil-Date.now()):0;
      boosterTime.textContent=pet?.booster?`ativo · ${animalTime(remaining)}`:'inativo';
      boosterBar.style.width=`${Math.max(0,Math.min(100,remaining/(30*60000)*100))}%`;
    }
    const superTime=el.closest('.animal-pen')?.querySelector('.animal-super-time');
    const superBar=el.closest('.animal-pen')?.querySelector('.animal-super-bar span');
    if(superTime&&superBar){
      const remaining=pet?.superUntil>Date.now()?Math.max(0,pet.superUntil-Date.now()):0;
      superTime.textContent=remaining?`${pet.superActive?'ativo':'pausado'} · ${animalTime(remaining)}`:'inativo';
      superBar.style.width=`${Math.max(0,Math.min(100,remaining/(30*60000)*100))}%`;
    }
    if (FarmAnimals.status(pet) === 'producing') {
      const a=FarmAnimals.catalog[id], remaining=pet.readyAt-Date.now();

      el.innerHTML = '';
      el.closest('.animal-pen').querySelector('.animal-production-summary small').textContent = `Próximo ${FarmAnimals.products[a.product].name.toLowerCase()} em ${animalTime(remaining)}`;
      el.closest('.animal-pen').querySelector('.animal-production-bar span').style.width = `${Math.max(0,100*(1-remaining/(pet.cycleDuration || a.minutes*60000)))}%`;
    }
    else if (FarmAnimals.status(pet) === 'ready' && !el.closest('.animal-pen').classList.contains('ready')) changed = true;
  }
  if (changed) renderAnimalYard();
  if (persistChange) saveGardenToSE().catch(error => console.warn('Idade ou falecimento aguardando sincronização:', error));
}, 1000);
