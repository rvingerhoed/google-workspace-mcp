/**
 * Errors from Google.
 *
 * Built from Google's actual error JSON, which carries a status, a reason and a
 * message written for an API caller rather than for a terminal. Do not reconstruct
 * errors by parsing text meant for humans.
 *
 * ADR-103, verification item 7.
 */
/** Google's error envelope: `{ error: { code, message, status, errors: [{ reason }] } }`. */
export interface GoogleErrorBody {
    error?: {
        code?: number;
        message?: string;
        status?: string;
        errors?: Array<{
            reason?: string;
            domain?: string;
            message?: string;
        }>;
    };
}
export declare class GoogleApiError extends Error {
    readonly status: number;
    readonly body: GoogleErrorBody;
    readonly request: {
        url: string;
        method: string;
    };
    readonly name = "GoogleApiError";
    constructor(status: number, body: GoogleErrorBody, request: {
        url: string;
        method: string;
    });
    /** e.g. `authError`, `insufficientPermissions`, `notFound`, `rateLimitExceeded`. */
    get reason(): string | undefined;
    /**
     * Is this the "you need to re-authenticate" case?
     *
     * Read it from Google, not from an invented status code. 401 means the token is
     * bad; a 403 whose reason is a permissions/scope failure means the token is valid
     * but does not carry the scope this call needs. Both are fixed by re-consenting.
     */
    get isAuthError(): boolean;
}
