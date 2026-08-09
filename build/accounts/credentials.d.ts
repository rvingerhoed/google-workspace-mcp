export interface AuthorizedUserCredential {
    type: 'authorized_user';
    client_id: string;
    client_secret: string;
    refresh_token: string;
    scopes?: string[];
}
export declare function hasCredential(email: string): Promise<boolean>;
export declare function saveCredential(email: string, credential: AuthorizedUserCredential): Promise<string>;
export declare function readCredential(email: string): Promise<AuthorizedUserCredential>;
export declare function removeCredential(email: string): Promise<void>;
export declare function listCredentials(): Promise<string[]>;
