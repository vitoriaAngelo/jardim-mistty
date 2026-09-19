const { authenticateTwitch, requireSameUser } = require('./_auth');
const { readGarden, conditionalPatch, activeSession } = require('./_garden-store');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Garden-Session',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

const VALID_BACKGROUNDS = new Set(['spring','sunny','rain','night','autumn','winter','rainbow','forest']);
const VALID_TITLES = new Set(['','Primeira Colheita','Mãos na Terra','Jardineiro Dedicado','Mestre da Colheita','Lenda do Jardim','Imperador da Colheita','Eterno do Jardim']);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };
  try {
    const { username, sessionId, profileBackground, selectedHarvestTitle, farmName, farmNameChosen, dailyPhrase } = JSON.parse(event.body || '{}');
    if (!username || !sessionId) return { statusCode: 400, headers, body: JSON.stringify({ error:'Dados inválidos' }) };
    const auth = await authenticateTwitch(event);
    requireSameUser(auth, username);
    const current = await readGarden(auth.username);
    const sameSession = Boolean(current && current.data?._activeSessionId === sessionId);
    if (!current || (!sameSession && !activeSession(current.data, sessionId))) return { statusCode:409, headers, body:JSON.stringify({ error:'Este jardim está ativo em outra tela', code:'SESSION_CONFLICT' }) };

    const next = { ...current.data };
    if (profileBackground !== undefined) {
      if (!VALID_BACKGROUNDS.has(profileBackground)) return { statusCode:400, headers, body:JSON.stringify({ error:'Plano de fundo inválido' }) };
      next.profileBackground = profileBackground;
    }
    if (selectedHarvestTitle !== undefined) {
      if (!VALID_TITLES.has(selectedHarvestTitle)) return { statusCode:400, headers, body:JSON.stringify({ error:'Título inválido' }) };
      next.selectedHarvestTitle = selectedHarvestTitle;
    }
    if (farmName !== undefined) {
      const value = String(farmName || '').trim();
      if (!value || value.length > 20) return { statusCode:400, headers, body:JSON.stringify({ error:'Nome da fazenda inválido' }) };
      next.farmName = value;
    }
    if (farmNameChosen !== undefined) {
      if (farmNameChosen !== true || !String(next.farmName || '').trim()) return { statusCode:400, headers, body:JSON.stringify({ error:'Escolha um nome válido para a fazenda' }) };
      next.farmNameChosen = true;
    }
    if (dailyPhrase !== undefined) {
      const value = String(dailyPhrase || '').trim();
      if (value.length > 25) return { statusCode:400, headers, body:JSON.stringify({ error:'Frase do dia inválida' }) };
      next.dailyPhrase = value;
    }
    next._sessionLeaseUntil = Date.now() + (2 * 60 * 1000);
    const updated = await conditionalPatch(auth.username, current.updated_at, next);
    if (!updated) return { statusCode:409, headers, body:JSON.stringify({ error:'O perfil foi atualizado em outra tela', code:'STALE_STATE' }) };
    return { statusCode:200, headers, body:JSON.stringify({ ok:true, revision:updated.updated_at }) };
  } catch (error) {
    return { statusCode:error.statusCode || 500, headers, body:JSON.stringify({ error:error.message }) };
  }
};
