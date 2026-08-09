/**
 * Queue handler — execute multiple operations sequentially with
 * result references ($N.field) for chaining outputs.
 *
 * Handlers return { text, refs }. Queue uses refs for $N.field
 * resolution and text for the final response.
 */
import { advanceEpoch } from './handler.js';
const NEXT_STEPS_SEPARATOR = '\n\n---\n**Next steps:**';
function stripNextSteps(text) {
    const idx = text.indexOf(NEXT_STEPS_SEPARATOR);
    return idx >= 0 ? text.slice(0, idx) : text;
}
export async function handleQueue(params, handlers) {
    const operations = params.operations;
    if (!Array.isArray(operations) || operations.length === 0) {
        throw new Error('operations array is required and must not be empty');
    }
    const detail = params.detail ?? 'summary';
    const results = [];
    let bailedAt = -1;
    let lastSuccessText = '';
    for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        const errorStrategy = op.onError ?? 'bail';
        if (bailedAt >= 0) {
            results.push({ index: i, tool: op.tool, status: 'skipped' });
            continue;
        }
        const handler = handlers[op.tool];
        if (!handler) {
            results.push({ index: i, tool: op.tool, status: 'error', error: `Unknown tool: ${op.tool}` });
            if (errorStrategy === 'bail')
                bailedAt = i;
            continue;
        }
        // Resolve $N.field references
        let resolvedArgs;
        try {
            resolvedArgs = resolveReferences(op.args, results);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            results.push({ index: i, tool: op.tool, status: 'error', error: msg });
            if (errorStrategy === 'bail')
                bailedAt = i;
            continue;
        }
        try {
            advanceEpoch(); // Each queued operation is a logical tool call
            const response = await handler(resolvedArgs);
            const text = stripNextSteps(response.text);
            results.push({ index: i, tool: op.tool, status: 'success', text, refs: response.refs });
            lastSuccessText = response.text; // keep next-steps from last success
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            results.push({ index: i, tool: op.tool, status: 'error', error: msg });
            if (errorStrategy === 'bail')
                bailedAt = i;
        }
    }
    const succeeded = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    // Build markdown output
    const lines = [
        `## Queue Results (${succeeded}/${results.length} succeeded)`,
        '',
    ];
    for (const r of results) {
        const icon = r.status === 'success' ? '✓' : r.status === 'error' ? '✗' : '○';
        const headline = r.status === 'error' ? r.error
            : r.text ? firstLine(r.text)
                : r.status;
        lines.push(`${icon} ${r.tool} — ${headline}`);
        // Full mode: include complete operation output below the summary line
        if (detail === 'full' && r.status === 'success' && r.text) {
            lines.push('', r.text, '');
        }
    }
    // Append consolidated next-steps from last successful operation
    const nextStepsSuffix = extractNextSteps(lastSuccessText);
    const text = lines.join('\n') + nextStepsSuffix;
    const refs = {
        total: results.length,
        succeeded,
        failed,
        skipped,
        // Per-operation refs keyed by index for downstream access
        results: results.map(r => ({
            tool: r.tool,
            status: r.status,
            ...(r.refs ?? {}),
        })),
    };
    return { text, refs };
}
// --- Reference resolution ---
function resolveReferences(args, results) {
    const resolved = {};
    for (const [key, value] of Object.entries(args)) {
        if (typeof value === 'string' && /\$\d+\./.test(value)) {
            resolved[key] = resolveRef(value, results);
        }
        else {
            resolved[key] = value;
        }
    }
    return resolved;
}
function resolveRef(value, results) {
    return value.replace(/\$(\d+)\.(\w+)/g, (_match, indexStr, field) => {
        const index = parseInt(indexStr, 10);
        if (index >= results.length) {
            throw new Error(`$${index}.${field}: operation ${index} hasn't run yet`);
        }
        const result = results[index];
        if (result.status !== 'success') {
            throw new Error(`$${index}.${field}: operation ${index} ${result.status}`);
        }
        const extracted = result.refs?.[field];
        if (extracted === undefined) {
            throw new Error(`$${index}.${field}: field '${field}' not found in result`);
        }
        return String(extracted);
    });
}
function firstLine(text) {
    // Skip markdown headings to get the first content line
    for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---')) {
            return trimmed.length > 80 ? trimmed.slice(0, 79) + '…' : trimmed;
        }
    }
    return text.split('\n')[0] ?? '';
}
function extractNextSteps(text) {
    const idx = text.indexOf(NEXT_STEPS_SEPARATOR);
    return idx >= 0 ? text.slice(idx) : '';
}
//# sourceMappingURL=queue.js.map