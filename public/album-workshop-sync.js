(() => {
  const singleWorkshop = openUnifiedWorkshop;
  openUnifiedWorkshop = function () {
    singleWorkshop();
    const root = document.querySelector('#modal-body');
    const all = document.createElement('button');
    all.className = 'wide secondary';
    all.textContent = '✦ Colocar todas as repetidas';
    root.querySelector('#unified-mix').before(all);
    all.onclick = () => {
      const farm = window.parent.__farmAlbumCards || {};
      const entries = collection.map(c => ({ key:c.name, qty:Number(farm[c.name] ?? c.qty), card:c, tier:cardTier({type:'normal',rarity:c.rarity}) }));
      prismWorkshopCards.forEach(([name], id) => entries.push({ key:'prismatic_'+id, qty:Number(farm['prismatic_'+id] ?? farm[name] ?? 0), tier:cardTier({type:'prism',id}) }));
      entries.sort((a,b)=>b.tier-a.tier);
      const total = entries.reduce((n,c) => n + Math.max(0, Math.floor(c.qty)-1), 0);
      const rounds = Math.floor(total/3);
      openBody('<div class="dialog-title"><span>✧</span><h2>Combinar todas as repetidas</h2></div><p class="notice">'+total+' repetidas disponíveis. Vamos usar '+(rounds*3)+' cartas para receber '+rounds+' cartas. Sobram '+(total%3)+' repetidas, além da primeira cópia de cada carta.</p><p class="hint">As repetidas mais raras serão priorizadas. Cada combinação recebe bônus conforme a raridade dos três ingredientes; os resultados deste lote não serão reutilizados.</p><button class="wide" id="bulk-mix" '+(!rounds?'disabled':'')+'>✦ Combinar todas · '+rounds+' combinações</button><button class="wide secondary" id="bulk-back">Voltar</button>');
      document.querySelector('#bulk-back').onclick = openUnifiedWorkshop;
      let applied = false;
      document.querySelector('#bulk-mix').onclick = async function () {
        if(applied || !rounds)return;
        // Recheck the snapshot before consuming cards; never consume newly earned rewards.
        const latest = window.parent.__farmAlbumCards || {};
        if(entries.some(c => Number(latest[c.key] ?? c.qty) !== c.qty)) {
          openUnifiedWorkshop();return;
        }
        applied = true;this.disabled = true;
        const updated = {...latest};
        const remainingByCard=new Map(entries.map(c=>[c.key,Math.max(0,Math.floor(c.qty)-1)]));
        let remaining = rounds*3;
        const inputGroups=[];
        while(remaining>=3){
          const group=[];
          while(group.length<3&&remaining>0){
            const next=entries.find(c=>(remainingByCard.get(c.key)||0)>0);
            if(!next)break;
            group.push(next);remainingByCard.set(next.key,remainingByCard.get(next.key)-1);remaining--;
          }
          if(group.length===3)inputGroups.push(group);
        }
        entries.forEach(c => {
          const used=Math.max(0,Math.floor(c.qty)-1)-remainingByCard.get(c.key);
          updated[c.key] = c.qty-used;
          if(c.card)c.card.qty = updated[c.key];
        });
        const rewards = new Map();
        for(let i=0;i<rounds;i++) {
          const tier=rarityWeightedTier(inputGroups[i].map(item=>item.card?{type:'normal',rarity:item.card.rarity}:{type:'prism',id:prismWorkshopCards.findIndex(([name],id)=>'prismatic_'+id===item.key)}),tiers);
          const pool=collection.filter(c=>c.rarity===tier);
          const reward=pool[Math.floor(Math.random()*pool.length)];
          reward.qty++;updated[reward.name]=reward.qty;
          rewards.set(reward,(rewards.get(reward)||0)+1);
        }
        window.parent.__farmAlbumCards=updated;
        unifiedChoices=[];render();
        rewards.forEach((quantity,reward)=>window.parent.postMessage({type:'card-found',card:{name:reward.name,rarity:reward.rarity,prismatic:false}},location.origin));
        openBody('<div class="dialog-title"><span>✦</span><h2>'+rounds+' cartas recebidas!</h2><p>'+(rounds*3)+' repetidas combinadas. Confira o resultado:</p></div><div class="mini-grid">'+[...rewards].map(([c,n])=>'<article style="text-align:center"><span>×'+n+'</span>'+art(c)+'<strong>'+c.name+'</strong><p>'+c.rarity+'</p></article>').join('')+'</div><p class="notice" id="bulk-save-status">Salvando no álbum…</p><button class="wide" id="bulk-done" disabled>Salvar e voltar à oficina</button>');
        const done=document.querySelector('#bulk-done'),status=document.querySelector('#bulk-save-status');
        let saved=false;
        async function persist(){
          done.disabled=true;
          try {
            // Let the existing album-state message update the farm before saving.
            await new Promise(resolve=>setTimeout(resolve,0));
            if(window.parent===window || !(await window.parent.saveGardenToSE()))throw new Error('save');
            saved=true;status.textContent='Todas as cartas foram salvas no álbum.';done.textContent='Voltar à oficina';
          } catch {status.textContent='Não foi possível confirmar o salvamento. Tente salvar novamente.';done.textContent='Tentar salvar novamente';}
          finally {done.disabled=false;}
        }
        done.onclick=()=>saved?openUnifiedWorkshop():persist();
        await persist();
      };
    };
  };
  const button = document.querySelector('#combine');
  const openWorkshop = button?.onclick;
  const legacyNames = [
    'Pipo, o brotinho', 'Juju do galinheiro', 'Alfredo do lago',
    'Mimi das nuvens', 'Bento, o cogumelo', 'Mel, a abelhinha',
    'Luna do luar', 'Íris cristalina', 'Aurora das asas',
    'Solária, guardiã do jardim'
  ];

  if (!button || !openWorkshop) return;

  button.onclick = event => {
    if (window.parent !== window) {
      const latestCards = window.parent.__farmAlbumCards || {};
      collection.forEach((card, index) => {
        const quantity = latestCards[card.name] ?? latestCards[legacyNames[index]];
        if (quantity !== undefined) card.qty = Math.max(0, Number(quantity) || 0);
      });
      render();
    }

    openWorkshop.call(button, event);

    const notice = document.querySelector('#modal-body .notice');
    if (notice) {
      notice.textContent = 'Os números mostram as cópias repetidas disponíveis. Uma cópia de cada figurinha permanece no álbum.';
    }
  };

  const modalBody = document.querySelector('#modal-body');
  new MutationObserver(() => {
    const reveal = modalBody.querySelector('.reveal');
    const card = reveal?.querySelector('.reveal-card');
    if (!card || card.dataset.farmFindSent) return;
    const name = card.querySelector('h3')?.textContent?.trim();
    const rarity = card.querySelector('p')?.textContent?.trim();
    if (!name || !rarity) return;
    card.dataset.farmFindSent = 'true';
    window.parent.postMessage({ type:'card-found', card:{ name, rarity, prismatic:false } }, '*');
  }).observe(modalBody, { childList:true, subtree:true });
})();
