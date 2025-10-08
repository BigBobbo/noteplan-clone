import type { Task } from '../types';

export interface ParsedTask extends Task {
  id: string;
  text: string;
  completed: boolean;
  scheduled: boolean;
  cancelled: boolean;
  canceled: boolean; // Alias for compatibility
  important: boolean;
  date?: Date;
  mentions: string[];
  tags: string[];
  line: number;
  file: string;
}

/**
 * Parse a single line to extract task information
 * Supports formats:
 * * Task name                    # Open task
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
  const taskRegex = /^\* (\[([xX>\-!])\] )?(.+)$/;
  const match = line.trim().match(taskRegex);

  if (!match) return null;

  const [_, __, status, text] = match;

  // Extract date references (>2025-10-08)
  const dateMatch = text.match(/>(\d{4}-\d{2}-\d{2})/);
  const scheduledDate = dateMatch ? new Date(dateMatch[1]) : undefined;

  // Extract mentions (@person)
  const mentions = [...text.matchAll(/@([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);

  // Extract tags (#tag)
  const tags = [...text.matchAll(/#([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);

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
    date: scheduledDate,
    mentions,
    tags,
    line: lineNumber,
    file: filePath,
  };
};

/**
 * Parse all tasks from file content
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

  return tasks;
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

  // Check if currently completed
  const isCompleted = /^\* \[[xX]\]/.test(line.trim());

  // Toggle the status
  const newLine = isCompleted
    ? line.replace(/^\* \[[xX]\]/, '* ')
    : line.replace(/^\*/, '* [x]');

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
