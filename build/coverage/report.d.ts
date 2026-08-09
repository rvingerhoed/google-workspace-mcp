/**
 * Format coverage reports for terminal and JSON output.
 */
import type { CoverageReport } from './types.js';
export declare function formatTerminalReport(report: CoverageReport): string;
export declare function formatJsonReport(report: CoverageReport): string;
