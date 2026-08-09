/**
 * Workspace directory — safe sandbox for file I/O operations.
 *
 * All file operations (Drive upload/download, Docs export, Sheets CSV export)
 * are jailed to this directory. Prevents agents from accidentally operating on
 * home directories, document folders, or Google Drive mount points.
 */
/** Validate and return the workspace directory path. */
export declare function getWorkspaceDir(): string;
/**
 * Validate workspace dir is safe. Throws if it IS a protected directory.
 * Being a subdirectory OF a protected directory is fine (e.g. ~/Documents/mcp-workspace/).
 */
export declare function validateWorkspaceDir(dir: string): void;
export interface WorkspaceStatus {
    path: string;
    valid: boolean;
    warning?: string;
}
/** Check workspace directory status without crashing. */
export declare function checkWorkspaceStatus(): WorkspaceStatus;
/** Ensure the workspace directory exists and is validated. Returns status instead of throwing. */
export declare function ensureWorkspaceDir(): Promise<WorkspaceStatus>;
/**
 * Sanitize a single filename segment (no path separators).
 * Strips null bytes, control characters, path separators, and other dangerous chars.
 */
export declare function sanitizeFilename(filename: string): string;
/**
 * Sanitize a path that may contain directory separators.
 * Each segment is sanitized individually; empty and traversal segments are rejected.
 */
export declare function sanitizePath(inputPath: string): string;
/**
 * Resolve a file path within the workspace directory.
 * Supports nested paths (e.g. "reports/q1/summary.csv").
 * Prevents path traversal and sanitizes each path segment.
 */
export declare function resolveWorkspacePath(filename: string): string;
/**
 * Verify a file path is safe to read/write after symlink resolution.
 * Must be called before any fs operation on a workspace path.
 */
export declare function verifyPathSafety(filePath: string): Promise<void>;
