/**
 * Drive patch — domain-specific hooks for the drive service.
 *
 * Key customizations:
 * - Custom formatters for file lists and details
 * - Upload: custom handler with positional file path arg
 * - Download/Export: stream to the workspace, return inline for text
 */
import type { ServicePatch } from '../../factory/types.js';
export declare const drivePatch: ServicePatch;
