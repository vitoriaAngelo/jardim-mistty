const SE_API = 'https://api.streamelements.com/kappa/v2';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
  const url = `${SE_API}${rawPath}`;
  const method = event.httpMethod;

  try {
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
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
