/**
 * Tasks patch.
 *
 * Google Tasks answers a PATCH carrying an empty body with
 *
 *     500  "Internal error encountered."  (reason: backendError)
 *
 * which reads like a Google outage and is nothing of the sort — it is us sending a
 * request with nothing in it. `update` used to declare no updatable fields at all, so
 * an empty body was the ONLY request it could construct, and every single call to it
 * failed this way, blaming Google.
 *
 * The manifest now carries title / notes / due / status. But a caller who passes only
 * the two ids still builds an empty patch, so refuse it here — with a message that says
 * what to do — rather than hand back a 500 that points at the wrong culprit.
 */
import type { ServicePatch } from '../../factory/types.js';
export declare const tasksPatch: ServicePatch;
