import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { credentialPath, credentialsDir } from '../executor/paths.js';
export async function hasCredential(email) {
    try {
        await fs.access(credentialPath(email));
        return true;
    }
    catch {
        return false;
    }
}
export async function saveCredential(email, credential) {
    if (credential?.type !== 'authorized_user') {
        throw new Error('Credential must have type "authorized_user"');
    }
    const filePath = credentialPath(email);
    await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
    await fs.writeFile(filePath, JSON.stringify(credential, null, 2), { mode: 0o600 });
    return filePath;
}
export async function readCredential(email) {
    const filePath = credentialPath(email);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    if (parsed.type !== 'authorized_user') {
        throw new Error(`Invalid credential for ${email}: expected type "authorized_user", got "${parsed.type}"`);
    }
    if (!parsed.refresh_token || typeof parsed.refresh_token !== 'string') {
        throw new Error(`Invalid credential for ${email}: missing or invalid refresh_token`);
    }
    if (!parsed.client_id || !parsed.client_secret) {
        throw new Error(`Invalid credential for ${email}: missing client_id or client_secret`);
    }
    return parsed;
}
export async function removeCredential(email) {
    try {
        await fs.unlink(credentialPath(email));
    }
    catch (err) {
        if (err.code !== 'ENOENT')
            throw err;
    }
}
export async function listCredentials() {
    try {
        const dir = credentialsDir();
        const files = await fs.readdir(dir);
        return files
            .filter(f => f.endsWith('.json'))
            .map(f => f.replace(/\.json$/, ''));
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=credentials.js.map