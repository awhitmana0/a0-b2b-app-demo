const FGA_API_HOST = process.env.FGA_API_HOST;
const FGA_ISSUER = process.env.FGA_ISSUER;
const FGA_STORE_ID = process.env.FGA_STORE_ID;
const FGA_CLIENT_ID = process.env.FGA_CLIENT_ID;
const FGA_CLIENT_SECRET = process.env.FGA_CLIENT_SECRET;
const FGA_TOKEN_CACHE = { token: null, expiresAt: 0 };

const getFgaToken = async () => {
    if (FGA_TOKEN_CACHE.token && FGA_TOKEN_CACHE.expiresAt > Date.now() + 60000) {
        return FGA_TOKEN_CACHE.token;
    }
    const response = await fetch(`https://${FGA_ISSUER}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: FGA_CLIENT_ID,
            client_secret: FGA_CLIENT_SECRET,
            audience: `https://${FGA_API_HOST}/`,
            grant_type: 'client_credentials',
        }),
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
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok && response.status === 400) {
        return response; // Return the response for special handling of 400 errors
    }
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `FGA API request failed.`);
    }
    return response.json();
};

const check = async (user, relation, object) => {
    const data = await fgaApiCall('/check', { tuple_key: { user, relation, object } });
    return data;
};

const readRelations = async (user, object) => {
    const data = await fgaApiCall('/read', { tuple_key: { user, object } });
    return data;
};

const write = async (writes, deletes) => {
    const payload = {};
    if (writes && writes.length > 0) payload.writes = { tuple_keys: writes };
    if (deletes && deletes.length > 0) payload.deletes = { tuple_keys: deletes };
    if (Object.keys(payload).length === 0) throw new Error("Write request must contain writes or deletes.");
    
    const response = await fgaApiCall('/write', payload);
    if (typeof response.json !== 'function') { // Check if it's the raw response object
        const errorData = await response.json();
        if (errorData.code === 'write_failed_due_to_invalid_input') {
            return { message: "Success (state may have already been correct)." };
        }
        throw new Error(errorData.message || 'FGA Write Failed');
    }
    return response;
};

module.exports = { check, readRelations, write };