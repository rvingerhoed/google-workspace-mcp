import { type ApiDescriptor } from './descriptor.js';
import type { GoogleService, ServiceMethods } from './methods.js';
export interface CallOptions {
    /** Account email — the token is minted for this identity. */
    account: string;
    descriptor?: ApiDescriptor;
    fetchImpl?: typeof fetch;
}
export interface BuiltRequest {
    url: string;
    method: string;
    body?: Record<string, unknown>;
}
/** Pure: descriptor + params -> the request. No I/O, so it is testable offline. */
export declare function buildRequest(descriptor: ApiDescriptor, service: string, resourcePath: string, params?: Record<string, unknown>): BuiltRequest;
/**
 * Call a Google API method. Returns RAW Google JSON — no envelope, no reshaping.
 * Throws GoogleApiError carrying Google's real error body.
 */
export declare function call<S extends GoogleService>(service: S, resourcePath: ServiceMethods[S], params: Record<string, unknown>, options: CallOptions): Promise<unknown>;
/**
 * Download media to disk.
 *
 * STREAMED, deliberately. The bytes go from the socket to the file and are never a
 * string at all. Never buffer a download through an in-memory string: accumulating
 * the whole response and JSON.parse-ing it turns a 30 MB attachment into a ~40 MB
 * string, then an object, then a Buffer — uncapped, for every download.
 */
export declare function download<S extends GoogleService>(service: S, resourcePath: ServiceMethods[S], params: Record<string, unknown>, outputPath: string, options: CallOptions): Promise<string>;
export interface UploadOptions extends CallOptions {
    media: Buffer;
    contentType: string;
    metadata?: Record<string, unknown>;
    /** Non-final chunks must be a multiple of 256 KiB. */
    chunkSize?: number;
}
/**
 * Resumable, chunked media upload.
 *
 * The descriptor carries the upload paths for both protocols because Discovery
 * DECLARES them. Verified live (ADR-103 item 4): a 25 MB attachment — 34.2 MB as
 * RFC822, 93% of Google's declared 36,700,160-byte cap — uploaded in 5 chunks and
 * read back byte-for-byte identical.
 */
export declare function upload<S extends GoogleService>(service: S, resourcePath: ServiceMethods[S], params: Record<string, unknown>, options: UploadOptions): Promise<unknown>;
