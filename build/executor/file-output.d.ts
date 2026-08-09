/**
 * File output utility — saves files to workspace and returns content inline
 * when possible. Solves the containerization problem: agents running in
 * sandboxed environments (Claude Desktop) can't read the MCP server's
 * local filesystem, so text content must be included in the response.
 *
 * Used by: getAttachment (gmail), download (drive), export (drive), workspace read
 */
import type { ContentBlock } from '../server/formatting/markdown.js';
/** Check if a file should have its content returned inline. */
export declare function isTextFile(filename: string, mimeType?: string): boolean;
/** Check if a file is an image that can be returned as an MCP image block. */
export declare function isImageFile(filename: string, mimeType?: string): boolean;
/** Get the image MIME type for a filename or explicit MIME. */
export declare function getImageMimeType(filename: string, mimeType?: string): string;
/** Build an MCP image content block from a buffer. Returns undefined if too large. */
export declare function buildImageBlock(buffer: Buffer, filename: string, mimeType?: string): ContentBlock | undefined;
/** Build an MCP image content block from a file on disk. Returns undefined if not an image or too large. */
export declare function buildImageBlockFromFile(filePath: string, filename: string, mimeType?: string): Promise<ContentBlock | undefined>;
export interface FileOutputResult {
    filename: string;
    path: string;
    size: number;
    /** Text content included inline for containerized agents. Undefined for binary files. */
    content?: string;
    /** Image content block for visual files. */
    imageBlock?: ContentBlock;
}
/**
 * Save a buffer to the workspace directory and optionally return text content inline.
 */
export declare function saveToWorkspace(filename: string, buffer: Buffer, mimeType?: string): Promise<FileOutputResult>;
/** Format a file output result as markdown for the MCP response. */
export declare function formatFileOutput(result: FileOutputResult): string;
