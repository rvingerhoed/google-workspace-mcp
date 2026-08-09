/**
 * Session tracker — per-account in-memory state for ambient context.
 *
 * Captures baseline workspace counters on first use per account,
 * refreshes periodically via fire-and-forget, and exposes current
 * deltas for context injection.
 *
 * Refresh is gated by epoch distance — only polls Google APIs when
 * at least REFRESH_EPOCH_INTERVAL tool calls have elapsed since the
 * last refresh, keeping API usage bounded.
 */
export interface NextEvent {
    summary: string;
    startTime: string;
}
export interface AccountSession {
    baselineUnreadCount: number;
    currentUnreadCount: number;
    baselineTodayEmailCount: number;
    currentTodayEmailCount: number;
    nextEvent: NextEvent | null;
    lastRefreshedEpoch: number;
    initialized: boolean;
}
export declare class SessionTracker {
    private sessions;
    /** Capture baseline on first call per account. Blocks until complete. */
    ensureBaseline(email: string, epoch: number): Promise<void>;
    /** Fire-and-forget async refresh, gated by epoch staleness. Never throws. */
    refresh(email: string, epoch: number): void;
    /** Return current session data, or undefined if not tracked. */
    getContext(email: string): AccountSession | undefined;
    /** Clear all state (for testing). */
    reset(): void;
    private _doRefresh;
}
