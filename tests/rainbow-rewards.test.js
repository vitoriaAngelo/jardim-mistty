const test=require('node:test'),assert=require('node:assert/strict');
const rewards=require('../public/rainbow-rewards');
test('rewards unlock at the four album milestones and the permanent seed is granted once',()=>{
 const state={albumCards:{},plots:[],inventory:{},achievements:new Set()};
 assert.deepEqual(rewards.grant(state),[false,false,false,false]);
 state.albumCards.rainbow_0=1;assert.deepEqual(rewards.grant(state),[true,false,false,false]);
 state.albumCards.rainbow_1=state.albumCards.rainbow_2=1;rewards.grant(state);assert.equal(state.albumFrameUnlocks.rainbow,true);
 for(let i=3;i<7;i++)state.albumCards['rainbow_'+i]=1;
 rewards.grant(state);assert.equal(state.inventory.rainbow_seed,1);
 state.inventory.rainbow_seed=0;state.plots=[{type:'rainbow_seed'}];rewards.grant(state);assert.equal(state.inventory.rainbow_seed,0);
 for(let i=7;i<10;i++)state.albumCards['rainbow_'+i]=1;
 rewards.grant(state);assert.equal(state.ownedMascots.rainbow,true);
 const restored=JSON.parse(JSON.stringify(state));rewards.grant(restored);assert.equal(restored.inventory.rainbow_seed,0);
});
test('existing completed achievements receive rewards retroactively',()=>{
 const state={albumCards:{},achievements:['rainbow_first','rainbow_common','rainbow_rare','rainbow_complete']};
 assert.deepEqual(rewards.grant(state),[true,true,true,true]);assert.equal(state.inventory.rainbow_seed,1);
});
test('fruit yield is bounded to 1–100 inclusive',()=>{
 assert.equal(rewards.harvestQuantity(()=>0),1);assert.equal(rewards.harvestQuantity(()=>.999999),100);
 assert.equal(rewards.harvestQuantity(()=>.5),51);
});
test('rainbow sprout waters every eligible plant once per 5 seconds without consuming reservoir water',()=>{
 const state={selectedMascot:'rainbow',ownedMascots:{rainbow:true},waterCount:4,plots:[{waterCount:0},{waterCount:2},{waterCount:0},{waterCount:0,ready:true}]};
 const opts={now:5000,random:()=>.5,maxWater:()=>2,ready:p=>p.ready,accessible:i=>i!==2};
 assert.deepEqual(rewards.pulse(state,opts),{changed:true,harvest:-1});assert.deepEqual(state.plots.map(p=>p.waterCount),[1,2,0,0]);assert.equal(state.waterCount,4);
 rewards.pulse(state,{...opts,now:9999});assert.equal(state.plots[0].waterCount,1);
 assert.equal(rewards.pulse(state,{...opts,now:10000,random:()=>0}).harvest,3);
 state.selectedMascot='premium';assert.equal(rewards.pulse(state,{...opts,now:15000,random:()=>0}).harvest,-1);
});
