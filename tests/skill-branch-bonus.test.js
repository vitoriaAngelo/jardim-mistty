const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('public/index.html', 'utf8');
const start = html.indexOf('const SKILL_BRANCHES = [');
const end = html.indexOf('// Custo em pts por nível', start);
const source = html.slice(start, end);

function skillHarness() {
  const context = vm.createContext({ G:{skillNodes:{}}, console });
  vm.runInContext(`${source}\nglobalThis.__branches = SKILL_BRANCHES`, context);
  return context;
}

test('bônus de domínio só ativa com todos os nós da ramificação no máximo', () => {
  const context = skillHarness();
  for (const branch of context.__branches) {
    context.G.skillNodes = Object.fromEntries(branch.nodes.map(node=>[node.id,node.max]));
    assert.equal(context.skillBranchBonusActive(branch.id), true, `${branch.id} deve ativar com todos os nós completos`);
    const lastNode = branch.nodes.at(-1);
    context.G.skillNodes[lastNode.id] -= 1;
    assert.equal(context.skillBranchBonusActive(branch.id), false, `${branch.id} deve desligar quando um nó perde um nível`);
    context.G.skillNodes = {};
    assert.equal(context.skillBranchBonusActive(branch.id), false, `${branch.id} deve ficar desligada após redefinir os pontos`);
  }
});

test('descrições da árvore informam exatamente os quatro bônus pedidos', () => {
  assert.match(html, /cultivo: '50% de chance de uma rega também regar uma segunda planta/);
  assert.match(html, /colheita: '\+15 segundos à duração de todos os eventos/);
  assert.match(html, /mercado: '\+2% de chance de uma venda render o dobro/);
  assert.match(html, /animais: '-1 minuto no tempo de produção de todos os animais/);
});
