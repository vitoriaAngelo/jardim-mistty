const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('public/card-packs.js', 'utf8');

test('packs normais deixam cartas raras e lendárias bem mais difíceis', () => {
  assert.match(source, /rarityOdds = \{ common:70, uncommon:25, rare:4, epic:\.8, legendary:\.2 \}/);
  assert.match(source, /Comum 70% · Incomum 25% · Rara 4% · Épica 0,8% · Lendária 0,2%/);
  assert.equal(70 + 25 + 4 + 0.8 + 0.2, 100);
});

test('pack prismático tem apenas 0,13% de chance de sortear qualquer carta prismática', () => {
  assert.match(source, /prismOdds = \{ base:\.06, rare:\.04, epic:\.02, rainbow:\.01 \}/);
  assert.match(source, /Normais 99,87% · Prismáticas 0,06% · Raras prismáticas 0,04% · Épicas prismáticas 0,02% · Arco-Íris 0,01%/);
  assert.equal(0.06 + 0.04 + 0.02 + 0.01, 0.13);
  assert.equal(99.87 + 0.13, 100);
});
