/**
 * Meet patch — domain-specific hooks for the Meet service.
 *
 * Key customizations:
 * - Conference list: show meeting codes, start/end times, space names
 * - Participant list: display names with join/leave times
 * - Transcript entries: inline text with participant display names
 * - Custom handler: getFullTranscript chains transcripts.list → entries.list
 *   → participant resolution into a single agent-friendly response
 */
import type { ServicePatch } from '../../factory/types.js';
export declare const meetPatch: ServicePatch;
