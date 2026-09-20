(() => {
  const modal=document.getElementById('modal'),body=document.getElementById('modal-body');
  const inventory=()=>window.parent!==window?window.parent.__farmAlbumCards||{}:{};
  let filter='all',picked=[],busy=false,available={};
  async function refreshAvailable(){
    const token=sessionStorage.getItem('twitch_access_token'),username=sessionStorage.getItem('se_username');
    if(!token||!username){
      if(!['127.0.0.1','localhost'].includes(location.hostname))throw new Error('Entre na sua conta para combinar figurinhas.');
      available=Object.fromEntries(RainbowAlbum.cards.map(c=>[c.id,Math.max(0,Number(inventory()[c.id]||0)-1)]));return;
    }
    const response=await fetch('/.netlify/functions/trade-user-cards?username='+encodeURIComponent(username),{headers:{Authorization:'Bearer '+token,'X-Garden-Session':sessionStorage.getItem('garden_session_id')||''},cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw new Error('Não foi possível conferir as figurinhas reservadas para trocas. Tente novamente.');
    available=Object.fromEntries((data.cards||[]).map(c=>[c.card_id,Math.max(0,Number(c.available_quantity)-1)]));
  }
  function cardMarkup(card,qty){return `<article class="rainbow-card ${qty?'owned':'undiscovered'}" data-tier="${card.rarity}"><div class="rarity"><span>${card.rarity} Arco-Íris</span><span>✧ ${card.i+21}</span></div>${RainbowAlbum.render(card)}<h3>${qty?card.name:'Encontro por descobrir'}</h3><p>${qty?card.desc:'Uma companhia colorida espera pelo seu primeiro encontro.'}</p><div class="card-bottom"><span>ALÉM DO ARCO-ÍRIS</span><strong>${qty?'×'+qty:'?'}</strong></div></article>`;}
  function render(){const inv=inventory(),owned=RainbowAlbum.cards.filter(c=>Number(inv[c.id])>0).length;document.getElementById('count').textContent=owned+' / 10 descobertas';document.querySelector('.progress i').style.width=owned*10+'%';document.getElementById('cards').innerHTML=RainbowAlbum.cards.filter(c=>filter==='all'||filter===c.rarity).map(c=>cardMarkup(c,Number(inv[c.id])||0)).join('');}
  async function persist(next){
    if(window.parent===window)throw new Error('Abra o álbum pela sua fazenda para salvar.');
    window.parent.__farmAlbumCards=next;
    window.parent.postMessage({type:'album-state',cards:next},location.origin);
    await new Promise(resolve=>setTimeout(resolve,0));
    if(!(await window.parent.saveGardenToSE()))throw new Error('Salvamento não confirmado.');
  }
  function workshop(){
    if(busy)return;
    if(!modal.open)modal.showModal();
    const inv=Object.fromEntries(RainbowAlbum.cards.map(c=>[c.id,Math.min(Number(inventory()[c.id])||0,1+(available[c.id]||0))]));
    body.innerHTML='<h2>Ateliê das sete cores</h2><p>Combine três repetidas Arco-Íris para receber uma figurinha desta coleção. Sua primeira cópia é preservada.</p><p>Comuns 46,15% · raras 30,77% · lendárias 23,08% entre os resultados Arco-Íris.</p><div class="mini-grid">'+RainbowAlbum.cards.filter(c=>(Number(inv[c.id])||0)>1).map(c=>{const left=Number(inv[c.id])-1-picked.filter(id=>id===c.id).length;return '<button data-pick="'+c.id+'" '+(left<=0||picked.length===3?'disabled':'')+'>'+RainbowAlbum.render(c)+'<strong>'+c.name+'</strong><small> · '+left+' repetidas</small></button>';}).join('')+'</div><p class="notice">'+picked.length+'/3 escolhidas</p><button id="clear-picks">Limpar seleção</button><button class="wide" id="mix" '+(picked.length!==3?'disabled':'')+'>Combinar e revelar</button>';
    body.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{picked.push(b.dataset.pick);workshop();});
    body.querySelector('#clear-picks').onclick=()=>{picked=[];workshop();};
    body.querySelector('#mix').onclick=async()=>{
      if(busy||picked.length!==3)return;
      busy=true;body.querySelector('#mix').disabled=true;
      try{await refreshAvailable();}catch(error){busy=false;body.querySelector('.notice').textContent=error.message;body.querySelector('#mix').disabled=false;return;}
      busy=false;
      const needed={};for(const id of picked)needed[id]=(needed[id]||0)+1;
      if(Object.entries(needed).some(([id,qty])=>qty>(available[id]||0))){picked=[];workshop();body.querySelector('.notice').textContent='Algumas cópias estão reservadas para trocas. Escolha novamente.';return;}
      const next={...inventory()};
      for(const id of picked){if(Number(next[id])<=1){picked=[];workshop();return;}next[id]--;}
      busy=true;
      let roll=Math.random()*.13,index=RainbowAlbum.weights.findIndex(weight=>(roll-=weight)<0);if(index<0)index=9;
      const reward=RainbowAlbum.cards[index];next[reward.id]=(Number(next[reward.id])||0)+1;picked=[];
      body.innerHTML='<h2>Um novo abraço chegou!</h2><div class="reveal-card">'+cardMarkup(reward,next[reward.id])+'</div><p id="save-status">Salvando…</p><button id="retry" hidden>Tentar salvar novamente</button>';
      modal.querySelector('.close').disabled=true;
      const save=async()=>{const retry=body.querySelector('#retry');retry.disabled=true;try{await persist(next);render();busy=false;modal.querySelector('.close').disabled=false;body.querySelector('#save-status').textContent='Figurinha salva no álbum!';retry.hidden=true;}catch(error){body.querySelector('#save-status').textContent=error.message;retry.hidden=false;}finally{retry.disabled=false;}};
      body.querySelector('#retry').onclick=save;await save();
    };
  }
  modal.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  modal.querySelector('.close').onclick=()=>{if(!busy)modal.close();};
  document.getElementById('combine').onclick=async()=>{if(busy)return;picked=[];busy=true;try{await refreshAvailable();busy=false;workshop();}catch(error){busy=false;body.textContent=error.message;if(!modal.open)modal.showModal();}};
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();});
  window.addEventListener('message',e=>{if(e.source!==window.parent)return;if(e.data?.type==='album-theme')document.body.classList.toggle('dark-mode',e.data.dark===true);});
  window.parent.postMessage({type:'album-theme-ready'},location.origin);
  try{document.body.classList.toggle('dark-mode',localStorage.getItem('mistty-theme')==='dark');}catch{}
  render();
})();
