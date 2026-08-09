/**
 * Session module — lazy singleton for the session tracker.
 */
import { SessionTracker } from './tracker.js';
let _tracker;
/** Get (or create) the singleton session tracker. */
export function getSessionTracker() {
    if (!_tracker)
        _tracker = new SessionTracker();
    return _tracker;
}
export { SessionTracker } from './tracker.js';
export { sessionContext } from './context.js';
//# sourceMappingURL=index.js.map