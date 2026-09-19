const NORMAL_NAMES = [
  ['Brotinho de Esperança','Pipo, o brotinho'], ['Juju entre Margaridas','Juju do galinheiro'],
  ['Alfredo do Orvalho','Alfredo do lago'], ['Ovelhinha Algodão','Mimi das nuvens'],
  ['Cogumelo do Pomar','Bento, o cogumelo'], ['Abelhinha Bilhetinho','Mel, a abelhinha'],
  ['Tulipinha Nuvem','Luna do luar'], ['Moranguinho Estrelar','Íris cristalina'],
  ['Borboleta Açucarada','Aurora das asas'], ['Solária da Primavera','Solária, guardiã do jardim'],
];
const PRISM_NAMES = ['Prisma de Orvalho','Prisma de Pétala','Prisma do Galinheiro','Prisma do Lago','Prisma de Cristal','Prisma Borboleta','Prisma Lunar','Prisma Aurora','Prisma Estelar','Arco-Íris Primaveril'];
const normalize = value => String(value || '').trim().toLocaleLowerCase('pt-BR');

function cardIsInAlbum(inventory, card) {
  if (!inventory || typeof inventory !== 'object' || !card) return false;
  const keys = new Set();
  const id = String(card.cardId || card.card_id || '');
  if (id) keys.add(id);
  const name = normalize(card.name);
  const normalIndex = NORMAL_NAMES.findIndex(names => names.some(alias => normalize(alias) === name));
  const prismIndex = PRISM_NAMES.findIndex(prismName => normalize(prismName) === name);
  if (card.prismatic === true) {
    const index = normalIndex >= 0 ? normalIndex : prismIndex;
    if (index >= 0) { keys.add(`prismatic_${index}`); keys.add(PRISM_NAMES[index]); }
  } else if (normalIndex >= 0) {
    NORMAL_NAMES[normalIndex].forEach(alias => keys.add(alias));
    keys.add(String(normalIndex));
  }
  return [...keys].some(key => Number(inventory[key] || 0) > 0);
}

module.exports = { cardIsInAlbum };
