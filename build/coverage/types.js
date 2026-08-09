/**
 * Types for the build-time coverage analysis tool (ADR-100).
 */
/** Services eligible for the factory model. */
export const ELIGIBLE_SERVICES = [
    'drive', 'sheets', 'gmail', 'calendar', 'docs',
    'slides', 'tasks', 'people', 'chat', 'keep', 'meet', 'events',
];
/** Internal/path params to skip when comparing parameters. */
export const SKIP_PARAMS = new Set([
    'userId', 'key', 'oauth_token', 'prettyPrint', 'quotaUser', 'alt',
    'uploadType', 'upload_protocol', 'fields', 'callback', 'access_token',
]);
//# sourceMappingURL=types.js.map