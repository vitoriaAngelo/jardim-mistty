const { authenticateTwitch, requireSameUser } = require('./_auth');
const { readGarden, conditionalPatch, createGarden } = require('./_garden-store');

const LEASE_MS = 2 * 60 * 1000;
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Garden-Session', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };
  try {
    const { username, sessionId } = JSON.parse(event.body || '{}');
    if (!username || !sessionId || String(sessionId).length > 100) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Dados da sessão inválidos' }) };
    const auth = await authenticateTwitch(event);
    requireSameUser(auth, username);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await readGarden(auth.username);
      const nextData = { ...(current?.data || {}), _activeSessionId: sessionId, _sessionLeaseUntil: Date.now() + LEASE_MS };
      if (!current) {
        nextData._isSessionShell = true;
        try {
          const created = await createGarden(auth.username, nextData);
          return { statusCode: 200, headers, body: JSON.stringify({ ok: true, revision: created.updated_at }) };
        } catch (error) { continue; }
      }
      const updated = await conditionalPatch(auth.username, current.updated_at, nextData);
      if (updated) return { statusCode: 200, headers, body: JSON.stringify({ ok: true, revision: updated.updated_at }) };
    }
    return { statusCode: 409, headers, body: JSON.stringify({ error: 'Não foi possível assumir a sessão. Tente novamente.' }) };
  } catch (error) {
    return { statusCode: error.statusCode || 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
