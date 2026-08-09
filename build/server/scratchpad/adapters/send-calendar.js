/**
 * Send adapter: calendar_event — creates a calendar event with scratchpad content as description.
 */
import { call } from '../../../google/client.js';
import { nextSteps } from '../../formatting/next-steps.js';
export async function sendCalendarEvent(scratchpads, scratchpadId, targetParams) {
    const content = scratchpads.getContent(scratchpadId);
    if (content === null) {
        return { text: `Scratchpad ${scratchpadId} not found.`, refs: { error: true } };
    }
    const { email, summary, start, end, location, attendees } = targetParams;
    if (!email || !summary || !start || !end) {
        return {
            text: `Send failed: email, summary, start, and end are required for calendar_event.\nScratchpad ${scratchpadId} is still active.`,
            refs: { error: true, scratchpadId },
        };
    }
    // `calendarId` is the one PATH param the descriptor declares; everything else
    // here is the Event resource and lands in the body. Same shape as
    // services/calendar/patch.ts `create`.
    const body = {
        calendarId: 'primary',
        summary,
        start: { dateTime: start },
        end: { dateTime: end },
        description: content,
    };
    if (location)
        body.location = location;
    if (attendees) {
        body.attendees = attendees
            .split(',').map((e) => e.trim()).filter(Boolean)
            .map((address) => ({ email: address }));
    }
    try {
        const data = await call('calendar', 'events.insert', body, { account: email });
        return {
            text: `Event created: **${summary}**\n\n` +
                `**When:** ${start} – ${end}\n` +
                (location ? `**Where:** ${location}\n` : '') +
                `**Description:** scratchpad content (${content.split('\n').length} lines)\n` +
                `**Event ID:** ${data.id ?? 'unknown'}` +
                nextSteps('calendar', 'create', { email }),
            refs: { scratchpadId, eventId: data.id, summary, start, end },
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            text: `Send failed: ${message}\nScratchpad ${scratchpadId} is still active.`,
            refs: { error: true, scratchpadId },
        };
    }
}
//# sourceMappingURL=send-calendar.js.map