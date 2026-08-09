/**
 * Shared factory registry — single instance of manifest + generated tools.
 * Both handler.ts and tools.ts import from here instead of loading independently.
 *
 * generator.ts resolves the manifest relative to its own module directory, so
 * this works under npx and .mcpb where cwd is NOT the project root.
 */
import type { GeneratedTool } from './types.js';
import type { Manifest } from './types.js';
export declare const manifest: Manifest;
export declare const generatedTools: GeneratedTool[];
