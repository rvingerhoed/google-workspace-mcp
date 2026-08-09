/**
 * Import adapter: sheet — loads a Google Sheet as CSV lines into a scratchpad.
 */
import { call } from '../../../google/client.js';
export async function importSheet(scratchpads, scratchpadId, sourceParams) {
    const { email, spreadsheetId, range } = sourceParams;
    if (!email || !spreadsheetId) {
        return { text: 'email and spreadsheetId are required for sheet import.', refs: { error: true } };
    }
    try {
        const params = { spreadsheetId };
        if (range)
            params.range = range;
        // Default to first sheet if no range specified
        const rangeArg = range ?? 'Sheet1';
        const data = await call('sheets', 'spreadsheets.values.get', {
            spreadsheetId,
            range: rangeArg,
        }, { account: email });
        const values = (data.values ?? []);
        if (values.length === 0) {
            return {
                text: `Sheet ${spreadsheetId} (${rangeArg}) has no data.\nScratchpad ${scratchpadId} unchanged.`,
                refs: { scratchpadId, spreadsheetId },
            };
        }
        // Convert to CSV lines
        const csvLines = values.map(row => row.map(escapeCsvField).join(','));
        scratchpads.appendRawLines(scratchpadId, csvLines);
        scratchpads.setFormat(scratchpadId, 'csv');
        return {
            text: `Imported sheet as CSV (${csvLines.length} rows) into scratchpad ${scratchpadId}.`,
            refs: { scratchpadId, spreadsheetId, range: rangeArg, rowsImported: csvLines.length },
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            text: `Import failed: ${message}`,
            refs: { error: true, scratchpadId },
        };
    }
}
/** Escape a CSV field: quote if it contains comma, newline, or double-quote. */
function escapeCsvField(field) {
    if (field === undefined || field === null)
        return '';
    const s = String(field);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}
//# sourceMappingURL=import-sheet.js.map