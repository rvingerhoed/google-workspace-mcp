/**
 * Import adapter: email — loads email body text into a scratchpad.
 * Extracts plain text body and registers file attachments in the side-table.
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface EmailImportParams {
    email: string;
    messageId: string;
    includeAttachments?: boolean;
}
export declare function importEmail(scratchpads: ScratchpadManager, scratchpadId: string, sourceParams: EmailImportParams): Promise<HandlerResponse>;
export {};
