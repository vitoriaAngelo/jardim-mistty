const SE_API = 'https://api.streamelements.com/kappa/v2';
const SE_CHANNEL = process.env.STREAMELEMENTS_CHANNEL_ID || '5b9a7efe15cd280f04f5891b';
const { authenticateTwitch, requireSameUser } = require('./_auth');
const { readGarden, activeSession } = require('./_garden-store');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Garden-Session',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const seJwt = process.env.STREAMELEMENTS_JWT;
  if (!seJwt) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'StreamElements integration is not configured.' }),
    };
  }

  const rawPath = event.queryStringParameters?.path || '';
  const method = event.httpMethod;

  try {
    const decodedPath = decodeURIComponent(rawPath);
    const match = decodedPath.match(/^\/points\/([^/]+)\/(top(?:\?.*)?|([^/?]+)(?:\/(-?\d+))?)$/);
    if (!match || match[1] !== SE_CHANNEL) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Operação de pontos não permitida' }) };
    }
    const isRanking = match[2].startsWith('top');
    const username = match[3] ? decodeURIComponent(match[3]) : '';
    const isMutation = method === 'PUT' || method === 'DELETE';
    if (method !== 'GET' && !isMutation) return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

    if (!isRanking || isMutation) {
      const auth = await authenticateTwitch(event);
      requireSameUser(auth, username);
      if (isMutation) {
        const sessionId = event.headers?.['x-garden-session'] || event.headers?.['X-Garden-Session'];
        const garden = await readGarden(auth.username);
        if (!garden || !activeSession(garden.data, sessionId)) {
          return { statusCode: 409, headers, body: JSON.stringify({ error: 'Este jardim está ativo em outra tela' }) };
        }
      }
    }

    const url = `${SE_API}${decodedPath}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${seJwt}`,
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' && event.body ? event.body : undefined,
    });

    return {
      statusCode: res.status,
      headers,
      body: await res.text(),
    };
  } catch (error) {
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
