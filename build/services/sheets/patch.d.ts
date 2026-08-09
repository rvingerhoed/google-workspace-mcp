/**
 * Sheets patch — domain-specific hooks for the Sheets service.
 *
 * Key customizations:
 * - formatDetail for `get` (spreadsheet metadata + sheet tabs) and
 *   `read`/`getValues` (cell values rendered as a markdown table). The
 *   generic detail formatter drops object/array fields, so the `values`
 *   and `sheets` arrays are invisible without this patch.
 * - formatAction for `create` and `append` so the spreadsheetId / update
 *   summary make it back to the agent.
 * - customHandlers.updateValues — `spreadsheets.values.update` needs a
 *   request body containing `values`, which the manifest/factory path
 *   can't express. This handler accepts `values` (CSV for a single row)
 *   or `jsonValues` (JSON 2D array) and sends them via `--json`.
 */
import type { ServicePatch } from '../../factory/types.js';
export declare const sheetsPatch: ServicePatch;
