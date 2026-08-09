export interface SendOptions {
    to: string;
    subject: string;
    body: string;
    from?: string;
    cc?: string;
    bcc?: string;
    html?: boolean;
    /** Workspace filenames. */
    attachments?: string[];
    draft?: boolean;
}
export declare function sendMail(account: string, opts: SendOptions): Promise<Record<string, unknown>>;
export interface ReplyOptions {
    messageId: string;
    body: string;
    cc?: string;
    html?: boolean;
    attachments?: string[];
    draft?: boolean;
    /** reply-all only. */
    all?: boolean;
}
export declare function replyMail(account: string, opts: ReplyOptions): Promise<Record<string, unknown>>;
export interface ForwardOptions {
    messageId: string;
    to: string;
    body?: string;
    html?: boolean;
    draft?: boolean;
    /** Carry the original's attachments. Default true. */
    includeAttachments?: boolean;
}
export declare function forwardMail(account: string, opts: ForwardOptions): Promise<Record<string, unknown>>;
