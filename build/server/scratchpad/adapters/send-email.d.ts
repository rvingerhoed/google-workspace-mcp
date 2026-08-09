/**
 * Send adapter: email — delivers scratchpad content as an email.
 * When attachments are present, creates a draft so the agent can review before
 * sending. Without attachments, sends directly.
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface EmailTargetParams {
    email: string;
    to: string;
    subject: string;
    cc?: string;
    bcc?: string;
}
export declare function sendEmail(scratchpads: ScratchpadManager, scratchpadId: string, targetParams: EmailTargetParams): Promise<HandlerResponse>;
export {};
