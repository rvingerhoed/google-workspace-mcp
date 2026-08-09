/**
 * Calendar patch — domain-specific hooks for the calendar service.
 *
 * Key customizations:
 * - List: default timeMin to today start, include calendarId in output
 * - Agenda: rich helper with day-range params, calendarId per event
 * - Freebusy: custom handler (POST body via --json, not --params)
 * - Create: custom response formatting with event details + --meet flag
 * - Delete: custom confirmation message
 */
import type { ServicePatch } from '../../factory/types.js';
export declare const calendarPatch: ServicePatch;
