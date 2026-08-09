/** Service name → OAuth scope URL(s). */
export declare const SERVICE_SCOPE_MAP: Record<string, string[]>;
/** All service names that have scope mappings. */
export declare const ALL_SERVICES: string;
export interface OAuthResult {
    email: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    scopes: string[];
}
/**
 * Convert comma-separated service names to deduplicated scope URLs.
 * Always includes base scopes (openid, userinfo.email).
 */
export declare function scopesForServices(services: string): string[];
/**
 * Run a full OAuth2 authorization code flow with a localhost callback server.
 *
 * 1. Start HTTP server on a random port
 * 2. Open browser to Google consent screen
 * 3. Handle redirect callback, exchange code for tokens
 * 4. Resolve the authenticated user's email via userinfo
 */
export declare function runOAuthFlow(clientId: string, clientSecret: string, scopes: string[]): Promise<OAuthResult>;
export declare function openBrowser(url: string): void;
