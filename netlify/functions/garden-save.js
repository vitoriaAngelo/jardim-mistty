const SUPABASE_URL = 'https://luvjridqxqpxnljucnur.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dmpyaWRxeHFweG5sanVjbnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDM3ODQsImV4cCI6MjEwNDgxOTc4NH0.shmGCDtE-XDPROUCezVjR27WFYD3VYfvQaE1-OVewGc';
const { authenticateTwitch, requireSameUser } = require('./_auth');
const { activeSession } = require('./_garden-store');

const ORDER_SEASONS = [
  ['lettuce','carrot','potato','ruby_kale','star_radish','daisy','tulip','cherry','jasmine','moon_lily','royal_dahlia'],
  ['tomato','corn','pepper','eggplant','star_radish','sunflower','hibiscus','bluebell','poppy','daisy','royal_dahlia'],
  ['pumpkin','beetroot','broccoli','cassava','ruby_kale','rose','lavender','orchid','moon_lily','royal_dahlia'],
  ['potato','broccoli','ruby_kale','star_radish','moon_lily'],
];
const ORDER_VALUES = { potato:52,lettuce:76,carrot:70,tomato:88,beetroot:112,cassava:140,corn:84,pumpkin:108,eggplant:94,pepper:103,broccoli:117,ruby_kale:335,star_radish:338,daisy:43,rose:85,tulip:76,sunflower:99,lavender:113,orchid:127,hibiscus:118,bluebell:95,cherry:136,poppy:81,jasmine:104,moon_lily:1000,royal_dahlia:383 };
const ORDER_TIERS = { A:{ mult:1,min:1,max:12 }, S:{ mult:2.2,min:8,max:26 }, SS:{ mult:4.5,min:20,max:40 } };
const ORDER_TIER_LEGACY = { normal:'A', epic:'S', legendary:'SS' };

function validOrder(order, seasonIdx, data) {
  const tier = ORDER_TIERS[ORDER_TIER_LEGACY[order?.rarity] || order?.rarity];
  const qty = Number(order?.qty);
  if (!tier || !ORDER_SEASONS[seasonIdx]?.includes(order?.type) || !Number.isInteger(qty) || qty < tier.min || qty > tier.max) return false;
  const mascotBonus = ['apple','premium'].includes(data?.selectedMascot) ? 1.15 : 1;
  const skillBonus = 1 + Number(data?.skillNodes?.etiqueta_dourada || 0) * .03;
  const unitValue = Math.round(ORDER_VALUES[order.type] * mascotBonus * skillBonus);
  const reward = Math.max(30, Math.max(12, Math.round(unitValue * tier.mult)) * qty + Math.round(25 * tier.mult));
  const xp = Math.round((60 + qty * 10) * tier.mult);
  return Number(order.reward) === reward && Number(order.xp) === xp && typeof order.id === 'string' && order.id.length <= 80;
}

function sameStoredOrder(a, b) {
  return Boolean(a && b)
    && String(a.id) === String(b.id)
    && String(a.type) === String(b.type)
    && Number(a.qty) === Number(b.qty)
    && String(ORDER_TIER_LEGACY[a.rarity] || a.rarity) === String(ORDER_TIER_LEGACY[b.rarity] || b.rarity)
    && Number(a.reward) === Number(b.reward)
    && Number(a.xp) === Number(b.xp);
}

function orderWasAlreadyStored(order, oldData) {
  const storedOrders = Array.isArray(oldData?.orders) ? oldData.orders : [];
  return storedOrders.some(stored => sameStoredOrder(stored, order));
}

function validateOrdersTransition(oldData, nextData) {
  const oldGlobalReset = Number(oldData.ordersGlobalResetVersion || 0);
  const nextGlobalReset = Number(nextData.ordersGlobalResetVersion || 0);
  const seasonIdx = Number(nextData.seasonIdx || 0);
  const searches = Number(nextData.orderSearches || 0);
  const deliveries = Number(nextData.orderDeliveries || 0);
  if (!Number.isInteger(searches) || searches < 0 || searches > 3) throw new Error('Limite de atualizações de pedidos inválido');
  if (!Number.isInteger(deliveries) || deliveries < 0 || deliveries > 4) throw new Error('Limite de entregas de pedidos inválido');
  const oldKey = String(oldData.ordersSeasonKey ?? oldData.seasonIdx ?? '0');
  const nextKey = String(nextData.ordersSeasonKey ?? seasonIdx);
  const orders = Array.isArray(nextData.orders) ? nextData.orders : [];
  const rewardState = oldKey === nextKey ? oldData : nextData;
  const hasInvalidOrder = orders.some(order => {
    // Pedidos que já estão persistidos podem atravessar a troca de estação:
    // colher uma planta fora de estação não deve invalidar o logout.
    if (orderWasAlreadyStored(order, oldData)) return false;
    return !validOrder(order, seasonIdx, rewardState);
  });
  if (orders.length > 3 || new Set(orders.map(order => order.id)).size !== orders.length || hasInvalidOrder) throw new Error('Pedido adulterado ou incompatível com a estação');
  if (nextKey !== String(seasonIdx)) throw new Error('Estação dos pedidos inválida');
  if (nextGlobalReset > oldGlobalReset) {
    if (nextGlobalReset !== 1 || oldGlobalReset !== 0 || searches !== 0 || deliveries !== 0 || nextData.orderPaidReset === true) throw new Error('Reset global de pedidos inválido');
    return;
  }
  if (nextGlobalReset < oldGlobalReset) throw new Error('Reset global de pedidos não pode ser revertido');
  if (oldKey !== nextKey) return;
  const oldSearches = Number(oldData.orderSearches || 0);
  const oldDeliveries = Number(oldData.orderDeliveries || 0);
  const oldPaid = oldData.orderPaidReset === true;
  const nextPaid = nextData.orderPaidReset === true;
  if (deliveries < oldDeliveries || deliveries - oldDeliveries > 1) throw new Error('Contador de entregas adulterado');
  if (oldPaid && !nextPaid) throw new Error('Compra extra de pedidos não pode ser revertida');
  const validPaidReset = !oldPaid && nextPaid && oldSearches >= 3 && searches === 0 && deliveries === 0;
  if (searches < oldSearches && !validPaidReset) throw new Error('Contador de atualizações não pode ser reduzido');
  if (searches > oldSearches + 1) throw new Error('Atualizações de pedidos avançaram rápido demais');
  if (!oldPaid && nextPaid && !validPaidReset) throw new Error('Compra extra de pedidos inválida');
  if (deliveries === oldDeliveries + 1) {
    const oldOrders = Array.isArray(oldData.orders) ? oldData.orders : [];
    const remainingIds = new Set(orders.map(order => order.id));
    const removed = oldOrders.filter(order => !remainingIds.has(order.id));
    if (removed.length !== 1 || !orderWasAlreadyStored(removed[0], oldData)) throw new Error('Entrega não corresponde a um pedido válido');
    const delivered = removed[0];
    const oldStock = Number(oldData.harvested?.[delivered.type] || 0);
    const newStock = Number(nextData.harvested?.[delivered.type] || 0);
    if (oldStock < delivered.qty || newStock > oldStock - delivered.qty) throw new Error('Estoque insuficiente para a entrega');
    if (Number(nextData.xp || 0) < Number(oldData.xp || 0) + delivered.xp) throw new Error('XP da entrega adulterado');
  }
}

function orderActionChanged(oldData, nextData) {
  // A colheita/plantio pode reenviar uma cópia local dos pedidos. Isso não é
  // uma ação de pedido e não deve disparar a validação de recompensas.
  const fields = ['ordersGlobalResetVersion','ordersSeasonKey','orderSearches','orderDeliveries','orderPaidReset'];
  return fields.some((field) => JSON.stringify(oldData?.[field] ?? null) !== JSON.stringify(nextData?.[field] ?? null));
}

function isPlaceholderFarmName(name, username) {
  const value = String(name || '').trim().toLowerCase();
  const safeUsername = String(username || '').replace(/^@+/, '').trim().toLowerCase();
  return !value
    || value === 'jardim da mistty'
    || value === 'jardim de mistty'
    || value === `jardim de @${safeUsername}`
    || value === `jardim de ${safeUsername}`;
}

exports._test = { validOrder, validateOrdersTransition };

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Garden-Session',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const { username, data, sessionId, expectedRevision } = JSON.parse(event.body);
    if (!username) return { statusCode: 400, headers, body: JSON.stringify({ error: 'username required' }) };
    const auth = await authenticateTwitch(event);
    requireSameUser(auth, username);

    const safeData = { ...(data || {}) };
    const premiumFields = [
      'premiumWateringCan',
      'premiumShovel',
      'premiumPlantsUnlocked',
      'premiumFertilizersClaimed',
      'premiumSpecialPlotClaimed',
    ];
    
    // ── VALIDAÇÃO ANTI-FRAUDE: Crescimento de Plantas ──
    const GROW_INTERVAL_MS = 15000; // 15 segundos por estágio
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
            // Uma colheita final remove a planta e transforma o canteiro em
            // null. Nesse caso não existe crescimento novo para validar.
            if (!p || !old) return;
            const growDiff = (p.growCount || 0) - (old.growCount || 0);
            if (growDiff > maxPossibleGrowth + 3) {
              fraudDetected = true;
              fraudLog.push({ plot: i, type: p.type, diff: growDiff, max: maxPossibleGrowth, time: elapsedMs });
            }
          });
          
          // Alterações exclusivamente de perfil (nome, frase, título, fundo ou
          // correio) reenviam os canteiros completos, mas não representam uma
          // tentativa de acelerar o crescimento. Não bloquear esse caso evita
          // que personalizações sejam rejeitadas pelo anti-fraude.
          const gameplayKeys = ['plots','inventory','fertilizerInventory','plotFertilizers','harvested','waterCapacity','seasonIdx','seasonDay','orders','missions','xp','pts'];
          const gameplayUnchanged = gameplayKeys.every((key) => JSON.stringify(oldData[key] ?? null) === JSON.stringify(safeData[key] ?? null));
          if (fraudDetected && !gameplayUnchanged) {
            console.error(`🚨 FRAUDE - ${username}:`, fraudLog);
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Crescimento impossível detectado', fraudLog }) };
          }
        }
      }
    }
    
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(username)}&select=data,updated_at&order=updated_at.desc&limit=1`,
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
      const currentRevision = existingRows[0]?.updated_at;
      const sameSession = Boolean(sessionId && existingData._activeSessionId === sessionId);
      if (!existingRows.length || (!sameSession && !activeSession(existingData, sessionId))) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Este jardim está ativo em outra tela', code: 'SESSION_CONFLICT' }) };
      }
      if (!expectedRevision || expectedRevision !== currentRevision) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'O jardim foi atualizado em outra tela', code: 'STALE_STATE', revision: currentRevision }) };
      }
      // Pedidos antigos podem ter sido gerados por fórmulas anteriores. Eles
      // só precisam ser revalidados quando o estado dos pedidos realmente muda;
      // colher, plantar ou sair da conta não deve bloquear o jardim inteiro.
      if (existingRows.length && orderActionChanged(existingData, safeData)) validateOrdersTransition(existingData, safeData);
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
      safeData._activeSessionId = sessionId;
      safeData._sessionLeaseUntil = Date.now() + (2 * 60 * 1000);
      delete safeData._isSessionShell;
    }

    const payload = { username, data: safeData, updated_at: new Date().toISOString() };
    let res = await fetch(`${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(username)}&updated_at=eq.${encodeURIComponent(expectedRevision)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ data: safeData, updated_at: payload.updated_at }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, headers, body: JSON.stringify({ error: err }) };
    }

    const updated = await res.json();
    if (!Array.isArray(updated) || updated.length !== 1) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'O jardim foi atualizado em outra tela', code: 'STALE_STATE' }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, revision: updated[0].updated_at }) };
  } catch (e) {
    return { statusCode: e.statusCode || 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
