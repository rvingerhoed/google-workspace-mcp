export declare class TokenRefreshError extends Error {
    readonly email: string;
    readonly googleError?: string | undefined;
    constructor(message: string, email: string, googleError?: string | undefined);
}
/**
 * Get a valid access token for an account.
 *
 * Returns from cache if >60s remaining, otherwise exchanges
 * the stored refresh token for a fresh access token.
 */
export declare function getAccessToken(email: string): Promise<string>;
/** Evict a cached token — forces next getAccessToken to refresh. */
export declare function invalidateToken(email: string): void;
/** Prefetch tokens for all given accounts (fire-and-forget, logs errors). */
export declare function warmTokenCache(emails: string[]): Promise<void>;
/** Visible for testing — clear the entire cache. */
export declare function _clearCache(): void;
