const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('public/index.html', 'utf8');

test('Twitchzinho resgatado pode ser selecionado outra vez depois de trocar de mascote', () => {
  const renderStart = html.indexOf('function renderMascotShop()');
  const renderEnd = html.indexOf('\nfunction previewMascot', renderStart);
  const render = html.slice(renderStart, renderEnd);
  assert.ok(renderStart >= 0 && renderEnd > renderStart);
  assert.match(render, /premiumOnly&&!owned\?'✦ Resgate no Premium'/);
  assert.match(render, /owned\?'Selecionar'/);
  assert.match(render, /btn\.disabled=selected\|\|\(premiumOnly&&!owned\)\|\|locked\|\|prismaticLocked/);

  const selectStart = html.indexOf('async function buyMascot(id)');
  const selectEnd = html.indexOf('\nwindow.buyMascot', selectStart);
  const select = html.slice(selectStart, selectEnd);
  assert.ok(selectStart >= 0 && selectEnd > selectStart);
  assert.match(select, /id === 'twitchzinho' && !alreadyOwned/);
  assert.match(select, /id === 'twitchzinho' && !alreadyOwned/);
  assert.doesNotMatch(select, /if\s*\(id\s*===\s*'twitchzinho'\s*&&\s*alreadyOwned\)/);
  assert.match(select, /if \(!alreadyOwned\)/);
});

test('mascotes respeitam níveis, preços maiores e prêmio do álbum prismático', () => {
  assert.match(html, /const MASCOT_COSTS = \{ orange:2500, apple:7500, strawberry:15000, premium:75000 \}/);
  assert.match(html, /const requiredLevel=\{orange:1,apple:10,strawberry:15,premium:25\}\[id\]/);
  assert.match(html, /function hasCompletePrismaticAlbum\(cards=G\.albumCards\|\|\{\}\)/);
  assert.match(html, /PRISMATIC_ALBUM_NAMES\.every/);
  assert.match(html, /id==='prismatic'&&!hasCompletePrismaticAlbum\(\)/);
  assert.match(html, /onclick="previewMascot\('prismatic'\)"/);
  assert.match(html, /Brotinho Prismático/);
  assert.match(html, /saquinho/i);
});

test('Brotinho Prismático aumenta o peso de Chuva Mágica sem quebrar as outras chances', () => {
  assert.match(html, /G\.selectedMascot === 'prismatic' && eventPool\.includes\('rain'\)/);
  assert.match(html, /const weightedPool = prismaticPetBonus \? \[\.\.\.eventPool, 'rain'\] : eventPool/);
});

test('histórico de deploy exibe apenas os destaques desta atualização', () => {
  const start = html.indexOf('<div class="deploy-history-list">');
  const end = html.indexOf('<!-- MODAL (legacy, hidden) -->', start);
  const release = html.slice(start, end);
  assert.ok(start >= 0 && end > start);
  for (const headline of [
    'Álbuns, packs e figurinhas', 'Oficina e trocas entre fazendas',
    'Ranking e novidades de cartas', 'Missões e pedidos do jardim',
    'Habilidades completas', 'Animais e recompensas de nível',
    'Regador por estação', 'Mascote Twitchzinho',
  ]) assert.ok(release.includes(headline), `Falta o destaque de deploy: ${headline}`);
  assert.doesNotMatch(release, /Eventos vivos na fazenda|Loja responsiva no celular|Cards do ranking estáveis/);
});
