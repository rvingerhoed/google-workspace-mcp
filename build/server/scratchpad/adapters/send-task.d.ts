/**
 * Send adapter: task_create — creates a Google Task from scratchpad content.
 * First line becomes the task title, remaining lines become the notes.
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface TaskCreateParams {
    email: string;
    taskListId?: string;
}
export declare function sendTaskCreate(scratchpads: ScratchpadManager, scratchpadId: string, targetParams: TaskCreateParams): Promise<HandlerResponse>;
export {};
