/* Pack presentation uses the same SVG drawings as both albums. */
(() => {
  const normalNames = AlbumArtwork.names;
  const oldNames = ['Pipo, o brotinho','Juju do galinheiro','Alfredo do lago','Mimi das nuvens','Bento, o cogumelo','Mel, a abelhinha','Luna do luar','Íris cristalina','Aurora das asas','Solária, guardiã do jardim'];
  const prismNames = ['Prisma de Orvalho','Prisma de Pétala','Prisma do Galinheiro','Prisma do Lago','Prisma de Cristal','Prisma Borboleta','Prisma Lunar','Prisma Aurora','Prisma Estelar','Arco-Íris Primaveril'];
  // Odds are per card drawn. Rare tiers and every prismatic tier are intentionally scarce.
  const rarityOdds = { common:70, uncommon:25, rare:4, epic:.8, legendary:.2 };
  const weights = [rarityOdds.common/3,rarityOdds.common/3,rarityOdds.common/3,rarityOdds.uncommon/2,rarityOdds.uncommon/2,rarityOdds.rare/2,rarityOdds.rare/2,rarityOdds.epic/2,rarityOdds.epic/2,rarityOdds.legendary];
  const prismOdds = { base:.06, rare:.04, epic:.02, rainbow:.01 };
  const prismWeights = [prismOdds.base/4,prismOdds.base/4,prismOdds.base/4,prismOdds.base/4,prismOdds.rare/3,prismOdds.rare/3,prismOdds.rare/3,prismOdds.epic/2,prismOdds.epic/2,prismOdds.rainbow];
  const totalPrismOdds = Object.values(prismOdds).reduce((sum,odds)=>sum+odds,0);
  const rarities = ['Comum','Comum','Comum','Incomum','Incomum','Rara','Rara','Épica','Épica','Lendária'];
  const packPrices = { normal:300, prismatic:750 };
  let busy = false;
  function draw(kind) {
    const normalShare = kind==='prismatic' ? (100-totalPrismOdds)/100 : 1;
    const pool = normalNames.map((name,i)=>({name,i,key:name,legacy:oldNames[i],rarity:rarities[i],weight:weights[i]*normalShare,prismatic:false}));
    if(kind==='prismatic') prismNames.forEach((name,i)=>pool.push({name:normalNames[i],i,key:'prismatic_'+i,legacy:name,rarity:i===9?'Arco-Íris':i>=7?'Prismática épica':i>=4?'Prismática rara':'Prismática',weight:prismWeights[i],prismatic:true}));
    let roll=Math.random()*pool.reduce((n,c)=>n+c.weight,0);
    return pool.find(c=>(roll-=c.weight)<0)||pool[pool.length-1];
  }
  window.renderCardPackShop=function(){
    const el=document.getElementById('card-pack-shop');if(!el)return;
    el.innerHTML=['normal','prismatic'].map(kind=>'<section class="pack-product '+kind+'"><div class="pack-envelope"><span>✦</span><strong>'+(kind==='normal'?'PRIMAVERA':'PRISMAS')+'</strong><small>3 FIGURINHAS</small></div><div><h3>'+(kind==='normal'?'Primavera Encantada':'Prismas da Primavera')+'</h3><p>'+(kind==='normal'?'Três cartas do álbum normal.':'Três cartas: normais ou prismáticas, com chance de Arco-Íris.')+'</p><small>'+(kind==='normal'?'Comum 70% · Incomum 25% · Rara 4% · Épica 0,8% · Lendária 0,2%':'Normais 99,87% · Prismáticas 0,06% · Raras prismáticas 0,04% · Épicas prismáticas 0,02% · Arco-Íris 0,01%')+'</small></div><div><strong>'+packPrices[kind].toLocaleString('pt-BR')+' pontos</strong><button data-buy-pack="'+kind+'" '+(busy?'disabled':'')+'>Comprar pack</button></div></section>').join('');
    el.querySelectorAll('[data-buy-pack]').forEach(b=>b.onclick=()=>buyCardPack(b.dataset.buyPack));
  };
  async function openPack(kind='normal', earned=false){
    if(busy)return;busy=true;renderCardPackShop();
    let charged=false;
    try{
      if(earned){
        G.packInventory=G.packInventory||{normal:0,prismatic:0};
        if(Number(G.packInventory[kind]||0)<1){toast('Você não tem esse pack no Inventário.');return;}
        G.packInventory[kind]=Number(G.packInventory[kind])-1;
      }else{
        if(!(await chargeGamePoints(packPrices[kind],'Pack '+kind)))return;
        charged=true;
      }
      const pulls=Array.from({length:3},()=>draw(kind));
      G.albumCards={...(G.albumCards||{})};
      pulls.forEach(c=>{
        const count=Number(G.albumCards[c.key]??G.albumCards[c.legacy]??0);
        c.isNew=count===0;G.albumCards[c.key]=count+1;
      });
      pulls.forEach(c=>window.recordCardFind?.(c));
      if(!earned)G.albumPacks=Number(G.albumPacks||0)+1;
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
        overlay.remove();busy=false;renderCardPackShop();renderInventory();
      };
      await persist();
    }catch(error){toast('Não foi possível abrir o pack. '+(charged?'A compra precisa ser verificada.':'Tente novamente.'));busy=false;}
    finally{if(!charged)busy=false;renderCardPackShop();}
  }
  window.buyCardPack=kind=>openPack(kind||'normal',false);
  window.openEarnedCardPack=kind=>openPack(kind||'normal',true);
})();
