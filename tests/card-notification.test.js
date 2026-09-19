const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { cardIsInAlbum } = require('../netlify/functions/_card-notification');
const latestSales = require('../netlify/functions/latest-sales');

test('feed só anuncia carta normal que continua no álbum daquela fazenda', () => {
  assert.equal(cardIsInAlbum({'Abelhinha Bilhetinho':1},{name:'Abelhinha Bilhetinho',rarity:'Rara'}),true);
  assert.equal(cardIsInAlbum({'Abelhinha Bilhetinho':0},{name:'Abelhinha Bilhetinho',rarity:'Rara'}),false);
});

test('feed valida cartas prismáticas pelo ID prismático, não pelo álbum normal', () => {
  const card={name:'Brotinho de Esperança',rarity:'Prismática',prismatic:true};
  assert.equal(cardIsInAlbum({'prismatic_0':1},card),true);
  assert.equal(cardIsInAlbum({'Brotinho de Esperança':1},card),false);
});

test('feed de novidades não gira as mensagens em ritmo acelerado', () => {
  const html=fs.readFileSync('public/index.html','utf8');
  assert.match(html,/\}, 8000\);/);
  assert.match(html,/updateLatestSales\(\);\s*setInterval\(\(\) => \{ if \(!document\.hidden\) updateLatestSales\(\); \}, 120000\);/);
});

test('feed global publica ovo dourado com espécie do animal e quantidade', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify([{
    username:'fazenda-teste',
    data:{farmName:'Jardim das Flores',recentGoldenEggFinds:[
      {animalName:'Pipoca',eggType:'egg',quantity:2,at:Date.now()},
      {animalName:'Patinha',eggType:'duck_egg',quantity:1,at:Date.now()},
      {animalName:'Falso',eggType:'milk',quantity:1,at:Date.now()},
    ]},
  }]),{status:200,headers:{'Content-Type':'application/json'}});
  try {
    const result = await latestSales.handler();
    const {sales} = JSON.parse(result.body);
    const eggs = sales.filter(item => item.activityType==='golden-egg');
    assert.equal(eggs.length,2);
    assert.equal(eggs[0].animalName,'Pipoca');
    assert.equal(eggs[0].item,'ovo dourado');
    assert.equal(eggs[0].quantity,2);
    assert.equal(eggs[1].item,'ovo de pato dourado');
  } finally { global.fetch = originalFetch; }
});

test('feed mostra o item ovo dourado com estilo dourado e protege os textos dinâmicos', () => {
  const html=fs.readFileSync('public/index.html','utf8');
  assert.match(html,/\.latest-sales-golden-item \{ color:#a87a16/);
  assert.match(html,/escapeLatestFeedText\(sale\.animalName \|\| 'Um animal'\)/);
  assert.match(html,/class="latest-sales-golden-item"/);
  assert.match(html,/recentGoldenEggFinds: Array\.isArray\(G\.recentGoldenEggFinds\)/);
});
