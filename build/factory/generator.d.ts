/**
 * Factory generator — reads the manifest and produces MCP tools.
 *
 * For each service in the manifest, generates:
 * 1. A JSON Schema tool definition (operation enum, typed params)
 * 2. A handler function (maps operations to Google API calls, applies formatting)
 *
 * Patches are optional per-service hooks that override default behavior.
 */
import type { Manifest, ServiceDef, OperationDef, ServicePatch, GeneratedTool, GeneratedToolSchema, GeneratedHandler } from './types.js';
/**
 * Load the manifest from `src/factory/manifest/` — one YAML file per service,
 * each file's root being that service's definition; the filename (minus
 * `.yaml`) is the service key (ADR-304). Assembles a `Manifest` with the same
 * shape the old single-file `manifest.yaml` produced.
 *
 * A malformed file fails the whole load (parseYaml throws) — same whole-or-
 * nothing behavior as before the split.
 *
 * @param dir Optional explicit manifest directory (used by tests/tools);
 *   otherwise resolved relative to the built output, then cwd.
 */
export declare function loadManifest(dir?: string): Manifest;
/** Generate all tools from the manifest with optional patches. */
export declare function generateTools(manifest: Manifest, patches?: Record<string, ServicePatch>): GeneratedTool[];
/** Generate the JSON Schema tool definition from a service declaration. */
export declare function generateSchema(service: ServiceDef): GeneratedToolSchema;
/** Generate a handler function for a service. */
export declare function generateHandler(service: ServiceDef, patch?: ServicePatch): GeneratedHandler;
/**
 * Build the params a resource operation sends to Google.
 *
 * This is the manifest's mapping — declared params, `maps_to` renames, defaults,
 * clamps. A resource operation never becomes a command line: the output here is
 * the request params, handed straight to the client. See ADR-103.
 */
export declare function buildResourceParams(opDef: OperationDef, params: Record<string, unknown>): Record<string, unknown>;
