/**
 * JSON path helpers for path-addressed editing.
 * Supports dot/bracket notation: $.foo.bar[0].baz
 */
/** Parse a JSON path into segments. */
export declare function parsePath(path: string): (string | number)[];
/** Get a value at a JSON path. */
export declare function getByPath(obj: unknown, path: string): unknown;
/** Set a value at a JSON path. */
export declare function setByPath(obj: unknown, path: string, value: unknown): void;
/** Delete a key or array element at a JSON path. */
export declare function deleteByPath(obj: unknown, path: string): void;
