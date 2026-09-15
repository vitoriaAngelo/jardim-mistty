const crypto = require('node:crypto');
const MP_API = 'https://api.mercadopago.com/v1/payments/';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://luvjridqxqpxnljucnur.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function json(statusCode, body) { return { statusCode, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }
function validSignature(event) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;
  const signature = event.headers?.['x-signature'] || event.headers?.['X-Signature'] || '';
  const requestId = event.headers?.['x-request-id'] || event.headers?.['X-Request-Id'] || '';
  const params = Object.fromEntries(String(signature).split(',').map((part) => part.trim().split('=')));
  const dataId = event.queryStringParameters?.['data.id'] || event.queryStringParameters?.id || '';
  if (!params.ts || !params.v1 || !requestId || !dataId) return false;
  const template = `id:${dataId};request-id:${requestId};ts:${params.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(template).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.v1));
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  if (!SUPABASE_KEY || !process.env.MP_ACCESS_TOKEN) return json(503, { error: 'Pagamento não configurado.' });
  if (!validSignature(event)) return json(401, { error: 'Assinatura inválida.' });
  try {
    const body = JSON.parse(event.body || '{}');
    const paymentId = body.data?.id || body.id;
    if (!paymentId) return json(200, { received: true });
    const paymentRes = await fetch(`${MP_API}${encodeURIComponent(paymentId)}`, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } });
    if (!paymentRes.ok) return json(502, { error: 'Não foi possível consultar o pagamento.' });
    const payment = await paymentRes.json();
    const status = payment.status === 'approved' ? 'paid' : payment.status === 'rejected' ? 'rejected' : 'pending';
    await fetch(`${SUPABASE_URL}/rest/v1/payment_orders?mercado_pago_payment_id=eq.${encodeURIComponent(paymentId)}`, {
      method: 'PATCH', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, paid_at: status === 'paid' ? new Date().toISOString() : null, webhook_payload: payment }),
    });
    return json(200, { received: true });
  } catch (error) { return json(200, { received: true }); }
};
