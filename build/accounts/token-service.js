import { readCredential } from './credentials.js';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const EXPIRY_BUFFER = 60_000; // refresh 1 minute before expiry
/** In-memory access token cache — lives for the MCP session. */
const cache = new Map();
/** In-flight refresh promises — deduplicates concurrent requests for the same account. */
const inflight = new Map();
export class TokenRefreshError extends Error {
    email;
    googleError;
    constructor(message, email, googleError) {
        super(message);
        this.email = email;
        this.googleError = googleError;
        this.name = 'TokenRefreshError';
    }
}
/**
 * Get a valid access token for an account.
 *
 * Returns from cache if >60s remaining, otherwise exchanges
 * the stored refresh token for a fresh access token.
 */
export async function getAccessToken(email) {
    const cached = cache.get(email);
    if (cached && cached.expiresAt > Date.now() + EXPIRY_BUFFER) {
        return cached.accessToken;
    }
    // Deduplicate concurrent refresh requests for the same account
    const pending = inflight.get(email);
    if (pending)
        return pending;
    const promise = refreshAccessToken(email);
    inflight.set(email, promise);
    try {
        return await promise;
    }
    finally {
        inflight.delete(email);
    }
}
async function refreshAccessToken(email) {
    const credential = await readCredential(email);
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: credential.client_id,
            client_secret: credential.client_secret,
            refresh_token: credential.refresh_token,
            grant_type: 'refresh_token',
        }),
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const googleError = body.error;
        if (response.status === 400 && googleError === 'invalid_grant') {
            cache.delete(email);
            throw new TokenRefreshError(`Refresh token revoked or expired for ${email}. Re-authenticate with manage_accounts → authenticate.`, email, googleError);
        }
        throw new TokenRefreshError(`Token refresh failed for ${email} (${response.status}): ${JSON.stringify(body)}`, email, googleError);
    }
    const data = await response.json();
    cache.set(email, {
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
    });
    return data.access_token;
}
/** Evict a cached token — forces next getAccessToken to refresh. */
export function invalidateToken(email) {
    cache.delete(email);
    inflight.delete(email);
}
/** Prefetch tokens for all given accounts (fire-and-forget, logs errors). */
export async function warmTokenCache(emails) {
    const results = await Promise.allSettled(emails.map(email => getAccessToken(email)));
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'rejected') {
            process.stderr.write(`[google-workspace-mcp] token warmup failed for ${emails[i]}: ${result.reason.message}\n`);
        }
    }
}
/** Visible for testing — clear the entire cache. */
export function _clearCache() {
    cache.clear();
    inflight.clear();
}
//# sourceMappingURL=token-service.js.map