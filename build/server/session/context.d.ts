/**
 * Session context formatter — builds a markdown footer with ambient
 * workspace awareness (email deltas, next calendar event, available accounts).
 */
import type { SessionTracker } from './tracker.js';
/** Format the session context footer for a tool response. */
export declare function sessionContext(_toolName: string, email: string | undefined, tracker: SessionTracker): Promise<string>;
