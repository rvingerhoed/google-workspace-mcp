/**
 * Docs patch — custom handlers for operations Google's raw response does not serve.
 *
 * write / insertText / replaceText go through documents.batchUpdate, which needs a
 * request body rather than query parameters.
 *
 * `get` is here for a different reason: see extractText below.
 */
import type { ServicePatch } from '../../factory/types.js';
export declare const docsPatch: ServicePatch;
