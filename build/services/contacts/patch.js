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
/** First string value of `field` on the first entry of a People API array field. */
function firstOf(person, field, key) {
    const arr = person[field];
    if (!Array.isArray(arr) || arr.length === 0)
        return undefined;
    const value = arr[0]?.[key];
    return typeof value === 'string' ? value : undefined;
}
/** Every string value of `field` across all entries of a People API array field. */
function allOf(person, field, key) {
    const arr = person[field];
    if (!Array.isArray(arr))
        return [];
    return arr
        .map((entry) => entry?.[key])
        .filter((v) => typeof v === 'string');
}
function formatBirthday(person) {
    const arr = person.birthdays;
    if (!Array.isArray(arr) || arr.length === 0)
        return undefined;
    const date = arr[0]?.date;
    if (!date)
        return undefined;
    const parts = [date.day, date.month, date.year].filter((v) => v !== undefined);
    return parts.length ? parts.join('-') : undefined;
}
function personSummaryLine(person) {
    const name = firstOf(person, 'names', 'displayName') ?? '(geen naam)';
    const email = firstOf(person, 'emailAddresses', 'value');
    const phone = firstOf(person, 'phoneNumbers', 'value');
    const org = firstOf(person, 'organizations', 'name');
    const parts = [name, email, phone, org].filter(Boolean);
    parts.push(String(person.resourceName ?? ''));
    return parts.join(' | ');
}
function formatPersonList(people) {
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
function formatPersonDetail(data) {
    const person = data;
    const name = firstOf(person, 'names', 'displayName') ?? '(geen naam)';
    const emails = allOf(person, 'emailAddresses', 'value');
    const phones = allOf(person, 'phoneNumbers', 'value');
    const orgs = allOf(person, 'organizations', 'name');
    const addresses = allOf(person, 'addresses', 'formattedValue');
    const birthday = formatBirthday(person);
    const lines = [`## ${name}`, ''];
    if (emails.length)
        lines.push(`**E-mail:** ${emails.join(', ')}`);
    if (phones.length)
        lines.push(`**Telefoon:** ${phones.join(', ')}`);
    if (orgs.length)
        lines.push(`**Organisatie:** ${orgs.join(', ')}`);
    if (addresses.length)
        lines.push(`**Adres:** ${addresses.join(' | ')}`);
    if (birthday)
        lines.push(`**Verjaardag:** ${birthday}`);
    lines.push(`**Resource:** ${String(person.resourceName ?? '')}`);
    return {
        text: lines.join('\n'),
        refs: { resourceName: person.resourceName, name, emails, phones },
    };
}
function formatGroupList(data) {
    const raw = data;
    const groups = (raw?.contactGroups ?? []);
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
export const contactsPatch = {
    formatList: (data, ctx) => {
        if (ctx.operation === 'listGroups')
            return formatGroupList(data);
        const raw = data;
        const people = ctx.operation === 'search'
            ? ((raw.results ?? [])
                .map((r) => r.person)
                .filter((p) => Boolean(p)))
            : (raw.connections ?? []);
        return formatPersonList(people);
    },
    formatDetail: (data) => formatPersonDetail(data),
};
//# sourceMappingURL=patch.js.map