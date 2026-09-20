const SUPABASE_URL = 'https://luvjridqxqpxnljucnur.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const { authenticateTwitch } = require('./_auth');

const NORMAL_CARDS = [
  ['Brotinho de Esperança', 'Pipo, o brotinho'],
  ['Juju entre Margaridas', 'Juju do galinheiro'],
  ['Alfredo do Orvalho', 'Alfredo do lago'],
  ['Ovelhinha Algodão', 'Mimi das nuvens'],
  ['Cogumelo do Pomar', 'Bento, o cogumelo'],
  ['Abelhinha Bilhetinho', 'Mel, a abelhinha'],
  ['Tulipinha Nuvem', 'Luna do luar'],
  ['Moranguinho Estrelar', 'Íris cristalina'],
  ['Borboleta Açucarada', 'Aurora das asas'],
  ['Solária da Primavera', 'Solária, guardiã do jardim'],
];
const PRISM_CARDS = [
  'Prisma de Orvalho', 'Prisma de Pétala', 'Prisma do Galinheiro',
  'Prisma do Lago', 'Prisma de Cristal', 'Prisma Borboleta',
  'Prisma Lunar', 'Prisma Aurora', 'Prisma Estelar', 'Arco-Íris Primaveril',
];

function countUniqueCards(inventory, keys) {
  return keys.filter(key => Number(inventory[key] || 0) > 0).length;
}

exports.handler = async event => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Garden-Session',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  try {
    await authenticateTwitch(event);
    if (!KEY) throw new Error('Banco de dados indisponível');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/gardens?select=username,data&order=updated_at.desc&limit=1000`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    if (!response.ok) throw new Error('Não foi possível carregar o ranking');
    const gardens = await response.json();
    const ranking = gardens.filter(row => row.username).map(row => {
      const data = row.data || {};
      const inventory = data.albumCards || {};
      const normalCount = NORMAL_CARDS.filter(names => countUniqueCards(inventory, names) > 0).length;
      const prismaticCount = PRISM_CARDS.reduce((total, name, index) => total + (countUniqueCards(inventory, [`prismatic_${index}`, name]) > 0 ? 1 : 0), 0);
      return {
        username: String(row.username),
        farmName: String(data.farmName || `Fazenda de @${row.username}`),
        normalCount,
        prismaticCount,
        rainbowCount: countUniqueCards(inventory, Array.from({length:10}, (_,i) => `rainbow_${i}`)),
        total: normalCount + prismaticCount + countUniqueCards(inventory, Array.from({length:10}, (_,i) => `rainbow_${i}`)),
      };
    }).sort((a, b) => b.total - a.total || b.normalCount - a.normalCount || b.prismaticCount - a.prismaticCount || a.username.localeCompare(b.username));
    return { statusCode: 200, headers, body: JSON.stringify({ ranking }) };
  } catch (error) {
    const statusCode = error.statusCode || (error.message === 'Banco de dados indisponível' ? 503 : 500);
    return { statusCode, headers, body: JSON.stringify({ error: error.message || 'Erro ao carregar ranking' }) };
  }
};
