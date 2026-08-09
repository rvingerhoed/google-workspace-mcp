/**
 * Patch registry — collects all per-service patches.
 * Import this to get the complete patch map for the generator.
 */
import { gmailPatch } from '../services/gmail/patch.js';
import { calendarPatch } from '../services/calendar/patch.js';
import { drivePatch } from '../services/drive/patch.js';
import { docsPatch } from '../services/docs/patch.js';
import { meetPatch } from '../services/meet/patch.js';
import { sheetsPatch } from '../services/sheets/patch.js';
import { tasksPatch } from '../services/tasks/patch.js';
import { contactsPatch } from '../services/contacts/patch.js';
export const patches = {
    gmail: gmailPatch,
    calendar: calendarPatch,
    drive: drivePatch,
    docs: docsPatch,
    meet: meetPatch,
    sheets: sheetsPatch,
    tasks: tasksPatch,
    // Key MUST match the manifest filename (contacts.yaml -> "contacts"), not
    // the `google_service` field inside it ("people") — generator.ts looks
    // patches up by the manifest's own map key, which loadManifest() derives
    // from the filename, not from any field in the YAML.
    contacts: contactsPatch,
};
//# sourceMappingURL=patches.js.map