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
 await page.evaluate(()=>{__farmAlbumCards.rainbow_0=4;window.failSave=true});
 await frame.locator('#combine').click();
 for(let i=0;i<3;i++)await frame.locator('[data-pick="rainbow_0"]').click();
 await frame.locator('#mix').click();await frame.locator('#retry:not([hidden])').waitFor();
 const after=await page.evaluate(()=>({...__farmAlbumCards}));
 assert.ok(after.rainbow_0>=1);assert.equal(Object.values(after).reduce((a,b)=>a+b),11);
 assert.equal(await frame.locator('.close').isDisabled(),true);
 await page.evaluate(()=>window.failSave=false);await frame.locator('#retry').click();
 await frame.locator('#save-status').filter({hasText:'Figurinha salva'}).waitFor();
 assert.deepEqual(await page.evaluate(()=>({...__farmAlbumCards})),after);
 assert.equal(await page.evaluate(()=>saveCalls),2);
 await frame.locator('.close').click();
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
 assert.deepEqual(errors,[]);
 console.log('Rainbow: designs, tiers, odds, combine/retry, mobile/dark, reduced motion and real 3/10-card pack integration OK');
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1});
