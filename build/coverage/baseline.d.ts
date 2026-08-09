/**
 * Baseline file management for coverage tracking.
 */
import type { CoverageBaseline, CoverageReport, DiscoveredSurface } from './types.js';
export declare function loadBaseline(filePath?: string): CoverageBaseline | null;
/** Generate a new baseline from a coverage report + discovered surface. */
export declare function generateBaseline(report: CoverageReport, discovered: DiscoveredSurface, existing?: CoverageBaseline | null): CoverageBaseline;
export declare function writeBaseline(baseline: CoverageBaseline, filePath?: string): string;
