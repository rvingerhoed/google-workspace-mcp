/**
 * Default formatters — generic markdown renderers for list/detail/action
 * responses. Used when a service has no patch formatter override.
 */
/** Route to the appropriate default formatter based on operation type. */
export function formatDefault(data, opDef) {
    switch (opDef.type) {
        case 'list':
            return formatDefaultList(data);
        case 'detail':
            return formatDefaultDetail(data);
        case 'action':
            return formatDefaultAction(data);
        default:
            return formatDefaultDetail(data);
    }
}
/** Generic list formatter — renders array items as pipe-delimited rows. */
function formatDefaultList(data) {
    const raw = data;
    // Try common list wrapper keys
    const items = findArray(raw);
    if (items.length === 0) {
        return { text: 'No results found.', refs: { count: 0 } };
    }
    const lines = items.map(item => {
        const obj = item;
        const id = String(obj.id ?? '');
        const parts = [id];
        // Include a few meaningful string fields
        for (const [key, val] of Object.entries(obj)) {
            if (key === 'id')
                continue;
            if (typeof val === 'string' && val.length < 100) {
                parts.push(val);
            }
            if (parts.length >= 5)
                break;
        }
        return parts.join(' | ');
    });
    return {
        text: `## Results (${items.length})\n\n${lines.join('\n')}`,
        refs: {
            count: items.length,
            id: String(items[0]?.id ?? ''),
            ids: items.map(i => String(i?.id ?? '')),
        },
    };
}
/** Generic detail formatter — renders object fields as bold key/value pairs. */
function formatDefaultDetail(data) {
    const obj = data;
    const title = String(obj.name ?? obj.summary ?? obj.subject ?? obj.title ?? 'Details');
    const id = String(obj.id ?? '');
    const parts = [`## ${title}`, ''];
    for (const [key, val] of Object.entries(obj)) {
        if (val === null || val === undefined)
            continue;
        if (typeof val === 'object')
            continue; // skip nested objects
        parts.push(`**${key}:** ${val}`);
    }
    return {
        text: parts.join('\n'),
        refs: { id, ...extractScalarRefs(obj) },
    };
}
/**
 * Generic action formatter — confirm, and say WHAT was acted on.
 *
 * Google does not agree with itself about what an identifier is called: Tasks returns
 * `id`, Docs returns `documentId`, Sheets returns `spreadsheetId`. This used to print
 * only a key named exactly `id`, so creating a document produced the entire response
 * "Operation completed." — no id, no title, nothing an agent could act on. The id was
 * in `refs` (so `$0.documentId` chaining worked), but anything reading the text was
 * told only that *something* had happened.
 *
 * So name the thing: whichever identifier came back, plus whatever the resource calls
 * itself. A confirmation you cannot act on is barely a confirmation.
 */
const ID_KEYS = ['id', 'documentId', 'spreadsheetId', 'fileId', 'eventId', 'threadId'];
const NAME_KEYS = ['title', 'name', 'summary'];
function formatDefaultAction(data) {
    const obj = (data ?? {});
    const idKey = ID_KEYS.find((k) => obj[k] !== undefined && obj[k] !== null);
    const id = idKey ? String(obj[idKey]) : 'unknown';
    const nameKey = NAME_KEYS.find((k) => typeof obj[k] === 'string' && obj[k] !== '');
    const parts = ['Operation completed.'];
    if (nameKey)
        parts.push(`\n\n**${titleCase(nameKey)}:** ${String(obj[nameKey])}`);
    if (idKey)
        parts.push(`\n**${titleCase(idKey)}:** ${id}`);
    return {
        text: parts.join(''),
        // `id` stays populated whatever Google called the field, so next-steps and
        // queue_operations references keep resolving.
        refs: { id, ...extractScalarRefs(obj) },
    };
}
/** documentId -> "Document ID"; title -> "Title" */
function titleCase(key) {
    return key
        .replace(/Id$/, ' ID')
        .replace(/^./, (c) => c.toUpperCase());
}
/** Find the first array in a response object (items, files, messages, etc). */
function findArray(obj) {
    if (Array.isArray(obj))
        return obj;
    for (const val of Object.values(obj)) {
        if (Array.isArray(val))
            return val;
    }
    return [];
}
/** Pull scalar values from an object for refs. */
function extractScalarRefs(obj) {
    const refs = {};
    for (const [key, val] of Object.entries(obj)) {
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            refs[key] = val;
        }
    }
    return refs;
}
//# sourceMappingURL=defaults.js.map