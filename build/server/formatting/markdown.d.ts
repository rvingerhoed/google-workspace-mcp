/**
 * Response formatters — shape raw Google JSON into token-efficient
 * markdown for AI consumption.
 *
 * Design:
 * - Lists are compact and scannable (pipe-delimited, IDs included)
 * - Detail views are natural prose an agent can relay to a user
 * - Each formatter returns { text, refs } where refs are the
 *   structured values queue $N.field resolution needs
 */
/** MCP content block for inline image/audio return. */
export interface ContentBlock {
    type: 'image' | 'audio';
    data: string;
    mimeType: string;
}
/** Shared response shape — markdown text for agents, structured refs for queue $N.field. */
export interface HandlerResponse {
    text: string;
    refs: Record<string, unknown>;
    /** Optional content blocks (images, audio) returned alongside text. */
    content?: ContentBlock[];
}
export type EmailBodyFormat = 'plain' | 'html';
/**
 * Walk Gmail MIME payload parts to extract the message body.
 *
 * `format: 'plain'` (default) — prefers `text/plain`, falls back to a lossy
 *   `stripHtml()` on `text/html`. Existing behavior.
 * `format: 'html'` — prefers `text/html` and returns it sanitized + wrapped
 *   in a Spotlighting block (ADR-305). Falls back to the `text/plain` part
 *   if no HTML exists.
 *
 * Decodes base64url body data either way.
 */
/**
 * Gmail returns `snippet` HTML-ESCAPED — an apostrophe arrives as `&#39;`, an ampersand
 * as `&amp;`. We render snippets as plain text, so escaped is simply wrong: every
 * preview containing a quote or an apostrophe read as `codename &#39;lando&#39;`.
 *
 * Only the five XML predefined entities plus numeric references; Gmail does not emit
 * the wider HTML named set here, and a general HTML decoder is not what a snippet needs.
 */
export declare function decodeSnippet(text: string): string;
export declare function extractBodyFromPayload(payload: Record<string, unknown> | undefined, format?: EmailBodyFormat): string;
export declare function formatEmailList(data: unknown): HandlerResponse;
/** Extract attachments from message payload parts (recursive). */
export declare function extractAttachments(parts: unknown[]): Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
}>;
export declare function formatEmailDetail(data: unknown, options?: {
    bodyFormat?: EmailBodyFormat;
}): HandlerResponse;
export declare function formatEventList(data: unknown): HandlerResponse;
export declare function formatEventDetail(data: unknown): HandlerResponse;
export declare function formatFileList(data: unknown): HandlerResponse;
export declare function formatFileDetail(data: unknown): HandlerResponse;
