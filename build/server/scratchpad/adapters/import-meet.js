/**
 * Import adapter: meet — loads a Meet conference transcript into a scratchpad.
 * Imports as markdown with speaker attribution. No live binding (transcripts are read-only).
 */
import { call } from '../../../google/client.js';
export async function importMeet(scratchpads, scratchpadId, sourceParams) {
    const { email, conferenceId } = sourceParams;
    if (!email || !conferenceId) {
        return { text: 'email and conferenceId are required for meet import.', refs: { error: true } };
    }
    try {
        const parent = conferenceId.startsWith('conferenceRecords/')
            ? conferenceId
            : `conferenceRecords/${conferenceId}`;
        // Step 1: List transcripts
        const transcriptsData = await call('meet', 'conferenceRecords.transcripts.list', { parent }, { account: email });
        const transcripts = (transcriptsData?.transcripts ?? []);
        if (transcripts.length === 0) {
            return {
                text: `No transcripts found for conference ${conferenceId}.\nScratchpad ${scratchpadId} unchanged.`,
                refs: { scratchpadId, conferenceId },
            };
        }
        // Step 2: Fetch entries and participants in parallel
        const transcriptName = String(transcripts[0].name ?? '');
        const [entriesData, participantsData] = await Promise.all([
            call('meet', 'conferenceRecords.transcripts.entries.list', { parent: transcriptName, pageSize: 100 }, { account: email }),
            call('meet', 'conferenceRecords.participants.list', { parent, pageSize: 100 }, { account: email }),
        ]);
        const entries = (entriesData?.transcriptEntries ?? []);
        if (entries.length === 0) {
            return {
                text: `Transcript found but no entries available yet (may still be processing).\nScratchpad ${scratchpadId} unchanged.`,
                refs: { scratchpadId, conferenceId, transcriptName },
            };
        }
        // Step 3: Build participant lookup
        const participants = (participantsData?.participants ?? []);
        const nameMap = new Map();
        for (const p of participants) {
            const name = String(p.name ?? '');
            const signedinUser = p.signedinUser;
            const displayName = String(signedinUser?.displayName ?? p.name ?? 'Unknown');
            if (name)
                nameMap.set(name, displayName);
        }
        // Step 4: Format as markdown transcript
        const lines = [
            `# Meeting Transcript`,
            ``,
            `**Conference:** ${conferenceId}`,
            `**Entries:** ${entries.length}`,
            ``,
        ];
        let currentSpeaker = '';
        for (const entry of entries) {
            const participantName = String(entry.participant ?? '');
            const speaker = nameMap.get(participantName) ?? String(entry.participantDisplayName ?? participantName);
            const text = String(entry.text ?? '');
            const time = formatTime(entry.startTime);
            if (speaker !== currentSpeaker) {
                if (currentSpeaker)
                    lines.push('');
                lines.push(`**${speaker}** (${time}):`);
                currentSpeaker = speaker;
            }
            lines.push(text);
        }
        scratchpads.appendRawLines(scratchpadId, lines);
        scratchpads.setFormat(scratchpadId, 'markdown');
        // No live binding — transcripts are read-only
        return {
            text: `Imported transcript (${entries.length} entries, ${lines.length} lines) into scratchpad ${scratchpadId}.`,
            refs: { scratchpadId, conferenceId, entries: entries.length, linesImported: lines.length },
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            text: `Import failed: ${message}`,
            refs: { error: true, scratchpadId },
        };
    }
}
function formatTime(time) {
    if (!time)
        return '';
    const s = String(time);
    try {
        const d = new Date(s);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    catch {
        return s;
    }
}
//# sourceMappingURL=import-meet.js.map