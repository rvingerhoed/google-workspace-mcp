/**
 * Send adapter: calendar_event — creates a calendar event with scratchpad content as description.
 */
import type { HandlerResponse } from '../../handler.js';
import type { ScratchpadManager } from '../manager.js';
interface CalendarEventParams {
    email: string;
    summary: string;
    start: string;
    end: string;
    location?: string;
    attendees?: string;
}
export declare function sendCalendarEvent(scratchpads: ScratchpadManager, scratchpadId: string, targetParams: CalendarEventParams): Promise<HandlerResponse>;
export {};
