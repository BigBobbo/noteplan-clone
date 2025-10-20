/**
 * Migration utility to convert old task format to GFM format
 *
 * Old format:
 * [] Task name
 * [x] Completed task
 *
 * New format (GFM):
 * - [ ] Task name
 * - [x] Completed task
 */

export function migrateTaskFormat(content: string): string {
  // Pattern to match old task format (with or without list markers)
  // Captures: indentation, optional list marker, checkbox state, task text
  const oldTaskPattern = /^(\s*)(?:[-*+]\s+)?\[([xX\-\>!\s]?)\]\s+(.*)$/gm;

  // Replace old format with new GFM format
  let migrated = content.replace(oldTaskPattern, (match, indent, state, text) => {
    // Normalize indentation: convert 4-space to 2-space
    const normalizedIndent = indent.replace(/    /g, '  ');

    // Create GFM formatted task
    return `${normalizedIndent}- [${state || ' '}] ${text}`;
  });

  // Also migrate indentation for non-task content (details, bullets)
  // This preserves the hierarchy but uses 2-space indentation
  const lines = migrated.split('\n');
  const processedLines = lines.map(line => {
    // Skip if it's already a task (starts with - [ )
    if (/^\s*-\s+\[/.test(line)) {
      return line;
    }

    // For non-task lines, normalize 4-space indentation to 2-space
    const match = line.match(/^(\s+)(.*)/);
    if (match) {
      const [_, spaces, content] = match;
      // Convert 4 spaces to 2
      const newSpaces = ' '.repeat(Math.floor(spaces.length / 4) * 2 + (spaces.length % 4));
      return newSpaces + content;
    }

    return line;
  });

  return processedLines.join('\n');
}

/**
 * Check if content needs migration
 */
export function needsMigration(content: string): boolean {
  // Check for old format tasks (without hyphen before brackets)
  const oldFormatPattern = /^\s*\[[\sxX\-\>!]?\]\s+/m;

  // Check for tasks with asterisk or plus markers (old format)
  const oldMarkerPattern = /^\s*[*+]\s+\[[\sxX\-\>!]?\]\s+/m;

  // Check for 4-space indentation
  const fourSpacePattern = /^    /m;

  return oldFormatPattern.test(content) ||
         oldMarkerPattern.test(content) ||
         fourSpacePattern.test(content);
}

/**
 * Migration report - what will be changed
 */
export function getMigrationReport(content: string): {
  oldTasks: number;
  newTasks: number;
  indentationChanges: number;
} {
  const oldTaskPattern = /^\s*(?:[-*+]\s+)?\[[\sxX\-\>!]?\]\s+/gm;
  const fourSpaceLines = content.split('\n').filter(line => line.startsWith('    '));

  const oldTasks = (content.match(oldTaskPattern) || []).length;
  const migrated = migrateTaskFormat(content);
  const newTaskPattern = /^\s*-\s+\[[\sxX\-\>!]?\]\s+/gm;
  const newTasks = (migrated.match(newTaskPattern) || []).length;

  return {
    oldTasks,
    newTasks,
    indentationChanges: fourSpaceLines.length,
  };
}