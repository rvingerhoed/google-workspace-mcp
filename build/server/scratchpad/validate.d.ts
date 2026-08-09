/**
 * Format-specific validators for scratchpad content.
 * Each returns a status string appended to mutation responses.
 */
import type { ScratchpadFormat } from './manager.js';
/** Run format-specific validation, returning a status string. */
export declare function validate(lines: string[], format: ScratchpadFormat): string;
