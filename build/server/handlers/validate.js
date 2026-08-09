const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export function requireEmail(params) {
    const email = params.email;
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
        throw new Error('A valid email address is required for this operation');
    }
    return email;
}
export function requireString(params, field) {
    const value = params[field];
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${field} is required`);
    }
    return value;
}
export function clamp(value, defaultVal, max) {
    const n = Number(value);
    if (Number.isNaN(n) || n <= 0)
        return Math.min(defaultVal, max);
    return Math.min(n, max);
}
//# sourceMappingURL=validate.js.map