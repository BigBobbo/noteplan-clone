/**
 * Cross-File Task Service
 *
 * Enables task operations (toggle, reschedule, etc.) on tasks from any file,
 * not just the currently open file.
 *
 * Responsibilities:
 * 1. Load file content (from API or currentFile cache)
 * 2. Apply task operations using taskService utilities
 * 3. Save updated content to disk
 * 4. Re-index global task store
 * 5. Handle edge cases (file conflicts, missing files)
 */

import { api } from './api';
import { toggleTaskInContent, updateTaskDateInContent } from './taskService';
import { useFileStore } from '../store/fileStore';
import { useGlobalTaskStore } from '../store/globalTaskStore';
import type { ParsedTask } from './taskService';

/**
 * Toggle task completion for a task in any file
 *
 * @param task - The task to toggle (must have .file and .line properties)
 * @returns Promise that resolves when operation completes
 * @throws Error if file cannot be loaded or saved
 */
export async function toggleTaskAcrossFiles(task: ParsedTask): Promise<void> {
  console.log('[CrossFileTask] Toggling task:', task.id, 'in file:', task.file);

  try {
    // 1. Get file content
    const content = await getFileContent(task.file);

    if (!content) {
      throw new Error(`Could not load content for file: ${task.file}`);
    }

    // 2. Toggle task in content
    const updatedContent = toggleTaskInContent(content, task.line);

    // 3. Save updated content
    const { saveFile } = useFileStore.getState();
    await saveFile(task.file, updatedContent);

    // 4. Re-index the file in global store
    const { indexFile } = useGlobalTaskStore.getState();
    indexFile(task.file, updatedContent);

    console.log('[CrossFileTask] Task toggled successfully');

  } catch (error) {
    console.error('[CrossFileTask] Failed to toggle task:', error);
    throw error;
  }
}

/**
 * Reschedule task in any file
 *
 * @param task - The task to reschedule
 * @param newDate - New date, or null to remove date
 * @returns Promise that resolves when operation completes
 */
export async function rescheduleTaskAcrossFiles(
  task: ParsedTask,
  newDate: Date | null
): Promise<void> {
  console.log('[CrossFileTask] Rescheduling task:', task.id, 'to:', newDate);

  try {
    // 1. Get file content
    const content = await getFileContent(task.file);

    if (!content) {
      throw new Error(`Could not load content for file: ${task.file}`);
    }

    // 2. Update task date in content
    const updatedContent = updateTaskDateInContent(content, task.line, newDate);

    // 3. Save updated content
    const { saveFile } = useFileStore.getState();
    await saveFile(task.file, updatedContent);

    // 4. Re-index the file in global store
    const { indexFile } = useGlobalTaskStore.getState();
    indexFile(task.file, updatedContent);

    console.log('[CrossFileTask] Task rescheduled successfully');

  } catch (error) {
    console.error('[CrossFileTask] Failed to reschedule task:', error);
    throw error;
  }
}

/**
 * Get file content from cache or API
 *
 * Performance optimization: If the file is currentFile, use cached content.
 * Otherwise, load from API.
 *
 * @param filePath - Path to the file
 * @returns File content as string
 */
async function getFileContent(filePath: string): Promise<string> {
  // Check if this is the currently open file (use cached content)
  const { currentFile } = useFileStore.getState();

  if (currentFile && currentFile.metadata.path === filePath) {
    console.log('[CrossFileTask] Using cached content for currentFile');
    return currentFile.content;
  }

  // File is not open - load from API
  console.log('[CrossFileTask] Loading content from API for:', filePath);
  const fileData = await api.getFile(filePath);
  return fileData.content;
}

/**
 * Batch toggle multiple tasks (future enhancement)
 *
 * Useful for "complete all tasks in this file" or "clear completed tasks"
 *
 * @param tasks - Array of tasks to toggle
 */
export async function batchToggleTasks(tasks: ParsedTask[]): Promise<void> {
  // Group tasks by file to minimize API calls
  const tasksByFile = new Map<string, ParsedTask[]>();

  tasks.forEach(task => {
    const fileTasks = tasksByFile.get(task.file) || [];
    fileTasks.push(task);
    tasksByFile.set(task.file, fileTasks);
  });

  // Process each file
  const promises = Array.from(tasksByFile.entries()).map(async ([filePath, fileTasks]) => {
    console.log(`[CrossFileTask] Batch toggling ${fileTasks.length} tasks in ${filePath}`);

    // Get file content once
    let content = await getFileContent(filePath);

    // Toggle all tasks in this file
    // Sort by line number descending to avoid line number shifts
    const sortedTasks = [...fileTasks].sort((a, b) => b.line - a.line);

    for (const task of sortedTasks) {
      content = toggleTaskInContent(content, task.line);
    }

    // Save once
    const { saveFile } = useFileStore.getState();
    await saveFile(filePath, content);

    // Re-index once
    const { indexFile } = useGlobalTaskStore.getState();
    indexFile(filePath, content);
  });

  await Promise.all(promises);
  console.log('[CrossFileTask] Batch toggle completed');
}
