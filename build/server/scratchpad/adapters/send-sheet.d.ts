/**
 * Send adapter: sheet_write — writes scratchpad CSV content to a Google Sheet.
 * Parses CSV lines back into a values array for spreadsheets.values.update.
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface SheetWriteParams {
    email: string;
    spreadsheetId: string;
    range?: string;
}
export declare function sendSheetWrite(scratchpads: ScratchpadManager, scratchpadId: string, targetParams: SheetWriteParams): Promise<HandlerResponse>;
export {};
