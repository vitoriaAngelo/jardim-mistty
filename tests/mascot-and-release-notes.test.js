const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('public/index.html', 'utf8');

test('Twitchzinho resgatado pode ser selecionado outra vez depois de trocar de mascote', () => {
  const renderStart = html.indexOf('function renderMascotShop()');
  const renderEnd = html.indexOf('\nfunction previewMascot', renderStart);
  const render = html.slice(renderStart, renderEnd);
  assert.ok(renderStart >= 0 && renderEnd > renderStart);
  assert.match(render, /premiumOnly && !owned \? '✦ Resgate no Premium' : owned \? 'Selecionar'/);
  assert.match(render, /btn\.disabled=selected \|\| \(premiumOnly && !owned\)/);

  const selectStart = html.indexOf('async function buyMascot(id, cost)');
  const selectEnd = html.indexOf('\nwindow.buyMascot', selectStart);
  const select = html.slice(selectStart, selectEnd);
  assert.ok(selectStart >= 0 && selectEnd > selectStart);
  assert.match(select, /id === 'twitchzinho' && !alreadyOwned/);
  assert.match(select, /id === 'twitchzinho' && alreadyOwned/);
  assert.match(select, /if \(!alreadyOwned\)/);
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
