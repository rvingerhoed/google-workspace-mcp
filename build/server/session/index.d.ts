/**
 * Session module — lazy singleton for the session tracker.
 */
import { SessionTracker } from './tracker.js';
/** Get (or create) the singleton session tracker. */
export declare function getSessionTracker(): SessionTracker;
export { SessionTracker } from './tracker.js';
export type { AccountSession, NextEvent } from './tracker.js';
export { sessionContext } from './context.js';
