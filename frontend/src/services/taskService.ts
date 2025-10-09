import type { Task } from '../types';

export interface ParsedTask extends Task {
  id: string;
  text: string;
  completed: boolean;
  scheduled: boolean;
  cancelled: boolean;
  canceled: boolean; // Alias for compatibility
  important: boolean;
  priority?: 1 | 2 | 3 | 4;  // NEW: Priority level
  date?: Date;
  mentions: string[];
  tags: string[];
  line: number;
  file: string;

  // NEW: Nesting support
  parentId?: string;
  children: ParsedTask[];
  depth: number;
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
 * Calculate indentation level (4 spaces or 1 tab = 1 level)
 */
export const calculateIndentLevel = (line: string): number => {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  const spaces = match[1];
  // Count tabs as 4 spaces
  const normalizedSpaces = spaces.replace(/\t/g, '    ');
  return Math.floor(normalizedSpaces.length / 4);
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
 * Supports formats:
 * * Task name (or + Task name)  # Open task (both * and + supported)
 * * [x] Completed task          # Completed
 * * [>] Scheduled/forwarded     # Moved to future date
 * * [-] Cancelled task          # Cancelled
 * * [!] Important task          # Priority
 * * Task >2025-10-08            # Scheduled for date
 * * Task @person                # Assigned/mentioned
 * * Task #tag                   # Tagged
 */
export const parseTask = (
  line: string,
  lineNumber: number,
  filePath: string
): ParsedTask | null => {
  // Calculate depth before trimming
  const depth = calculateIndentLevel(line);

  // Support both * and + for task markers (standard markdown)
  const taskRegex = /^\s*[*+] (\[([xX>\-!])\] )?(.+)$/;
  const match = line.match(taskRegex);

  if (!match) return null;

  const [_, __, status, text] = match;

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

  const isCancelled = status === '-';

  return {
    id: `${filePath}-${lineNumber}`,
    text: cleanText,
    completed: status === 'x' || status === 'X',
    scheduled: status === '>',
    cancelled: isCancelled,
    canceled: isCancelled, // Alias for compatibility
    important: status === '!',
    priority,
    date: scheduledDate,
    mentions,
    tags,
    line: lineNumber,
    file: filePath,
    depth,
    children: [],
    parentId: undefined,
  };
};

/**
 * Parse all tasks from file content and build hierarchy
 */
export const parseTasksFromContent = (
  content: string,
  filePath: string
): ParsedTask[] => {
  const lines = content.split('\n');
  const tasks: ParsedTask[] = [];

  lines.forEach((line, index) => {
    const task = parseTask(line, index, filePath);
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
export type TaskFilter = 'all' | 'active' | 'completed' | 'today' | 'scheduled';

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
    case 'all':
    default:
      return tasks;
  }
};

/**
 * Toggle task completion status in content
 */
export const toggleTaskInContent = (
  content: string,
  lineNumber: number
): string => {
  const lines = content.split('\n');
  const line = lines[lineNumber];

  if (!line) return content;

  // Support both * and + markers
  const isCompleted = /^\s*[*+] \[[xX]\]/.test(line);

  // Toggle the status - preserve original marker and indentation
  const newLine = isCompleted
    ? line.replace(/^(\s*[*+]) \[[xX]\]/, '$1')
    : line.replace(/^(\s*)([*+])/, '$1$2 [x]');

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
