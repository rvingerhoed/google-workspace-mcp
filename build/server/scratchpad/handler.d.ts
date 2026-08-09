/**
 * Handler for manage_scratchpad tool.
 * See ADR-301: Scratchpad Buffer — Service-Agnostic Content Authoring.
 */
import { ScratchpadManager } from './manager.js';
import type { HandlerResponse } from '../handler.js';
/** Expose the singleton for import/send adapters. */
export declare function getScratchpadManager(): ScratchpadManager;
export declare function handleScratchpad(params: Record<string, unknown>): Promise<HandlerResponse>;
