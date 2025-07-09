const FGA_API_HOST = process.env.VITE_FGA_API_HOST;
const FGA_ISSUER = process.env.VITE_FGA_ISSUER;
const FGA_STORE_ID = process.env.VITE_FGA_STORE_ID;
const FGA_CLIENT_ID = process.env.VITE_FGA_CLIENT_ID;
const FGA_CLIENT_SECRET = process.env.VITE_FGA_CLIENT_SECRET;
const FGA_TOKEN_CACHE = { token: null, expiresAt: 0 };

const getFgaToken = async () => {
    if (FGA_TOKEN_CACHE.token && FGA_TOKEN_CACHE.expiresAt > Date.now() + 60000) return FGA_TOKEN_CACHE.token;
    if (!FGA_CLIENT_ID || !FGA_CLIENT_SECRET) throw new Error("FGA credentials are not configured.");
    const response = await fetch(`https://${FGA_ISSUER}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: FGA_CLIENT_ID, client_secret: FGA_CLIENT_SECRET, audience: `https://${FGA_API_HOST}/`, grant_type: 'client_credentials' }),
    });
    if (!response.ok) throw new Error('Failed to fetch FGA API token.');
    const data = await response.json();
    FGA_TOKEN_CACHE.token = data.access_token;
    FGA_TOKEN_CACHE.expiresAt = Date.now() + (data.expires_in * 1000);
    return FGA_TOKEN_CACHE.token;
};
const fgaApiCall = async (endpoint, body) => {
    const token = await getFgaToken();
    const url = `https://${FGA_API_HOST}/stores/${FGA_STORE_ID}${endpoint}`;
    return await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
};
const check = async (user, relation, object) => {
    const response = await fgaApiCall('/check', { tuple_key: { user, relation, object } });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
};
const readRelations = async (user, object) => {
    const response = await fgaApiCall('/read', { tuple_key: { user, object } });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
};
const write = async (writes, deletes) => {
    const payload = {};
    if (writes && writes.length > 0) payload.writes = { tuple_keys: writes };
    if (deletes && deletes.length > 0) payload.deletes = { tuple_keys: deletes };
    if (Object.keys(payload).length === 0) throw new Error("Write request must contain writes or deletes.");
    const response = await fgaApiCall('/write', payload);
    if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'write_failed_due_to_invalid_input') return { message: "Success (state may have already been correct)." };
        throw new Error(errorData.message || 'FGA Write Failed');
    }
    return response.json();
};
module.exports = { check, readRelations, write };