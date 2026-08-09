/** How often to check whether our parent is still alive. */
export declare const WATCHDOG_INTERVAL_MS = 5000;
/**
 * Whether the process has been orphaned, given a startup ppid and what we see now.
 *
 * Pure so it can be tested without spawning process trees. Two signals, because neither
 * covers every platform:
 *
 * `currentPpid !== originalPpid` — on Unix a dead parent means immediate reparenting to
 * init/systemd, so a *changed* ppid is definitive. This is the reliable one, and it is
 * immune to PID reuse.
 *
 * `!parentAlive` — a `kill(pid, 0)` probe, for platforms that don't reparent (Windows).
 * Note this is checked against the ORIGINAL ppid, captured at startup.
 *
 * Why the original ppid matters: `process.ppid` is a LIVE GETTER, not a value fixed at
 * startup. The fix suggested in #149 polls `process.kill(process.ppid, 0)`, which re-reads
 * ppid every tick — after reparenting that reads as init/systemd, which is always alive,
 * so the check never fires and the server spins on. Measured: after the parent died, ppid
 * moved 2884591 -> 2951 (systemd), and kill(2951, 0) reports alive. Reading ppid once, at
 * startup, is the whole trick.
 */
export declare function isOrphaned(originalPpid: number, currentPpid: number, parentAlive: boolean): boolean;
export interface LifecycleHooks {
    /** Seam for tests. Defaults to process.exit. */
    exit?: (code: number) => void;
    /** Seam for tests. Defaults to a real pid probe. */
    parentAlive?: (pid: number) => boolean;
}
/**
 * Installs all three layers. Call once, from the entrypoint, before starting the server.
 *
 * Returns a `stop()` for tests; the real process never needs it.
 */
export declare function installLifecycle(hooks?: LifecycleHooks): () => void;
