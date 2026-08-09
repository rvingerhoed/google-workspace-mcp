export interface ApiParam {
    location: 'path' | 'query';
    required?: boolean;
    repeated?: boolean;
}
export interface ApiMediaUpload {
    maxSize?: string;
    accept?: string[];
    simple?: string;
    resumable?: string;
}
export interface ApiMethod {
    path: string;
    httpMethod: string;
    parameters: Record<string, ApiParam>;
    scopes?: string[];
    supportsMediaDownload?: boolean;
    mediaUpload?: ApiMediaUpload;
}
export interface ApiService {
    version: string;
    rootUrl: string;
    servicePath: string;
    discoveryUrl: string;
    /** `fields`, `alt`, `quotaUser`… declared once at the document root, not per method. */
    globalParameters: Record<string, ApiParam>;
    methods: Record<string, ApiMethod>;
}
export interface ApiDescriptor {
    generatedFrom: string;
    services: Record<string, ApiService>;
}
/**
 * Load the descriptor. Resolved as a sibling of this module, which makes it work
 * under `src/` (vitest) and under `build/` (the shipped server) alike — the same
 * trick `loadManifest()` uses, and the reason `npx` works.
 */
export declare function loadDescriptor(): Promise<ApiDescriptor>;
/** Tests only: drop the memoised descriptor. */
export declare function resetDescriptorCache(): void;
