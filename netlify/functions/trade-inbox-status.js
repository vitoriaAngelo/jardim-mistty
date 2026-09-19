const SUPABASE_URL = 'https://luvjridqxqpxnljucnur.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const { authenticateTwitch } = require('./_auth');
const { supabaseServiceHeaders } = require('./_supabase-auth');

exports.handler = async event => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Garden-Session',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers, body:'' };
  if (event.httpMethod !== 'GET') return { statusCode:405, headers, body:JSON.stringify({ error:'Method Not Allowed' }) };

  try {
    const user = await authenticateTwitch(event);
    if (!KEY) throw new Error('Banco de trocas indisponível');
    const dbHeaders = supabaseServiceHeaders(KEY, { 'Content-Type':'application/json' });
    const expiryResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/expire_trade_offers`, {
      method:'POST',
      headers:dbHeaders,
      body:'{}',
    });
    if (!expiryResponse.ok) console.error('Falha não bloqueante na limpeza de trocas:', expiryResponse.status, await expiryResponse.text());
    const params = new URLSearchParams({
      select:'id',
      recipient_username:`eq.${user.username}`,
      status:'eq.active',
      expires_at:`gt.${new Date().toISOString()}`,
      limit:'100',
    });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/trade_offers?${params}`, {
      headers:dbHeaders,
    });
    if (!response.ok) throw new Error('Não foi possível consultar as trocas');
    const offers = await response.json();
    return { statusCode:200, headers, body:JSON.stringify({ pendingCount:Array.isArray(offers) ? offers.length : 0 }) };
  } catch (error) {
    const statusCode = error.statusCode || (error.message === 'Banco de trocas indisponível' ? 503 : 500);
    return { statusCode, headers, body:JSON.stringify({ error:error.message || 'Erro ao consultar as trocas' }) };
  }
};
