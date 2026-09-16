const SUPABASE_URL = process.env.SUPABASE_URL || 'https://luvjridqxqpxnljucnur.supabase.co';
const activeDbKey = () => process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const { deliverPaidKit } = require('./mercadopago-webhook');
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dmpyaWRxeHFweG5sanVjbnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDM3ODQsImV4cCI6MjEwNDgxOTc4NH0.shmGCDtE-XDPROUCezVjR27WFYD3VYfvQaE1-OVewGc';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const username = event.queryStringParameters?.username;
  if (!username) return { statusCode: 400, headers, body: JSON.stringify({ error: 'username required' }) };

  try {
    if (SERVICE_KEY) {
      const paidRes = await fetch(`${SUPABASE_URL}/rest/v1/payment_orders?username=eq.${encodeURIComponent(username)}&status=eq.paid&select=order_id,username,kit&order=id.asc`, { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } });
      if (paidRes.ok) {
        const paidOrders = await paidRes.json();
        for (const order of paidOrders) await deliverPaidKit(order, order.order_id);
      }
    }
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(username)}&select=data&order=updated_at.desc&limit=1`,
      {
        headers: {
          'apikey': activeDbKey(),
          'Authorization': `Bearer ${activeDbKey()}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: err }) };
    }

    const rows = await res.json();
    if (!rows.length) return { statusCode: 404, headers, body: JSON.stringify({ data: null }) };

    return { statusCode: 200, headers, body: JSON.stringify({ data: rows[0].data }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
