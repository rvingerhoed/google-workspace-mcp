/**
 * MIME: type lookup, and the RFC 5322 message builder.
 *
 * Two constraints worth stating, because getting either wrong is silent:
 *
 * 1. **Header injection.** A `To:` or `Subject:` carrying CR or LF splits the
 *    header block and lets a caller forge headers (Bcc, From) or inject a body.
 *    Every header value is stripped of control characters. This is not
 *    theoretical: the values come from an LLM, through a tool call.
 *
 * 2. **Inline images belong in multipart/related, not multipart/mixed.** Gmail
 *    rewrites `Content-Disposition: inline` to `attachment` when a CID part sits
 *    in a `mixed` container, so an inline image silently becomes a dangling
 *    attachment.
 */
/** Look up MIME type by filename extension. */
export declare function lookupMimeType(filename: string): string;
export interface MimeAttachment {
    filename: string;
    contentType: string;
    data: Buffer;
    /** Present for inline images. Forces a multipart/related container — see the header note. */
    contentId?: string;
}
export interface MimeMessage {
    to: string;
    subject: string;
    body: string;
    from?: string;
    cc?: string;
    bcc?: string;
    html?: boolean;
    attachments?: MimeAttachment[];
    /** Threading (reply/forward). */
    inReplyTo?: string;
    references?: string;
}
/**
 * Build an RFC 5322 message, base64url-encoded for Gmail's `raw` field or for a
 * `message/rfc822` media upload.
 *
 * Structure is chosen by content, not by habit:
 *   body only                  -> text/plain or text/html
 *   body + inline images       -> multipart/related   (NOT mixed — Gmail rewrites inline->attachment in mixed)
 *   body + attachments         -> multipart/mixed
 *   body + inline + attachments-> multipart/mixed [ multipart/related [ body, inline… ], attachments… ]
 */
export declare function buildMimeMessage(msg: MimeMessage): Buffer;
/** Gmail's `raw` field wants base64url with no padding. */
export declare function toRawField(message: Buffer): string;
