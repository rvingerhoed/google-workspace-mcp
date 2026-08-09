/**
 * Import adapter: meet — loads a Meet conference transcript into a scratchpad.
 * Imports as markdown with speaker attribution. No live binding (transcripts are read-only).
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface MeetImportParams {
    email: string;
    conferenceId: string;
}
export declare function importMeet(scratchpads: ScratchpadManager, scratchpadId: string, sourceParams: MeetImportParams): Promise<HandlerResponse>;
export {};
