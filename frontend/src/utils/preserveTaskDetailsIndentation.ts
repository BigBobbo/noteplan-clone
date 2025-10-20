/**
 * Preserve Task Details Indentation
 *
 * TipTap's markdown serializer strips indentation from content following list items.
 * This utility post-processes the serialized markdown to restore proper indentation
 * for NotePlan-style task details.
 *
 * Task details are identified as non-task, non-empty lines following a task marker.
 * They should be indented at taskDepth + 1 (4 spaces per depth level).
 */

interface LineInfo {
  content: string;
  isTask: boolean;
  isBlank: boolean;
  currentIndent: number;
  taskDepth?: number;
}

/**
 * Calculate the indentation depth of a line (4 spaces = 1 level)
 */
function calculateIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  const spaces = match[1];
  // Count tabs as 4 spaces
  const normalizedSpaces = spaces.replace(/\t/g, '    ');
  return Math.floor(normalizedSpaces.length / 4);
}

/**
 * Analyze a line to determine its type and properties
 */
function analyzeLine(line: string): LineInfo {
  const isBlank = !line.trim();
  const taskMatch = line.match(/^(\s*)[*+]\s/);
  const isTask = !!taskMatch;
  const currentIndent = isTask ? taskMatch[1].length : line.search(/\S/);
  const taskDepth = isTask ? Math.floor(currentIndent / 4) : undefined;

  return {
    content: line,
    isTask,
    isBlank,
    currentIndent: currentIndent === -1 ? 0 : currentIndent,
    taskDepth,
  };
}

/**
 * Check if a line is a heading or other block element that should not be indented
 */
function isBlockElement(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('#') ||     // Heading
    trimmed.startsWith('---') ||   // Horizontal rule
    trimmed.startsWith('```') ||   // Code block
    trimmed.startsWith('|')        // Table
  );
}

/**
 * Preserve indentation for task details in markdown content
 *
 * Handles TipTap's 2-space list indentation and converts to NotePlan's 4-space format
 * Strips backslash continuation markers that TipTap adds
 *
 * @param markdown - The serialized markdown from TipTap
 * @returns Markdown with properly indented task details in NotePlan format
 *
 * @example
 * Input (TipTap format):
 * ```
 * * Task 1\
 * Detail line\
 * Another detail
 *   * Nested task\
 *   Nested detail
 * ```
 *
 * Output (NotePlan format):
 * ```
 * * Task 1
 *     Detail line
 *     Another detail
 *     * Nested task
 *         Nested detail
 * ```
 */
export function preserveTaskDetailsIndentation(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];

  let lastTaskDepth: number | null = null;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Track code blocks (don't modify content inside)
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      lastTaskDepth = null;
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Strip trailing backslashes (TipTap continuation markers)
    const hasBackslash = line.trimEnd().endsWith('\\');
    if (hasBackslash) {
      line = line.trimEnd().slice(0, -1).trimEnd();
    }

    const info = analyzeLine(line);

    // If it's a blank line, output as-is and maintain context
    if (info.isBlank) {
      result.push(line);
      continue;
    }

    // If it's a block element, output as-is and reset context
    if (isBlockElement(line)) {
      result.push(line);
      lastTaskDepth = null;
      continue;
    }

    // If it's a task line, normalize indentation and record depth
    if (info.isTask) {
      // TipTap uses 2-space indents, NotePlan uses 4-space
      // Convert 2-space to 4-space for task depth
      const tiptapIndent = line.match(/^(\s*)/)?.[1]?.length || 0;
      const notePlanDepth = Math.floor(tiptapIndent / 2); // 2 spaces per TipTap level
      const notePlanIndent = '    '.repeat(notePlanDepth); // 4 spaces per NotePlan level

      // Reconstruct task line with correct indentation
      const taskContent = line.trim();
      const normalizedTaskLine = notePlanIndent + taskContent;

      result.push(normalizedTaskLine);
      lastTaskDepth = notePlanDepth;
      continue;
    }

    // At this point, if we have a lastTaskDepth, this might be a detail line
    if (lastTaskDepth !== null) {
      const expectedIndent = (lastTaskDepth + 1) * 4; // NotePlan: 4 spaces per level
      const indentString = ' '.repeat(expectedIndent);

      // Strip any existing indentation and add the correct one
      const content = line.trim();

      if (content) {
        result.push(indentString + content);
      } else {
        result.push('');
      }
    } else {
      // Not in a task context, output line as-is
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Test utility to verify indentation is correct
 * Logs errors if indentation doesn't match expected format
 */
export function validateTaskDetailsIndentation(markdown: string): {
  valid: boolean;
  errors: string[];
} {
  const lines = markdown.split('\n');
  const errors: string[] = [];
  let lastTaskDepth: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const info = analyzeLine(line);

    if (info.isTask) {
      lastTaskDepth = info.taskDepth!;
      continue;
    }

    if (info.isBlank || isBlockElement(line)) {
      continue;
    }

    // Check if this is a potential detail line
    if (lastTaskDepth !== null && !info.isTask) {
      const expectedIndent = (lastTaskDepth + 1) * 4;
      const actualIndent = info.currentIndent;

      if (actualIndent !== expectedIndent) {
        errors.push(
          `Line ${i + 1}: Expected ${expectedIndent} spaces, got ${actualIndent} spaces\n  Line: "${line}"`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log the structure of tasks and details for debugging
 */
export function logTaskStructure(markdown: string): void {
  const lines = markdown.split('\n');

  console.group('📋 Task Structure Analysis');

  lines.forEach((line, i) => {
    const info = analyzeLine(line);

    if (info.isBlank) {
      console.log(`${i + 1}: [empty line]`);
    } else if (info.isTask) {
      console.log(
        `${i + 1}: 📝 [Task, depth ${info.taskDepth}] ${line.substring(0, 50)}`
      );
    } else if (isBlockElement(line)) {
      console.log(`${i + 1}: 📄 [Block element] ${line.substring(0, 50)}`);
    } else {
      const indent = info.currentIndent;
      console.log(`${i + 1}: [${indent} spaces] ${line.substring(0, 50)}`);
    }
  });

  console.groupEnd();
}
