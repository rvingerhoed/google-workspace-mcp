/**
 * Gmail attachment handler — downloads or views email attachments.
 *
 * The agent discovers attachments via the `read` operation, which lists
 * filenames and sizes. Then calls `getAttachment` to save to workspace,
 * or `viewAttachment` to view images inline without saving.
 *
 * Flow: read → see filenames → getAttachment/viewAttachment(messageId, filename)
 */
import type { HandlerResponse } from '../../server/formatting/markdown.js';
/**
 * Download an email attachment by filename — saves to workspace.
 */
export declare function handleGetAttachment(params: Record<string, unknown>, account: string): Promise<HandlerResponse>;
/**
 * View an image attachment inline without saving to workspace.
 */
export declare function handleViewAttachment(params: Record<string, unknown>, account: string): Promise<HandlerResponse>;
