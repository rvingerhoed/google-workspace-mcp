/**
 * Workspace handler — file CRUD within the sandboxed workspace directory.
 *
 * The workspace is the exchange point between the MCP server and the agent.
 * Files saved by getAttachment, download, and export land here. The agent
 * can also read, write, and manage files directly — including nested directories.
 */
import type { HandlerResponse } from '../formatting/markdown.js';
export declare function handleWorkspace(params: Record<string, unknown>): Promise<HandlerResponse>;
