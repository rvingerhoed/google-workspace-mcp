/**
 * Send adapter: workspace — writes scratchpad content to a file in the workspace directory.
 * Attachments are copied alongside the content file.
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface WorkspaceTargetParams {
    filename: string;
}
export declare function sendWorkspace(scratchpads: ScratchpadManager, scratchpadId: string, targetParams: WorkspaceTargetParams): Promise<HandlerResponse>;
export {};
