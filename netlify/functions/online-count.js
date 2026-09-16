const SUPABASE_URL = process.env.SUPABASE_URL || 'https://luvjridqxqpxnljucnur.supabase.co';
const activeDbKey = () => process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dmpyaWRxeHFweG5sanVjbnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDM3ODQsImV4cCI6MjEwNDgxOTc4NH0.shmGCDtE-XDPROUCezVjR27WFYD3VYfvQaE1-OVewGc';

exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
  try {
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/gardens?updated_at=gt.${encodeURIComponent(since)}&select=username`, {
      headers: { apikey: activeDbKey(), Authorization: `Bearer ${activeDbKey()}`, Prefer: 'count=exact' },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const rows = await res.json();
    const range = res.headers.get('content-range') || '';
    const total = Number(range.split('/')[1]);
    return { statusCode: 200, headers, body: JSON.stringify({ online: Number.isFinite(total) ? total : rows.length }) };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ online: 0, error: e.message }) };
  }
};
