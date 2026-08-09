/**
 * Import adapter: doc — loads a Google Doc into a scratchpad.
 *
 * Two modes:
 * - markdown (default): exports as markdown, strips base64 images to attachments
 * - json: loads native Docs API JSON, sets live binding for round-trip editing
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface DocImportParams {
    email: string;
    documentId: string;
    mode?: 'markdown' | 'json';
}
export declare function importDoc(scratchpads: ScratchpadManager, scratchpadId: string, sourceParams: DocImportParams): Promise<HandlerResponse>;
export {};
