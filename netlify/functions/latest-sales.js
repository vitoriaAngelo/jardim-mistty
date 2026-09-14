const SUPABASE_URL = 'https://luvjridqxqpxnljucnur.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dmpyaWRxeHFweG5sanVjbnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDM3ODQsImV4cCI6MjEwNDgxOTc4NH0.shmGCDtE-XDPROUCezVjR27WFYD3VYfvQaE1-OVewGc';
exports.handler = async () => {
  const headers = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json', 'Cache-Control':'no-store' };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/gardens?select=username,data&order=updated_at.desc&limit=20`, { headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}` } });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const rows = await res.json();
    const sales = rows.map(row => ({ username: row.username, farmName: row.data?.farmName || row.username, ...(row.data?.lastSale || {}) })).filter(s => s.at && Date.now()-Number(s.at) < 24*60*60*1000).sort((a,b)=>Number(b.at)-Number(a.at)).slice(0,5);
    return { statusCode:200, headers, body:JSON.stringify({ sales }) };
  } catch (e) { return { statusCode:200, headers, body:JSON.stringify({ sales:[], error:e.message }) }; }
};
