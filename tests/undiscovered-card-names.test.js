const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const commonCss = fs.readFileSync('public/album-spring.css', 'utf8');
const prismCss = fs.readFileSync('public/album-prismatic.css', 'utf8');
const prismReprintCss = fs.readFileSync('public/album-prismatic-reprint.css', 'utf8');

test('nomes de cartas ainda não descobertas aparecem; ilustrações continuam borradas', () => {
  assert.match(commonCss, /\.card\.missing \.art svg\{filter:blur\(/);
  assert.match(commonCss, /\.card\.missing h3\{filter:none/);
  assert.match(prismCss, /\.card:not\(\.owned\) \.art svg\{filter:blur\(/);
  assert.match(prismCss, /\.card:not\(\.owned\) h3\{filter:none/);
  assert.match(prismReprintCss, /\.prism-reprint:not\(\.owned\) \.art svg \{ filter:[^}]*blur\(/);
  assert.match(prismReprintCss, /\.prism-reprint:not\(\.owned\) h3 \{ filter:none/);
});
