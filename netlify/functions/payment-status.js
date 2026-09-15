const SUPABASE_URL = process.env.SUPABASE_URL || 'https://luvjridqxqpxnljucnur.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  if (!SUPABASE_KEY) return { statusCode: 503, headers, body: JSON.stringify({ error: 'Pagamento não configurado.' }) };
  const orderId = event.queryStringParameters?.orderId;
  if (!orderId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'orderId obrigatório.' }) };
  const response = await fetch(`${SUPABASE_URL}/rest/v1/payment_orders?order_id=eq.${encodeURIComponent(orderId)}&select=order_id,kit,status`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!response.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Não foi possível consultar o pedido.' }) };
  const rows = await response.json();
  if (!rows[0]) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pedido não encontrado.' }) };
  return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
};
