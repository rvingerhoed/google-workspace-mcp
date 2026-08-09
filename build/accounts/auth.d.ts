export interface AuthResult {
    status: 'success' | 'error';
    account?: string;
    credentialPath?: string;
    error?: string;
    errorType?: string;
}
export interface AccountStatus {
    email: string;
    tokenValid: boolean;
    scopes: string[];
    scopeCount: number;
    hasRefreshToken: boolean;
}
/**
 * Authenticate a new account via our own OAuth2 flow.
 * Requests all service scopes by default.
 */
export declare function authenticateAccount(clientId: string, clientSecret: string): Promise<AuthResult>;
/**
 * Re-authenticate with a specific set of services.
 * Used by the `scopes` operation as an escape hatch.
 */
export declare function reauthWithServices(clientId: string, clientSecret: string, services: string): Promise<AuthResult>;
/**
 * Check account status: token validity and granted scopes.
 * Reads scopes from the per-account credential file.
 * Validates token by attempting a refresh via the token service.
 */
export declare function checkAccountStatus(email: string): Promise<AccountStatus>;
