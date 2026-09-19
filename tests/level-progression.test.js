const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('public/index.html', 'utf8');
const start = html.indexOf('const LEVELS = [');
const end = html.indexOf('// XP per action', start);
const source = html.slice(start, end);

test('curva de XP preserva até nível 13 e fica progressivamente mais difícil depois', () => {
  const context = vm.createContext({});
  vm.runInContext(`${source}\nglobalThis.__levels = LEVELS;`, context);
  const levels = context.__levels;

  assert.equal(levels[12].minXP, 8140);
  assert.ok(levels[13].minXP > 9910);
  assert.equal(levels[30].lv, 31);

  const gap13 = levels[12].minXP - levels[11].minXP;
  const gap14 = levels[13].minXP - levels[12].minXP;
  const gap31 = levels[30].minXP - levels[29].minXP;
  const gap32 = levels[31].minXP - levels[30].minXP;
  const gap100 = levels[99].minXP - levels[98].minXP;
  assert.ok(gap14 > gap13);
  assert.ok(gap32 > gap31);
  assert.ok(gap100 > gap32);
  assert.ok(levels.every((level, index) => index === 0 || level.minXP > levels[index - 1].minXP));
});
