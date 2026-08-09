import { type AuthResult } from './auth.js';
export interface Account {
    email: string;
    category: 'personal' | 'work' | 'other';
    description?: string;
}
export declare function listAccounts(): Promise<Account[]>;
export declare function getAccount(email: string): Promise<Account | undefined>;
export declare function addAccount(email: string, category?: Account['category'], description?: string): Promise<Account>;
export declare function removeAccount(email: string): Promise<void>;
export declare function authenticateAndAddAccount(clientId: string, clientSecret: string, category?: Account['category'], description?: string): Promise<AuthResult>;
