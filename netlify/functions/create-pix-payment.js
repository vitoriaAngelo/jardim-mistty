const MP_API = 'https://api.mercadopago.com/v1/payments';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://luvjridqxqpxnljucnur.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const KITS = {
  'Kit Jardineiro Iniciante': { amount: 5 },
  'Kit Jardineiro Experiente': { amount: 10 },
  'Kit Jardineiro Especialista': { amount: 15 },
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  if (!process.env.MP_ACCESS_TOKEN || !SUPABASE_KEY) return { statusCode: 503, headers, body: JSON.stringify({ error: 'Pagamento não configurado no servidor.' }) };

  try {
    const { username, kit, email } = JSON.parse(event.body || '{}');
    const definition = KITS[String(kit || '')];
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!username || !definition || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Kit, usuário e e-mail válido são obrigatórios.' }) };
    }

    const orderId = `mistty-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const payment = await fetch(MP_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': orderId },
      body: JSON.stringify({
        transaction_amount: definition.amount,
        description: `${kit} - Jardim da Mistty`,
        payment_method_id: 'pix',
        payer: { email: normalizedEmail },
        external_reference: orderId,
        notification_url: `${process.env.URL || 'https://misttylandia.netlify.app'}/.netlify/functions/mercadopago-webhook`,
      }),
    });
    const paymentData = await payment.json();
    if (!payment.ok) return { statusCode: 502, headers, body: JSON.stringify({ error: 'Não foi possível gerar o Pix.', details: paymentData }) };

    const save = await fetch(`${SUPABASE_URL}/rest/v1/payment_orders`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ order_id: orderId, username: String(username), kit, amount: definition.amount, status: 'pending', mercado_pago_payment_id: String(paymentData.id) }),
    });
    if (!save.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Pagamento criado, mas não foi possível registrar o pedido.' }) };

    const pix = paymentData.point_of_interaction?.transaction_data || {};
    return { statusCode: 200, headers, body: JSON.stringify({ orderId, paymentId: paymentData.id, status: paymentData.status, qrCode: pix.qr_code, qrCodeBase64: pix.qr_code_base64, ticketUrl: pix.ticket_url }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro interno ao criar pagamento.' }) };
  }
};
