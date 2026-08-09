/**
 * Safety policies — interceptors for destructive or sensitive operations.
 *
 * These run as beforeExecute hooks in the factory pipeline, before any
 * service-specific patches. They provide a cross-service safety layer
 * that can:
 *
 * - Block operations entirely (throw)
 * - Downgrade operations (send → draft)
 * - Require confirmation context (params that prove intent)
 * - Log/audit destructive actions
 *
 * Policies are composable — multiple can apply to the same operation.
 * They're configured per-deployment, not per-service.
 *
 * Example use cases:
 * - "Draft-only mode" — agents can read email but not send
 * - "No-delete mode" — prevent permanent deletion across all services
 * - "Audit mode" — log all write operations to stderr
 */
import type { PatchContext } from './types.js';
/** Policy decision: what to do with an intercepted operation. */
export type PolicyAction = 'allow' | 'block' | 'downgrade';
/** Result of a policy check. */
export interface PolicyResult {
    action: PolicyAction;
    reason?: string;
    /** For 'downgrade': replacement args to use instead. */
    replacementArgs?: string[];
}
/** A safety policy that evaluates an operation before execution. */
export interface SafetyPolicy {
    name: string;
    description: string;
    /** Which service.operation combinations this policy applies to. */
    applies: (service: string, operation: string) => boolean;
    /** Evaluate the operation and return a policy decision. */
    evaluate: (args: string[], ctx: PatchContext, service: string) => PolicyResult;
}
/**
 * Draft-only email policy — blocks send/reply/forward, allows everything else.
 * Agents can read, search, triage, and label emails but cannot send on behalf of the user.
 */
export declare const draftOnlyEmail: SafetyPolicy;
/**
 * No-delete policy — blocks permanent deletion across all services.
 * Trash is allowed (reversible), but delete is blocked (permanent).
 */
export declare const noDelete: SafetyPolicy;
/**
 * Read-only policy — blocks all write operations across all services.
 * Only list, get, search, and read operations are allowed.
 */
export declare const readOnly: SafetyPolicy;
/**
 * Audit policy — allows everything but logs destructive operations to stderr.
 * Useful for monitoring what an agent does without blocking it.
 */
export declare const auditLog: SafetyPolicy;
/** Set the active safety policies. */
export declare function configurePolicies(policies: SafetyPolicy[]): void;
/** Get the active policies (defensive copy). */
export declare function getActivePolicies(): SafetyPolicy[];
/**
 * Run all active policies against an operation.
 * First block wins. Returns the most restrictive result.
 */
export declare function evaluatePolicies(args: string[], ctx: PatchContext, service: string): PolicyResult;
