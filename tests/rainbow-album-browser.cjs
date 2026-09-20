// Isolated local fixture: never calls production services or changes real inventories.
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const art=require('../public/album-rainbow-art');
assert.deepEqual(['comum','rara','lendária'].map(t=>art.cards.filter(c=>c.rarity===t).length),[3,4,3]);
assert.equal(new Set(art.cards.map(c=>c.kind)).size,10);
assert.ok(Math.abs(art.weights.reduce((a,b)=>a+b,0)-.13)<1e-10);
const root=path.resolve('public');
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/fixture'){res.setHeader('Content-Type','text/html');res.end('<style>body{margin:0}iframe{width:100%;height:100vh;border:0}</style><script>window.__farmAlbumCards=Object.fromEntries(Array.from({length:10},(_,i)=>["rainbow_"+i,1]));window.saveCalls=0;window.saveGardenToSE=async()=>{saveCalls++;return !window.failSave};</script><iframe src="/album-rainbow.html"></iframe>');return;}
  const file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1320,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:'+server.address().port+'/fixture');
 const frame=page.frameLocator('iframe');
 await frame.locator('.rainbow-card').last().waitFor();
 assert.equal(await frame.locator('.rainbow-card').count(),10);
 fs.mkdirSync('tmp',{recursive:true});await page.screenshot({path:'tmp/rainbow-desktop.png',fullPage:true});
 await frame.locator('[data-filter="rara"]').click();assert.equal(await frame.locator('.rainbow-card').count(),4);
 await frame.locator('[data-filter="all"]').click();
 await page.evaluate(()=>{__farmAlbumCards.rainbow_0=4});
 assert.equal(await frame.locator('#combine').count(),0);
 await page.setViewportSize({width:390,height:844});
 await page.frames()[1].evaluate(()=>document.body.classList.add('dark-mode'));
 assert.equal(await page.frames()[1].evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'tmp/rainbow-mobile-dark.png'});
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await frame.locator('.rb-character').first().evaluate(el=>getComputedStyle(el).animationName),'none');
 assert.deepEqual(errors,[]);
 await page.goto('http://127.0.0.1:'+server.address().port+'/index.html?preview');
 await page.evaluate(async()=>{
   window.testCharges=[];chargeGamePoints=async(price)=>{testCharges.push(price);return true};saveGardenToSE=async()=>true;
   G.albumCards={};const oldRandom=Math.random;Math.random=()=>.99995;
   try{await buyCardPack('rainbow',3)}finally{Math.random=oldRandom}
 });
 assert.equal(await page.evaluate(()=>G.albumCards.rainbow_9),3);
 assert.equal(await page.evaluate(()=>G.achievements.has('rainbow_first')),true);
 assert.deepEqual(await page.evaluate(()=>testCharges),[750]);
 assert.equal(await page.locator('.pack-face.is-rainbow').count(),3);
 await page.evaluate(()=>document.querySelector('.pack-reveal-all').click());
 assert.equal(await page.locator('.pack-flip.revealed').count(),3);
 await page.evaluate(()=>document.querySelector('.pack-close').click());
 await page.evaluate(async()=>{await buyCardPack('rainbow',10)});
 assert.deepEqual(await page.evaluate(()=>testCharges),[750,2500]);
 assert.equal(await page.locator('.pack-flip').count(),10);
 await page.evaluate(()=>{RainbowAlbum.cards.forEach(c=>G.albumCards[c.id]=1);checkAchievements()});
 assert.equal(await page.evaluate(()=>['rainbow_first','rainbow_common','rainbow_rare','rainbow_complete','badge_rainbow'].every(id=>G.achievements.has(id))),true);
 await page.evaluate(()=>document.querySelector('.pack-close').click());
 assert.equal(await page.evaluate(()=>G.inventory.rainbow_seed),1);
 assert.equal(await page.evaluate(()=>G.albumFrameUnlocks.rainbow),true);
 assert.equal(await page.evaluate(()=>harvestTitleUnlocked(titleForName('Pote de Arco-Íris'))),true);
 await page.evaluate(async()=>{
   G.plots[0]=null;G.selectedFertilizer=null;G.specialPlotPending=false;G.selectedTool='water';G.taxPending=false;
   G.selectedSeed='rainbow_seed';await onPlotClick(0);
 });
 assert.equal(await page.evaluate(()=>G.inventory.rainbow_seed),0);
 for(const [random,expected] of [[0,1],[.99999,100]]){
   const result=await page.evaluate(async random=>{
     const before=Number(G.harvested.rainbow_seed||0);G.plots[0].growCount=effectivePlotMaxGrow(G.plots[0]);
     const old=Math.random;Math.random=()=>random;try{await onPlotClick(0)}finally{Math.random=old}
     return {quantity:G.harvested.rainbow_seed-before,type:G.plots[0]?.type,growth:G.plots[0]?.growCount,seeds:G.inventory.rainbow_seed,price:effectiveSellValue('rainbow_seed',true)};
   },random);
   assert.deepEqual(result,{quantity:expected,type:'rainbow_seed',growth:0,seeds:0,price:200});
 }
 await page.evaluate(async()=>{await buyMascot('rainbow');G.rainbowMascotPulseAt=0;G.waterCount=3;G.waterCapacity=3;G.plots=[{type:'rainbow_seed',growCount:0,waterCount:0},{type:'potato',growCount:0,waterCount:0},null,null,null,null];await tickRainbowMascot(Date.now()+50000,()=>.5)});
 assert.deepEqual(await page.evaluate(()=>[G.plots[0].waterCount,G.plots[1].waterCount,G.waterCapacity]),[1,1,3]);
 await page.evaluate(async()=>{G.plots[0].growCount=effectivePlotMaxGrow(G.plots[0]);G.selectedTool='shovel';G.taxPending=true;await tickRainbowMascot(Date.now()+60000,()=>0)});
 assert.equal(await page.evaluate(()=>G.plots[0].growCount),0);
 assert.equal(await page.evaluate(()=>G.plots[0].type),'rainbow_seed');
 assert.equal(await page.evaluate(()=>G.waterCapacity),3);
 assert.equal(await page.locator('.mascot-render-rainbow').count(),1);
 const persisted=await page.evaluate(async()=>{const saved=await saveGardenToSENow();return {title:saved.data.albumRewardsClaimed.rainbow_title,seed:saved.data.albumRewardsClaimed.rainbow_seed,inventory:saved.data.inventory.rainbow_seed,plant:saved.data.plots[0].type,mascot:saved.data.selectedMascot,frame:saved.data.albumFrameUnlocks.rainbow,pulse:saved.data.rainbowMascotPulseAt>0}});
 assert.deepEqual(persisted,{title:true,seed:true,inventory:0,plant:'rainbow_seed',mascot:'rainbow',frame:true,pulse:true});
 await page.setViewportSize({width:1320,height:1000});
 await page.evaluate(()=>{G.selectedHarvestTitle='Pote de Arco-Íris';openProfile();renderProfileTitles()});
 assert.equal(await page.locator('#profile-selected-title').evaluate(el=>el.classList.contains('rainbow-title')),true);
 await page.evaluate(()=>{closeProfile();openFarmAlbum(new Event('click'),'album-rainbow.html')});
 await page.frameLocator('#farm-album-frame').locator('#rainbow-rewards').scrollIntoViewIfNeeded();
 await page.frameLocator('#farm-album-frame').locator('#rainbow-rewards').screenshot({path:'tmp/rainbow-rewards-desktop.png'});
 assert.equal(await page.frameLocator('#farm-album-frame').locator('.reward-unlocked').count(),4);
 assert.deepEqual(errors,[]);
 console.log('Rainbow: album, rewards, permanent seed, 1–100 fruit yield, free watering, auto harvest, persistence, mobile/dark and packs OK');
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
