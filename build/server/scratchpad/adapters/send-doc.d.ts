/**
 * Send adapters: doc_create and doc_write.
 * doc_create: creates a new Google Doc and writes scratchpad content.
 * doc_write: appends scratchpad content to an existing Google Doc.
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface DocCreateParams {
    email: string;
    title: string;
}
interface DocWriteParams {
    email: string;
    documentId: string;
}
export declare function sendDocCreate(scratchpads: ScratchpadManager, scratchpadId: string, targetParams: DocCreateParams): Promise<HandlerResponse>;
export declare function sendDocWrite(scratchpads: ScratchpadManager, scratchpadId: string, targetParams: DocWriteParams): Promise<HandlerResponse>;
export {};
