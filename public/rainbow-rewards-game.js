(() => {
  function addMascotGradient(){
    document.querySelectorAll('.mascot-button>svg').forEach(svg=>{
      if(svg.querySelector('#mascotRainbowBody'))return;
      const defs=svg.querySelector('defs');
      if(defs)defs.insertAdjacentHTML('beforeend','<linearGradient id="mascotRainbowBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#efa4bb"/><stop offset=".18" stop-color="#efbd8b"/><stop offset=".36" stop-color="#eadb8f"/><stop offset=".54" stop-color="#afd2a8"/><stop offset=".72" stop-color="#9bcddb"/><stop offset="1" stop-color="#c3a7df"/></linearGradient>');
    });
  }
  window.rainbowRewardStatus=()=>RainbowRewards.grant(G);
  window.useRainbowReward=async index=>{
    const state=RainbowRewards.grant(G);if(!state[index])return;
    if(!(await saveGardenToSE())){toast('Não foi possível salvar a recompensa. Tente novamente.');return;}
    closeFarmAlbum();
    if(index===0){openProfile();showProfileTab('titles');await selectHarvestTitle('Pote de Arco-Íris');}
    if(index===1){openProfile();selectProfileFrame('prism_album');}
    if(index===2)openInventory();
    if(index===3){await buyMascot('rainbow');openMascotShop();}
  };
  let busy=false;
  window.tickRainbowMascot=async(now=Date.now(),random=Math.random)=>{
    if(busy||!gardenHydrated||!seUser)return;
    busy=true;
    try{
      const result=RainbowRewards.pulse(G,{now,random,maxWater:effectivePlotMaxWater,ready:isReady,accessible:i=>i<G.unlockedPlots||(i===5&&premiumSpecialPlotAccess())});
      if(result.wateredAll)toast('🌈 Milagre Arco-Íris! Todas as plantas sedentas receberam água grátis!',3500);
      else if(result.wateredPlot>=0)spawnSkillEffect(result.wateredPlot,'💧','+1 Rega grátis!','#a883c5');
      if(result.harvest>=0)await onPlotClick(result.harvest,true);
      if(result.changed||result.harvest>=0){renderPlots();await saveGardenToSE();}
    }finally{busy=false;}
  };
  addMascotGradient();
  setInterval(()=>{tickRainbowMascot().catch(error=>console.warn('Brotinho Arco-Íris: salvamento pendente',error));},5000);
  if(gardenHydrated)RainbowRewards.grant(G);
})();
