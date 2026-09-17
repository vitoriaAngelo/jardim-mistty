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

test('planta perdida fora da estação não concede XP de colheita', () => {
  const harvestStart = html.indexOf('// AUTO-COLHEITA:');
  const harvestEnd = html.indexOf('// APLICAR ADUBO:', harvestStart);
  const harvestSource = html.slice(harvestStart, harvestEnd);
  const seasonCheck = harvestSource.indexOf('if (outOfSeason)');
  const rewardBranch = harvestSource.indexOf("gainXP('harvest'", seasonCheck);
  assert.ok(seasonCheck >= 0 && rewardBranch > seasonCheck, 'XP deve ficar somente no ramo de colheita válida');
  assert.doesNotMatch(harvestSource.slice(seasonCheck, harvestSource.indexOf('} else {', seasonCheck)), /gainXP\(/);
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
