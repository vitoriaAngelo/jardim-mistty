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

test('acelera automaticamente o primeiro evento apenas no Deploy Preview', () => {
  assert.match(html, /location\.hostname\.startsWith\('deploy-preview-'\)/);
  assert.match(html, /eventFastMode\(\) \? 8000 \+ Math\.random\(\)\*5000/);
  assert.match(html, /G\.eventNextAt = Date\.now\(\)\+5000/);
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
