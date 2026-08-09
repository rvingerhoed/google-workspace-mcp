import type { DiscoveredSurface } from './types.js';
/**
 * Read Google's real surface for every service the descriptor knows about.
 *
 * An operation is a Google method or it does not exist.
 */
export declare function discoverSurface(): Promise<DiscoveredSurface>;
