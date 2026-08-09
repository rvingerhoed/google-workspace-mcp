/**
 * Import adapter: sheet — loads a Google Sheet as CSV lines into a scratchpad.
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface SheetImportParams {
    email: string;
    spreadsheetId: string;
    range?: string;
}
export declare function importSheet(scratchpads: ScratchpadManager, scratchpadId: string, sourceParams: SheetImportParams): Promise<HandlerResponse>;
export {};
