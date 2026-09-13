const TWITCH_LOGIN = 'misttylol';

exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'max-age=60',
  };

  try {
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        query: `{
          user(login: "${TWITCH_LOGIN}") {
            stream {
              id
              title
              viewersCount
            }
          }
        }`
      }),
    });

    const data = await res.json();
    const stream = data?.data?.user?.stream;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        live: !!stream,
        title: stream?.title || '',
        viewers: stream?.viewersCount || 0,
      }),
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ live: false, error: e.message }),
    };
  }
};
