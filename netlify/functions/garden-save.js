const SUPABASE_URL = 'https://luvjridqxqpxnljucnur.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dmpyaWRxeHFweG5sanVjbnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDM3ODQsImV4cCI6MjEwNDgxOTc4NH0.shmGCDtE-XDPROUCezVjR27WFYD3VYfvQaE1-OVewGc';

function isPlaceholderFarmName(name, username) {
  const value = String(name || '').trim().toLowerCase();
  const safeUsername = String(username || '').replace(/^@+/, '').trim().toLowerCase();
  return !value
    || value === 'jardim da mistty'
    || value === 'jardim de mistty'
    || value === `jardim de @${safeUsername}`
    || value === `jardim de ${safeUsername}`;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const { username, data } = JSON.parse(event.body);
    if (!username) return { statusCode: 400, headers, body: JSON.stringify({ error: 'username required' }) };

    const safeData = { ...(data || {}) };
    const premiumFields = [
      'premiumWateringCan',
      'premiumShovel',
      'premiumPlantsUnlocked',
      'premiumFertilizersClaimed',
      'premiumSpecialPlotClaimed',
    ];
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(username)}&select=data&order=updated_at.desc&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (existingRes.ok) {
      const existingRows = await existingRes.json();
      const existingData = existingRows[0]?.data || {};
      const existingName = existingData.farmName;
      if (isPlaceholderFarmName(safeData.farmName, username) && !isPlaceholderFarmName(existingName, username)) {
        safeData.farmName = existingName;
      }
      // Resgates Premium são permanentes. Uma gravação atrasada ou um F5 não
      // pode apagar um presente que já foi resgatado anteriormente.
      premiumFields.forEach((field) => {
        safeData[field] = safeData[field] === true || existingData[field] === true;
      });
      safeData.isPremium = safeData.isPremium === true
        || existingData.isPremium === true
        || premiumFields.some((field) => safeData[field]);
    }

    const payload = { username, data: safeData, updated_at: new Date().toISOString() };
    let res = await fetch(`${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(username)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ data: safeData, updated_at: payload.updated_at }),
    });

    if (res.ok) {
      const updated = await res.json();
      if (!Array.isArray(updated) || updated.length === 0) {
        res = await fetch(`${SUPABASE_URL}/rest/v1/gardens`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }
    }

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: err }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
