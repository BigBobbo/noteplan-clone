/**
 * Markdown utility functions
 */

/**
 * Extract title from markdown content (first heading or first line)
 */
export function extractTitle(content: string): string {
  if (!content) return 'Untitled';

  // Try to find first heading
  const headingMatch = content.match(/^#+ (.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Otherwise use first non-empty line
  const firstLine = content.split('\n').find((line) => line.trim());
  if (firstLine) {
    return firstLine.trim().substring(0, 50);
  }

  return 'Untitled';
}

/**
 * Count tasks in markdown content
 */
export function countTasks(content: string): { total: number; completed: number } {
  const taskRegex = /^\* (\[[ xX]\] )?(.+)$/gm;
  const matches = content.match(taskRegex) || [];

  const total = matches.length;
  const completed = matches.filter((match) => /\[xX\]/.test(match)).length;

  return { total, completed };
}

/**
 * Extract preview text from markdown (first paragraph without formatting)
 */
export function extractPreview(content: string, maxLength: number = 150): string {
  if (!content) return '';

  // Remove frontmatter
  let text = content.replace(/^---[\s\S]*?---\n/, '');

  // Remove headings
  text = text.replace(/^#+\s+/gm, '');

  // Remove task markers
  text = text.replace(/^\* \[[ xX]\] /gm, '');

  // Remove list markers
  text = text.replace(/^[*-]\s+/gm, '');

  // Remove time blocks
  text = text.replace(/^\+ \d{2}:\d{2}-\d{2}:\d{2} /gm, '');

  // Remove wiki links
  text = text.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, '$1');

  // Remove markdown links
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove bold/italic
  text = text.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1');

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');

  // Get first paragraph
  const paragraph = text.split('\n\n')[0] || text.split('\n')[0] || '';

  // Trim and truncate
  const trimmed = paragraph.trim();
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) + '...' : trimmed;
}

/**
 * Check if content has frontmatter
 */
export function hasFrontmatter(content: string): boolean {
  return content.trimStart().startsWith('---');
}

/**
 * Generate default note template
 */
export function generateNoteTemplate(title: string): string {
  return `# ${title}\n\n`;
}

/**
 * Generate daily note template
 */
export function generateDailyNoteTemplate(date: Date): string {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `# ${dateStr}\n\n## Tasks\n\n## Notes\n\n`;
}
