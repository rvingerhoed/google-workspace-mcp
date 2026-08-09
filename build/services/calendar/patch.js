/**
 * Calendar patch — domain-specific hooks for the calendar service.
 *
 * Key customizations:
 * - List: default timeMin to today start, include calendarId in output
 * - Agenda: rich helper with day-range params, calendarId per event
 * - Freebusy: custom handler (POST body via --json, not --params)
 * - Create: custom response formatting with event details + --meet flag
 * - Delete: custom confirmation message
 */
import { createHash } from 'node:crypto';
import { call } from '../../google/client.js';
import { formatEventList, formatEventDetail } from '../../server/formatting/markdown.js';
import { requireString } from '../../server/handlers/validate.js';
/** Format calendar list — name, access role, primary flag. */
function formatCalendarList(data) {
    const raw = data;
    const items = (raw?.items ?? []);
    if (items.length === 0) {
        return { text: 'No calendars found.', refs: { count: 0 } };
    }
    const lines = items.map(cal => {
        const id = String(cal.id ?? '');
        const summary = String(cal.summary ?? '(unnamed)');
        const role = String(cal.accessRole ?? '');
        const primary = cal.primary ? ' ★' : '';
        return `${summary}${primary} | ${role} | ${id}`;
    });
    return {
        text: `## Calendars (${items.length})\n\n${lines.join('\n')}`,
        refs: {
            count: items.length,
            calendarId: String(items[0]?.id ?? ''),
            calendars: items.map(c => ({ id: c.id, summary: c.summary })),
        },
    };
}
/** Format event list with calendarId enrichment. */
function formatEventListWithCalendar(data, ctx) {
    const result = formatEventList(data);
    const calendarId = ctx.params.calendarId || 'primary';
    // Enrich refs with calendarId so follow-up get calls work on shared calendars
    result.refs = { ...result.refs, calendarId };
    // Add calendarId hint to output when not primary
    if (calendarId !== 'primary') {
        result.text = result.text.replace(/^## Events/, `## Events (calendar: ${calendarId})`);
    }
    return result;
}
/** Format freebusy response into readable busy/free blocks. */
function formatFreeBusy(data, ctx) {
    const raw = data;
    const calendars = (raw?.calendars ?? {});
    const parts = ['## Availability\n'];
    const allBusy = [];
    for (const [calId, info] of Object.entries(calendars)) {
        // Surface API errors (e.g., permission denied on a calendar)
        if (info.errors && info.errors.length > 0) {
            const reasons = info.errors.map(e => e.reason).join(', ');
            parts.push(`**${calId}**: ⚠ Unable to check (${reasons})`);
            continue;
        }
        const busy = info.busy ?? [];
        if (busy.length === 0) {
            parts.push(`**${calId}**: Free for entire range`);
        }
        else {
            parts.push(`**${calId}**: ${busy.length} busy block${busy.length !== 1 ? 's' : ''}`);
            for (const block of busy) {
                const start = new Date(block.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const end = new Date(block.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                parts.push(`  - ${start} – ${end}`);
                allBusy.push({ calendar: calId, start: block.start, end: block.end });
            }
        }
    }
    return {
        text: parts.join('\n'),
        refs: {
            calendars: Object.keys(calendars),
            busyBlocks: allBusy,
            timeMin: ctx.params.timeMin,
            timeMax: ctx.params.timeMax,
        },
    };
}
/**
 * Compute the agenda window.
 *
 * Every window starts at the START OF A DAY, which is what a person means when they
 * ask for their agenda. A rolling `[now, now+7d]` window is NOT a week: it silently
 * excludes everything earlier today. Do not reintroduce one.
 */
function agendaWindow(params) {
    const startOfDay = (offsetDays) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        d.setHours(0, 0, 0, 0);
        return d;
    };
    if (params.tomorrow === true || params.tomorrow === 'true') {
        return { timeMin: startOfDay(1).toISOString(), timeMax: startOfDay(2).toISOString() };
    }
    const days = params.week === true || params.week === 'true'
        ? 7
        : Number(params.days ?? 1) || 1;
    return { timeMin: startOfDay(0).toISOString(), timeMax: startOfDay(days).toISOString() };
}
/** Render the merged agenda. Grouped by day, because that is how a day is read. */
function formatAgenda(events, window) {
    if (events.length === 0) {
        return {
            text: 'No events scheduled.',
            refs: { count: 0, timeMin: window.timeMin, timeMax: window.timeMax },
        };
    }
    const dayOf = (e) => e.start.slice(0, 10);
    const time = (e) => e.allDay
        ? 'all day'
        : new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const lines = [];
    let currentDay = '';
    for (const e of events) {
        const day = dayOf(e);
        if (day !== currentDay) {
            currentDay = day;
            const label = new Date(`${day}T12:00:00`).toLocaleDateString('en-US', {
                weekday: 'long', month: 'short', day: 'numeric',
            });
            lines.push(`${lines.length ? '\n' : ''}### ${label}`);
        }
        const where = e.location ? ` — ${e.location}` : '';
        const whose = e.calendarName ? ` _(${e.calendarName})_` : '';
        lines.push(`- **${time(e)}** ${e.summary}${where}${whose}`);
    }
    return {
        text: `## Agenda (${events.length} event${events.length === 1 ? '' : 's'})\n\n${lines.join('\n')}`,
        refs: {
            count: events.length,
            timeMin: window.timeMin,
            timeMax: window.timeMax,
            eventId: events[0]?.id,
            // calendarId per event: a follow-up `get` on a shared calendar needs it,
            // and it is the whole reason this operation exists rather than `list`.
            events: events.map((e) => ({ id: e.id, calendarId: e.calendarId, summary: e.summary })),
        },
    };
}
export const calendarPatch = {
    beforeExecute: {
        // Default the range to "from the start of today" when the caller gave none.
        //
        // This used to reach into an argv slot and re-serialise its JSON:
        //   const i = args.indexOf('--params'); JSON.parse(args[i + 1]) …
        // — surgery on a command line, only because the seam WAS a command line.
        // The hook now receives the params themselves (ADR-103).
        list: async (params) => {
            if (params.timeMin)
                return params;
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            return { ...params, timeMin: todayStart };
        },
    },
    formatList: (data, ctx) => {
        switch (ctx.operation) {
            case 'calendars':
                return formatCalendarList(data);
            default:
                return formatEventListWithCalendar(data, ctx);
        }
    },
    formatDetail: (data) => formatEventDetail(data),
    customHandlers: {
        /**
         * Agenda: every calendar the account can see, merged into one timeline.
         *
         * Built from raw Google, and reshaped here rather than anywhere below us.
         *
         * Two failure modes this deliberately avoids:
         *   - do NOT swallow per-calendar failures. A calendar you have lost access to
         *     must not contribute zero events in silence — surface it.
         *   - do NOT cap events per calendar without pagination. A busy calendar would
         *     silently lose the tail. Ask for the whole window we were asked for.
         */
        agenda: async (params, account) => {
            const window = agendaWindow(params);
            const calList = await call('calendar', 'calendarList.list', {}, { account });
            let calendars = (calList.items ?? [])
                .filter((c) => c.id);
            // Optional filter: match an id exactly, or a display name by substring.
            if (params.calendarId) {
                const needle = String(params.calendarId).toLowerCase();
                calendars = calendars.filter((c) => String(c.id).toLowerCase() === needle ||
                    String(c.summary ?? '').toLowerCase().includes(needle));
                if (calendars.length === 0) {
                    return {
                        text: `No calendar matches "${params.calendarId}". Use the \`calendars\` operation to list them.`,
                        refs: { count: 0 },
                    };
                }
            }
            const failures = [];
            const perCalendar = await Promise.all(calendars.map(async (cal) => {
                const calendarId = String(cal.id);
                const calendarName = String(cal.summary ?? calendarId);
                try {
                    const res = await call('calendar', 'events.list', {
                        calendarId,
                        timeMin: window.timeMin,
                        timeMax: window.timeMax,
                        singleEvents: true, // expand recurrences into instances
                        orderBy: 'startTime',
                    }, { account });
                    return (res.items ?? []).map((e) => {
                        const start = e.start;
                        const end = e.end;
                        const allDay = !start?.dateTime;
                        return {
                            id: String(e.id ?? ''),
                            calendarId,
                            calendarName,
                            summary: String(e.summary ?? '(no title)'),
                            location: String(e.location ?? ''),
                            start: String(start?.dateTime ?? start?.date ?? ''),
                            end: String(end?.dateTime ?? end?.date ?? ''),
                            allDay,
                        };
                    });
                }
                catch (err) {
                    // Do NOT swallow this. A calendar that cannot be read is information.
                    failures.push(`${calendarName}: ${err instanceof Error ? err.message : String(err)}`);
                    return [];
                }
            }));
            // Merge and sort. All-day events (a bare date) sort before timed events on
            // the same day, which is what a reader expects.
            const events = perCalendar.flat().sort((a, b) => a.start.localeCompare(b.start));
            const response = formatAgenda(events, window);
            if (failures.length > 0) {
                response.text += `\n\n> ⚠ ${failures.length} calendar(s) could not be read:\n` +
                    failures.map((f) => `> - ${f}`).join('\n');
                response.refs = { ...response.refs, unreadableCalendars: failures };
            }
            return response;
        },
        freebusy: async (params, account) => {
            const timeMin = requireString(params, 'timeMin');
            const timeMax = requireString(params, 'timeMax');
            // Build calendar items list from attendees + own calendar (deduplicated)
            const seen = new Set([account]);
            const items = [{ id: account }];
            const addItem = (id) => { if (!seen.has(id)) {
                seen.add(id);
                items.push({ id });
            } };
            if (params.attendees) {
                for (const email of String(params.attendees).split(',').map(e => e.trim()).filter(Boolean)) {
                    addItem(email);
                }
            }
            if (params.calendarId) {
                for (const id of String(params.calendarId).split(',').map(e => e.trim()).filter(Boolean)) {
                    addItem(id);
                }
            }
            const data = await call('calendar', 'freebusy.query', { timeMin, timeMax, items }, { account });
            return formatFreeBusy(data, { operation: 'freebusy', params, account });
        },
        create: async (params, account) => {
            const summary = requireString(params, 'summary');
            const start = requireString(params, 'start');
            const end = requireString(params, 'end');
            const calendarId = params.calendarId || 'primary';
            // Attendees are an ARRAY OF OBJECTS in the event body, not a repeated scalar.
            const body = {
                calendarId,
                summary,
                start: { dateTime: start },
                end: { dateTime: end },
            };
            if (params.description)
                body.description = String(params.description);
            if (params.location)
                body.location = String(params.location);
            if (params.attendees) {
                body.attendees = String(params.attendees)
                    .split(',').map((e) => e.trim()).filter(Boolean)
                    .map((email) => ({ email }));
            }
            if (params.meet) {
                // Ask Google to mint a Meet link. `requestId` is an IDEMPOTENCY KEY: reuse
                // it and Google reuses the conference instead of creating a second one.
                // Derive it deterministically from the event fields so a retried create
                // cannot double-book.
                const fingerprint = createHash('sha256')
                    .update(JSON.stringify({ calendarId, summary, start, end, location: params.location ?? '' }))
                    .digest('hex').slice(0, 32);
                body.conferenceData = {
                    createRequest: {
                        requestId: fingerprint,
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                };
                body.conferenceDataVersion = 1; // required, or Google ignores conferenceData entirely
            }
            const data = await call('calendar', 'events.insert', body, { account });
            const meetLink = params.meet ? ' (with Google Meet)' : '';
            return {
                text: `Event created: **${summary}**${meetLink}\n\n` +
                    `**When:** ${start} – ${end}\n` +
                    (params.location ? `**Where:** ${params.location}\n` : '') +
                    `**Calendar:** ${calendarId}\n` +
                    `**Event ID:** ${data.id ?? 'unknown'}`,
                refs: { id: data.id, eventId: data.id, calendarId, summary, start, end },
            };
        },
        delete: async (params, account) => {
            const eventId = requireString(params, 'eventId');
            const calendarId = params.calendarId || 'primary';
            await call('calendar', 'events.delete', { calendarId, eventId }, { account });
            return {
                text: `Event deleted: ${eventId}`,
                refs: { eventId, status: 'deleted' },
            };
        },
        update: async (params, account) => {
            // events.patch takes `calendarId` + `eventId` via --params (path/query)
            // and the changed fields as a JSON body via --json. The manifest-driven
            // generator only emits --params, so without this handler the body is
            // empty and Google returns 200 without applying anything — silently.
            const eventId = requireString(params, 'eventId');
            const calendarId = params.calendarId || 'primary';
            const body = {};
            if (params.summary !== undefined)
                body.summary = String(params.summary);
            if (params.description !== undefined)
                body.description = String(params.description);
            if (params.location !== undefined)
                body.location = String(params.location);
            if (params.start !== undefined)
                body.start = { dateTime: String(params.start) };
            if (params.end !== undefined)
                body.end = { dateTime: String(params.end) };
            // attendees: comma-separated string → array of {email} objects.
            // Google events.patch replaces the attendees array wholesale (no diff semantics),
            // so the caller must re-supply every guest they want kept.
            if (params.attendees !== undefined) {
                const attendeeList = String(params.attendees)
                    .split(',')
                    .map(e => e.trim())
                    .filter(Boolean);
                body.attendees = attendeeList.map(email => ({ email }));
            }
            // Build --params: note the conferenceDataVersion=1 requirement when creating a Meet link.
            const queryParams = { calendarId, eventId };
            // Optional Meet link attach. Google Calendar does not allow removing a Meet link
            // via events.patch, so we only handle the "add" case.
            if (params.meet) {
                const requestId = `meet-${eventId}-${Date.now()}`;
                body.conferenceData = {
                    createRequest: {
                        requestId,
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                };
                queryParams.conferenceDataVersion = 1;
            }
            if (Object.keys(body).length === 0) {
                throw new Error('update requires at least one field to change: summary, start, end, description, location, attendees, or meet');
            }
            const data = await call('calendar', 'events.patch', {
                ...queryParams,
                ...body,
            }, { account });
            const changed = Object.keys(body);
            const meetLink = data.hangoutLink ? `\n**Meet:** ${data.hangoutLink}` : '';
            return {
                text: `Event updated: **${data.summary ?? eventId}**\n\n` +
                    `**Event ID:** ${data.id ?? eventId}\n` +
                    `**Calendar:** ${calendarId}\n` +
                    `**Fields changed:** ${changed.join(', ')}` +
                    meetLink,
                refs: {
                    id: data.id,
                    eventId: data.id ?? eventId,
                    calendarId,
                    changed,
                    ...(data.hangoutLink ? { meetLink: data.hangoutLink } : {}),
                },
            };
        },
    },
};
//# sourceMappingURL=patch.js.map