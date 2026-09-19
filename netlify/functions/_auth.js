const TWITCH_USERS_URL = 'https://api.twitch.tv/helix/users';
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || '5vs8ms3nlbs1blwlot6j0fx1diabhp';
const ACTIVE_SESSION_VERSION = 'launch-2.0';

function bearerToken(event) {
  const value = event.headers?.authorization || event.headers?.Authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

async function authenticateTwitch(event) {
  const gardenSession = String(event.headers?.['x-garden-session'] || event.headers?.['X-Garden-Session'] || '');
  if (!gardenSession.startsWith(`${ACTIVE_SESSION_VERSION}:`)) {
    throw Object.assign(new Error('Sessão encerrada. Entre novamente.'), { statusCode: 401, code: 'SESSION_REVOKED' });
  }
  const token = bearerToken(event);
  if (!token) throw Object.assign(new Error('Login da Twitch necessário'), { statusCode: 401 });
  const response = await fetch(TWITCH_USERS_URL, {
    headers: { Authorization: `Bearer ${token}`, 'Client-Id': TWITCH_CLIENT_ID },
  });
  if (!response.ok) throw Object.assign(new Error('Sessão da Twitch inválida ou expirada'), { statusCode: 401 });
  const body = await response.json();
  const user = body.data?.[0];
  if (!user?.login) throw Object.assign(new Error('Conta da Twitch não encontrada'), { statusCode: 401 });
  return { token, username: String(user.login).toLowerCase(), user };
}

function requireSameUser(auth, username) {
  if (auth.username !== String(username || '').replace(/^@+/, '').toLowerCase()) {
    throw Object.assign(new Error('Esta sessão não pertence a esse jardim'), { statusCode: 403 });
  }
}

module.exports = { authenticateTwitch, requireSameUser, ACTIVE_SESSION_VERSION };
