import * as fs from 'node:fs/promises';
import { accountsFilePath, configDir } from '../executor/paths.js';
import { hasCredential, removeCredential } from './credentials.js';
import { authenticateAccount } from './auth.js';
async function readAccounts() {
    try {
        const content = await fs.readFile(accountsFilePath(), 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return { accounts: [] };
    }
}
async function writeAccounts(data) {
    const dir = configDir();
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    await fs.writeFile(accountsFilePath(), JSON.stringify(data, null, 2), { mode: 0o600 });
}
export async function listAccounts() {
    const { accounts } = await readAccounts();
    // Enrich with credential status
    const enriched = await Promise.all(accounts.map(async (account) => ({
        ...account,
        hasCredential: await hasCredential(account.email),
    })));
    return enriched;
}
export async function getAccount(email) {
    const { accounts } = await readAccounts();
    return accounts.find(a => a.email === email);
}
export async function addAccount(email, category = 'personal', description) {
    const data = await readAccounts();
    if (data.accounts.some(a => a.email === email)) {
        throw new Error(`Account ${email} already exists`);
    }
    const account = { email, category, description };
    data.accounts.push(account);
    await writeAccounts(data);
    return account;
}
export async function removeAccount(email) {
    const data = await readAccounts();
    const index = data.accounts.findIndex(a => a.email === email);
    if (index === -1) {
        throw new Error(`Account ${email} not found`);
    }
    data.accounts.splice(index, 1);
    await writeAccounts(data);
    await removeCredential(email);
}
export async function authenticateAndAddAccount(clientId, clientSecret, category = 'personal', description) {
    const result = await authenticateAccount(clientId, clientSecret);
    if (result.status === 'success' && result.account) {
        const existing = await getAccount(result.account);
        if (!existing) {
            await addAccount(result.account, category, description);
        }
    }
    return result;
}
//# sourceMappingURL=registry.js.map