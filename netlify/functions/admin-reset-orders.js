// Função de admin: reseta pedidos de TODOS os jogadores.
// Protegida por ADMIN_SECRET (variável de ambiente no Netlify).
// Uso: POST /admin-reset-orders  com header  Authorization: Bearer <ADMIN_SECRET>
//
// O que faz:
//   - Incrementa ordersGlobalResetVersion em todos os saves
//   - Zera orderSearches, orderDeliveries, orderPaidReset
//   - Remove os pedidos existentes (o frontend gera novos ao carregar)

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://luvjridqxqpxnljucnur.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  // Verificar chave de admin
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) return { statusCode: 503, headers, body: JSON.stringify({ error: 'ADMIN_SECRET não configurado no servidor.' }) };
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (token !== ADMIN_SECRET) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Não autorizado.' }) };

  if (!SERVICE_KEY) return { statusCode: 503, headers, body: JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurado.' }) };

  try {
    // Buscar todos os jardins
    const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/gardens?select=username,data,updated_at`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!fetchRes.ok) throw new Error(`Supabase fetch falhou: ${fetchRes.status}`);
    const rows = await fetchRes.json();

    let updated = 0;
    let failed = 0;

    // Atualizar em paralelo (lotes de 20 para não sobrecarregar)
    const BATCH = 20;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      await Promise.all(batch.map(async (row) => {
        const data = row.data || {};
        const currentVersion = Number(data.ordersGlobalResetVersion || 0);
        const newVersion = currentVersion + 1;

        const newData = {
          ...data,
          ordersGlobalResetVersion: newVersion,
          orderSearches: 0,
          orderDeliveries: 0,
          orderPaidReset: false,
          orders: [],
          ordersSeasonKey: String(data.seasonIdx || '0'),
        };

        const patchRes = await fetch(
          `${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(row.username)}`,
          {
            method: 'PATCH',
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ data: newData, updated_at: new Date().toISOString() }),
          }
        );
        if (patchRes.ok) { updated++; } else { failed++; }
      }));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, total: rows.length, updated, failed }),
    };
  } catch (err) {
    console.error('admin-reset-orders error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err.message) }) };
  }
};
