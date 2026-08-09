/**
 * docs-sync — translate a single JSON-mode mutation into a Google Docs
 * `batchUpdate` request, or reject it.
 *
 * Issue #79 / deferred portion of ADR-301. The scratchpad JSON-mode buffer
 * for a Doc lets agents do `json_set` on a typed path; this module turns
 * those intents into the discrete operations the Docs API requires
 * (`insertText`, `deleteContentRange`, `updateParagraphStyle`) — no full
 * JSON replace endpoint exists.
 *
 * Two supported path shapes:
 *
 *  1. `$.body.content[N].paragraph.elements[M].textRun.content`
 *     Text content change → `deleteContentRange(startIndex, endIndex)` +
 *     `insertText(text=newValue, location.index=startIndex)`. Watch the
 *     trailing-newline trap: a textRun whose content ends with `\n` includes
 *     the paragraph break in its range; deleting through it removes the
 *     paragraph. We delete `endIndex - 1` in that case to preserve the break.
 *     A `\n` in the new value is rejected — that's a structural edit dressed
 *     as a text change.
 *
 *  2. `$.body.content[N].paragraph.paragraphStyle.<field>`
 *     Paragraph style change → `updateParagraphStyle` over the element's
 *     range with `fields: <field>`. We don't pre-validate the field name —
 *     the API rejects unknown fields cleanly and we surface its message.
 *
 * Anything else (structural edits, table cells, list items, image
 * properties, root-level changes) is rejected with guidance to use markdown
 * mode + doc_create / doc_write for structural authoring.
 *
 * Optimistic concurrency: every translation includes
 * `writeControl.requiredRevisionId` = the revisionId captured at import time
 * (or after the previous successful sync). The Docs API rejects stale
 * writes — the agent gets a clean error rather than silently corrupting a
 * doc that's been edited by a collaborator since import.
 */
export type DocsSyncOp = 'set' | 'delete' | 'insert';
export interface DocsSyncIntent {
    op: DocsSyncOp;
    path: string;
    /** New value for `set` / `insert`; undefined for `delete`. */
    value?: unknown;
    /** Pre-mutation buffer JSON text (for looking up startIndex/endIndex/oldContent). */
    beforeJson: string;
}
/** Successful translation — body to POST to documents.batchUpdate. */
export interface DocsSyncRequest {
    body: {
        requests: Array<Record<string, unknown>>;
        writeControl?: {
            requiredRevisionId: string;
        };
    };
    /** A human-readable summary of what was translated, for the response text. */
    summary: string;
}
/** Rejection — caller surfaces `reason` to the agent. */
export interface DocsSyncRejection {
    reason: string;
}
export type DocsSyncResult = DocsSyncRequest | DocsSyncRejection;
/** Translate a mutation intent into a batchUpdate request, or reject it. */
export declare function translateMutation(intent: DocsSyncIntent, revisionId: string | undefined): DocsSyncResult;
/** Type guard — narrows DocsSyncResult to the rejection arm. */
export declare function isRejection(result: DocsSyncResult): result is DocsSyncRejection;
