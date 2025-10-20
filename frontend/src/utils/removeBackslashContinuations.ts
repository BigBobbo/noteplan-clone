/**
 * Remove Backslash Line Continuations
 *
 * TipTap's markdown serializer adds backslashes at the end of lines
 * as continuation markers. We need to remove these to preserve
 * the exact text the user entered.
 */

/**
 * Remove trailing backslashes that are used as line continuation markers
 * @param markdown - The serialized markdown from TipTap
 * @returns Markdown with backslash continuations removed
 */
export function removeBackslashContinuations(markdown: string): string {
  // Remove backslashes at the end of lines (before newline)
  // But preserve backslashes that are escaping other characters
  return markdown.replace(/\\(\r?\n)/g, '$1');
}