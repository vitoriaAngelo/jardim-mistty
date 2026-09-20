/* Rainbow rewards share the garden's existing inventory and save lifecycle. */
(function(root){
  const tiers=['rainbow_first','rainbow_common','rainbow_rare','rainbow_complete'];
  function grant(state){
    const owned=i=>Number(state.albumCards?.['rainbow_'+i])>0;
    const unlocked=[Array.from({length:10},(_,i)=>i).some(owned),[0,1,2].every(owned),[3,4,5,6].every(owned),Array.from({length:10},(_,i)=>i).every(owned)];
    const claimed=state.albumRewardsClaimed||(state.albumRewardsClaimed={});
    const earned=id=>state.achievements instanceof Set?state.achievements.has(id):(state.achievements||[]).includes(id);
    unlocked.forEach((value,i)=>{if(value||earned(tiers[i]))unlocked[i]=true;});
    if(unlocked[0])claimed.rainbow_title=true;
    if(unlocked[1]){state.albumFrameUnlocks=state.albumFrameUnlocks||{};state.albumFrameUnlocks.rainbow=true;}
    if(unlocked[2]&&!claimed.rainbow_seed){
      state.inventory=state.inventory||{};
      if(!(state.plots||[]).some(p=>p?.type==='rainbow_seed'))state.inventory.rainbow_seed=Math.max(1,Number(state.inventory.rainbow_seed)||0);
      claimed.rainbow_seed=true;
    }
    if(unlocked[3]){state.ownedMascots=state.ownedMascots||{};state.ownedMascots.rainbow=true;}
    return unlocked;
  }
  const harvestQuantity=(random=Math.random)=>1+Math.min(99,Math.max(0,Math.floor(random()*100)));
  function pulse(state,{now=Date.now(),random=Math.random,maxWater,ready,accessible=()=>true}={}){
    if(state.selectedMascot!=='rainbow'||state.ownedMascots?.rainbow!==true)return {changed:false,harvest:-1,wateredPlot:-1,wateredAll:false};
    if(now-Number(state.rainbowMascotPulseAt||0)<5000)return {changed:false,harvest:-1,wateredPlot:-1,wateredAll:false};
    state.rainbowMascotPulseAt=now;
    const candidates=[],needsWater=[];
    (state.plots||[]).forEach((plot,i)=>{
      if(!plot||!accessible(i))return;
      if(ready(plot)){candidates.push(i);return;}
      const maximum=maxWater(plot);
      if(Number(plot.waterCount||0)<maximum)needsWater.push(i);
    });
    let changed=false,wateredPlot=-1,wateredAll=false;
    if(needsWater.length&&random()<.0001){
      needsWater.forEach(i=>{const plot=state.plots[i];plot.waterCount=Math.min(maxWater(plot),Number(plot.waterCount||0)+1);});
      changed=true;wateredAll=true;
    }else if(needsWater.length){
      wateredPlot=needsWater[Math.min(needsWater.length-1,Math.floor(random()*needsWater.length))];
      const plot=state.plots[wateredPlot];plot.waterCount=Math.min(maxWater(plot),Number(plot.waterCount||0)+1);changed=true;
    }
    const harvest=candidates.length&&random()<.01?candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))]:-1;
    return {changed,harvest,wateredPlot,wateredAll};
  }
  let serial=0;
  function art(kind='seed',progress=1){
    const id='rainbowReward'+(++serial),gradient=`<defs><linearGradient id="${id}" x2="1" y2="1"><stop stop-color="#e79ab4"/><stop offset=".2" stop-color="#edbf7e"/><stop offset=".4" stop-color="#e5d788"/><stop offset=".6" stop-color="#a9d8b7"/><stop offset=".8" stop-color="#94c7de"/><stop offset="1" stop-color="#c6a1df"/></linearGradient></defs>`;
    const fill=`url(#${id})`;
    const face='<circle cx="42" cy="60" r="2"/><circle cx="58" cy="60" r="2"/><path d="M46 66q4 4 8 0" fill="none" stroke="#655768" stroke-width="2"/><ellipse cx="36" cy="65" rx="4" ry="2" fill="#e89eae"/><ellipse cx="64" cy="65" rx="4" ry="2" fill="#e89eae"/>';
    let body;
    if(kind==='frame')body=`<rect x="17" y="13" width="66" height="74" rx="23" fill="${fill}"/><rect x="25" y="21" width="50" height="58" rx="17" fill="#fff8e9"/><path d="M36 61q14-31 28 0" fill="none" stroke="${fill}" stroke-width="7"/>`;
    else if(kind==='title')body=`<path d="M27 40h46l5 33q-28 19-56 0Z" fill="${fill}" stroke="#978075" stroke-width="2"/><rect x="24" y="34" width="52" height="9" rx="4" fill="#ebd8ba"/><path d="M30 30q20-32 40 0" fill="none" stroke="${fill}" stroke-width="9"/><g fill="#655768">${face}</g>`;
    else if(kind==='mascot')body=`<ellipse cx="50" cy="59" rx="27" ry="28" fill="${fill}" stroke="#95817f" stroke-width="2"/><path d="M50 35Q19 25 27 13q28-3 23 22Q81 29 75 11 51 9 50 35" fill="${fill}" stroke="#8ba98a" stroke-width="2"/><g fill="#655768">${face}</g>`;
    else body=`<ellipse cx="50" cy="87" rx="30" ry="5" fill="#bbaa9133"/><path d="M50 84V${70-40*progress}" stroke="#88a178" stroke-width="4"/><path d="M50 67Q24 68 25 47q21-2 25 20M50 55Q77 55 76 33q-21 1-26 22" fill="${fill}" stroke="#91a77e"/><g transform="translate(50 ${75-40*progress}) scale(${.25+.75*progress}) translate(-50 -48)"><path d="M50 23Q23 40 29 60q21 20 42 0 6-20-21-37Z" fill="${fill}" stroke="#a28a8f" stroke-width="2"/><g fill="#655768">${face}</g></g>`;
    return `<svg class="rainbow-reward-art" viewBox="0 0 100 100" role="img" aria-label="${kind==='seed'?'Fruto Arco-Íris':kind==='mascot'?'Brotinho Arco-Íris':kind==='frame'?'Moldura Arco-Íris':'Pote de Arco-Íris'}">${gradient}${body}<g fill="#d9bc72"><path d="m15 23 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z"/><path d="m83 72 2-4 2 4 4 2-4 2-2 4-2-4-4-2Z"/></g></svg>`;
  }
  const api={grant,harvestQuantity,pulse,art};root.RainbowRewards=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
