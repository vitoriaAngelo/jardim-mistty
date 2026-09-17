const SUPABASE_URL = 'https://luvjridqxqpxnljucnur.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1dmpyaWRxeHFweG5sanVjbnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNDM3ODQsImV4cCI6MjEwNDgxOTc4NH0.shmGCDtE-XDPROUCezVjR27WFYD3VYfvQaE1-OVewGc';

const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function readGarden(username) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(username)}&select=data,updated_at&order=updated_at.desc&limit=1`, { headers });
  if (!response.ok) throw new Error(await response.text());
  return (await response.json())[0] || null;
}

async function conditionalPatch(username, revision, data, updatedAt = new Date().toISOString()) {
  const url = `${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(username)}&updated_at=eq.${encodeURIComponent(revision)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ data, updated_at: updatedAt }),
  });
  if (!response.ok) throw new Error(await response.text());
  const rows = await response.json();
  return rows[0] || null;
}

async function createGarden(username, data, updatedAt = new Date().toISOString()) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/gardens`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ username, data, updated_at: updatedAt }),
  });
  if (!response.ok) throw new Error(await response.text());
  return (await response.json())[0] || { data, updated_at: updatedAt };
}

function activeSession(data, sessionId) {
  return Boolean(sessionId && data?._activeSessionId === sessionId && Number(data?._sessionLeaseUntil || 0) > Date.now());
}

module.exports = { readGarden, conditionalPatch, createGarden, activeSession };
