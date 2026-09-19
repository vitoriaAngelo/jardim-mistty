const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const start = html.indexOf("const toolsPanel = document.querySelector('.inventory-side-panel')");
const end = html.indexOf('</script>', start);
const menuSetup = html.slice(start, end);

test('Loja Exclusiva é inserida também quando o menu já existe e abre após carregar a função', () => {
  assert.match(menuSetup, /existingToolsDropdown && !existingToolsDropdown\.querySelector\('\.exclusive-store-launcher'\)/);
  assert.match(menuSetup, /existingToolsDropdown\.appendChild\(exclusiveStoreButton\)/);
  assert.match(menuSetup, /addEventListener\('click', \(\) => window\.openExclusiveStore\?\.\(\)\)/);
  assert.ok(menuSetup.indexOf('if (toolsPanel && !toolsPanel.querySelector') < menuSetup.indexOf('const existingToolsDropdown'));
});
