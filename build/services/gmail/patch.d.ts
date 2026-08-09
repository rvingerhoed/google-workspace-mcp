/**
 * Gmail patch — domain-specific hooks for the email service.
 *
 * Key customizations:
 * - Search hydration: messages.list only returns IDs, so we fetch metadata
 * - Custom formatters: pipe-delimited list, header-extracted detail
 * - Custom handlers: send/reply use specific response formatting
 */
import type { ServicePatch } from '../../factory/types.js';
export declare const gmailPatch: ServicePatch;
