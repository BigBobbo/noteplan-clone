import type { WikiLink, FileMetadata, TaskReference, TimeBlockRef } from '../types';
import type { ParsedTask } from './taskService';

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

export interface TaskLinkMatch {
  taskName: string;
  subtaskName?: string;
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

/**
 * Parse task link from text
 * Supports formats:
 * [[Task Name]]           - Links to task
 * [[Parent > Child]]      - Links to subtask
 */
export const parseTaskLink = (text: string): TaskLinkMatch | null => {
  const match = text.match(/\[\[([^\]]+)\]\]/);
  if (!match) return null;

  const parts = match[1].split('>').map(s => s.trim());

  return {
    taskName: parts[0],
    subtaskName: parts[1] || undefined
  };
};

/**
 * Find task by name in a list of tasks
 * Supports hierarchical lookup for subtasks
 */
export const findTaskByName = (
  tasks: ParsedTask[],
  taskName: string,
  subtaskName?: string
): ParsedTask | null => {
  // Search recursively through tasks
  const searchTasks = (taskList: ParsedTask[]): ParsedTask | null => {
    for (const task of taskList) {
      // Check if this task matches
      const cleanTaskText = task.text.replace(/#[a-zA-Z0-9_-]+/g, '').trim();
      const cleanSearchName = taskName.trim();

      if (cleanTaskText.includes(cleanSearchName) || cleanSearchName.includes(cleanTaskText)) {
        if (!subtaskName) {
          return task;
        }

        // Look for subtask in children
        if (task.children && task.children.length > 0) {
          const subtask = task.children.find(child => {
            const cleanChildText = child.text.replace(/#[a-zA-Z0-9_-]+/g, '').trim();
            return cleanChildText.includes(subtaskName) || subtaskName.includes(cleanChildText);
          });

          if (subtask) return subtask;
        }
      }

      // Search in children recursively
      if (task.children && task.children.length > 0) {
        const found = searchTasks(task.children);
        if (found) return found;
      }
    }
    return null;
  };

  return searchTasks(tasks);
};

/**
 * Create markdown reference line for a task
 */
export const createTaskReference = (
  task: ParsedTask,
  timeBlock?: TimeBlockRef
): string => {
  const taskText = task.text.split('#')[0].trim(); // Remove tags for cleaner reference

  if (timeBlock) {
    return `+ ${timeBlock.start}-${timeBlock.end} [[${taskText}]] #timeblock`;
  } else {
    return `* [[${taskText}]]`;
  }
};

/**
 * Build task reference index from files
 * Scans all files for [[task links]] and builds a map
 */
export const buildTaskReferenceIndex = (
  files: Array<{ path: string; content: string }>,
  allTasks: ParsedTask[]
): Map<string, TaskReference[]> => {
  const index = new Map<string, TaskReference[]>();

  files.forEach(file => {
    const lines = file.content.split('\n');

    lines.forEach((line, lineNum) => {
      const linkMatch = parseTaskLink(line);
      if (!linkMatch) return;

      // Find the referenced task
      const task = findTaskByName(allTasks, linkMatch.taskName, linkMatch.subtaskName);
      if (!task) return;

      // Check if this is a time block reference
      const timeBlockMatch = line.match(/^[+*-]?\s*(\d{2}:\d{2})-(\d{2}:\d{2})/);

      const reference: TaskReference = {
        id: `${file.path}:${lineNum}`,
        taskId: task.id,
        sourceFile: task.file,
        date: extractDateFromPath(file.path),
        type: timeBlockMatch ? 'timeblock' : 'reference',
        createdAt: new Date(),
        timeBlock: timeBlockMatch ? {
          id: `${file.path}:${lineNum}`,
          start: timeBlockMatch[1],
          end: timeBlockMatch[2],
          duration: calculateDuration(timeBlockMatch[1], timeBlockMatch[2]),
          taskRef: task.id
        } : undefined
      };

      // Add to index
      const existing = index.get(task.id) || [];
      existing.push(reference);
      index.set(task.id, existing);
    });
  });

  return index;
};

/**
 * Extract date from calendar file path
 */
const extractDateFromPath = (path: string): Date => {
  const match = path.match(/(\d{8})/);
  if (match) {
    const dateStr = match[1];
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }
  return new Date();
};

/**
 * Calculate duration between two times
 */
const calculateDuration = (start: string, end: string): number => {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
};

/**
 * Get backlinks (references) for a task
 */
export const getTaskBacklinks = (
  taskId: string,
  linkIndex: Map<string, TaskReference[]>
): TaskReference[] => {
  return linkIndex.get(taskId) || [];
};
