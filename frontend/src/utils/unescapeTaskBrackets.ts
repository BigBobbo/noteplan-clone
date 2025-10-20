/**
 * Unescape Task Brackets
 *
 * TipTap's markdown serializer escapes square brackets [] to \[\] to prevent
 * them from being interpreted as markdown link syntax. However, for NotePlan-style
 * tasks, we want [] to remain unescaped at the start of list items.
 *
 * This utility post-processes the serialized markdown to unescape task brackets.
 */

/**
 * Unescape brackets in task markers
 *
 * Converts escaped task patterns back to unescaped:
 * - \[ \] → [ ]
 * - \[x\] → [x]
 * - \[X\] → [X]
 * - \[-\] → [-]
 * - \[>\] → [>]
 * - \[!\] → [!]
 *
 * Only unescapes brackets at the start of lines (after optional whitespace and bullet markers)
 *
 * @param markdown - The serialized markdown from TipTap
 * @returns Markdown with unescaped task brackets
 */
export function unescapeTaskBrackets(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    // Match lines that start with optional whitespace, optional bullet (-, *, +), then escaped brackets
    // Pattern: optional spaces, optional (- or * or +), optional space, then \[...\]
    const taskPattern = /^(\s*)([-*+]\s+)?\\(\[[x\s\-!>]\])\\(\s|$)/i;

    if (taskPattern.test(line)) {
      // Unescape the brackets
      const unescaped = line.replace(/\\(\[[x\s\-!>]\])\\(\s|$)/gi, '$1 ');
      result.push(unescaped);
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Alternative simpler approach - unescape ALL square brackets
 * This is necessary since users may type tasks directly without bullet markers
 */
export function unescapeTaskBracketsSimple(markdown: string): string {
  // Simply replace ALL escaped brackets with unescaped ones
  // This ensures tasks work whether they have bullet markers or not
  return markdown.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
}
