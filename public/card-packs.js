/* Pack presentation uses the same SVG drawings as both albums. */
(() => {
  const normalNames = AlbumArtwork.names;
  const oldNames = ['Pipo, o brotinho','Juju do galinheiro','Alfredo do lago','Mimi das nuvens','Bento, o cogumelo','Mel, a abelhinha','Luna do luar','Íris cristalina','Aurora das asas','Solária, guardiã do jardim'];
  const prismNames = ['Prisma de Orvalho','Prisma de Pétala','Prisma do Galinheiro','Prisma do Lago','Prisma de Cristal','Prisma Borboleta','Prisma Lunar','Prisma Aurora','Prisma Estelar','Arco-Íris Primaveril'];
  const weights = [55/3,55/3,55/3,12.5,12.5,6,6,3,3,2];
  const prismWeights = [.2,.2,.2,.2,.35/3,.35/3,.35/3,.06,.06,.03];
  const rarities = ['Comum','Comum','Comum','Incomum','Incomum','Rara','Rara','Épica','Épica','Lendária'];
  let busy = false;
  function draw(kind) {
    const pool = normalNames.map((name,i)=>({name,i,key:name,legacy:oldNames[i],rarity:rarities[i],weight:weights[i]*(kind==='prismatic'?.987:1),prismatic:false}));
    if(kind==='prismatic') prismNames.forEach((name,i)=>pool.push({name:normalNames[i],i,key:'prismatic_'+i,legacy:name,rarity:i===9?'Arco-Íris':i>=7?'Prismática épica':i>=4?'Prismática rara':'Prismática',weight:prismWeights[i],prismatic:true}));
    let roll=Math.random()*pool.reduce((n,c)=>n+c.weight,0);
    return pool.find(c=>(roll-=c.weight)<0)||pool[pool.length-1];
  }
  window.renderCardPackShop=function(){
    const el=document.getElementById('card-pack-shop');if(!el)return;
    el.innerHTML=['normal','prismatic'].map(kind=>'<section class="pack-product '+kind+'"><div class="pack-envelope"><span>✦</span><strong>'+(kind==='normal'?'PRIMAVERA':'PRISMAS')+'</strong><small>3 FIGURINHAS</small></div><div><h3>'+(kind==='normal'?'Primavera Encantada':'Prismas da Primavera')+'</h3><p>'+(kind==='normal'?'Três cartas do álbum normal.':'Três cartas: normais ou prismáticas, com chance de Arco-Íris.')+'</p><small>'+(kind==='normal'?'Comum 55% · Incomum 25% · Rara 12% · Épica 6% · Lendária 2%':'Normais 98,70% · Prismáticas 0,80% · Raras prismáticas 0,35% · Épicas prismáticas 0,12% · Arco-Íris 0,03%')+'</small></div><div><strong>'+(kind==='normal'?'1 ponto':'2 pontos')+'</strong><button data-buy-pack="'+kind+'" '+(busy?'disabled':'')+'>Comprar pack</button></div></section>').join('');
    el.querySelectorAll('[data-buy-pack]').forEach(b=>b.onclick=()=>buyCardPack(b.dataset.buyPack));
  };
  window.buyCardPack=async function(kind='normal'){
    if(busy)return;busy=true;renderCardPackShop();
    let charged=false;
    try{
      if(!(await chargeGamePoints(kind==='prismatic'?2:1,'Pack '+kind)))return;
      charged=true;
      const pulls=Array.from({length:3},()=>draw(kind));
      G.albumCards={...(G.albumCards||{})};
      pulls.forEach(c=>{
        const count=Number(G.albumCards[c.key]??G.albumCards[c.legacy]??0);
        c.isNew=count===0;G.albumCards[c.key]=count+1;
      });
      pulls.forEach(c=>window.recordCardFind?.(c));
      G.albumPacks=Number(G.albumPacks||0)+1;
      window.__farmAlbumCards={...G.albumCards};
      const overlay=document.createElement('div');overlay.className='pack-opening-v2 '+kind;
      overlay.innerHTML='<section role="dialog" aria-modal="true" aria-label="Abrir pack" class="pack-dialog"><button class="pack-close" aria-label="Guardar e fechar">×</button><small>UM PRESENTE PARA SUA COLEÇÃO</small><h2>Seu pack chegou!</h2><p>Clique em cada carta para revelar.</p><div class="pack-three">'+pulls.map((c,i)=>'<button class="pack-flip" data-reveal="'+i+'" aria-label="Revelar carta '+(i+1)+'"><span class="pack-back"><span>✦</span><b>'+(kind==='normal'?'JARDIM ENCANTADO':'PRISMAS DA PRIMAVERA')+'</b><small>TOQUE PARA REVELAR</small></span><span class="pack-face '+(c.prismatic?'is-prismatic':'')+'" hidden><small>'+c.rarity+'</small><span class="pack-illustration" style="--prism-hue:'+c.i*29+'deg">'+AlbumArtwork.render(AlbumArtwork.card(c.i))+'</span><b>'+c.name+'</b>'+(c.isNew?'<em>NOVA!</em>':'<em>Repetida</em>')+'</span></button>').join('')+'</div><p class="pack-save-status" role="status">Salvando suas três cartas…</p><button class="pack-save-retry" hidden>Tentar salvar novamente</button></section>';
      document.body.append(overlay);
      let saved=false,saving=false;
      const status=overlay.querySelector('.pack-save-status'),retry=overlay.querySelector('.pack-save-retry');
      async function persist(){
        if(saving)return false;saving=true;retry.hidden=true;
        status.textContent='Salvando suas três cartas…';
        try{
          const result=await saveGardenToSE();
          if(!result)throw new Error('Sessão não carregada');
          saved=true;status.textContent='As três cartas estão salvas no seu álbum.';return true;
        }catch{status.textContent='Não foi possível salvar. Tente novamente antes de fechar.';retry.hidden=false;return false;}
        finally{saving=false;}
      }
      overlay.querySelectorAll('[data-reveal]').forEach(b=>b.onclick=()=>{
        if(b.classList.contains('revealed'))return;
        const c=pulls[Number(b.dataset.reveal)];
        b.querySelector('.pack-back').hidden=true;b.querySelector('.pack-face').hidden=false;
        b.classList.add('revealed');if(c.prismatic)b.classList.add('prism-reveal');
        b.setAttribute('aria-label',c.name+' · '+c.rarity+(c.isNew?' · Nova':' · Repetida'));
      });
      retry.onclick=persist;
      overlay.querySelector('.pack-close').onclick=async()=>{
        if(saving)return;
        if(!saved&&!(await persist()))return;
        overlay.remove();busy=false;renderCardPackShop();
      };
      await persist();
    }catch(error){toast('Não foi possível abrir o pack. '+(charged?'A compra precisa ser verificada.':'Tente novamente.'));busy=false;}
    finally{if(!charged)busy=false;renderCardPackShop();}
  };
})();
