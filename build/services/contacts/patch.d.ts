/**
 * Contacts (People API) patch — custom formatters only.
 *
 * The People API nests every useful field (names, emailAddresses,
 * phoneNumbers, organizations, addresses, birthdays) as an ARRAY OF OBJECTS
 * on the Person resource. The factory's default list/detail formatters skip
 * any field whose value is an object (see factory/defaults.ts), so without
 * this patch `manage_contacts` would technically work but return responses
 * with nothing but `resourceName`/`etag` — the same "silently useless"
 * failure class ADR-103 warns about elsewhere in this codebase.
 *
 * Response shapes differ per operation and are NOT interchangeable:
 *   - people.connections.list -> { connections: Person[] }
 *   - people.searchContacts   -> { results: { person: Person }[] }  (wrapped!)
 *   - people.get              -> Person directly
 *   - contactGroups.list      -> { contactGroups: ContactGroup[] }
 */
import type { ServicePatch } from '../../factory/types.js';
export declare const contactsPatch: ServicePatch;
