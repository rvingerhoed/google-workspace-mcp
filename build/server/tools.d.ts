/**
 * Tool registry — combines factory-generated schemas with hand-coded tools.
 *
 * Factory tools come from the manifest (ADR-300). Hand-coded tools are
 * manage_accounts (account lifecycle) and queue_operations (meta-tool).
 */
export interface ToolSchema {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}
export declare const toolSchemas: ToolSchema[];
export declare function getToolSchema(name: string): ToolSchema | undefined;
