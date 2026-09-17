// Função de admin: reseta TUDO dos jardins de TODOS os jogadores.
// Protegida por ADMIN_SECRET (variável de ambiente no Netlify).
// Uso: POST /admin-reset-garden-complete com header Authorization: Bearer <ADMIN_SECRET>
//
// O que faz:
//   - Zera plantas (plots)
//   - Zera inventário (harvested, inventory, fertilizerInventory)
//   - Zera pontos, XP, nível
//   - Zera pedidos e contadores
//   - Zera water capacity, skills, achievements, etc.
//   - Mantém apenas: username, dados de conta Twitch, farm name

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://luvjridqxqpxnljucnur.supabase.co').replace(/\/$/, '');
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  // Verificar chave de admin
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) return { statusCode: 503, headers, body: JSON.stringify({ error: 'ADMIN_SECRET não configurado no servidor.' }) };
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (token !== ADMIN_SECRET) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Não autorizado.' }) };

  if (!SERVICE_KEY) return { statusCode: 503, headers, body: JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurado.' }) };

  try {
    // Buscar todos os jardins
    const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/gardens?select=username,data,updated_at`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!fetchRes.ok) throw new Error(`Supabase fetch falhou: ${fetchRes.status}`);
    const rows = await fetchRes.json();

    let updated = 0;
    let failed = 0;

    // Atualizar em paralelo (lotes de 20)
    const BATCH = 20;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      await Promise.all(batch.map(async (row) => {
        const oldData = row.data || {};
        
        // Reset completo: manter só fields de conta, zerar tudo de jogo
        const newData = {
          // Dados de conta (preservar)
          username: oldData.username,
          isPremium: oldData.isPremium || false,
          ownedMascots: oldData.ownedMascots || ['default'],
          selectedMascot: 'default',
          bonusKitLevel: oldData.bonusKitLevel || 0,
          premiumPlantsUnlocked: oldData.premiumPlantsUnlocked || false,
          premiumSpecialPlotClaimed: oldData.premiumSpecialPlotClaimed || false,
          farmName: oldData.farmName || 'Jardim da Mistty',
          profileBackground: oldData.profileBackground || 'spring',
          selectedHarvestTitle: oldData.selectedHarvestTitle || '',
          
          // Status de jogo (reset)
          seasonIdx: 0,
          seasonDay: 1,
          plots: Array(6).fill(null), // 6 canteiros vazios
          harvested: {}, // inventário vazio
          inventory: {}, // sementes vazias
          fertilizerInventory: {}, // adubo vazio
          pts: 0,
          xp: 0,
          level: 1,
          waterCount: 0,
          waterCapacity: 5,
          waterCapacityLastRefill: Date.now(),
          
          // Pedidos reset
          orders: [],
          ordersSeasonKey: '0',
          orderSearches: 0,
          orderDeliveries: 0,
          orderPaidReset: false,
          ordersGlobalResetVersion: 3,
          
          // Eventos reset
          eventNextAt: 0,
          eventLastType: '',
          gardenEvent: null,
          eventParticipations: 0,
          
          // Skills reset
          skillNodes: {},
          skillPoints: 0,
          
          // Achievements reset (preservar lista, mas não vistas)
          achievements: [],
          achievSeen: 0,
          achievStats: {
            totalHarvest: 0,
            totalBuy: 0,
            totalWater: 0,
            totalSellPts: 0,
            totalFlowerSell: 0,
          },
          
          // Missões reset
          missions: null,
          
          // Histórico reset
          lastOrder: null,
          lastEvent: null,
          lastPurchase: null,
          pointsHistory: [],
          
          // Misc reset
          unlockedPlots: 3,
          specialPlot: null,
          specialPlotExpiresAt: 0,
          specialPlots: [],
          upgrades: new Set(),
          plotFertilizers: {},
          presenceStreak: 0,
          presenceLastDay: '',
          presenceBonusDate: '',
          presenceDays: [],
          discoveredMutations: [],
          totalOrderDeliveries: 0,
        };

        const patchRes = await fetch(
          `${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(row.username)}`,
          {
            method: 'PATCH',
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ data: newData, updated_at: new Date().toISOString() }),
          }
        );
        if (patchRes.ok) { updated++; } else { failed++; }
      }));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, total: rows.length, updated, failed, message: 'Reset completo executado com sucesso!' }),
    };
  } catch (err) {
    console.error('admin-reset-garden-complete error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err.message) }) };
  }
};
