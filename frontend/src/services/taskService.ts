import type { Task } from '../types';

export interface ParsedTask extends Task {
  id: string;
  text: string;
  completed: boolean;
  scheduled: boolean;
  cancelled: boolean;
  canceled: boolean; // Alias for compatibility
  important: boolean;
  priority?: 1 | 2 | 3 | 4;  // Priority level
  date?: Date;
  mentions: string[];
  tags: string[];
  line: number;
  file: string;

  // Nesting support
  parentId?: string;
  children: ParsedTask[];
  depth: number;

  // Custom ordering support
  rank?: number;

  // Task details/notes support
  details?: string;
  hasDetails?: boolean;
}

/**
 * Extract priority level from tags (#p1-#p4)
 */
export const extractPriority = (tags: string[]): 1 | 2 | 3 | 4 | undefined => {
  const priorityTag = tags.find((tag) => /^p[1-4]$/.test(tag));
  if (priorityTag) {
    return parseInt(priorityTag[1]) as 1 | 2 | 3 | 4;
  }
  return undefined;
};

/**
 * Calculate indentation level (2 spaces = 1 level for GFM compatibility)
 */
export const calculateIndentLevel = (line: string): number => {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  const spaces = match[1];
  // Count tabs as 2 spaces for consistency
  const normalizedSpaces = spaces.replace(/\t/g, '  ');
  return Math.floor(normalizedSpaces.length / 2);
};

/**
 * Parse task details from indented content after task line
 * Details are indented content at depth+1, stopping at next task or non-detail content
 */
export const parseTaskDetails = (
  taskLineNumber: number,
  allLines: string[],
  taskDepth: number
): string | undefined => {
  const detailLines: string[] = [];
  let currentLine = taskLineNumber + 1;

  while (currentLine < allLines.length) {
    const line = allLines[currentLine];
    const lineIndent = calculateIndentLevel(line);

    // Stop if we hit content at same or higher level as the task
    if (lineIndent <= taskDepth && line.trim()) break;

    // Stop if we hit a child task (GFM format: - [ ])
    if (/^\s*-\s+\[[\sxX>\-!]?\]\s+/.test(line)) {
      // If it's a task at any deeper level, it's a child task, not a detail
      break;
    }

    // Include lines indented more than task depth as details
    if (lineIndent > taskDepth) {
      // Remove the base indentation (taskDepth + 1 levels) - 2 spaces per level
      const baseIndent = '  '.repeat(taskDepth + 1);
      const detailText = line.startsWith(baseIndent)
        ? line.substring(baseIndent.length)
        : line.trimStart(); // Preserve relative indentation for deeply nested content
      detailLines.push(detailText);
    } else if (!line.trim()) {
      // Include blank lines
      detailLines.push('');
    } else {
      // Different indentation level, stop parsing
      break;
    }

    currentLine++;
  }

  const details = detailLines.join('\n').trim();

  // Debug logging to track newlines
  if (details) {
    console.log('[parseTaskDetails] Task at line', taskLineNumber, 'has details:');
    console.log('[parseTaskDetails] Raw details:', JSON.stringify(details));
    console.log('[parseTaskDetails] Has newlines:', details.includes('\n'));
    console.log('[parseTaskDetails] Line count:', details.split('\n').length);
  }

  return details || undefined;
};

/**
 * Build hierarchical task structure from flat list with depth info
 */
export const buildTaskHierarchy = (tasks: ParsedTask[]): ParsedTask[] => {
  if (tasks.length === 0) return [];

  const rootTasks: ParsedTask[] = [];
  const stack: ParsedTask[] = [];

  tasks.forEach((task) => {
    // Initialize children array
    task.children = [];
    task.parentId = undefined;

    if (task.depth === 0) {
      // Root level task
      rootTasks.push(task);
      stack.length = 0;
      stack.push(task);
    } else {
      // Find parent in stack
      // Pop stack until we find a parent at depth-1
      while (stack.length > 0 && stack[stack.length - 1].depth >= task.depth) {
        stack.pop();
      }

      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        task.parentId = parent.id;
        parent.children.push(task);
      } else {
        // No valid parent found, treat as root
        rootTasks.push(task);
      }

      stack.push(task);
    }
  });

  return rootTasks;
};

/**
 * Parse a single line to extract task information
 * Supports GitHub Flavored Markdown (GFM) task list format:
 * - [ ] Task name               # Open task
 * - [x] Completed task          # Completed
 * - [>] Scheduled/forwarded     # Moved to future date (NotePlan extension)
 * - [-] Cancelled task          # Cancelled (NotePlan extension)
 * - [!] Important task          # Priority (NotePlan extension)
 * Task >2025-10-08              # Scheduled for date
 * Task @person                  # Assigned/mentioned
 * Task #tag                     # Tagged
 */
export const parseTask = (
  line: string,
  lineNumber: number,
  filePath: string,
  allLines?: string[]
): ParsedTask | null => {
  // Calculate depth before trimming
  const depth = calculateIndentLevel(line);

  // Match both GFM format (- [ ]) and legacy NotePlan format ([ ])
  // GFM format (preferred): - [ ] Task
  const gfmTaskRegex = /^\s*-\s+\[([xX>\-!\s]?)\]\s+(.+)$/;
  // Legacy NotePlan format (temporary): [] Task
  const noteplanTaskRegex = /^\s*\[([xX>\-!\s]?)\]\s+(.+)$/;

  let match = line.match(gfmTaskRegex);
  let isLegacyFormat = false;

  if (!match) {
    // Try legacy format
    match = line.match(noteplanTaskRegex);
    isLegacyFormat = true;
  }

  if (!match) return null;

  const [_, status, text] = match;

  // Log warning for legacy format
  if (isLegacyFormat) {
    console.warn(`[taskService] Legacy NotePlan format detected at ${filePath}:${lineNumber}. Consider migrating to GFM format: - [ ] Task`);
  }
  const trimmedStatus = status.trim(); // Handle [ ] with space for open tasks

  // Extract date references (>2025-10-08)
  const dateMatch = text.match(/>(\d{4}-\d{2}-\d{2})/);
  const scheduledDate = dateMatch ? new Date(dateMatch[1]) : undefined;

  // Extract mentions (@person)
  const mentions = [...text.matchAll(/@([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);

  // Extract tags (#tag)
  const tags = [...text.matchAll(/#([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);

  // Extract priority from tags
  const priority = extractPriority(tags);

  // Clean text by removing date reference
  const cleanText = text.replace(/>(\d{4}-\d{2}-\d{2})/, '').trim();

  const isCancelled = trimmedStatus === '-';

  // Parse task details from following indented lines
  const details = allLines ? parseTaskDetails(lineNumber, allLines, depth) : undefined;

  return {
    id: `${filePath}-${lineNumber}`,
    text: cleanText,
    completed: trimmedStatus === 'x' || trimmedStatus === 'X',
    scheduled: trimmedStatus === '>',
    cancelled: isCancelled,
    canceled: isCancelled, // Alias for compatibility
    important: trimmedStatus === '!',
    priority,
    date: scheduledDate,
    mentions,
    tags,
    line: lineNumber,
    file: filePath,
    depth,
    children: [],
    parentId: undefined,
    details,
    hasDetails: !!details,
  };
};

/**
 * Parse all tasks from file content and build hierarchy
 */
export const parseTasksFromContent = (
  content: string,
  filePath: string
): ParsedTask[] => {
  // Handle undefined or null content
  if (!content) {
    console.warn(`[parseTasksFromContent] Content is undefined for file: ${filePath}`);
    return [];
  }

  const lines = content.split('\n');
  const tasks: ParsedTask[] = [];

  lines.forEach((line, index) => {
    const task = parseTask(line, index, filePath, lines);
    if (task) {
      tasks.push(task);
    }
  });

  // Build hierarchical structure
  return buildTaskHierarchy(tasks);
};

/**
 * Filter tasks by various criteria
 */
export type TaskFilter = 'all' | 'active' | 'completed' | 'today' | 'scheduled' | 'p1' | 'p2' | 'p3' | 'p4';

export const filterTasks = (
  tasks: ParsedTask[],
  filter: TaskFilter
): ParsedTask[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (filter) {
    case 'active':
      return tasks.filter((t) => !t.completed && !t.cancelled);
    case 'completed':
      return tasks.filter((t) => t.completed);
    case 'today':
      return tasks.filter((t) => {
        if (t.date) {
          const taskDate = new Date(t.date);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        }
        return false;
      });
    case 'scheduled':
      return tasks.filter((t) => t.date !== undefined);
    case 'p1':
      return tasks.filter((t) => t.priority === 1);
    case 'p2':
      return tasks.filter((t) => t.priority === 2);
    case 'p3':
      return tasks.filter((t) => t.priority === 3);
    case 'p4':
      return tasks.filter((t) => t.priority === 4);
    case 'all':
    default:
      return tasks;
  }
};

/**
 * Toggle task completion status in content (GFM format)
 */
export const toggleTaskInContent = (
  content: string,
  lineNumber: number
): string => {
  const lines = content.split('\n');
  const line = lines[lineNumber];

  if (!line) return content;

  // Check if completed (has - [x] or - [X])
  const isCompleted = /^\s*-\s+\[[xX]\]/.test(line);

  // Toggle the status - preserve indentation and GFM format
  let newLine: string;
  if (isCompleted) {
    // "- [x]" -> "- [ ]"
    newLine = line.replace(/^(\s*-\s+)\[[xX]\]/, '$1[ ]');
  } else {
    // "- [ ]" -> "- [x]"
    newLine = line.replace(/^(\s*-\s+)\[\s?\]/, '$1[x]');
  }

  lines[lineNumber] = newLine;
  return lines.join('\n');
};

/**
 * Update task date in content
 */
export const updateTaskDateInContent = (
  content: string,
  lineNumber: number,
  newDate: Date | null
): string => {
  const lines = content.split('\n');
  const line = lines[lineNumber];

  if (!line) return content;

  // Remove existing date reference
  let newLine = line.replace(/>(\d{4}-\d{2}-\d{2})/, '').trim();

  // Add new date if provided
  if (newDate) {
    const dateStr = newDate.toISOString().split('T')[0];
    newLine = `${newLine} >${dateStr}`;
  }

  lines[lineNumber] = newLine;
  return lines.join('\n');
};

/**
 * Remove existing task details, preserving child tasks
 * Returns the cleaned lines and the index where child tasks start
 */
const removeExistingDetails = (
  lines: string[],
  taskLineNumber: number,
  taskDepth: number
): { cleanedLines: string[]; childTaskStartLine: number } => {
  const result = [...lines];
  let currentLine = taskLineNumber + 1;
  let removedCount = 0;

  while (currentLine < result.length) {
    const adjustedLine = currentLine - removedCount;
    if (adjustedLine >= result.length) break;

    const line = result[adjustedLine];
    const lineDepth = calculateIndentLevel(line);

    // Stop at task of same or higher level (GFM format)
    if (/^\s*-\s+\[[\sxX>\-!]?\]\s/.test(line)) {
      if (lineDepth <= taskDepth) break;
      // Found child task - stop removing, this is where children start
      break;
    }

    // This is a detail line at depth+1, or a blank line - remove it
    if (lineDepth === taskDepth + 1 || !line.trim()) {
      result.splice(adjustedLine, 1);
      removedCount++;
      continue;
    }

    // Stop if we hit content at different indentation
    if (lineDepth <= taskDepth && line.trim()) break;

    currentLine++;
  }

  return {
    cleanedLines: result,
    childTaskStartLine: currentLine - removedCount,
  };
};

/**
 * Update task details in file content
 * Replaces existing details with new details, preserving child tasks
 */
export const updateTaskDetails = (
  content: string,
  taskLineNumber: number,
  newDetails: string | undefined,
  taskDepth: number
): string => {
  const lines = content.split('\n');

  if (taskLineNumber >= lines.length) return content;

  // Remove existing details
  const { cleanedLines } = removeExistingDetails(lines, taskLineNumber, taskDepth);

  // Insert new details if provided
  if (newDetails) {
    const indent = '  '.repeat(taskDepth + 1); // 2-space indentation for GFM
    const detailLines = newDetails.split('\n').map((line) => {
      return line ? `${indent}${line}` : '';
    });

    // Insert after task line
    cleanedLines.splice(taskLineNumber + 1, 0, ...detailLines);
  }

  return cleanedLines.join('\n');
};
