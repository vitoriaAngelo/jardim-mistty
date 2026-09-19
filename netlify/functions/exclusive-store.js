const SUPABASE_URL = 'https://luvjridqxqpxnljucnur.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SE_API = 'https://api.streamelements.com/kappa/v2';
const SE_CHANNEL = process.env.STREAMELEMENTS_CHANNEL_ID || '5b9a7efe15cd280f04f5891b';
const SE_JWT = process.env.STREAMELEMENTS_JWT;
const { authenticateTwitch } = require('./_auth');
const { readGarden, activeSession } = require('./_garden-store');

const PRODUCTS = {
  ifood_20: { cost:5_000_000, limit:3 },
  ifood_50: { cost:10_000_000, limit:1 },
};
const HEADERS = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Garden-Session',
  'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
  'Cache-Control':'no-store',
  'Content-Type':'application/json',
};

async function callRpc(name, body) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method:'POST',
    headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, 'Content-Type':'application/json' },
    body:JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error(payload?.message || payload?.details || 'Não foi possível registrar o resgate no banco.'), { statusCode:response.status === 404 ? 503 : 409 });
  return payload;
}

async function getSEPoints(username) {
  const response = await fetch(`${SE_API}/points/${SE_CHANNEL}/${encodeURIComponent(username)}`, {
    headers:{ Authorization:`Bearer ${SE_JWT}`, 'Content-Type':'application/json' },
  });
  if (!response.ok) throw new Error('Não foi possível confirmar seu saldo de pontos. Tente novamente.');
  const payload = await response.json();
  const points = Number(payload?.points);
  if (!Number.isFinite(points) || points < 0) throw new Error('O saldo de pontos retornado é inválido.');
  return points;
}

async function mutateSEPoints(username, amount, method) {
  const base = `${SE_API}/points/${SE_CHANNEL}/${encodeURIComponent(username)}`;
  let response = await fetch(`${base}/${amount}`, { method, headers:{ Authorization:`Bearer ${SE_JWT}`, 'Content-Type':'application/json' } });
  if (!response.ok && method === 'DELETE') {
    response = await fetch(`${base}/-${amount}`, { method:'PUT', headers:{ Authorization:`Bearer ${SE_JWT}`, 'Content-Type':'application/json' } });
  }
  return response.ok;
}

async function reservationStatus(id) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/exclusive_store_redemptions?id=eq.${encodeURIComponent(id)}&select=status&limit=1`, {
    headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` },
  });
  if (!response.ok) return null;
  const rows = await response.json();
  return rows[0]?.status || null;
}

exports.handler = async event => {
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers:HEADERS, body:'' };
  if (!['GET','POST'].includes(event.httpMethod)) return { statusCode:405, headers:HEADERS, body:JSON.stringify({ error:'Method Not Allowed' }) };

  try {
    const auth = await authenticateTwitch(event);
    if (!SUPABASE_KEY) return { statusCode:503, headers:HEADERS, body:JSON.stringify({ error:'A Loja Exclusiva ainda não está configurada no banco.' }) };

    if (event.httpMethod === 'GET') {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/exclusive_store_redemptions?select=reward_key,username,redeemer_name,status,created_at,redeemed_at&status=in.(pending,redeemed,review)&order=created_at.asc`, {
        headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` },
      });
      const raw = await response.text();
      if (!response.ok) {
        let details={};try{details=JSON.parse(raw)}catch{}
        const missingMigration = ['PGRST205','42P01'].includes(details.code) || /schema cache|does not exist/i.test(details.message||'');
        const permissionIssue = details.code === '42501' || /permission denied/i.test(details.message||'');
        const message = missingMigration
          ? 'A tabela da Loja Exclusiva não foi encontrada no projeto Supabase conectado ao Preview.'
          : permissionIssue
            ? 'O servidor não tem permissão para consultar os resgates. Reaplique a migração da Loja Exclusiva no Supabase.'
            : 'Não foi possível carregar os resgates da Loja Exclusiva: ' + (details.message||'erro no Supabase.');
        throw Object.assign(new Error(message), { statusCode:missingMigration||permissionIssue ? 503 : 502 });
      }
      const rows = JSON.parse(raw || '[]');
      const pendingCutoff = Date.now() - 15 * 60 * 1000;
      const activeRows = rows.filter(row => row.status !== 'pending' || new Date(row.created_at).getTime() >= pendingCutoff);
      const products = {};
      for (const [key, product] of Object.entries(PRODUCTS)) {
        const claims = activeRows.filter(row => row.reward_key === key);
        const reserved = claims.filter(row => ['pending','review'].includes(row.status)).length;
        const redeemed = claims.filter(row => row.status === 'redeemed');
        products[key] = {
          cost:product.cost,
          limit:product.limit,
          remaining:Math.max(0, product.limit - claims.length),
          redeemers:redeemed.map(row => ({ username:row.username, name:row.redeemer_name, redeemedAt:row.redeemed_at })),
          processing:reserved,
        };
      }
      return { statusCode:200, headers:HEADERS, body:JSON.stringify({ products }) };
    }

    if (!SE_JWT) return { statusCode:503, headers:HEADERS, body:JSON.stringify({ error:'O resgate por pontos está temporariamente indisponível.' }) };
    const sessionId = event.headers?.['x-garden-session'] || event.headers?.['X-Garden-Session'];
    const garden = await readGarden(auth.username);
    if (!garden || !activeSession(garden.data, sessionId)) {
      return { statusCode:409, headers:HEADERS, body:JSON.stringify({ error:'Esta fazenda está aberta em outra sessão. Atualize e tente novamente.' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const rewardKey = String(body.reward_key || '');
    const requestId = String(body.request_id || '');
    const product = PRODUCTS[rewardKey];
    if (!product || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      return { statusCode:400, headers:HEADERS, body:JSON.stringify({ error:'Prêmio ou identificador do resgate inválido.' }) };
    }

    const displayName = String(auth.user.display_name || auth.user.login || auth.username).trim().slice(0,80);
    const reservation = await callRpc('reserve_exclusive_store_redemption', {
      p_request_id:requestId,
      p_reward_key:rewardKey,
      p_username:auth.username,
      p_redeemer_name:displayName,
      p_session_id:sessionId,
    });
    if (reservation?.status !== 'pending' || !reservation.id || reservation.newly_reserved !== true) {
      const alreadyRedeemed = reservation?.status === 'redeemed';
      return { statusCode:alreadyRedeemed ? 200 : 409, headers:HEADERS, body:JSON.stringify({ ok:alreadyRedeemed, alreadyRedeemed, error:alreadyRedeemed ? undefined : 'Este pedido de resgate já foi processado. Atualize a loja antes de tentar novamente.' }) };
    }

    let pointsBefore;
    try {
      pointsBefore = await getSEPoints(auth.username);
      if (pointsBefore < product.cost) throw new Error(`Você precisa de ${(product.cost - pointsBefore).toLocaleString('pt-BR')} pontos a mais para resgatar este cartão.`);
    } catch (error) {
      await callRpc('release_exclusive_store_redemption', { p_redemption_id:reservation.id }).catch(() => {});
      return { statusCode:409, headers:HEADERS, body:JSON.stringify({ error:error.message }) };
    }

    let charged;
    try {
      charged = await mutateSEPoints(auth.username, product.cost, 'DELETE');
    } catch {
      // A timeout can happen after StreamElements already applied the debit.
      // Keep the stock reserved for review instead of risking a duplicate charge.
      await callRpc('flag_exclusive_store_redemption_for_review', { p_redemption_id:reservation.id }).catch(() => {});
      return { statusCode:503, headers:HEADERS, body:JSON.stringify({ error:'Não foi possível confirmar o desconto dos pontos. O resgate ficou reservado para análise; não tente novamente agora.' }) };
    }
    if (!charged) {
      await callRpc('release_exclusive_store_redemption', { p_redemption_id:reservation.id }).catch(() => {});
      return { statusCode:502, headers:HEADERS, body:JSON.stringify({ error:'O StreamElements não confirmou o desconto. Seus pontos não foram usados.' }) };
    }

    let finalized = null;
    for (let attempt = 0; attempt < 3 && !finalized; attempt += 1) {
      try { finalized = await callRpc('finish_exclusive_store_redemption', { p_redemption_id:reservation.id }); }
      catch { if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1))); }
    }
    if (!finalized) {
      const state = await reservationStatus(reservation.id);
      if (state !== 'redeemed') {
        const refunded = await mutateSEPoints(auth.username, product.cost, 'PUT');
        if (refunded) {
          await callRpc('release_exclusive_store_redemption', { p_redemption_id:reservation.id }).catch(() => {});
          return { statusCode:503, headers:HEADERS, body:JSON.stringify({ error:'Não foi possível concluir o resgate. O desconto foi estornado; atualize e tente novamente.' }) };
        }
        await callRpc('flag_exclusive_store_redemption_for_review', { p_redemption_id:reservation.id }).catch(() => {});
        return { statusCode:503, headers:HEADERS, body:JSON.stringify({ error:'O desconto foi confirmado, mas a confirmação do prêmio está em análise. Não tente resgatar novamente; fale com o suporte.' }) };
      }
    }

    const pointsRemaining = await getSEPoints(auth.username).catch(() => Math.max(0, pointsBefore - product.cost));
    return { statusCode:200, headers:HEADERS, body:JSON.stringify({ ok:true, reward_key:rewardKey, pointsRemaining, redeemer:{ username:auth.username, name:displayName } }) };
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return { statusCode, headers:HEADERS, body:JSON.stringify({ error:error.message || 'Não foi possível concluir a operação da loja.' }) };
  }
};
