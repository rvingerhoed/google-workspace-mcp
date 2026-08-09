/**
 * ScratchpadManager — line-addressed content authoring buffer.
 * See ADR-301: Scratchpad Buffer — Service-Agnostic Content Authoring.
 */
import { randomUUID } from 'node:crypto';
import { getEpoch } from '../handler.js';
import { validate } from './validate.js';
import { getByPath, setByPath, deleteByPath } from './json-path.js';
// ── ScratchpadManager ──────────────────────────────────────
const SCRATCHPAD_MAX_AGE_EPOCHS = 100;
export class ScratchpadManager {
    scratchpads = new Map();
    /**
     * Create a new scratchpad, optionally pre-filled with content.
     */
    create(opts) {
        this.gc();
        const id = `sp-${randomUUID().slice(0, 12)}`;
        const lines = opts?.content ? normalizeAndSplit(opts.content) : [];
        this.scratchpads.set(id, {
            id,
            lines,
            format: opts?.format ?? 'text',
            attachments: new Map(),
            label: opts?.label,
            lastTouchedEpoch: getEpoch(),
            createdAt: new Date(),
        });
        return id;
    }
    /**
     * Get a scratchpad by ID. Returns null if not found or GC'd.
     */
    get(id) {
        const sp = this.scratchpads.get(id);
        if (!sp)
            return null;
        if (this.isExpired(sp)) {
            this.scratchpads.delete(id);
            return null;
        }
        return sp;
    }
    /**
     * Touch a scratchpad — resets its epoch to keep it alive.
     */
    touch(sp) {
        sp.lastTouchedEpoch = getEpoch();
    }
    /**
     * View buffer content with line numbers and validation status.
     */
    view(id, startLine, endLine) {
        const sp = this.get(id);
        if (!sp)
            return null;
        this.touch(sp);
        const start = startLine ? Math.max(1, startLine) : 1;
        const end = endLine ? Math.min(endLine, sp.lines.length) : sp.lines.length;
        const numbered = formatNumberedLines(sp.lines, start, end);
        const validation = validate(sp.lines, sp.format);
        const label = sp.label ? ` "${sp.label}"` : '';
        const attInfo = sp.attachments.size > 0 ? ` | ${sp.attachments.size} attachment(s)` : '';
        const bindInfo = sp.binding ? ` | bound: ${sp.binding.service}/${sp.binding.resourceId}` : '';
        const header = `Scratchpad: ${sp.id}${label} | ${sp.format} | ${sp.lines.length} lines${attInfo}${bindInfo}`;
        return `${header}\n${numbered}\n${validation}`;
    }
    /**
     * Insert lines after a given line number. afterLine=0 prepends.
     */
    insertLines(id, afterLine, content) {
        const sp = this.get(id);
        if (!sp)
            return null;
        this.touch(sp);
        if (afterLine < 0 || afterLine > sp.lines.length) {
            return {
                message: `Error: afterLine ${afterLine} out of range (0-${sp.lines.length}).`,
                context: '',
                validation: validate(sp.lines, sp.format),
            };
        }
        const newLines = normalizeAndSplit(content);
        sp.lines.splice(afterLine, 0, ...newLines);
        const affectedStart = afterLine + 1;
        const affectedEnd = afterLine + newLines.length;
        return {
            message: `Inserted ${newLines.length} line(s) after line ${afterLine}. Buffer: ${sp.lines.length} lines.`,
            context: formatContext(sp.lines, affectedStart, affectedEnd),
            validation: validate(sp.lines, sp.format),
        };
    }
    /**
     * Append lines at the end of the buffer.
     */
    appendLines(id, content) {
        const sp = this.get(id);
        if (!sp)
            return null;
        this.touch(sp);
        const newLines = normalizeAndSplit(content);
        const affectedStart = sp.lines.length + 1;
        sp.lines.push(...newLines);
        const affectedEnd = sp.lines.length;
        return {
            message: `Appended ${newLines.length} line(s). Buffer: ${sp.lines.length} lines.`,
            context: formatContext(sp.lines, affectedStart, affectedEnd),
            validation: validate(sp.lines, sp.format),
        };
    }
    /**
     * Replace a range of lines with new content.
     */
    replaceLines(id, startLine, endLine, content) {
        const sp = this.get(id);
        if (!sp)
            return null;
        this.touch(sp);
        if (startLine < 1 || startLine > sp.lines.length) {
            return {
                message: `Error: startLine ${startLine} out of range (1-${sp.lines.length}).`,
                context: '',
                validation: validate(sp.lines, sp.format),
            };
        }
        if (endLine < startLine || endLine > sp.lines.length) {
            return {
                message: `Error: endLine ${endLine} out of range (${startLine}-${sp.lines.length}).`,
                context: '',
                validation: validate(sp.lines, sp.format),
            };
        }
        const newLines = normalizeAndSplit(content);
        sp.lines.splice(startLine - 1, endLine - startLine + 1, ...newLines);
        const affectedEnd = startLine + newLines.length - 1;
        return {
            message: `Replaced lines ${startLine}-${endLine}. Buffer: ${sp.lines.length} lines.`,
            context: formatContext(sp.lines, startLine, affectedEnd),
            validation: validate(sp.lines, sp.format),
        };
    }
    /**
     * Remove line(s) from the buffer.
     */
    removeLines(id, startLine, endLine) {
        const sp = this.get(id);
        if (!sp)
            return null;
        this.touch(sp);
        const end = endLine ?? startLine;
        if (startLine < 1 || startLine > sp.lines.length) {
            return {
                message: `Error: startLine ${startLine} out of range (1-${sp.lines.length}).`,
                context: '',
                validation: validate(sp.lines, sp.format),
            };
        }
        if (end < startLine || end > sp.lines.length) {
            return {
                message: `Error: endLine ${end} out of range (${startLine}-${sp.lines.length}).`,
                context: '',
                validation: validate(sp.lines, sp.format),
            };
        }
        sp.lines.splice(startLine - 1, end - startLine + 1);
        const joinLine = Math.min(startLine, sp.lines.length);
        return {
            message: `Removed ${end - startLine + 1} line(s). Buffer: ${sp.lines.length} lines.`,
            context: formatRemoveContext(sp.lines, startLine, joinLine),
            validation: validate(sp.lines, sp.format),
        };
    }
    /**
     * Copy lines from another scratchpad into this one.
     * Source is not modified.
     */
    copyLines(targetId, sourceId, startLine, endLine, afterLine) {
        const target = this.get(targetId);
        const source = this.get(sourceId);
        if (!target)
            return null;
        if (!source) {
            return {
                message: `Error: source scratchpad ${sourceId} not found.`,
                context: '',
                validation: validate(target.lines, target.format),
            };
        }
        if (startLine < 1 || startLine > source.lines.length) {
            return {
                message: `Error: source startLine ${startLine} out of range (1-${source.lines.length}).`,
                context: '',
                validation: validate(target.lines, target.format),
            };
        }
        if (endLine < startLine || endLine > source.lines.length) {
            return {
                message: `Error: source endLine ${endLine} out of range (${startLine}-${source.lines.length}).`,
                context: '',
                validation: validate(target.lines, target.format),
            };
        }
        if (afterLine < 0 || afterLine > target.lines.length) {
            return {
                message: `Error: afterLine ${afterLine} out of range (0-${target.lines.length}).`,
                context: '',
                validation: validate(target.lines, target.format),
            };
        }
        this.touch(target);
        this.touch(source);
        const copied = source.lines.slice(startLine - 1, endLine);
        target.lines.splice(afterLine, 0, ...copied);
        const affectedStart = afterLine + 1;
        const affectedEnd = afterLine + copied.length;
        return {
            message: `Copied ${copied.length} line(s) from ${sourceId}. Buffer: ${target.lines.length} lines.`,
            context: formatContext(target.lines, affectedStart, affectedEnd),
            validation: validate(target.lines, target.format),
        };
    }
    // ── Attachments ─────────────────────────────────────────
    /**
     * Attach a file reference and insert a marker line.
     * Returns the assigned refId (e.g., "att-1").
     */
    attach(id, ref, afterLine) {
        const sp = this.get(id);
        if (!sp)
            return null;
        this.touch(sp);
        const refId = `att-${sp.attachments.size + 1}`;
        sp.attachments.set(refId, { ...ref, refId });
        const marker = `![${ref.filename}](att:${refId} "${ref.filename}, ${formatSize(ref.size)}, from ${ref.source}")`;
        const insertAt = afterLine ?? sp.lines.length;
        sp.lines.splice(insertAt, 0, marker);
        return { refId, message: `Attached ${ref.filename} as ${refId}. Buffer: ${sp.lines.length} lines.` };
    }
    /**
     * Remove an attachment from the side-table. Marker line is left for the agent.
     */
    detach(id, refId) {
        const sp = this.get(id);
        if (!sp)
            return null;
        this.touch(sp);
        if (!sp.attachments.has(refId)) {
            return `Error: attachment ${refId} not found.`;
        }
        const ref = sp.attachments.get(refId);
        sp.attachments.delete(refId);
        return `Detached ${ref.filename} (${refId}). Marker line remains in buffer — remove it with remove_lines if needed.`;
    }
    /** Get all attachments for a scratchpad. */
    getAttachments(id) {
        const sp = this.get(id);
        if (!sp)
            return null;
        return sp.attachments;
    }
    // ── Live binding ───────────────────────────────────────
    /** Set a live binding on a scratchpad (used by import adapters). */
    setBinding(id, binding) {
        const sp = this.get(id);
        if (!sp)
            return false;
        sp.binding = binding;
        return true;
    }
    /** Get the live binding, if any. */
    getBinding(id) {
        const sp = this.get(id);
        return sp?.binding;
    }
    // ── JSON path operations ───────────────────────────────
    /**
     * Get a value at a JSON path. Only valid for json-format scratchpads.
     */
    jsonGet(id, path) {
        const sp = this.get(id);
        if (!sp)
            return null;
        if (sp.format !== 'json')
            return { error: 'json_get requires format: json' };
        this.touch(sp);
        const text = sp.lines.join('\n');
        let obj;
        try {
            obj = JSON.parse(text);
        }
        catch {
            return { error: 'Buffer is not valid JSON. Fix syntax errors first.' };
        }
        try {
            const value = getByPath(obj, path);
            const serialized = JSON.stringify(value, null, 2);
            const lineCount = serialized.split('\n').length;
            return { value, lineSpan: `${lineCount} line(s)` };
        }
        catch (err) {
            return { error: err instanceof Error ? err.message : String(err) };
        }
    }
    /**
     * Set a value at a JSON path. Re-serializes the buffer.
     */
    jsonSet(id, path, value) {
        const sp = this.get(id);
        if (!sp)
            return null;
        if (sp.format !== 'json') {
            return { message: 'Error: json_set requires format: json', context: '', validation: '' };
        }
        this.touch(sp);
        const text = sp.lines.join('\n');
        let obj;
        try {
            obj = JSON.parse(text);
        }
        catch {
            return {
                message: 'Error: buffer is not valid JSON. Fix syntax errors first.',
                context: '',
                validation: validate(sp.lines, sp.format),
            };
        }
        try {
            setByPath(obj, path, value);
        }
        catch (err) {
            return {
                message: `Error: ${err instanceof Error ? err.message : String(err)}`,
                context: '',
                validation: validate(sp.lines, sp.format),
            };
        }
        sp.lines = JSON.stringify(obj, null, 2).split('\n');
        return {
            message: `Set ${path}. Buffer: ${sp.lines.length} lines.`,
            context: '',
            validation: validate(sp.lines, sp.format),
        };
    }
    /**
     * Delete a key or array element at a JSON path.
     */
    jsonDelete(id, path) {
        const sp = this.get(id);
        if (!sp)
            return null;
        if (sp.format !== 'json') {
            return { message: 'Error: json_delete requires format: json', context: '', validation: '' };
        }
        this.touch(sp);
        const text = sp.lines.join('\n');
        let obj;
        try {
            obj = JSON.parse(text);
        }
        catch {
            return {
                message: 'Error: buffer is not valid JSON. Fix syntax errors first.',
                context: '',
                validation: validate(sp.lines, sp.format),
            };
        }
        try {
            deleteByPath(obj, path);
        }
        catch (err) {
            return {
                message: `Error: ${err instanceof Error ? err.message : String(err)}`,
                context: '',
                validation: validate(sp.lines, sp.format),
            };
        }
        sp.lines = JSON.stringify(obj, null, 2).split('\n');
        return {
            message: `Deleted ${path}. Buffer: ${sp.lines.length} lines.`,
            context: '',
            validation: validate(sp.lines, sp.format),
        };
    }
    /**
     * Insert a value into an array at a JSON path.
     */
    jsonInsert(id, path, value) {
        const sp = this.get(id);
        if (!sp)
            return null;
        if (sp.format !== 'json') {
            return { message: 'Error: json_insert requires format: json', context: '', validation: '' };
        }
        this.touch(sp);
        const text = sp.lines.join('\n');
        let obj;
        try {
            obj = JSON.parse(text);
        }
        catch {
            return {
                message: 'Error: buffer is not valid JSON. Fix syntax errors first.',
                context: '',
                validation: validate(sp.lines, sp.format),
            };
        }
        try {
            const target = getByPath(obj, path);
            if (!Array.isArray(target)) {
                return {
                    message: `Error: ${path} is not an array.`,
                    context: '',
                    validation: validate(sp.lines, sp.format),
                };
            }
            target.push(value);
        }
        catch (err) {
            return {
                message: `Error: ${err instanceof Error ? err.message : String(err)}`,
                context: '',
                validation: validate(sp.lines, sp.format),
            };
        }
        sp.lines = JSON.stringify(obj, null, 2).split('\n');
        return {
            message: `Inserted into ${path}. Buffer: ${sp.lines.length} lines.`,
            context: '',
            validation: validate(sp.lines, sp.format),
        };
    }
    // ── Buffer access ──────────────────────────────────────
    /** Get full buffer content as a single string. */
    getContent(id) {
        const sp = this.get(id);
        if (!sp)
            return null;
        return sp.lines.join('\n');
    }
    /** Append raw lines to a scratchpad (used by import adapters). */
    appendRawLines(id, lines) {
        const sp = this.get(id);
        if (!sp)
            return false;
        this.touch(sp);
        sp.lines.push(...lines);
        return true;
    }
    /** Set the format of a scratchpad (used by import adapters). */
    setFormat(id, format) {
        const sp = this.get(id);
        if (!sp)
            return false;
        sp.format = format;
        return true;
    }
    /** Discard and invalidate a scratchpad. */
    discard(id) {
        return this.scratchpads.delete(id);
    }
    /** List all active scratchpads. */
    list() {
        this.gc();
        const result = [];
        for (const sp of this.scratchpads.values()) {
            result.push({
                id: sp.id,
                format: sp.format,
                label: sp.label,
                lineCount: sp.lines.length,
                attachmentCount: sp.attachments.size,
                bound: !!sp.binding,
                validation: validate(sp.lines, sp.format),
                lastTouchedEpoch: sp.lastTouchedEpoch,
            });
        }
        return result;
    }
    // ── Garbage collection ─────────────────────────────────
    isExpired(sp) {
        return getEpoch() - sp.lastTouchedEpoch > SCRATCHPAD_MAX_AGE_EPOCHS;
    }
    gc() {
        const expired = [];
        for (const sp of this.scratchpads.values()) {
            if (this.isExpired(sp))
                expired.push(sp.id);
        }
        for (const id of expired)
            this.scratchpads.delete(id);
    }
}
// ── Helpers ────────────────────────────────────────────────
/** Format bytes as human-readable size. */
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
/** Normalize CRLF/CR to LF and split into lines. */
function normalizeAndSplit(content) {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}
/** Format lines with line numbers for display. */
function formatNumberedLines(lines, start, end) {
    if (lines.length === 0)
        return '  (empty buffer)';
    const width = String(end).length;
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(`${String(i).padStart(width)} | ${lines[i - 1]}`);
    }
    return result.join('\n');
}
/** Format a context marker showing the edit site with surrounding lines. */
function formatContext(lines, affectedStart, affectedEnd) {
    if (lines.length === 0)
        return '';
    const width = String(Math.min(affectedEnd + 1, lines.length)).length;
    const parts = [];
    // One line before
    if (affectedStart > 1) {
        const ln = affectedStart - 1;
        parts.push(`${String(ln).padStart(width)} | ${lines[ln - 1]}`);
    }
    // First affected line
    parts.push(`${String(affectedStart).padStart(width)} | ${lines[affectedStart - 1]}`);
    // Elide middle if > 2 affected lines
    if (affectedEnd - affectedStart > 1) {
        parts.push(`${' '.repeat(width)} | ...`);
    }
    // Last affected line (if different from first)
    if (affectedEnd > affectedStart) {
        parts.push(`${String(affectedEnd).padStart(width)} | ${lines[affectedEnd - 1]}`);
    }
    // One line after
    if (affectedEnd < lines.length) {
        const ln = affectedEnd + 1;
        parts.push(`${String(ln).padStart(width)} | ${lines[ln - 1]}`);
    }
    return parts.join('\n');
}
/** Format context for a remove operation showing the join point. */
function formatRemoveContext(lines, removedAt, joinLine) {
    if (lines.length === 0)
        return '  (buffer now empty)';
    const width = String(Math.min(joinLine + 1, lines.length)).length;
    const parts = [];
    if (removedAt > 1 && removedAt - 1 <= lines.length) {
        const ln = removedAt - 1;
        parts.push(`${String(ln).padStart(width)} | ${lines[ln - 1]}`);
    }
    if (joinLine >= 1 && joinLine <= lines.length) {
        parts.push(`${String(joinLine).padStart(width)} | ${lines[joinLine - 1]}`);
    }
    return parts.join('\n');
}
// Validation: ./validate.ts | JSON path: ./json-path.ts
//# sourceMappingURL=manager.js.map