import { useEffect } from 'react';
import { useFileStore } from '../store/fileStore';
import { useTaskStore } from '../store/taskStore';
import {
  parseTasksFromContent,
  toggleTaskInContent,
  updateTaskDateInContent,
} from '../services/taskService';

export const useTasks = () => {
  const { currentFile, saveFile } = useFileStore();
  const { tasks, setTasks, filter, setFilter, getFilteredTasks } =
    useTaskStore();

  // Parse tasks from current file
  useEffect(() => {
    // Parse current file tasks
    if (currentFile) {
      const fileTasks = parseTasksFromContent(
        currentFile.content,
        currentFile.metadata.path
      );
      setTasks(fileTasks);
    }
  }, [currentFile, setTasks]);

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

  return {
    tasks: getFilteredTasks(),
    allTasks: tasks,
    filter,
    setFilter,
    toggleTask,
    rescheduleTask,
  };
};
