const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { cardIsInAlbum } = require('../netlify/functions/_card-notification');

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
