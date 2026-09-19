const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('scripts inline do index.html permanecem sintaticamente válidos', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());
  const errors = [];
  scripts.forEach((source, index) => {
    try { new vm.Script(source); }
    catch (error) { errors.push(`script ${index + 1}: ${error.message}`); }
  });
  assert.deepEqual(errors, [], errors.join('\n'));
});
