/**
 * Send adapter: email_draft — creates a Gmail draft from scratchpad content.
 * sendMail(..., { draft: true }) builds the MIME message and uploads it.
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface EmailDraftTargetParams {
    email: string;
    to?: string;
    subject?: string;
}
export declare function sendEmailDraft(scratchpads: ScratchpadManager, scratchpadId: string, targetParams: EmailDraftTargetParams): Promise<HandlerResponse>;
export {};
