const SE_JWT     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjaXRhZGVsIiwiZXhwIjoxNzkxNjg4NTYzLCJqdGkiOiIxNmEwZmE2My0zNDZkLTQ3MjMtOWFmMy0yODE2MTQzNWZmY2EiLCJjaGFubmVsIjoiNWI5YTdlZmUxNWNkMjgwZjA0ZjU4OTFiIiwicm9sZSI6Im93bmVyIiwiYXV0aFRva2VuIjoiUzRnb1A1ekhXRFdPNmFhQ1lJWlEiLCJ1c2VyIjoiNWI5YTdlZmUxNWNkMjgzMDY5ZjU4OTFhIiwidXNlcl9pZCI6IjFjOGFkMWQzLTQ0NDUtNGZjZS04ODZmLTRjNDcwYWU3OTRlOSIsInVzZXJfcm9sZSI6ImNyZWF0b3IiLCJwcm92aWRlciI6InR3aXRjaCIsInByb3ZpZGVyX2lkIjoiNjE1MDIyMTMiLCJjaGFubmVsX2lkIjoiYjk1MDk3ZmYtMWQ3ZS00ZTgyLTg0YTYtMzdhYzY1MGQ1M2VlIiwiY3JlYXRvcl9pZCI6IjljN2UyZTU0LWFiNzktNGM5YS05ODdjLWRjZTZlZjllMDVjMCJ9.qdEeG4tKYt8VBhP6j6Ep-EZTo0vaEZkJdXQfCOuZLNg';
const SE_API     = 'https://api.streamelements.com/kappa/v2';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // e.g. /se-proxy?path=/points/CHANNEL/top%3Flimit%3D25
  const rawPath = event.queryStringParameters?.path || '';
  // Decode and reconstruct the full SE URL
  const url    = `${SE_API}${rawPath}`;
  const method = event.httpMethod;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${SE_JWT}`,
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' && event.body ? event.body : undefined,
    });

    const text = await res.text();
    return {
      statusCode: res.status,
      headers,
      body: text,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
