import type { Reference, ParsedTag, ReferenceOptions, FileMetadata } from '../types';
import { parseWikiLinks } from './linkService';
import { parseTasksFromContent } from './taskService';

/**
 * Parse hashtags from content
 * Supports formats:
 * #simple - Simple tag
 * #multi-word - Multi-word tag with hyphens
 * #[[Multi Word]] - Multi-word tag with brackets
 */
export const parseTags = (
  content: string
): ParsedTag[] => {
  const tags: ParsedTag[] = [];

  // Match simple tags: #word or #word-word
  const simpleTagRegex = /#([a-zA-Z0-9_-]+)/g;
  let match;

  while ((match = simpleTagRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length - 1;

    tags.push({
      tag: match[1].toLowerCase(), // Normalize to lowercase for matching
      line: lineNumber,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Match bracketed tags: #[[Multi Word]]
  const bracketTagRegex = /#\[\[([^\]]+)\]\]/g;

  while ((match = bracketTagRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length - 1;

    tags.push({
      tag: match[1].toLowerCase().trim(), // Normalize to lowercase for matching
      line: lineNumber,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return tags;
};

/**
 * Extract context around a reference
 */
export const extractContext = (
  content: string,
  lineNumber: number,
  contextLines = 2
): string[] => {
  const lines = content.split('\n');
  const start = Math.max(0, lineNumber - contextLines);
  const end = Math.min(lines.length, lineNumber + contextLines + 1);

  return lines.slice(start, end);
};

/**
 * Find unlinked mentions of a target name
 * Searches for plain text mentions that aren't already wiki-links or tags
 */
export const findUnlinkedMentions = (
  targetName: string,
  content: string,
  options: ReferenceOptions = {}
): ParsedTag[] => {
  const {
    caseSensitive = false,
    minMentionLength = 3,
  } = options;

  // Skip if target name is too short
  if (targetName.length < minMentionLength) {
    return [];
  }

  const mentions: ParsedTag[] = [];
  const lines = content.split('\n');

  // Build regex for finding mentions
  // Use word boundaries to avoid partial matches
  const flags = caseSensitive ? 'g' : 'gi';
  const escapedTarget = targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mentionRegex = new RegExp(`\\b${escapedTarget}\\b`, flags);

  // Also check for existing wiki-links and tags to exclude them
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  const tagRegex = /#\[\[([^\]]+)\]\]|#([a-zA-Z0-9_-]+)/g;

  lines.forEach((line, lineNumber) => {
    // Find all wiki-links and tags in this line to exclude
    const excludeRanges: Array<{ start: number; end: number }> = [];

    let linkMatch;
    while ((linkMatch = wikiLinkRegex.exec(line)) !== null) {
      excludeRanges.push({
        start: linkMatch.index,
        end: linkMatch.index + linkMatch[0].length,
      });
    }

    let tagMatch;
    while ((tagMatch = tagRegex.exec(line)) !== null) {
      excludeRanges.push({
        start: tagMatch.index,
        end: tagMatch.index + tagMatch[0].length,
      });
    }

    // Find mentions that aren't in excluded ranges
    let mentionMatch: RegExpExecArray | null;
    while ((mentionMatch = mentionRegex.exec(line)) !== null) {
      const matchIndex = mentionMatch.index;
      const matchLength = mentionMatch[0].length;

      const isExcluded = excludeRanges.some(
        (range) =>
          matchIndex >= range.start && matchIndex < range.end
      );

      if (!isExcluded) {
        mentions.push({
          tag: targetName,
          line: lineNumber,
          startIndex: matchIndex,
          endIndex: matchIndex + matchLength,
        });
      }
    }

    // Reset regex
    mentionRegex.lastIndex = 0;
  });

  return mentions;
};

/**
 * Find all references to a target name across all files
 */
export const findReferences = async (
  targetName: string,
  files: Array<{ path: string; name: string; content: string; metadata: FileMetadata }>,
  options: ReferenceOptions = {}
): Promise<Reference[]> => {
  const {
    includeUnlinked = true,
    contextLines = 2,
  } = options;

  const references: Reference[] = [];
  const normalizedTarget = targetName.toLowerCase().trim();

  for (const file of files) {
    try {
      const { content, path, name, metadata } = file;

      // Check if this is a daily note
      const isDaily = metadata.type === 'daily' || path.includes('/Daily/');

      // 1. Find hashtag references (#tag)
      const tags = parseTags(content);
      tags.forEach((tag) => {
        if (tag.tag === normalizedTarget) {
          const context = extractContext(content, tag.line, contextLines);
          const matchText = content.split('\n')[tag.line] || '';

          references.push({
            id: `${path}:${tag.line}:tag`,
            type: 'tag',
            sourceFile: path,
            sourceName: name,
            targetName,
            line: tag.line,
            context,
            matchText,
            dateModified: new Date(metadata.modified),
            isDaily,
          });
        }
      });

      // 2. Find wiki-link references ([[Note]])
      const links = parseWikiLinks(content, path);
      links.forEach((link) => {
        const linkTarget = link.target.toLowerCase().trim();
        const targetWithoutExt = normalizedTarget.replace(/\.txt$/, '');

        if (linkTarget === normalizedTarget || linkTarget === targetWithoutExt) {
          const context = extractContext(content, link.line, contextLines);
          const matchText = content.split('\n')[link.line] || '';

          references.push({
            id: `${path}:${link.line}:wikilink`,
            type: 'wikilink',
            sourceFile: path,
            sourceName: name,
            targetName,
            line: link.line,
            context,
            matchText,
            dateModified: new Date(metadata.modified),
            isDaily,
          });
        }
      });

      // 3. Find task references (tasks with #tag)
      const tasks = parseTasksFromContent(content, path);
      tasks.forEach((task: any) => {
        // Check if task contains the target as a tag
        const taskTags = parseTags(task.text);
        const hasTargetTag = taskTags.some((tag: ParsedTag) => tag.tag === normalizedTarget);

        if (hasTargetTag) {
          const context = extractContext(content, task.line, contextLines);
          const matchText = content.split('\n')[task.line] || '';

          references.push({
            id: `${path}:${task.line}:task`,
            type: 'task',
            sourceFile: path,
            sourceName: name,
            targetName,
            line: task.line,
            context,
            matchText,
            dateModified: new Date(metadata.modified),
            isDaily,
          });
        }
      });

      // 4. Find unlinked mentions (optional)
      if (includeUnlinked) {
        const mentions = findUnlinkedMentions(targetName, content, options);
        mentions.forEach((mention) => {
          const context = extractContext(content, mention.line, contextLines);
          const matchText = content.split('\n')[mention.line] || '';

          references.push({
            id: `${path}:${mention.line}:unlinked`,
            type: 'unlinked',
            sourceFile: path,
            sourceName: name,
            targetName,
            line: mention.line,
            context,
            matchText,
            dateModified: new Date(metadata.modified),
            isDaily,
          });
        });
      }
    } catch (error) {
      console.error(`Error processing file ${file.path}:`, error);
    }
  }

  return references;
};

/**
 * Group references by file
 */
export const groupReferencesByFile = (
  references: Reference[]
): Map<string, Reference[]> => {
  const grouped = new Map<string, Reference[]>();

  references.forEach((ref) => {
    const existing = grouped.get(ref.sourceFile) || [];
    existing.push(ref);
    grouped.set(ref.sourceFile, existing);
  });

  return grouped;
};

/**
 * Group references by type
 */
export const groupReferencesByType = (
  references: Reference[]
): Record<string, Reference[]> => {
  const grouped: Record<string, Reference[]> = {
    tag: [],
    wikilink: [],
    unlinked: [],
    task: [],
  };

  references.forEach((ref) => {
    grouped[ref.type].push(ref);
  });

  return grouped;
};

/**
 * Convert unlinked mention to a wiki-link or tag
 */
export const linkMention = (
  content: string,
  line: number,
  mentionText: string,
  linkType: 'wikilink' | 'tag'
): string => {
  const lines = content.split('\n');

  if (line < 0 || line >= lines.length) {
    throw new Error('Invalid line number');
  }

  const lineContent = lines[line];
  let newLineContent: string;

  if (linkType === 'wikilink') {
    // Replace first occurrence of mentionText with [[mentionText]]
    newLineContent = lineContent.replace(
      new RegExp(`\\b${mentionText}\\b`, 'i'),
      `[[${mentionText}]]`
    );
  } else {
    // Replace first occurrence of mentionText with #mentionText
    // Handle multi-word tags with brackets
    const hasSpaces = mentionText.includes(' ');
    const replacement = hasSpaces ? `#[[${mentionText}]]` : `#${mentionText.replace(/\s+/g, '-')}`;
    newLineContent = lineContent.replace(
      new RegExp(`\\b${mentionText}\\b`, 'i'),
      replacement
    );
  }

  lines[line] = newLineContent;
  return lines.join('\n');
};

/**
 * Build reference index for common tags
 * This is used for performance optimization
 */
export const buildReferenceIndex = async (
  files: Array<{ path: string; name: string; content: string; metadata: FileMetadata }>,
  topTags: string[],
  options: ReferenceOptions = {}
): Promise<Map<string, Reference[]>> => {
  const index = new Map<string, Reference[]>();

  for (const tag of topTags) {
    const references = await findReferences(tag, files, options);
    index.set(tag, references);
  }

  return index;
};

/**
 * Get the name/identifier from a file path or current file
 */
export const getTargetName = (file: { name: string; path: string } | null): string | null => {
  if (!file) return null;

  // Remove .txt extension
  return file.name.replace(/\.txt$/, '');
};

/**
 * Check if a file path represents a daily note
 */
export const isDailyNote = (path: string): boolean => {
  return path.includes('/Daily/') || /\d{8}/.test(path);
};

/**
 * Sort references by various criteria
 */
export const sortReferences = (
  references: Reference[],
  sortBy: 'modified' | 'created' | 'filename' | 'count'
): Reference[] => {
  const sorted = [...references];

  switch (sortBy) {
    case 'modified':
      return sorted.sort((a, b) =>
        b.dateModified.getTime() - a.dateModified.getTime()
      );

    case 'filename':
      return sorted.sort((a, b) =>
        a.sourceName.localeCompare(b.sourceName)
      );

    case 'count':
      // Group by file and sort by count
      const fileGroups = groupReferencesByFile(references);
      const sortedByCount: Reference[] = [];

      Array.from(fileGroups.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .forEach(([_, refs]) => {
          sortedByCount.push(...refs);
        });

      return sortedByCount;

    default:
      return sorted;
  }
};

/**
 * Filter references by criteria
 */
export const filterReferences = (
  references: Reference[],
  filters: {
    types?: Array<'tag' | 'wikilink' | 'unlinked' | 'task'>;
    fileTypes?: Array<'daily' | 'note' | 'template'>;
    dateRange?: { start: Date; end: Date };
  }
): Reference[] => {
  let filtered = references;

  // Filter by type
  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter((ref) => filters.types!.includes(ref.type));
  }

  // Filter by file type
  if (filters.fileTypes && filters.fileTypes.length > 0) {
    filtered = filtered.filter((ref) => {
      if (filters.fileTypes!.includes('daily') && ref.isDaily) return true;
      if (filters.fileTypes!.includes('note') && !ref.isDaily && !ref.sourceFile.includes('Templates')) return true;
      if (filters.fileTypes!.includes('template') && ref.sourceFile.includes('Templates')) return true;
      return false;
    });
  }

  // Filter by date range
  if (filters.dateRange) {
    filtered = filtered.filter((ref) => {
      const date = ref.dateModified;
      return date >= filters.dateRange!.start && date <= filters.dateRange!.end;
    });
  }

  return filtered;
};
