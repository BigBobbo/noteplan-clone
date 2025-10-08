import type { WikiLink, FileMetadata } from '../types';

export interface LinkGraphNode {
  id: string;
  label: string;
  file: string;
}

export interface LinkGraphEdge {
  source: string;
  target: string;
}

export interface LinkGraph {
  nodes: LinkGraphNode[];
  edges: LinkGraphEdge[];
}

export interface Backlink {
  source: string;
  sourceName: string;
  target: string;
  line: number;
  context: string;
}

/**
 * Parse wiki-style links from content
 * Supports formats:
 * [[Note]]           - Simple link
 * [[Note|Alias]]     - Link with alias
 */
export const parseWikiLinks = (
  content: string,
  _filePath: string
): WikiLink[] => {
  const regex = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g;
  const links: WikiLink[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length - 1;

    links.push({
      target: match[1].trim(),
      alias: match[3]?.trim() || null,
      line: lineNumber,
    });
  }

  return links;
};

/**
 * Resolve a wiki link to an actual file path
 */
export const resolveLink = (
  linkText: string,
  files: FileMetadata[]
): string | null => {
  console.log('[LinkService] Resolving link:', linkText);
  console.log('[LinkService] Available files:', files.length);

  if (!files || files.length === 0) {
    console.warn('[LinkService] No files available for link resolution');
    return null;
  }

  // Normalize link text - remove any leading/trailing brackets that might have leaked through
  const normalizedLink = linkText.trim().replace(/^[\[\]]+|[\[\]]+$/g, '');

  // Try exact match first (with .txt)
  let file = files.find((f) => f.name === `${normalizedLink}.txt`);
  if (file) {
    console.log('[LinkService] Found exact match:', file.path);
    return file.path;
  }

  // Try without extension
  file = files.find((f) => f.name === normalizedLink);
  if (file) {
    console.log('[LinkService] Found match without extension:', file.path);
    return file.path;
  }

  // Try case-insensitive match
  const lowerLink = normalizedLink.toLowerCase();
  file = files.find(
    (f) =>
      f.name.toLowerCase() === `${lowerLink}.txt` ||
      f.name.toLowerCase() === lowerLink
  );
  if (file) {
    console.log('[LinkService] Found case-insensitive match:', file.path);
    return file.path;
  }

  // Try partial match (for files with spaces or special characters)
  file = files.find((f) => {
    const nameWithoutExt = f.name.replace(/\.txt$/, '');
    return nameWithoutExt.toLowerCase() === lowerLink;
  });
  if (file) {
    console.log('[LinkService] Found partial match:', file.path);
    return file.path;
  }

  console.warn('[LinkService] Could not resolve link:', normalizedLink);
  console.log('[LinkService] Available file names:', files.map(f => f.name).join(', '));
  return null; // Broken link
};

/**
 * Extract context around a link
 */
export const extractContext = (
  content: string,
  lineNumber: number,
  contextLines = 2
): string => {
  const lines = content.split('\n');
  const start = Math.max(0, lineNumber - contextLines);
  const end = Math.min(lines.length, lineNumber + contextLines + 1);

  return lines.slice(start, end).join('\n');
};

/**
 * Find all backlinks to a file
 */
export const findBacklinks = (
  targetFile: string,
  allFiles: Array<{ path: string; name: string; content: string }>
): Backlink[] => {
  const backlinks: Backlink[] = [];
  const targetName = targetFile.split('/').pop()?.replace('.txt', '') || '';

  allFiles.forEach((file) => {
    const links = parseWikiLinks(file.content, file.path);

    links.forEach((link) => {
      // Check if this link points to our target file
      if (
        link.target === targetName ||
        link.target === targetFile ||
        `${link.target}.txt` === targetFile.split('/').pop()
      ) {
        backlinks.push({
          source: file.path,
          sourceName: file.name,
          target: targetFile,
          line: link.line,
          context: extractContext(file.content, link.line),
        });
      }
    });
  });

  return backlinks;
};

/**
 * Build a complete link graph from all files
 */
export const buildLinkGraph = (
  files: Array<{ path: string; name: string; content: string }>,
  availableFiles: FileMetadata[]
): LinkGraph => {
  const nodes: LinkGraphNode[] = [];
  const edges: LinkGraphEdge[] = [];

  // Add all files as nodes
  files.forEach((file) => {
    nodes.push({
      id: file.path,
      label: file.name.replace('.txt', ''),
      file: file.path,
    });
  });

  // Build edges from links
  files.forEach((file) => {
    const links = parseWikiLinks(file.content, file.path);

    links.forEach((link) => {
      const targetPath = resolveLink(link.target, availableFiles);
      if (targetPath) {
        edges.push({
          source: file.path,
          target: targetPath,
        });
      }
    });
  });

  return { nodes, edges };
};
