/**
 * Handler for manage_scratchpad tool.
 * See ADR-301: Scratchpad Buffer — Service-Agnostic Content Authoring.
 */
import { ScratchpadManager } from './manager.js';
import { translateMutation, isRejection } from './docs-sync.js';
import * as fs from 'node:fs/promises';
import { sendEmail, sendEmailDraft, sendDocCreate, sendDocWrite, sendWorkspace, sendSheetWrite, sendCalendarEvent, sendTaskCreate, importEmail, importDoc, importSheet, importDriveFile, importMeet, } from './adapters/index.js';
import { call } from '../../google/client.js';
import { resolveWorkspacePath, verifyPathSafety } from '../../executor/workspace.js';
import { lookupMimeType } from '../../services/gmail/mime.js';
const scratchpads = new ScratchpadManager();
/** Expose the singleton for import/send adapters. */
export function getScratchpadManager() {
    return scratchpads;
}
export async function handleScratchpad(params) {
    const operation = params.operation;
    switch (operation) {
        // ── Buffer lifecycle ────────────────────────────────
        case 'create':
            return handleCreate(params);
        case 'view':
            return handleView(params);
        case 'discard':
            return handleDiscard(params);
        case 'list':
            return handleList();
        // ── Line operations ─────────────────────────────────
        case 'insert_lines':
            return handleInsertLines(params);
        case 'append_lines':
            return handleAppendLines(params);
        case 'replace_lines':
            return handleReplaceLines(params);
        case 'remove_lines':
            return handleRemoveLines(params);
        case 'copy_lines':
            return handleCopyLines(params);
        // ── JSON path operations ────────────────────────────
        case 'json_get':
            return handleJsonGet(params);
        case 'json_set':
            return handleJsonSet(params);
        case 'json_delete':
            return handleJsonDelete(params);
        case 'json_insert':
            return handleJsonInsert(params);
        // ── Attachments ─────────────────────────────────────
        case 'attach':
            return handleAttach(params);
        case 'detach':
            return handleDetach(params);
        // ── Import / Send ───────────────────────────────────
        case 'import':
            return handleImport(params);
        case 'send':
            return handleSend(params);
        default:
            return error(`Unknown operation: ${operation}`);
    }
}
// ── Helpers ────────────────────────────────────────────────
function error(text) {
    return { text, refs: { error: true } };
}
function requireScratchpadId(params) {
    const id = params.scratchpadId;
    if (!id)
        return null;
    if (!scratchpads.get(id))
        return null;
    return id;
}
function scratchpadNotFound(id) {
    if (!id)
        return error('scratchpadId is required. Use create to start a new scratchpad.');
    return error(`Scratchpad ${id} not found or expired. Use create to start a new one.`);
}
function formatMutation(result) {
    const parts = [result.message];
    if (result.context)
        parts.push(result.context);
    parts.push(result.validation);
    return parts.join('\n');
}
// ── Buffer lifecycle ──────────────────────────────────────
function handleCreate(params) {
    const id = scratchpads.create({
        label: params.label,
        content: params.content,
        format: params.format,
    });
    const sp = scratchpads.get(id);
    const lineInfo = sp.lines.length > 0 ? ` (${sp.lines.length} lines)` : '';
    return {
        text: `Scratchpad created: ${id}${lineInfo}\nFormat: ${sp.format}`,
        refs: { scratchpadId: id, format: sp.format, lineCount: sp.lines.length },
    };
}
function handleView(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const result = scratchpads.view(id, params.startLine, params.endLine);
    if (!result)
        return scratchpadNotFound(id);
    return { text: result, refs: { scratchpadId: id } };
}
function handleDiscard(params) {
    const id = params.scratchpadId;
    if (!id)
        return error('scratchpadId is required.');
    scratchpads.discard(id);
    return { text: `Scratchpad ${id} discarded.`, refs: { scratchpadId: id, status: 'discarded' } };
}
function handleList() {
    const list = scratchpads.list();
    if (list.length === 0) {
        return { text: 'No active scratchpads.', refs: { count: 0 } };
    }
    const lines = list.map(sp => {
        const label = sp.label ? ` "${sp.label}"` : '';
        const att = sp.attachmentCount > 0 ? ` | ${sp.attachmentCount} att` : '';
        const bound = sp.bound ? ' | live' : '';
        return `- ${sp.id}${label} | ${sp.format} | ${sp.lineCount} lines${att}${bound} | ${sp.validation}`;
    });
    return {
        text: `Active scratchpads (${list.length}):\n${lines.join('\n')}`,
        refs: { count: list.length, scratchpads: list.map(s => s.id) },
    };
}
// ── Line operations ───────────────────────────────────────
function handleInsertLines(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const afterLine = params.afterLine;
    if (afterLine === undefined)
        return error('afterLine is required for insert_lines.');
    const content = params.content;
    if (content === undefined)
        return error('content is required for insert_lines.');
    const result = scratchpads.insertLines(id, afterLine, content);
    if (!result)
        return scratchpadNotFound(id);
    return { text: formatMutation(result), refs: { scratchpadId: id, lineCount: scratchpads.get(id).lines.length } };
}
function handleAppendLines(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const content = params.content;
    if (content === undefined)
        return error('content is required for append_lines.');
    const result = scratchpads.appendLines(id, content);
    if (!result)
        return scratchpadNotFound(id);
    return { text: formatMutation(result), refs: { scratchpadId: id, lineCount: scratchpads.get(id).lines.length } };
}
function handleReplaceLines(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const startLine = params.startLine;
    const endLine = params.endLine;
    if (startLine === undefined || endLine === undefined)
        return error('startLine and endLine are required.');
    const content = params.content;
    if (content === undefined)
        return error('content is required for replace_lines.');
    const result = scratchpads.replaceLines(id, startLine, endLine, content);
    if (!result)
        return scratchpadNotFound(id);
    return { text: formatMutation(result), refs: { scratchpadId: id, lineCount: scratchpads.get(id).lines.length } };
}
function handleRemoveLines(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const startLine = params.startLine;
    if (startLine === undefined)
        return error('startLine is required for remove_lines.');
    const result = scratchpads.removeLines(id, startLine, params.endLine);
    if (!result)
        return scratchpadNotFound(id);
    return { text: formatMutation(result), refs: { scratchpadId: id, lineCount: scratchpads.get(id).lines.length } };
}
function handleCopyLines(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const fromId = params.fromScratchpadId;
    if (!fromId)
        return error('fromScratchpadId is required for copy_lines.');
    const startLine = params.startLine;
    const endLine = params.endLine;
    const afterLine = params.afterLine;
    if (startLine === undefined || endLine === undefined || afterLine === undefined) {
        return error('startLine, endLine, and afterLine are required for copy_lines.');
    }
    const result = scratchpads.copyLines(id, fromId, startLine, endLine, afterLine);
    if (!result)
        return scratchpadNotFound(id);
    return { text: formatMutation(result), refs: { scratchpadId: id, lineCount: scratchpads.get(id).lines.length } };
}
// ── JSON path operations ──────────────────────────────────
function handleJsonGet(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const path = params.path;
    if (!path)
        return error('path is required for json_get.');
    const result = scratchpads.jsonGet(id, path);
    if (!result)
        return scratchpadNotFound(id);
    if ('error' in result)
        return error(result.error);
    const display = JSON.stringify(result.value, null, 2);
    return {
        text: `${path} (${result.lineSpan}):\n${display}`,
        refs: { scratchpadId: id, path, value: result.value },
    };
}
async function handleJsonSet(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const jsonPath = params.path;
    if (!jsonPath)
        return error('path is required for json_set.');
    if (!('value' in params))
        return error('value is required for json_set.');
    // For docs-bound scratchpads, pre-validate the mutation before applying
    // locally — unsupported paths shouldn't strand the buffer divergent.
    const docsResult = await maybeHandleDocsBoundMutation(id, {
        op: 'set', path: jsonPath, value: params.value,
    });
    if (docsResult)
        return docsResult;
    // Non-docs flow: mutate, then sync (sheets pushes; unbound is a no-op).
    const result = scratchpads.jsonSet(id, jsonPath, params.value);
    if (!result)
        return scratchpadNotFound(id);
    const syncResult = await syncIfBound(id);
    if (syncResult)
        return syncResult;
    return { text: formatMutation(result), refs: { scratchpadId: id } };
}
async function handleJsonDelete(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const jsonPath = params.path;
    if (!jsonPath)
        return error('path is required for json_delete.');
    const docsResult = await maybeHandleDocsBoundMutation(id, { op: 'delete', path: jsonPath });
    if (docsResult)
        return docsResult;
    const result = scratchpads.jsonDelete(id, jsonPath);
    if (!result)
        return scratchpadNotFound(id);
    const syncResult = await syncIfBound(id);
    if (syncResult)
        return syncResult;
    return { text: formatMutation(result), refs: { scratchpadId: id } };
}
async function handleJsonInsert(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const jsonPath = params.path;
    if (!jsonPath)
        return error('path is required for json_insert.');
    if (!('value' in params))
        return error('value is required for json_insert.');
    const docsResult = await maybeHandleDocsBoundMutation(id, {
        op: 'insert', path: jsonPath, value: params.value,
    });
    if (docsResult)
        return docsResult;
    const result = scratchpads.jsonInsert(id, jsonPath, params.value);
    if (!result)
        return scratchpadNotFound(id);
    const syncResult = await syncIfBound(id);
    if (syncResult)
        return syncResult;
    return { text: formatMutation(result), refs: { scratchpadId: id } };
}
/**
 * For docs-bound scratchpads, translate the intent, push via batchUpdate,
 * reload, and return the response. Returns null when the scratchpad isn't
 * docs-bound (caller falls through to the existing non-docs flow).
 *
 * The mutation is pre-validated against the BEFORE buffer so unsupported
 * paths reject without mutating local state (#79).
 */
async function maybeHandleDocsBoundMutation(id, intent) {
    const binding = scratchpads.getBinding(id);
    if (binding?.service !== 'docs')
        return null;
    const before = scratchpads.getContent(id);
    if (before === null)
        return scratchpadNotFound(id);
    const translated = translateMutation({ ...intent, beforeJson: before }, binding.revisionId);
    if (isRejection(translated)) {
        return error(`json_${intent.op} rejected: ${translated.reason}`);
    }
    // Apply the mutation locally now that we know it's translatable.
    const result = applyMutation(id, intent);
    if (!result)
        return scratchpadNotFound(id);
    // Push to the Docs API.
    try {
        await call('docs', 'documents.batchUpdate', {
            documentId: binding.resourceId,
            ...translated.body,
        }, { account: binding.account });
    }
    catch (err) {
        // The buffer has the local change; the doc doesn't. Match the sheets
        // error contract — agent retries or discards.
        const message = err instanceof Error ? err.message : String(err);
        return {
            text: `Sync failed: ${message}\nLocal buffer still has your changes. Retry or use scratchpad reset to discard.`,
            refs: { error: true, scratchpadId: id },
        };
    }
    // Reload the buffer from the doc — the doc is the source of truth.
    // This also picks up the new revisionId for the next sync.
    await reloadDocsBuffer(id, binding);
    return {
        text: `${formatMutation(result)}\n_Synced: ${translated.summary}_`,
        refs: { scratchpadId: id, synced: true, summary: translated.summary },
    };
}
/** Dispatch the local mutation matching the intent's op. */
function applyMutation(id, intent) {
    switch (intent.op) {
        case 'set': return scratchpads.jsonSet(id, intent.path, intent.value);
        case 'delete': return scratchpads.jsonDelete(id, intent.path);
        case 'insert': return scratchpads.jsonInsert(id, intent.path, intent.value);
    }
}
/** Re-fetch the doc, replace the buffer, and update the binding's revisionId. */
async function reloadDocsBuffer(id, binding) {
    // NO includeTabsContent — this must stay in step with the import that created the
    // buffer (see importDocJson, and #155). The flag removes `body`, which is what
    // docs-sync addresses. Change one of these two call sites and a scratchpad's buffer
    // and its reload disagree about the shape of the document.
    const doc = await call('docs', 'documents.get', {
        documentId: binding.resourceId,
    }, { account: binding.account });
    const freshJson = JSON.stringify(doc, null, 2);
    const sp = scratchpads.get(id);
    if (!sp)
        return;
    sp.lines = freshJson.split('\n');
    if (sp.binding) {
        sp.binding.revisionId = typeof doc.revisionId === 'string' ? doc.revisionId : undefined;
    }
}
/**
 * If the scratchpad is live-bound, push the current buffer to the API
 * and reload from the live resource. Returns an error HandlerResponse
 * on failure, or null on success (caller uses its own mutation result).
 */
async function syncIfBound(id) {
    const binding = scratchpads.getBinding(id);
    if (!binding)
        return null;
    const content = scratchpads.getContent(id);
    if (content === null)
        return null;
    try {
        if (binding.service === 'docs') {
            // Docs JSON-mode mutations are handled upstream by
            // maybeHandleDocsBoundMutation, which translates the intent into
            // a batchUpdate request, pushes, and reloads. Reaching this point
            // means a non-json operation on a docs-bound scratchpad — nothing
            // to sync (those op types don't reflect into the doc anyway).
            return null;
        }
        else if (binding.service === 'sheets') {
            // For Sheets: the buffer is the values JSON.
            // Push back via spreadsheets.values.update.
            const data = JSON.parse(content);
            const values = data.values;
            const range = data.range;
            if (values && range) {
                // `values` is the request BODY (the descriptor declares only
                // spreadsheetId/range/valueInputOption), so it goes at the top level —
                // not nested under `requestBody`.
                await call('sheets', 'spreadsheets.values.update', {
                    spreadsheetId: binding.resourceId,
                    range,
                    valueInputOption: 'USER_ENTERED',
                    values,
                }, { account: binding.account });
            }
            // Reload from API
            const fresh = await call('sheets', 'spreadsheets.values.get', {
                spreadsheetId: binding.resourceId,
                range: range ?? 'Sheet1',
            }, { account: binding.account });
            const freshJson = JSON.stringify(fresh, null, 2);
            const sp = scratchpads.get(id);
            if (sp) {
                sp.lines = freshJson.split('\n');
            }
        }
        return null; // Success — caller uses its own result
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            text: `Sync failed: ${message}\nLocal buffer still has your changes. Retry or discard.`,
            refs: { error: true, scratchpadId: id },
        };
    }
}
// ── Attachments ───────────────────────────────────────────
async function handleAttach(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const source = params.source;
    if (!source)
        return error('source is required for attach (workspace or drive).');
    const filename = params.filename;
    const fileId = params.fileId;
    if (!filename && !fileId)
        return error('filename (for workspace) or fileId (for drive) is required.');
    let resolvedFilename;
    let mimeType;
    let size;
    let location;
    if (source === 'workspace') {
        if (!filename)
            return error('filename is required for workspace attachments.');
        try {
            const filePath = resolveWorkspacePath(filename);
            await verifyPathSafety(filePath);
            const stat = await fs.stat(filePath);
            resolvedFilename = filename;
            mimeType = lookupMimeType(filename);
            size = stat.size;
            location = filePath;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return error(`Cannot attach workspace file: ${msg}`);
        }
    }
    else {
        // Drive attachments — use fileId as identifier, metadata resolved later on send
        resolvedFilename = fileId ?? 'unknown';
        mimeType = 'application/octet-stream';
        size = 0;
        location = fileId ?? '';
    }
    const result = scratchpads.attach(id, {
        source,
        filename: resolvedFilename,
        mimeType,
        size,
        location,
    }, params.afterLine);
    if (!result)
        return scratchpadNotFound(id);
    return { text: result.message, refs: { scratchpadId: id, refId: result.refId } };
}
function handleDetach(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const refId = params.refId;
    if (!refId)
        return error('refId is required for detach.');
    const result = scratchpads.detach(id, refId);
    if (!result)
        return scratchpadNotFound(id);
    return { text: result, refs: { scratchpadId: id, refId } };
}
// ── Import / Send (stubs — adapters in separate files) ────
async function handleImport(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const source = params.source;
    if (!source)
        return error('source is required for import (doc, email, sheet, drive_file).');
    const sourceParams = (params.sourceParams ?? {});
    switch (source) {
        case 'email':
            return importEmail(scratchpads, id, sourceParams);
        case 'doc':
            return importDoc(scratchpads, id, sourceParams);
        case 'sheet':
            return importSheet(scratchpads, id, sourceParams);
        case 'drive_file':
            return importDriveFile(scratchpads, id, sourceParams);
        case 'meet':
            return importMeet(scratchpads, id, sourceParams);
        default:
            return error(`Unknown import source: ${source}. Valid sources: doc, email, sheet, drive_file, meet.`);
    }
}
async function handleSend(params) {
    const id = requireScratchpadId(params);
    if (!id)
        return scratchpadNotFound(params.scratchpadId);
    const target = params.target;
    if (!target)
        return error('target is required for send (email, email_draft, doc_create, doc_write, workspace).');
    const targetParams = (params.targetParams ?? {});
    const keep = params.keep !== false; // default true
    let result;
    switch (target) {
        case 'email':
            result = await sendEmail(scratchpads, id, targetParams);
            break;
        case 'email_draft':
            result = await sendEmailDraft(scratchpads, id, targetParams);
            break;
        case 'doc_create':
            result = await sendDocCreate(scratchpads, id, targetParams);
            break;
        case 'doc_write':
            result = await sendDocWrite(scratchpads, id, targetParams);
            break;
        case 'workspace':
            result = await sendWorkspace(scratchpads, id, targetParams);
            break;
        case 'sheet_write':
            result = await sendSheetWrite(scratchpads, id, targetParams);
            break;
        case 'calendar_event':
            result = await sendCalendarEvent(scratchpads, id, targetParams);
            break;
        case 'task_create':
            result = await sendTaskCreate(scratchpads, id, targetParams);
            break;
        default:
            return error(`Unknown send target: ${target}. Valid targets: email, email_draft, doc_create, doc_write, workspace, sheet_write, calendar_event, task_create.`);
    }
    // Discard scratchpad on success if keep=false
    if (!keep && !result.refs?.error) {
        scratchpads.discard(id);
        result.text += `\nScratchpad ${id} discarded.`;
    }
    return result;
}
//# sourceMappingURL=handler.js.map