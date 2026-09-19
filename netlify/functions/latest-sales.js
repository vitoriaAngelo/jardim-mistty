const SUPABASE_URL = 'https://luvjridqxqpxnljucnur.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dmpyaWRxeHFweG5sanVjbnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDM3ODQsImV4cCI6MjEwNDgxOTc4NH0.shmGCDtE-XDPROUCezVjR27WFYD3VYfvQaE1-OVewGc';
exports.handler = async () => {
  const headers = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json', 'Cache-Control':'no-store' };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/gardens?select=username,data&order=updated_at.desc&limit=20`, { headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` } });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const rows = await res.json();
    const activities = rows.flatMap(row => {
      const base = { username: row.username, farmName: row.data?.farmName || `Jardim de @${String(row.username || '').replace(/^@+/, '')}` };
      const cardFinds = (Array.isArray(row.data?.recentCardFinds) ? row.data.recentCardFinds : []).filter(card => card && typeof card.name === 'string' && card.name.length <= 80 && (card.prismatic === true || ['rara','lendária'].includes(String(card.rarity || '').toLocaleLowerCase('pt-BR')))).map(card => ({ ...base, card, at:card.at, activityType:'card' }));
      return [row.data?.lastSale ? { ...base, ...row.data.lastSale, activityType:'sale' } : null, row.data?.lastOrder ? { ...base, ...row.data.lastOrder, activityType:'order' } : null, row.data?.lastEvent ? { ...base, ...row.data.lastEvent, activityType:'event' } : null, ...cardFinds];
    }).filter(item => item?.at && Date.now()-Number(item.at) < 24*60*60*1000).sort((a,b)=>Number(b.at)-Number(a.at)).slice(0,8);
    return { statusCode:200, headers, body:JSON.stringify({ sales: activities }) };
  } catch (e) { return { statusCode:200, headers, body:JSON.stringify({ sales:[], error:e.message }) }; }
};
