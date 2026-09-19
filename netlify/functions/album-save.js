const SUPABASE_URL = 'https://luvjridqxqpxnljucnur.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const { authenticateTwitch, requireSameUser } = require('./_auth');

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization, X-Garden-Session','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error:'Method Not Allowed' }) };
  if (!SUPABASE_KEY) return { statusCode: 503, headers, body: JSON.stringify({ error:'Banco não configurado no servidor.' }) };
  try {
    const { username, cards } = JSON.parse(event.body || '{}');
    if (!username || !Array.isArray(cards)) return { statusCode:400, headers, body:JSON.stringify({ error:'username e cards são obrigatórios' }) };
    const auth = await authenticateTwitch(event); requireSameUser(auth, username);
    const rows = cards.filter(c => c && typeof c.card_id === 'string' && Number.isInteger(c.quantity) && c.quantity >= 0).map(c => ({ username, card_id:c.card_id, quantity:c.quantity, reserved_quantity:Number.isInteger(c.reserved_quantity) && c.reserved_quantity >= 0 ? c.reserved_quantity : 0, updated_at:new Date().toISOString() }));
    if (rows.length !== cards.length) return { statusCode:400, headers, body:JSON.stringify({ error:'Cartas inválidas' }) };
    const response = await fetch(`${SUPABASE_URL}/rest/v1/player_cards?on_conflict=username,card_id`, { method:'POST', headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates,return=minimal' }, body:JSON.stringify(rows) });
    if (!response.ok) return { statusCode:500, headers, body:JSON.stringify({ error:await response.text() }) };
    return { statusCode:200, headers, body:JSON.stringify({ ok:true, saved:rows.length }) };
  } catch (error) { return { statusCode:500, headers, body:JSON.stringify({ error:error.message }) }; }
};
