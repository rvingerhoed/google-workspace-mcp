/**
 * Shared HTML sanitization for any agent-facing path that emits or ingests
 * HTML (Gmail message bodies, Docs HTML export, Drive HTML files, the
 * scratchpad html format from ADR-302). See ADR-305.
 *
 * Every layer here exists for a specific real-world attack:
 * 1. CSS-hidden subtrees ─ the most common prompt-injection pattern in
 *    marketing email; instructions are dropped into a `display:none` block
 *    so a human reader doesn't see them but an LLM consuming the markup does.
 * 2. Tag/attribute allowlist ─ blocks `<script>`, event handlers, dangerous
 *    URI schemes (`javascript:`, `data:`, `vbscript:`).
 * 3. Unicode injection chars ─ Tag Block (U+E0000–U+E007F), bidi overrides,
 *    zero-width spaces. Have been used to smuggle invisible instructions
 *    through human review.
 * 4. Spotlighting delimiters ─ wrap the sanitized output in a tagged block
 *    with the source and an "untrusted" marker. Microsoft's LLMail-Inject
 *    research found this alone drops injection success >50% → <2%; combined
 *    with sanitization it's stronger than either layer alone.
 *
 * Default-off in callers: the existing stripped-text path is unchanged.
 * Opt-in via `bodyFormat: 'html'` (or the equivalent on other ops).
 */
/** Untrusted source identifier — appears on the Spotlighting wrapper. */
export type SanitizeSource = 'gmail' | 'docs' | 'drive' | 'scratchpad-import';
interface SanitizeOptions {
    /** Where the HTML came from — surfaces on the Spotlighting wrapper. */
    source: SanitizeSource;
}
/**
 * Sanitize HTML before handing it to an agent-facing path.
 *
 * Returns a sanitized HTML string wrapped in a Spotlighting block. Safe to
 * embed directly in tool response text — the wrapper signals "untrusted
 * content" to the consuming model.
 *
 * Empty input returns an empty Spotlighting block (still wrapped, for
 * consistency — callers can compare against `''` to detect no-content).
 */
export declare function sanitizeHtmlForAgent(html: string, options: SanitizeOptions): string;
export {};
