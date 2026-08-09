/**
 * ScratchpadManager — line-addressed content authoring buffer.
 * See ADR-301: Scratchpad Buffer — Service-Agnostic Content Authoring.
 */
export type ScratchpadFormat = 'text' | 'markdown' | 'json' | 'csv';
/** Present when scratchpad is a live view of a Google Workspace resource (JSON mode). */
export interface LiveBinding {
    service: 'docs' | 'sheets';
    resourceId: string;
    account: string;
    /**
     * Doc revision at import time (Docs only). Sent as
     * `writeControl.requiredRevisionId` on batchUpdate so the API rejects
     * stale writes when a collaborator has edited the doc since import.
     * Updated after every successful sync+reload (issue #79).
     */
    revisionId?: string;
}
/** File reference tracked in the attachment side-table. */
export interface AttachmentRef {
    refId: string;
    source: 'workspace' | 'drive' | 'import';
    filename: string;
    mimeType: string;
    size: number;
    location: string;
}
export interface Scratchpad {
    id: string;
    lines: string[];
    format: ScratchpadFormat;
    attachments: Map<string, AttachmentRef>;
    binding?: LiveBinding;
    label?: string;
    lastTouchedEpoch: number;
    createdAt: Date;
}
export interface MutationResult {
    message: string;
    context: string;
    validation: string;
}
export interface ScratchpadSummary {
    id: string;
    format: ScratchpadFormat;
    label?: string;
    lineCount: number;
    attachmentCount: number;
    bound: boolean;
    validation: string;
    lastTouchedEpoch: number;
}
export declare class ScratchpadManager {
    private scratchpads;
    /**
     * Create a new scratchpad, optionally pre-filled with content.
     */
    create(opts?: {
        label?: string;
        content?: string;
        format?: ScratchpadFormat;
    }): string;
    /**
     * Get a scratchpad by ID. Returns null if not found or GC'd.
     */
    get(id: string): Scratchpad | null;
    /**
     * Touch a scratchpad — resets its epoch to keep it alive.
     */
    private touch;
    /**
     * View buffer content with line numbers and validation status.
     */
    view(id: string, startLine?: number, endLine?: number): string | null;
    /**
     * Insert lines after a given line number. afterLine=0 prepends.
     */
    insertLines(id: string, afterLine: number, content: string): MutationResult | null;
    /**
     * Append lines at the end of the buffer.
     */
    appendLines(id: string, content: string): MutationResult | null;
    /**
     * Replace a range of lines with new content.
     */
    replaceLines(id: string, startLine: number, endLine: number, content: string): MutationResult | null;
    /**
     * Remove line(s) from the buffer.
     */
    removeLines(id: string, startLine: number, endLine?: number): MutationResult | null;
    /**
     * Copy lines from another scratchpad into this one.
     * Source is not modified.
     */
    copyLines(targetId: string, sourceId: string, startLine: number, endLine: number, afterLine: number): MutationResult | null;
    /**
     * Attach a file reference and insert a marker line.
     * Returns the assigned refId (e.g., "att-1").
     */
    attach(id: string, ref: Omit<AttachmentRef, 'refId'>, afterLine?: number): {
        refId: string;
        message: string;
    } | null;
    /**
     * Remove an attachment from the side-table. Marker line is left for the agent.
     */
    detach(id: string, refId: string): string | null;
    /** Get all attachments for a scratchpad. */
    getAttachments(id: string): Map<string, AttachmentRef> | null;
    /** Set a live binding on a scratchpad (used by import adapters). */
    setBinding(id: string, binding: LiveBinding): boolean;
    /** Get the live binding, if any. */
    getBinding(id: string): LiveBinding | undefined;
    /**
     * Get a value at a JSON path. Only valid for json-format scratchpads.
     */
    jsonGet(id: string, path: string): {
        value: unknown;
        lineSpan: string;
    } | {
        error: string;
    } | null;
    /**
     * Set a value at a JSON path. Re-serializes the buffer.
     */
    jsonSet(id: string, path: string, value: unknown): MutationResult | null;
    /**
     * Delete a key or array element at a JSON path.
     */
    jsonDelete(id: string, path: string): MutationResult | null;
    /**
     * Insert a value into an array at a JSON path.
     */
    jsonInsert(id: string, path: string, value: unknown): MutationResult | null;
    /** Get full buffer content as a single string. */
    getContent(id: string): string | null;
    /** Append raw lines to a scratchpad (used by import adapters). */
    appendRawLines(id: string, lines: string[]): boolean;
    /** Set the format of a scratchpad (used by import adapters). */
    setFormat(id: string, format: ScratchpadFormat): boolean;
    /** Discard and invalidate a scratchpad. */
    discard(id: string): boolean;
    /** List all active scratchpads. */
    list(): ScratchpadSummary[];
    private isExpired;
    private gc;
}
