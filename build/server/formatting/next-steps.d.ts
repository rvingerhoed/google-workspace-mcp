/**
 * Contextual next-steps guidance. Appended as a markdown footer to every
 * response so agents discover natural follow-on actions.
 */
/**
 * Returns a markdown footer string with contextual next-steps guidance.
 * Returns empty string when no suggestions exist for the domain/operation.
 */
export declare function nextSteps(domain: string, operation: string, context?: Record<string, string>): string;
