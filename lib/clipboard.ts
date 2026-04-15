/**
 * Clipboard utilities for copying text in plain and rich (HTML) formats.
 */

/** Copy plain text to clipboard. Used by Athome.lu, ImmoTop.lu, and Social Media formats. */
export async function copyPlainText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/**
 * Copy rich text (HTML + plain text fallback) to clipboard.
 * Uses dual ClipboardItem so paste targets pick the best format:
 * - Rich text editors (Gmail, Docs) use text/html → bold preserved
 * - Plain text inputs use text/plain → clean fallback
 *
 * Used by Email format only.
 */
export async function copyRichText(
  html: string,
  plainFallback: string,
): Promise<void> {
  // Check API availability (typeof check, not try/catch — permission denial is a different error)
  if (typeof ClipboardItem !== "undefined") {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plainFallback], { type: "text/plain" }),
      }),
    ]);
  } else {
    // Fallback for browsers without ClipboardItem support
    await navigator.clipboard.writeText(plainFallback);
  }
}
