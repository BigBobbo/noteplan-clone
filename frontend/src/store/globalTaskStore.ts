import { create } from 'zustand';
import { parseTasksFromContent, type ParsedTask } from '../services/taskService';

interface GlobalTaskStore {
  // Map of file path to tasks in that file
  tasksByFile: Map<string, ParsedTask[]>;

  // All tasks from all files (flattened)
  allGlobalTasks: ParsedTask[];

  // Loading state
  isIndexing: boolean;
  lastIndexTime: Date | null;

  // Actions
  indexFile: (filePath: string, content: string) => void;
  indexMultipleFiles: (files: Array<{ path: string; content: string }>) => void;
  removeFile: (filePath: string) => void;
  getTaskById: (taskId: string) => ParsedTask | undefined;
  getTasksByFile: (filePath: string) => ParsedTask[];
  getAllTasks: () => ParsedTask[];
  clearIndex: () => void;
}

export const useGlobalTaskStore = create<GlobalTaskStore>((set, get) => ({
  tasksByFile: new Map(),
  allGlobalTasks: [],
  isIndexing: false,
  lastIndexTime: null,

  indexFile: (filePath: string, content: string) => {
    console.log('[GlobalTaskStore] Indexing file:', filePath);

    // Parse tasks from the file
    const tasks = parseTasksFromContent(content, filePath);

    // Update the map
    const newTasksByFile = new Map(get().tasksByFile);
    newTasksByFile.set(filePath, tasks);

    // Rebuild the flattened array
    const allTasks: ParsedTask[] = [];
    newTasksByFile.forEach(fileTasks => {
      allTasks.push(...fileTasks);
    });

    set({
      tasksByFile: newTasksByFile,
      allGlobalTasks: allTasks,
      lastIndexTime: new Date()
    });

    console.log(`[GlobalTaskStore] Indexed ${tasks.length} tasks from ${filePath}`);
    console.log(`[GlobalTaskStore] Total tasks across all files: ${allTasks.length}`);
  },

  indexMultipleFiles: (files: Array<{ path: string; content: string }>) => {
    console.log(`[GlobalTaskStore] Indexing ${files.length} files...`);
    set({ isIndexing: true });

    const newTasksByFile = new Map<string, ParsedTask[]>();
    const allTasks: ParsedTask[] = [];

    files.forEach(file => {
      // Skip non-markdown/text files
      if (!file.path.endsWith('.txt') && !file.path.endsWith('.md')) {
        return;
      }

      const tasks = parseTasksFromContent(file.content, file.path);
      console.log(`[GlobalTaskStore] File ${file.path}: found ${tasks.length} tasks`);

      if (tasks.length > 0) {
        newTasksByFile.set(file.path, tasks);
        allTasks.push(...tasks);
      }
    });

    set({
      tasksByFile: newTasksByFile,
      allGlobalTasks: allTasks,
      isIndexing: false,
      lastIndexTime: new Date()
    });

    console.log(`[GlobalTaskStore] Indexing complete:
      - Files with tasks: ${newTasksByFile.size}
      - Total tasks: ${allTasks.length}`);
  },

  removeFile: (filePath: string) => {
    console.log('[GlobalTaskStore] Removing file from index:', filePath);

    const newTasksByFile = new Map(get().tasksByFile);
    newTasksByFile.delete(filePath);

    // Rebuild the flattened array
    const allTasks: ParsedTask[] = [];
    newTasksByFile.forEach(fileTasks => {
      allTasks.push(...fileTasks);
    });

    set({
      tasksByFile: newTasksByFile,
      allGlobalTasks: allTasks
    });
  },

  getTaskById: (taskId: string) => {
    // Search through all tasks to find by ID
    const { allGlobalTasks } = get();

    // Recursive function to search including children
    const findTask = (tasks: ParsedTask[]): ParsedTask | undefined => {
      for (const task of tasks) {
        if (task.id === taskId) {
          return task;
        }
        if (task.children.length > 0) {
          const found = findTask(task.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    return findTask(allGlobalTasks);
  },

  getTasksByFile: (filePath: string) => {
    return get().tasksByFile.get(filePath) || [];
  },

  getAllTasks: () => {
    return get().allGlobalTasks;
  },

  clearIndex: () => {
    set({
      tasksByFile: new Map(),
      allGlobalTasks: [],
      lastIndexTime: null
    });
  }
}));

// Helper function to check if a task exists globally
export const findGlobalTask = (taskId: string): ParsedTask | undefined => {
  return useGlobalTaskStore.getState().getTaskById(taskId);
};

// Helper function to get all tasks from Notes folder
export const getNotesTasksOnly = (): ParsedTask[] => {
  const { tasksByFile } = useGlobalTaskStore.getState();
  const notesTasks: ParsedTask[] = [];

  tasksByFile.forEach((tasks, filePath) => {
    // Only include tasks from Notes folder (not Calendar)
    if (filePath.includes('Notes/') && !filePath.includes('Calendar/')) {
      notesTasks.push(...tasks);
    }
  });

  return notesTasks;
};