// Verificação local, sem acesso a contas ou serviços de produção.
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve('public');
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({headless:true,channel:'msedge'});
    const page=await browser.newPage({viewport:{width:1280,height:1000},serviceWorkers:'block'});
    await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?preview`);
    await page.evaluate(()=>{document.body.classList.remove('dark-mode'); switchFarmTab('animals');});
    assert.equal(await page.locator('.animal-pen').count(),5);
    assert.equal(await page.locator('#plots-grid').isVisible(),false);
    await page.evaluate(async()=>{
      for(const id of Object.keys(FarmAnimals.catalog)) await animalAction('buy',id);
      await animalAction('ration'); await animalAction('ration');
      for(const id of Object.keys(FarmAnimals.catalog)) await animalAction('feed',id);
    });
    await page.locator('#plots-card').screenshot({path:'tmp/animals-desktop.png'});
    await page.evaluate(()=>{for(const pet of Object.values(G.livestock.pets))pet.readyAt=Date.now()-1;renderAnimalYard();});
    await page.evaluate(async()=>{for(const id of Object.keys(FarmAnimals.catalog))await animalAction('collect',id);});
    const stock=await page.evaluate(()=>G.harvested);
    for(const type of ['farm_egg','farm_milk','farm_bacon','farm_wool','farm_duck_egg'])assert.equal(stock[type],1);
    await page.evaluate(()=>sellAll());
    const total=await page.evaluate(()=>sellTotal());
    assert.equal(total,710);
    assert.equal(await page.locator('#sell-all-confirm-overlay .shop-cart-row').count(),5);
    await page.evaluate(()=>closeSellAllConfirm());
    const beforeSale=await page.evaluate(()=>G.pts);
    // O serviço de pontos é simulado; os produtos seguem o fluxo real de venda.
    await page.evaluate(async()=>{giveSEPoints=async()=>true;await sellSelected();});
    // A primeira venda também pode concluir uma missão diária.
    assert.ok(await page.evaluate(()=>G.pts)>=beforeSale+710);
    assert.equal(await page.evaluate(()=>G.lastSale.total),710);
    assert.equal(await page.evaluate(()=>G.harvested.farm_egg),0);
    const saved=await page.evaluate(()=>readGardenCache('preview'));
    assert.equal(Object.keys(saved.livestock.pets).length,5);
    assert.equal(saved.livestock.feed,1);
    assert.equal(saved.harvested.farm_milk,0);
    await page.evaluate(()=>{dismissLevelUp();openAnimalShop();});
    await page.locator('#panel-animais').screenshot({path:'tmp/animals-shop.png'});
    await page.evaluate(()=>{closeShop();document.body.classList.add('dark-mode');switchFarmTab('animals');});
    await page.setViewportSize({width:390,height:844});
    await page.locator('#plots-card').screenshot({path:'tmp/animals-mobile-dark.png'});
    assert.equal(await page.evaluate(()=>document.getElementById('animal-yard').scrollWidth<=document.getElementById('animal-yard').clientWidth),true);
    assert.deepEqual(errors,[]);
    console.log('OK: five animals, purchases/feed/collection, market selection (710 pts), desktop/mobile/dark layouts, no JavaScript errors.');
  } finally {if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
