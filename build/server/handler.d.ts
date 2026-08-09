export type { HandlerResponse } from './formatting/markdown.js';
import type { HandlerResponse } from './formatting/markdown.js';
/** Current epoch value. */
export declare function getEpoch(): number;
/** Increment and return the new epoch. Called once per tool dispatch. */
export declare function advanceEpoch(): number;
export declare function handleToolCall(toolName: string, params: Record<string, unknown>): Promise<HandlerResponse>;
