/**
 * Import adapter: drive_file — loads text content from a Drive file into a scratchpad.
 * Only supports text-based files. Binary files return an error with guidance.
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface DriveImportParams {
    email: string;
    fileId: string;
}
export declare function importDriveFile(scratchpads: ScratchpadManager, scratchpadId: string, sourceParams: DriveImportParams): Promise<HandlerResponse>;
export {};
