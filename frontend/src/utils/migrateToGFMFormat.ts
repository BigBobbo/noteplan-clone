/**
 * Migrate NotePlan format tasks to GFM format
 *
 * Converts legacy NotePlan task format to GitHub Flavored Markdown (GFM) format:
 * [] Task -> - [ ] Task
 * [x] Task -> - [x] Task
 * [-] Task -> - [-] Task
 * [>] Task -> - [>] Task
 * [!] Task -> - [!] Task
 *
 * This migration is part of standardizing on GFM task format across the application.
 * See PRPs/task-format-mismatch-fix.md for more details.
 */
export function migrateToGFMFormat(content: string): string {
  const lines = content.split('\n');
  const migratedLines = lines.map(line => {
    // Check if line is a NotePlan task (not already GFM)
    const noteplanTaskMatch = line.match(/^(\s*)\[([xX\s\-!>]?)\]\s+(.+)$/);

    // Don't migrate if already in GFM format (has leading -)
    if (noteplanTaskMatch && !line.match(/^\s*-\s+\[/)) {
      const [, indent, marker, text] = noteplanTaskMatch;
      return `${indent}- [${marker}] ${text}`;
    }

    return line;
  });

  return migratedLines.join('\n');
}

/**
 * Check if content contains any legacy NotePlan format tasks
 */
export function hasLegacyFormat(content: string): boolean {
  const lines = content.split('\n');

  for (const line of lines) {
    // Match NotePlan format
    const noteplanTaskMatch = line.match(/^(\s*)\[([xX\s\-!>]?)\]\s+.+$/);
    // Check it's not GFM format
    const isGFM = line.match(/^\s*-\s+\[/);

    if (noteplanTaskMatch && !isGFM) {
      return true;
    }
  }

  return false;
}
