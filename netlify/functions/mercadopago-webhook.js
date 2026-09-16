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

const KIT_GRANTS = {
  'Kit Jardineiro Iniciante': { rank: 1, capacity: 2, golden: 5, special: 1, specialMs: 3 * 60 * 60 * 1000, frame: 'yellow' },
  'Kit Jardineiro Experiente': { rank: 2, capacity: 4, recovery: 1, allFertilizers: 5, special: 2, specialMs: 6 * 60 * 60 * 1000, seeds: 1, frame: 'yellow' },
  'Kit Jardineiro Especialista': { rank: 3, capacity: 4, recovery: 1, allFertilizers: 10, special: 4, specialMs: 10 * 24 * 60 * 60 * 1000, seeds: 2, vipMs: 10 * 24 * 60 * 60 * 1000, frame: 'vip' },
};

async function deliverPaidKit(order, paymentId) {
  const grant = KIT_GRANTS[order.kit];
  if (!grant || !order.username) return;
  const query = `${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(order.username)}&select=data&order=updated_at.desc&limit=1`;
  const read = await fetch(query, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
  if (!read.ok) throw new Error('Não foi possível carregar o jardim para entregar o kit.');
  const rows = await read.json();
  const data = rows[0]?.data || {};
  const delivered = Array.isArray(data.paidKitOrders) ? data.paidKitOrders : [];
  if (delivered.includes(order.order_id)) return;

  const next = { ...data, paidKitOrders: [...delivered, order.order_id] };
  const previousRank = Number(data.bonusKitLevel || 0);
  if (grant.rank > previousRank) {
    next.bonusKitLevel = grant.rank;
    next.bonusRefillDiscount = true;
    next.bonusWateringCapacity = Math.max(Number(data.bonusWateringCapacity || 0), grant.capacity || 0);
    next.bonusWaterRecoveryMinutes = Math.max(Number(data.bonusWaterRecoveryMinutes || 0), grant.recovery || 0);
    next.profileFrame = grant.frame || data.profileFrame;
    next.supporterFrameUnlocked = true;
    if (grant.vipMs) next.bonusVipUntil = Math.max(Number(data.bonusVipUntil || 0), Date.now() + grant.vipMs);
  }
  if (grant.golden) next.fertilizerInventory = { ...(data.fertilizerInventory || {}), golden_soil: Number(data.fertilizerInventory?.golden_soil || 0) + grant.golden };
  if (grant.allFertilizers) {
    next.fertilizerInventory = { ...(next.fertilizerInventory || data.fertilizerInventory || {}) };
    ['quick_grow', 'golden_soil'].forEach(id => { next.fertilizerInventory[id] = Number(next.fertilizerInventory[id] || 0) + grant.allFertilizers; });
  }
  if (grant.seeds) {
    next.inventory = { ...(data.inventory || {}) };
    ['ruby_kale', 'star_radish', 'moon_lily', 'royal_dahlia'].forEach(id => { next.inventory[id] = Number(next.inventory[id] || 0) + grant.seeds; });
  }
  if (grant.special) {
    const plots = Array.isArray(data.specialPlots) ? [...new Set(data.specialPlots)] : (Number.isInteger(data.specialPlot) ? [data.specialPlot] : []);
    const unlocked = Number(data.unlockedPlots || 2);
    for (let i = 0; i < unlocked && plots.length < grant.special; i++) if (!plots.includes(i)) plots.push(i);
    next.specialPlots = plots;
    next.specialPlot = plots[0] ?? null;
    next.specialPlotExpiresAt = Math.max(Number(data.specialPlotExpiresAt || 0), Date.now() + grant.specialMs);
  }
  const saved = await fetch(`${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(order.username)}`, {
    method: 'PATCH', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ data: next, updated_at: new Date().toISOString() }),
  });
  if (!saved.ok) throw new Error(`Falha ao salvar entrega do kit (${saved.status}).`);
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
    if (status === 'paid') {
      const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/payment_orders?mercado_pago_payment_id=eq.${encodeURIComponent(paymentId)}&select=order_id,username,kit&limit=1`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
      const orders = await orderRes.json();
      if (orders[0]) await deliverPaidKit(orders[0], paymentId);
    }
    return json(200, { received: true });
  } catch (error) { return json(200, { received: true }); }
};
