const TWITCH_LOGIN = 'misttylol';

exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'max-age=30',
  };

  try {
    // Query direta sem persistedQuery
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

    const text = await res.text();
    console.log('GQL raw:', text);

    const data = JSON.parse(text);
    const stream = data?.data?.user?.stream;
    const isLive = !!stream;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        live: isLive,
        title: stream?.title || '',
        viewers: stream?.viewersCount || 0,
        raw: text, // debug
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
