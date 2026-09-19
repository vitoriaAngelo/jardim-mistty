function supabaseServiceHeaders(key, extra = {}) {
  if (!key) throw Object.assign(new Error('Banco indisponível'), { statusCode: 503 });
  const headers = { apikey: key, ...extra };
  // As chaves legadas são JWTs e usam Bearer. As novas sb_secret_* devem ser
  // enviadas somente como apikey; tratá-las como JWT faz o Supabase responder 401.
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  return headers;
}

module.exports = { supabaseServiceHeaders };
