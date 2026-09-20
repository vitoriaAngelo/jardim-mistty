const SUPABASE_URL = 'https://luvjridqxqpxnljucnur.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dmpyaWRxeHFweG5sanVjbnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDM3ODQsImV4cCI6MjEwNDgxOTc4NH0.shmGCDtE-XDPROUCezVjR27WFYD3VYfvQaE1-OVewGc';
const { cardIsInAlbum } = require('./_card-notification');
exports.handler = async () => {
  const headers = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json', 'Cache-Control':'no-store' };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/gardens?select=username,data&order=updated_at.desc&limit=20`, { headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` } });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const rows = await res.json();
    const activities = rows.flatMap(row => {
      const base = { username: row.username, farmName: row.data?.farmName || `Jardim de @${String(row.username || '').replace(/^@+/, '')}` };
      const inventory = row.data?.albumCards || {};
      const cardFinds = (Array.isArray(row.data?.recentCardFinds) ? row.data.recentCardFinds : []).filter(card => card && typeof card.name === 'string' && card.name.length <= 80 && (card.prismatic === true || ['rara','lendária'].includes(String(card.rarity || '').toLocaleLowerCase('pt-BR'))) && cardIsInAlbum(inventory, card)).map(card => ({ ...base, card, at:card.at, activityType:'card' }));
      const goldenEggFinds = (Array.isArray(row.data?.recentGoldenEggFinds) ? row.data.recentGoldenEggFinds : [])
        .filter(item => item && typeof item.animalName === 'string' && item.animalName.trim().length > 0 && ['egg','duck_egg'].includes(item.eggType) && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0 && Number(item.quantity) <= 1000)
        .map(item => {
          // Resolve the saved pet name instead of replaying an outdated event label.
          // Older events lack animalId, but the egg type identifies their species.
          const animalId = item.eggType === 'duck_egg' ? 'duck' : 'chicken';
          const pet = row.data?.livestock?.pets?.[animalId];
          const customName = typeof pet?.name === 'string' ? pet.name.trim() : '';
          const animalName = customName || (pet ? (animalId === 'duck' ? 'Pato' : 'Galinha') : item.animalName.trim());
          return { ...base, animalName:animalName.slice(0,40), item:item.eggType === 'duck_egg' ? 'ovo de pato dourado' : 'ovo dourado', quantity:Number(item.quantity), at:item.at, activityType:'golden-egg' };
        });
      const globalMessage = row.data?.lastGlobalMessage;
      const messageActivity = globalMessage && typeof globalMessage.text === 'string' && globalMessage.text.trim().length > 0 && globalMessage.text.length <= 120 && Number(globalMessage.at) + 13000 > Date.now()
        ? { ...base, text:globalMessage.text.trim(), at:globalMessage.at, activityType:'global-message' } : null;
      return [row.data?.lastSale ? { ...base, ...row.data.lastSale, activityType:'sale' } : null, messageActivity, row.data?.lastOrder ? { ...base, ...row.data.lastOrder, activityType:'order' } : null, row.data?.lastEvent ? { ...base, ...row.data.lastEvent, activityType:'event' } : null, ...cardFinds, ...goldenEggFinds];
    }).filter(item => item?.at && (item.activityType === 'global-message' ? Number(item.at) + 13000 > Date.now() : Date.now()-Number(item.at) < 24*60*60*1000)).sort((a,b)=>Number(b.at)-Number(a.at)).slice(0,8);
    return { statusCode:200, headers, body:JSON.stringify({ sales: activities }) };
  } catch (e) { return { statusCode:200, headers, body:JSON.stringify({ sales:[], error:e.message }) }; }
};
