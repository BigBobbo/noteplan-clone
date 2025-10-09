import { useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import { useTaskStore } from '../store/taskStore';
import { useLinkStore } from '../store/linkStore';
import { useTaskOrderStore } from '../store/taskOrderStore';
import {
  parseTasksFromContent,
  toggleTaskInContent,
  updateTaskDateInContent,
  type ParsedTask,
} from '../services/taskService';
import { createTaskReference } from '../services/linkService';
import { toNotePlanDate } from '../utils/dateUtils';
import type { TimeBlockRef, TaskReference } from '../types';
import { api } from '../services/api';

export const useTasks = () => {
  const { currentFile, saveFile } = useFileStore();
  const { tasks, setTasks, filter, setFilter, getFilteredTasks } =
    useTaskStore();
  const { addTaskReference } = useLinkStore();

  // Subscribe to taskRanks for current file
  const taskRanks = useTaskOrderStore((state) =>
    currentFile ? state.taskRanks.get(currentFile.metadata.path) : undefined
  );

  // Load ranks from storage when file path changes
  useEffect(() => {
    if (currentFile) {
      const { loadFromStorage } = useTaskOrderStore.getState();
      loadFromStorage(currentFile.metadata.path);
    }
  }, [currentFile?.metadata.path]);

  // Parse tasks from current file and apply ranks
  useEffect(() => {
    if (currentFile) {
      console.log('Parsing tasks from file:', currentFile.metadata.path);
      console.log('File content length:', currentFile.content.length);

      const filePath = currentFile.metadata.path;
      const fileTasks = parseTasksFromContent(
        currentFile.content,
        filePath
      );

      // Apply ranks to tasks (taskRanks from hook subscription)
      const tasksWithRanks = applyRanksToTasks(fileTasks, taskRanks);

      console.log('Parsed tasks:', tasksWithRanks.length, tasksWithRanks);
      setTasks(tasksWithRanks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFile?.metadata.path, currentFile?.content, taskRanks]);

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentFile) return;

    const newContent = toggleTaskInContent(currentFile.content, task.line);
    await saveFile(currentFile.metadata.path, newContent);
  };

  const rescheduleTask = async (taskId: string, newDate: Date | null) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentFile) return;

    const newContent = updateTaskDateInContent(
      currentFile.content,
      task.line,
      newDate
    );
    await saveFile(currentFile.metadata.path, newContent);
  };

  /**
   * Create a task reference in a daily note
   * This is used when dragging a task to the calendar
   */
  const createTaskReferenceInDailyNote = async (
    taskId: string,
    targetDate: Date,
    timeBlock?: TimeBlockRef
  ) => {
    // Find the task
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }

    // Get or create daily note for targetDate
    const dateStr = toNotePlanDate(targetDate);
    const dailyNotePath = `Calendar/${dateStr}.txt`;

    try {
      // Load or create the daily note
      const dailyNote = await api.getDailyNote(dateStr);

      // Create the reference line
      const referenceLine = createTaskReference(task, timeBlock);

      // Determine which section to add to
      const sectionHeader = timeBlock ? '## Timeblocking' : '## Tasks';

      // Add reference to the appropriate section
      const updatedContent = appendToSection(
        dailyNote.content,
        sectionHeader,
        referenceLine
      );

      // Save the daily note
      await saveFile(dailyNotePath, updatedContent);

      // Update the link index
      const reference: TaskReference = {
        id: `${dailyNotePath}:${updatedContent.split('\n').length}`,
        taskId: task.id,
        sourceFile: task.file,
        date: targetDate,
        timeBlock,
        type: timeBlock ? 'timeblock' : 'reference',
        createdAt: new Date(),
      };

      addTaskReference(taskId, reference);

      console.log('Task reference created:', reference);
    } catch (error) {
      console.error('Failed to create task reference:', error);
      throw error;
    }
  };

  return {
    tasks: getFilteredTasks(),
    allTasks: tasks,
    filter,
    setFilter,
    toggleTask,
    rescheduleTask,
    createTaskReferenceInDailyNote,
  };
};

/**
 * Append a line to a specific section in markdown content
 * Creates the section if it doesn't exist
 */
function appendToSection(
  content: string,
  sectionHeader: string,
  line: string
): string {
  const lines = content.split('\n');

  // Find the section
  const sectionIndex = lines.findIndex((l) => l.trim() === sectionHeader);

  if (sectionIndex === -1) {
    // Section doesn't exist, append at end
    return content + `\n\n${sectionHeader}\n${line}`;
  }

  // Find the next section or end of file
  let insertIndex = sectionIndex + 1;
  while (insertIndex < lines.length && !lines[insertIndex].startsWith('##')) {
    insertIndex++;
  }

  // Insert the line before the next section
  lines.splice(insertIndex, 0, line);

  return lines.join('\n');
}

/**
 * Apply ranks to tasks recursively
 */
function applyRanksToTasks(
  tasks: ParsedTask[],
  ranks?: Map<string, number>
): ParsedTask[] {
  if (!ranks) return tasks;

  return tasks.map((task) => ({
    ...task,
    rank: ranks.get(task.id),
    children: applyRanksToTasks(task.children, ranks),
  }));
}
