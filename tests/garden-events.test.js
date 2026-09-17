const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

test('inclui os cinco eventos e mantém apenas um evento ativo', () => {
  for (const type of ['rain', 'golden', 'butterflies', 'moon', 'mutation']) {
    assert.match(html, new RegExp(`${type}: \\{`));
  }
  assert.match(html, /if \(!gardenHydrated \|\| gardenEvent \|\|/);
  assert.match(html, /gardenEvent=null; renderGardenEvent\(\)/);
});

test('usa aviso de 10 segundos e frequência normal de 5 a 8 minutos', () => {
  assert.match(html, /phase:'countdown', endsAt:Date\.now\(\)\+10000/);
  assert.match(html, /300000 \+ Math\.random\(\)\*180000/);
});

test('mantém os tempos reais no preview e permite aceleração apenas local para testes', () => {
  assert.doesNotMatch(html, /location\.hostname\.startsWith\('deploy-preview-'\)/);
  assert.match(html, /eventFastMode\(\) \? 8000 \+ Math\.random\(\)\*5000/);
  assert.doesNotMatch(html, /G\.eventNextAt = Date\.now\(\)\+5000/);
  assert.match(html, /gardenEventDuration\(type\) \{ return eventFastMode\(\) \? 12/);
});

test('mutação é sorteada como evento raro', () => {
  assert.match(html, /const mutationChance = keys\.includes\('mutation'\) \? 0\.08/);
  assert.match(html, /Math\.random\(\) < mutationChance/);
});

test('planta perdida fora da estação não concede XP de colheita', () => {
  const harvestStart = html.indexOf('// AUTO-COLHEITA:');
  const harvestEnd = html.indexOf('// APLICAR ADUBO:', harvestStart);
  const harvestSource = html.slice(harvestStart, harvestEnd);
  const seasonCheck = harvestSource.indexOf('if (outOfSeason)');
  const rewardBranch = harvestSource.indexOf("gainXP('harvest'", seasonCheck);
  assert.ok(seasonCheck >= 0 && rewardBranch > seasonCheck, 'XP deve ficar somente no ramo de colheita válida');
  assert.doesNotMatch(harvestSource.slice(seasonCheck, harvestSource.indexOf('} else {', seasonCheck)), /gainXP\(/);
});

test('planta mutada fica identificada no card e no tooltip', () => {
  assert.match(html, /plot-mutation-label/);
  assert.match(html, /mutation-tooltip-badge/);
  assert.match(html, /plot\?\.mutated \? ' event-mutated'/);
  assert.match(html, /hue-rotate\(52deg\)/);
  assert.match(html, /Cor alterada · \+1 item, \+1 colheita e \+25 XP/);
  assert.match(html, /finalQty \+= 1/);
  assert.match(html, /\+25 XP Mutação/);
  assert.match(html, /Combina com habilidades e outros bônus/);
  assert.match(html, /harvestsRemaining = Number\(G\.plots\[idx\]\.harvestsRemaining/);
  assert.match(html, /if \(plot\.mutated\)/);
  assert.doesNotMatch(html, /const wasMutated = plot\.mutated === true/);
});

test('persiste o próximo evento para impedir repetição por F5', () => {
  assert.match(html, /eventNextAt:\s+Number\(G\.eventNextAt \|\| 0\)/);
  assert.match(html, /G\.eventNextAt\s+= Number\(save\.eventNextAt \|\| 0\)/);
  assert.match(html, /G\.eventNextAt = gardenEvent\.endsAt \+ nextEventDelay\(\)/);
});

test('eventos recompensam por ações sem creditar pontos diretamente', () => {
  const start = html.indexOf('// ─── EVENTOS VIVOS DO JARDIM');
  const end = html.indexOf('// maxWater', start);
  const eventSource = html.slice(start, end);
  assert.doesNotMatch(eventSource, /G\.pts\s*\+=/);
  assert.match(eventSource, /gainXP\(/);
  assert.match(html, /activeGardenEvent\('golden'\)/);
  assert.match(html, /activeGardenEvent\('moon'\)/);
});

test('chuva mágica dá um tick de crescimento quando a planta já está totalmente regada', () => {
  assert.match(html, /if \(plot\.waterCount < max\)/);
  assert.match(html, /const maxGrow = effectiveMaxGrow\(plot\.type\)/);
  assert.match(html, /plot\.growCount = Math\.min\(maxGrow, Number\(plot\.growCount \|\| 0\) \+ 1\)/);
});

test('evento terminado mostra popup com resumo e recompensas', () => {
  assert.match(html, /function showGardenEventSummary\(finished, def\)/);
  assert.match(html, /garden-event-summary-overlay/);
  assert.match(html, /showGardenEventSummary\(finished, def\)/);
  assert.match(html, /XP ganhos/);
});

test('eventos têm contraste no modo escuro e layout responsivo', () => {
  assert.match(html, /body\.dark-mode \.garden-event-timer/);
  assert.match(html, /body\.dark-mode #garden-event-summary-overlay \.levelup-rewards/);
  assert.match(html, /\.garden-event-banner\.visible \{ align-items:flex-start; flex-wrap:wrap/);
  assert.match(html, /\.garden-event-timer \{ order:3; width:100%/);
});

test('Lírio Lunar é exclusivo do evento e tem saquinho especial', () => {
  assert.match(html, /moon_lily:.*eventOnly:true/);
  assert.match(html, /Object\.entries\(FLOWERS\)\.filter\(\(\[, p\]\) => !p\.eventOnly\)/);
  assert.match(html, /product\?\.eventOnly/);
  assert.match(html, /const lunar = type === 'moon_lily'/);
});

test('conflito de gravação não deixa o login carregando infinitamente', () => {
  assert.match(html, /function handleGardenSessionConflict[\s\S]*?setLoginLoading\(false\)/);
  assert.match(html, /conflict\.code === 'STALE_STATE'[\s\S]*?saveGardenToSENow\(false\)/);
  assert.match(html, /conflict\.code === 'SESSION_CONFLICT'[\s\S]*?handleGardenSessionConflict/);
  assert.match(html, /handleGardenSessionConflict\(conflict\.error\);\s*throw new Error\('Sessão do jardim encerrada por outra tela\.'/);
});

test('frase do dia só confirma após salvar e restaura o valor em caso de falha', () => {
  assert.match(html, /const previousPhrase = G\.dailyPhrase \|\| ''/);
  assert.match(html, /if \(!seUser \|\| !gardenHydrated\)/);
  assert.match(html, /G\.dailyPhrase = previousPhrase;[\s\S]*?Não foi possível salvar a frase/);
});

test('nome da fazenda só confirma após salvar e não exibe sucesso e erro juntos', () => {
  assert.match(html, /const previousName = G\.farmName/);
  assert.match(html, /await saveGardenToSE\(\);[\s\S]*?Nome da fazenda alterado!/);
  assert.match(html, /G\.farmName = previousName;[\s\S]*?Não foi possível salvar o perfil/);
});

test('títulos desbloqueados podem ser escolhidos e avisam pelo correio', () => {
  assert.match(html, /selectedHarvestTitle: ''/);
  assert.match(html, /function selectHarvestTitle\(name\)/);
  assert.match(html, /Novo título desbloqueado:/);
  assert.match(html, /G_MAIL\.some\(mail => mail\.id === id\)/);
  assert.match(html, /selectedHarvestTitle: G\.selectedHarvestTitle \|\| ''/);
});

test('o jogo possui favicon com o ícone de pontos', () => {
  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="points-sprout\.svg">/);
});

test('cartas do correio com IDs de texto podem ser abertas', () => {
  assert.match(html, /onclick='openLetter\(\$\{JSON\.stringify\(m\.id\)\}\)'/);
});

test('perfil oferece dois títulos difíceis de desbloquear', () => {
  assert.match(html, /name:'Imperador da Colheita', target:3000/);
  assert.match(html, /name:'Eterno do Jardim', target:7500/);
});
