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
    
    // ── VALIDAÇÃO ANTI-FRAUDE: Crescimento de Plantas ──
    const GROW_INTERVAL_MS = 120000; // 2 minutos
    const maxGrowthPerTick = 1;
    const validationRes = await fetch(
      `${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(username)}&select=data,updated_at&order=updated_at.desc&limit=1`,
      {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      }
    );
    
    if (validationRes.ok) {
      const rows = await validationRes.json();
      if (rows.length > 0) {
        const oldData = rows[0].data || {};
        const lastSaveTime = new Date(rows[0].updated_at).getTime();
        const elapsedMs = (data.savedAt || Date.now()) - lastSaveTime;
        const maxPossibleGrowth = Math.floor(elapsedMs / GROW_INTERVAL_MS) * maxGrowthPerTick;
        
        if (oldData.plots && safeData.plots) {
          let fraudDetected = false;
          const fraudLog = [];
          
          safeData.plots.forEach((p, i) => {
            const old = oldData.plots[i];
            if (!old) return;
            const growDiff = (p.growCount || 0) - (old.growCount || 0);
            if (growDiff > maxPossibleGrowth + 3) {
              fraudDetected = true;
              fraudLog.push({ plot: i, type: p.type, diff: growDiff, max: maxPossibleGrowth, time: elapsedMs });
            }
          });
          
          if (fraudDetected) {
            console.error(`🚨 FRAUDE - ${username}:`, fraudLog);
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Crescimento impossível detectado', fraudLog }) };
          }
        }
      }
    }
    
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
      // Um salvamento de saída antigo pode não conter os dados do mascote.
      // Nesse caso, preserva a seleção já registrada no servidor.
      if (!Object.prototype.hasOwnProperty.call(safeData, 'ownedMascots') && existingData.ownedMascots) {
        safeData.ownedMascots = existingData.ownedMascots;
      }
      if (!Object.prototype.hasOwnProperty.call(safeData, 'selectedMascot') && existingData.selectedMascot) {
        safeData.selectedMascot = existingData.selectedMascot;
      }
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
