/**
 * Compare the curated manifest against the API surface Google publishes.
 */
import type { Manifest } from '../factory/types.js';
import type { DiscoveredSurface, CoverageBaseline, CoverageReport } from './types.js';
export declare function compareSurfaces(manifest: Manifest, discovered: DiscoveredSurface, baseline?: CoverageBaseline | null): CoverageReport;
