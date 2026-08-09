/** Keep in sync with `engines.node`, the engines-floor CI job, and mcpb/manifest.json. */
export declare const MIN_NODE = "22.12.0";
/** True if `actual` is at least `min`. Plain compare, no dependency — by design. */
export declare function meets(actual: string, min: string): boolean;
export declare function floorMessage(actual: string, min?: string): string;
/**
 * Exits the process if the running Node is below the floor.
 *
 * `writeSync`, NOT `process.stderr.write`: Node's writes to a PIPE are asynchronous on
 * macOS (synchronous only on Linux/Windows), and Claude Desktop spawns the .mcpb server
 * with piped stdio — on the platform where .mcpb matters most. `process.stderr.write(...)`
 * followed immediately by `process.exit(1)` can tear the process down before the buffer
 * drains, leaving a bare exit code and NO message: strictly worse than the stack trace
 * this replaces. This is the one code path whose entire value is its output.
 */
export declare function enforceNodeFloor(actual?: string): void;
