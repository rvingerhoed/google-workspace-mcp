/**
 * Queue handler — execute multiple operations sequentially with
 * result references ($N.field) for chaining outputs.
 *
 * Handlers return { text, refs }. Queue uses refs for $N.field
 * resolution and text for the final response.
 */
import type { HandlerResponse } from './handler.js';
type ToolHandler = (params: Record<string, unknown>) => Promise<HandlerResponse>;
export declare function handleQueue(params: Record<string, unknown>, handlers: Record<string, ToolHandler>): Promise<HandlerResponse>;
export {};
