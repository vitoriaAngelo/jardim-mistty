const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const profileSave = fs.readFileSync(path.join(root, 'netlify', 'functions', 'garden-profile-save.js'), 'utf8');

test('primeiro login concede 200 pontos e abre cadastro obrigatório', () => {
  assert.match(html, /G\.pts \+= 200;/);
  assert.match(html, /recordPointsHistory\(200, 'Bônus de boas-vindas'\)/);
  assert.match(html, /await giveSEPoints\(200\);/);
  assert.match(html, /\+200 pontos!/);
  assert.match(html, /if \(!hadSave\) G\.farmNameChosen = false;/);
  assert.match(html, /if \(G\.farmNameChosen !== true\) setTimeout\(\(\) => openFirstLoginBonus\(\), 500\);/);
});

test('popup exige nome e não fecha por clique externo ou Escape', () => {
  const start = html.indexOf('function openFirstLoginBonus()');
  const end = html.indexOf('function applyTheme(', start);
  const onboarding = html.slice(start, end);
  assert.match(onboarding, /overlay\.dataset\.lockClose = 'true'/);
  assert.match(onboarding, /id="first-login-farm-name"/);
  assert.match(onboarding, /maxlength="20"/);
  assert.doesNotMatch(onboarding, /popup-close-x/);
  assert.match(html, /overlay\.dataset\.lockClose === 'true'/);
});

test('nome só encerra o cadastro depois de ser salvo no banco', () => {
  const start = html.indexOf('async function completeFirstLoginSetup()');
  const end = html.indexOf('function applyTheme(', start);
  const completion = html.slice(start, end);
  const saveAt = completion.indexOf('await saveProfilePreferences({ farmName, farmNameChosen:true })');
  const removeAt = completion.indexOf("document.getElementById('first-login-bonus-overlay')?.remove()");
  assert.ok(saveAt >= 0, 'deve salvar nome e confirmação no perfil');
  assert.ok(removeAt > saveAt, 'só deve fechar depois da confirmação do banco');
  assert.match(html, /farmNameChosen:\s+G\.farmNameChosen === true/);
  assert.match(html, /if \(save\.farmNameChosen !== undefined\) G\.farmNameChosen = save\.farmNameChosen === true/);
});

test('servidor valida e persiste a conclusão do cadastro', () => {
  assert.match(profileSave, /farmName, farmNameChosen, dailyPhrase/);
  assert.match(profileSave, /farmNameChosen !== true \|\| !String\(next\.farmName \|\| ''\)\.trim\(\)/);
  assert.match(profileSave, /next\.farmNameChosen = true/);
});
