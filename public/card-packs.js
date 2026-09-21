/* Pack presentation uses the same SVG drawings as both albums. */
(() => {
  const normalNames = AlbumArtwork.names;
  const oldNames = ['Pipo, o brotinho','Juju do galinheiro','Alfredo do lago','Mimi das nuvens','Bento, o cogumelo','Mel, a abelhinha','Luna do luar','Íris cristalina','Aurora das asas','Solária, guardiã do jardim'];
  const prismNames = ['Prisma de Orvalho','Prisma de Pétala','Prisma do Galinheiro','Prisma do Lago','Prisma de Cristal','Prisma Borboleta','Prisma Lunar','Prisma Aurora','Prisma Estelar','Arco-Íris Primaveril'];
  // Odds are per card drawn. Rare tiers and every prismatic tier are intentionally scarce.
  const rarityOdds = { common:70, uncommon:25, rare:4, epic:.8, legendary:.2 };
  const weights = [rarityOdds.common/3,rarityOdds.common/3,rarityOdds.common/3,rarityOdds.uncommon/2,rarityOdds.uncommon/2,rarityOdds.rare/2,rarityOdds.rare/2,rarityOdds.epic/2,rarityOdds.epic/2,rarityOdds.legendary];
  const prismOdds = { base:.461538, rare:.307692, epic:.153846, rainbow:.076924 };
  const prismWeights = [prismOdds.base/4,prismOdds.base/4,prismOdds.base/4,prismOdds.base/4,prismOdds.rare/3,prismOdds.rare/3,prismOdds.rare/3,prismOdds.epic/2,prismOdds.epic/2,prismOdds.rainbow];
  const totalPrismOdds = Object.values(prismOdds).reduce((sum,odds)=>sum+odds,0);
  const rarities = ['Comum','Comum','Comum','Incomum','Incomum','Rara','Rara','Épica','Épica','Lendária'];
  const packPrices = { normal:300, prismatic:750, rainbow:1500 };
  const largePackPrices = { normal:1000, prismatic:2500, rainbow:7500 };
  const rainbowPackOdds = { normal:99.87, prismatic:0, rainbow:.13 };
  let busy = false;
  function draw(kind) {
    const normalShare = kind==='rainbow' ? rainbowPackOdds.normal/100 : kind!=='normal' ? (100-totalPrismOdds)/100 : 1;
    const pool = normalNames.map((name,i)=>({name,i,key:name,legacy:oldNames[i],rarity:rarities[i],weight:weights[i]*normalShare,prismatic:false}));
    if(kind==='prismatic') prismNames.forEach((name,i)=>pool.push({name:normalNames[i],i,key:'prismatic_'+i,legacy:name,rarity:i===9?'Arco-Íris':i>=7?'Prismática épica':i>=4?'Prismática rara':'Prismática',weight:prismWeights[i],prismatic:true}));
    if(kind==='rainbow') {
      const rainbowWeights=RainbowAlbum.weights.map(weight=>weight/rainbowPackOdds.rainbow*100);
      prismNames.forEach((name,i)=>pool.push({name:normalNames[i],i,key:'prismatic_'+i,legacy:name,rarity:i===9?'Arco-Íris':i>=7?'Prismática épica':i>=4?'Prismática rara':'Prismática',weight:prismWeights[i]/totalPrismOdds*rainbowPackOdds.prismatic,prismatic:true}));
      RainbowAlbum.cards.forEach((c,i)=>pool.push({...c,legacy:c.key,rarity:c.rarity+' Arco-Íris',weight:rainbowWeights[i],rainbow:true,prismatic:false}));
    }
    let roll=Math.random()*pool.reduce((n,c)=>n+c.weight,0);
    return pool.find(c=>(roll-=c.weight)<0)||pool[pool.length-1];
  }
  window.renderCardPackShop=function(){
    const el=document.getElementById('card-pack-shop');if(!el)return;
    el.innerHTML=['normal','prismatic','rainbow'].map(kind=>'<section class="pack-product '+kind+'"><div class="pack-envelope"><span>✦</span><strong>'+(kind==='normal'?'PRIMAVERA':kind==='rainbow'?'ARCO-ÍRIS':'PRISMAS')+'</strong><small>3 FIGURINHAS</small></div><div><h3>'+(kind==='normal'?'Primavera Encantada':kind==='rainbow'?'Além do Arco-Íris':'Prismas da Primavera')+'</h3><p>'+(kind==='normal'?'Três cartas do álbum normal.':kind==='rainbow'?'Dez novos encontros cozy, com chances ampliadas de cartas Prismáticas e Arco-Íris.':'Três cartas: normais ou prismáticas, com chance de Arco-Íris.')+'</p><small>'+(kind==='normal'?'Comum 70% · Incomum 25% · Rara 4% · Épica 0,8% · Lendária 0,2%':kind==='rainbow'?'Normais 97% · Prismáticas 2% · Arco-Íris 1%':'Normais 99,87% · Prismáticas 0,06% · Raras prismáticas 0,04% · Épicas prismáticas 0,02% · Arco-Íris 0,01%')+'</small></div><div><strong>'+packPrices[kind].toLocaleString('pt-BR')+' pontos</strong><button data-buy-pack="'+kind+'" '+(busy?'disabled':'')+'>Comprar pack</button></div></section>').join('');
    el.querySelectorAll('[data-buy-pack]').forEach(b=>{
      b.textContent='Comprar 3 cartas';
      b.onclick=()=>buyCardPack(b.dataset.buyPack);
      const large=document.createElement('button');
      large.className='pack-buy-large';large.disabled=busy;
      large.textContent='✦ Comprar 10 cartas · '+largePackPrices[b.dataset.buyPack].toLocaleString('pt-BR')+' pts';
      large.onclick=()=>buyCardPack(b.dataset.buyPack,10);
      b.after(large);
    });
  };
  async function openPack(kind='normal', earned=false, count=3){
    if(!Object.hasOwn(packPrices,kind))return;
    count=!earned&&count===10?10:3;
    if(busy)return;busy=true;renderCardPackShop();
    let charged=false,opened=false;
    try{
      if(earned){
        G.packInventory=G.packInventory||{normal:0,prismatic:0};
        if(Number(G.packInventory[kind]||0)<1){toast('Você não tem esse pack no Inventário.');return;}
        G.packInventory[kind]=Number(G.packInventory[kind])-1;
      }else{
        if(!(await chargeGamePoints(count===10?largePackPrices[kind]:packPrices[kind],'Pack '+kind+' · '+count+' cartas')))return;
        charged=true;
      }
      const pulls=Array.from({length:count},()=>draw(kind));
      G.albumCards={...(G.albumCards||{})};
      pulls.forEach(c=>{
        const count=Number(G.albumCards[c.key]??G.albumCards[c.legacy]??0);
        c.isNew=count===0;G.albumCards[c.key]=count+1;
      });
      pulls.forEach(c=>window.recordCardFind?.(c));
      checkAchievements();
      if(!earned)G.albumPacks=Number(G.albumPacks||0)+1;
      window.__farmAlbumCards={...G.albumCards};
      const overlay=document.createElement('div');overlay.className='pack-opening-v2 '+kind;
      overlay.innerHTML='<section role="dialog" aria-modal="true" aria-label="Abrir pack" class="pack-dialog"><button class="pack-close" aria-label="Guardar e fechar">×</button><small>UM PRESENTE PARA SUA COLEÇÃO</small><h2>Seu pack chegou!</h2><p>Clique em cada carta para revelar.</p><div class="pack-three">'+pulls.map((c,i)=>'<button class="pack-flip" data-reveal="'+i+'" aria-label="Revelar carta '+(i+1)+'"><span class="pack-back"><span>✦</span><b>'+(kind==='normal'?'JARDIM ENCANTADO':kind==='rainbow'?'ALÉM DO ARCO-ÍRIS':'PRISMAS DA PRIMAVERA')+'</b><small>TOQUE PARA REVELAR</small></span><span class="pack-face '+(c.rainbow?'is-rainbow':c.prismatic?'is-prismatic':'')+'" hidden><small>'+c.rarity+'</small><span class="pack-illustration" style="--prism-hue:'+c.i*29+'deg">'+(c.rainbow?RainbowAlbum.render(c):AlbumArtwork.render(AlbumArtwork.card(c.i)))+'</span><b>'+c.name+'</b>'+(c.isNew?'<em>NOVA!</em>':'<em>Repetida</em>')+'</span></button>').join('')+'</div><p class="pack-save-status" role="status">Salvando suas '+count+' cartas…</p><button class="pack-save-retry" hidden>Tentar salvar novamente</button><button class="pack-buy-again" hidden>Comprar outro pack de '+count+' cartas</button></section>';
      overlay.classList.toggle('pack-ten',count===10);
      overlay.querySelector('h2').textContent=count===10?'Dez surpresas para seu álbum!':'Seu pack chegou!';
      const progress=document.createElement('p');progress.className='pack-reveal-progress';progress.setAttribute('aria-live','polite');
      progress.textContent='0 de '+count+' cartas reveladas';
      const revealAll=document.createElement('button');revealAll.className='pack-reveal-all';revealAll.textContent='✦ Revelar todas';
      overlay.querySelector('.pack-three').before(progress,revealAll);
      document.body.append(overlay);opened=true;
      let saved=false,saving=false;
      const status=overlay.querySelector('.pack-save-status'),retry=overlay.querySelector('.pack-save-retry'),buyAgain=overlay.querySelector('.pack-buy-again');
      async function persist(){
        if(saving)return false;saving=true;retry.hidden=true;
        status.textContent='Salvando suas '+count+' cartas…';
        try{
          const result=await saveGardenToSE();
          if(!result)throw new Error('Sessão não carregada');
          saved=true;status.textContent='As '+count+' cartas estão salvas no seu álbum.';return true;
        }catch{status.textContent='Não foi possível salvar. Tente novamente antes de fechar.';retry.hidden=false;return false;}
        finally{saving=false;}
      }
      overlay.querySelectorAll('[data-reveal]').forEach(b=>b.onclick=()=>{
        if(b.classList.contains('revealed'))return;
        const c=pulls[Number(b.dataset.reveal)];
        b.querySelector('.pack-back').hidden=true;b.querySelector('.pack-face').hidden=false;
        b.classList.add('revealed');if(c.prismatic)b.classList.add('prism-reveal');
        b.setAttribute('aria-label',c.name+' · '+c.rarity+(c.isNew?' · Nova':' · Repetida'));
        const revealed=overlay.querySelectorAll('.pack-flip.revealed').length;
        progress.textContent=revealed+' de '+count+' cartas reveladas';
        revealAll.disabled=revealed===count;
        if(revealed===count)revealAll.textContent='✓ Todas reveladas';
        if(revealed===count){buyAgain.hidden=false;buyAgain.textContent='✦ Comprar novamente · '+(count===10?largePackPrices[kind]:packPrices[kind]).toLocaleString('pt-BR')+' pts';}
      });
      revealAll.onclick=()=>overlay.querySelectorAll('[data-reveal]:not(.revealed)').forEach(b=>b.click());
      retry.onclick=persist;
      buyAgain.onclick=async()=>{
        if(saving||!saved)return;
        overlay.remove();busy=false;renderCardPackShop();renderInventory();
        await openPack(kind,false,count);
      };
      overlay.querySelector('.pack-close').onclick=async()=>{
        if(saving)return;
        if(!saved&&!(await persist()))return;
        overlay.remove();busy=false;renderCardPackShop();renderInventory();
      };
      await persist();
    }catch(error){toast('Não foi possível abrir o pack. '+(charged?'A compra precisa ser verificada.':'Tente novamente.'));busy=false;}
    finally{if(!opened)busy=false;renderCardPackShop();}
  }
  window.buyCardPack=(kind,count=3)=>openPack(kind||'normal',false,count);
  window.openEarnedCardPack=kind=>openPack(kind||'normal',true);
})();
