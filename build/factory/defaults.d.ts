/**
 * Default formatters — generic markdown renderers for list/detail/action
 * responses. Used when a service has no patch formatter override.
 */
import type { HandlerResponse } from '../server/formatting/markdown.js';
import type { OperationDef } from './types.js';
/** Route to the appropriate default formatter based on operation type. */
export declare function formatDefault(data: unknown, opDef: OperationDef): HandlerResponse;
