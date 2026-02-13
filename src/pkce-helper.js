// PKCE Helper Functions for OAuth2 Authorization Code Flow with PKCE

// Generate random string for code_verifier
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Generate SHA256 hash
async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

// Base64 URL encode
function base64urlencode(buffer) {
    let str = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Generate code_challenge from code_verifier
export async function generateCodeChallenge(verifier) {
    const hashed = await sha256(verifier);
    return base64urlencode(hashed);
}

// Generate PKCE pair
export async function generatePKCE() {
    const verifier = generateRandomString(128);
    const challenge = await generateCodeChallenge(verifier);
    return { verifier, challenge };
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(domain, clientId, code, codeVerifier, redirectUri) {
    const tokenUrl = `https://${domain}/oauth/token`;

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientId,
            code: code,
            code_verifier: codeVerifier,
            redirect_uri: redirectUri,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || 'Token exchange failed');
    }

    return response.json();
}

// Get user info from Auth0
export async function getUserInfo(domain, accessToken) {
    const response = await fetch(`https://${domain}/userinfo`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to get user info');
    }

    return response.json();
}
