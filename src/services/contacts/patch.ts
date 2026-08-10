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

import type { ServicePatch, PatchContext } from '../../factory/types.js';
import type { HandlerResponse } from '../../server/formatting/markdown.js';

type Person = Record<string, unknown>;

/** First string value of `field` on the first entry of a People API array field. */
function firstOf(person: Person, field: string, key: string): string | undefined {
  const arr = person[field];
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const value = (arr[0] as Record<string, unknown>)?.[key];
  return typeof value === 'string' ? value : undefined;
}

/** Every string value of `field` across all entries of a People API array field. */
function allOf(person: Person, field: string, key: string): string[] {
  const arr = person[field];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((entry) => (entry as Record<string, unknown>)?.[key])
    .filter((v): v is string => typeof v === 'string');
}

function formatBirthday(person: Person): string | undefined {
  const arr = person.birthdays;
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const date = (arr[0] as Record<string, unknown>)?.date as
    | { year?: number; month?: number; day?: number }
    | undefined;
  if (!date) return undefined;
  const parts = [date.day, date.month, date.year].filter((v) => v !== undefined);
  return parts.length ? parts.join('-') : undefined;
}

function personSummaryLine(person: Person): string {
  const name = firstOf(person, 'names', 'displayName') ?? '(geen naam)';
  const email = firstOf(person, 'emailAddresses', 'value');
  const phone = firstOf(person, 'phoneNumbers', 'value');
  const org = firstOf(person, 'organizations', 'name');
  const parts = [name, email, phone, org].filter(Boolean) as string[];
  parts.push(String(person.resourceName ?? ''));
  return parts.join(' | ');
}

function formatPersonList(people: Person[]): HandlerResponse {
  if (people.length === 0) {
    return { text: 'Geen contacten gevonden.', refs: { count: 0 } };
  }
  const lines = people.map(personSummaryLine);
  return {
    text: `## Contacten (${people.length})\n\n${lines.join('\n')}`,
    refs: {
      count: people.length,
      resourceName: String(people[0]?.resourceName ?? ''),
      results: people.map((p) => ({
        resourceName: p.resourceName,
        name: firstOf(p, 'names', 'displayName'),
        email: firstOf(p, 'emailAddresses', 'value'),
      })),
    },
  };
}

function formatPersonDetail(data: unknown): HandlerResponse {
  const person = data as Person;
  const name = firstOf(person, 'names', 'displayName') ?? '(geen naam)';
  const emails = allOf(person, 'emailAddresses', 'value');
  const phones = allOf(person, 'phoneNumbers', 'value');
  const orgs = allOf(person, 'organizations', 'name');
  const addresses = allOf(person, 'addresses', 'formattedValue');
  const birthday = formatBirthday(person);

  const lines = [`## ${name}`, ''];
  if (emails.length) lines.push(`**E-mail:** ${emails.join(', ')}`);
  if (phones.length) lines.push(`**Telefoon:** ${phones.join(', ')}`);
  if (orgs.length) lines.push(`**Organisatie:** ${orgs.join(', ')}`);
  if (addresses.length) lines.push(`**Adres:** ${addresses.join(' | ')}`);
  if (birthday) lines.push(`**Verjaardag:** ${birthday}`);
  lines.push(`**Resource:** ${String(person.resourceName ?? '')}`);

  return {
    text: lines.join('\n'),
    refs: { resourceName: person.resourceName, name, emails, phones },
  };
}

function formatGroupList(data: unknown): HandlerResponse {
  const raw = data as Record<string, unknown>;
  const groups = (raw?.contactGroups ?? []) as Array<Record<string, unknown>>;
  if (groups.length === 0) {
    return { text: 'Geen contactgroepen gevonden.', refs: { count: 0 } };
  }
  const lines = groups.map((g) => {
    const name = String(g.formattedName ?? g.name ?? '(onbenoemd)');
    const count = g.memberCount !== undefined ? `${g.memberCount} leden` : '';
    const resourceName = String(g.resourceName ?? '');
    return [name, count, resourceName].filter(Boolean).join(' | ');
  });
  return {
    text: `## Contactgroepen (${groups.length})\n\n${lines.join('\n')}`,
    refs: { count: groups.length },
  };
}

export const contactsPatch: ServicePatch = {
  beforeExecute: {
    // contactGroups.members.modify needs resourceNamesToAdd as an ARRAY in the
    // body; the manifest param is a comma-separated string (the factory's
    // param type system has no 'array' — see ParamDef in factory/types.ts),
    // so split it here, the one place hooks are allowed to mutate params
    // (ADR-103).
    addToGroup: (params) => {
      const raw = params.resourceNamesToAdd;
      if (typeof raw !== 'string') return params;
      return {
        ...params,
        resourceNamesToAdd: raw.split(',').map((s) => s.trim()).filter(Boolean),
      };
    },
  },
  formatList: (data: unknown, ctx: PatchContext) => {
    if (ctx.operation === 'listGroups') return formatGroupList(data);

    const raw = data as Record<string, unknown>;
    const people =
      ctx.operation === 'search'
        ? (((raw.results ?? []) as Array<{ person?: Person }>)
            .map((r) => r.person)
            .filter((p): p is Person => Boolean(p)))
        : ((raw.connections ?? []) as Person[]);

    return formatPersonList(people);
  },
  formatDetail: (data: unknown) => formatPersonDetail(data),
};
