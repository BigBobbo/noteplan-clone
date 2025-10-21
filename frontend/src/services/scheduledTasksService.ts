import type { ParsedTask } from './taskService';
import { parseTaskLink } from './linkService';
import { useGlobalTaskStore } from '../store/globalTaskStore';

export interface ScheduledTaskInstance {
  taskId: string;
  task: ParsedTask;
  sourceFile: string;
  timeSlots: TimeSlot[];
  completedForDay: boolean; // Track if marked "done for today"
}

export interface TimeSlot {
  start: string;
  end: string;
  line: number; // Line number in the daily note
}

/**
 * Parse scheduled tasks from a daily note's timeblocking section
 * Groups tasks by their ID and collects all time slots
 */
export const parseScheduledTasks = (
  dailyNoteContent: string,
  date: Date
): ScheduledTaskInstance[] => {
  const lines = dailyNoteContent.split('\n');
  const taskMap = new Map<string, ScheduledTaskInstance>();

  let inTimeblockingSection = false;

  lines.forEach((line, lineNum) => {
    // Detect timeblocking section
    if (line.trim() === '## Timeblocking') {
      inTimeblockingSection = true;
      return;
    }

    // Stop at next section
    if (inTimeblockingSection && line.startsWith('##')) {
      inTimeblockingSection = false;
      return;
    }

    if (!inTimeblockingSection) return;

    // Parse time block references: + 09:00-10:00 [[Task Name]] #timeblock
    const timeBlockMatch = line.match(/^[+*-]\s*(\d{2}:\d{2})-(\d{2}:\d{2})\s+\[\[([^\]]+)\]\]/);
    if (!timeBlockMatch) return;

    const [, start, end, taskName] = timeBlockMatch;

    // Find the actual task from global store
    const task = findTaskByName(taskName.trim());
    if (!task) {
      console.warn(`Could not resolve task reference: [[${taskName}]]`);
      return;
    }

    const timeSlot: TimeSlot = { start, end, line: lineNum };

    // Group by task ID
    if (taskMap.has(task.id)) {
      taskMap.get(task.id)!.timeSlots.push(timeSlot);
    } else {
      taskMap.set(task.id, {
        taskId: task.id,
        task,
        sourceFile: task.file,
        timeSlots: [timeSlot],
        completedForDay: checkIfCompletedForDay(task.id, date),
      });
    }
  });

  // Convert map to array and sort by first time slot
  return Array.from(taskMap.values()).sort((a, b) => {
    const timeA = a.timeSlots[0]?.start || '99:99';
    const timeB = b.timeSlots[0]?.start || '99:99';
    return timeA.localeCompare(timeB);
  });
};

/**
 * Find a task by name using the global task store
 */
const findTaskByName = (taskName: string): ParsedTask | null => {
  const { allGlobalTasks } = useGlobalTaskStore.getState();

  // Clean the task name for comparison
  const cleanSearchName = taskName.trim().toLowerCase();

  // Search all tasks (including nested)
  const searchRecursive = (tasks: ParsedTask[]): ParsedTask | null => {
    for (const task of tasks) {
      const cleanTaskText = task.text
        .replace(/#[a-zA-Z0-9_-]+/g, '') // Remove tags
        .replace(/>[\d-]+/g, '') // Remove dates
        .trim()
        .toLowerCase();

      if (cleanTaskText === cleanSearchName || cleanTaskText.includes(cleanSearchName)) {
        return task;
      }

      // Search children
      if (task.children && task.children.length > 0) {
        const found = searchRecursive(task.children);
        if (found) return found;
      }
    }
    return null;
  };

  return searchRecursive(allGlobalTasks);
};

/**
 * Check if a task has been marked "done for today" for this specific date
 * Uses localStorage to persist daily completion state
 */
const checkIfCompletedForDay = (taskId: string, date: Date): boolean => {
  const dateKey = formatDateKey(date);
  const storageKey = `daily-completion-${dateKey}`;

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return false;

    const completedTasks: string[] = JSON.parse(stored);
    return completedTasks.includes(taskId);
  } catch (error) {
    console.error('Error reading daily completion state:', error);
    return false;
  }
};

/**
 * Mark a task as "done for today" or unmark it
 * This does NOT affect the source task state
 */
export const toggleDailyCompletion = (
  taskId: string,
  date: Date,
  completed: boolean
): void => {
  const dateKey = formatDateKey(date);
  const storageKey = `daily-completion-${dateKey}`;

  try {
    let completedTasks: string[] = [];
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      completedTasks = JSON.parse(stored);
    }

    if (completed) {
      if (!completedTasks.includes(taskId)) {
        completedTasks.push(taskId);
      }
    } else {
      completedTasks = completedTasks.filter(id => id !== taskId);
    }

    localStorage.setItem(storageKey, JSON.stringify(completedTasks));
  } catch (error) {
    console.error('Error saving daily completion state:', error);
  }
};

/**
 * Format date as YYYYMMDD for storage keys
 */
const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Get human-readable source file name
 */
export const getSourceFileName = (filePath: string): string => {
  const fileName = filePath.split('/').pop() || filePath;
  return fileName.replace('.txt', '');
};

/**
 * Format time slots for display
 * Examples:
 *   - Single slot: "09:00-10:00"
 *   - Multiple slots: "09:00-10:00, 14:00-15:00"
 */
export const formatTimeSlots = (timeSlots: TimeSlot[]): string => {
  return timeSlots
    .map(slot => `${slot.start}-${slot.end}`)
    .join(', ');
};

/**
 * Build an index of all scheduled tasks from calendar files
 * Returns Map<taskId, scheduledDates[]>
 */
export const buildScheduledTaskIndex = async (): Promise<Map<string, Date[]>> => {
  const index = new Map<string, Date[]>();

  // This would need to scan all calendar files
  // For now, we'll return an empty map
  // TODO: Implement calendar file scanning

  return index;
};

/**
 * Check if a task is scheduled for any date
 * This is a placeholder - in a full implementation, this would query
 * the calendar files or maintain an in-memory index
 */
export const isTaskScheduled = (taskId: string): boolean => {
  // TODO: Implement by checking calendar files for references to this task
  return false;
};
