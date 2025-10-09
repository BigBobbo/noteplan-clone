import { create } from 'zustand';
import {
  saveTaskOrder,
  loadTaskOrder,
  clearTaskOrder,
  cleanupOrphanedRanks,
} from '../utils/taskOrderStorage';
import { calculateNewRank, reRankTasks, needsReRanking } from '../utils/rankCalculator';
import type { ParsedTask } from '../services/taskService';

interface TaskOrderStore {
  // Map of file path -> task ranks
  taskRanks: Map<string, Map<string, number>>;

  // Actions
  setTaskRank: (filePath: string, taskId: string, rank: number) => void;
  getTaskRank: (filePath: string, taskId: string) => number | undefined;
  reorderTasks: (filePath: string, tasks: ParsedTask[]) => void;
  resetOrder: (filePath: string) => void;
  cleanupOrphans: (filePath: string, validTaskIds: string[]) => void;
  loadFromStorage: (filePath: string) => void;
  saveToStorage: (filePath: string) => void;
}

export const useTaskOrderStore = create<TaskOrderStore>((set, get) => ({
  taskRanks: new Map(),

  setTaskRank: (filePath, taskId, rank) => {
    set((state) => {
      const newRanks = new Map(state.taskRanks);
      const fileRanks = new Map(newRanks.get(filePath) || []);
      fileRanks.set(taskId, rank);
      newRanks.set(filePath, fileRanks);
      return { taskRanks: newRanks };
    });

    // Save to localStorage
    const fileRanks = get().taskRanks.get(filePath);
    if (fileRanks) {
      saveTaskOrder(filePath, fileRanks);
    }
  },

  getTaskRank: (filePath, taskId) => {
    const fileRanks = get().taskRanks.get(filePath);
    return fileRanks?.get(taskId);
  },

  reorderTasks: (filePath, tasks) => {
    // Calculate new ranks for all tasks
    const newRanks = new Map<string, number>();

    tasks.forEach((task, index) => {
      const newRank = calculateNewRank(index, tasks);
      newRanks.set(task.id, newRank);
    });

    // Check if re-ranking is needed
    const tasksWithRanks = tasks.map((task) => ({
      ...task,
      rank: newRanks.get(task.id) ?? task.line,
    }));

    if (needsReRanking(tasksWithRanks)) {
      console.log('Re-ranking tasks to avoid collision');
      const reRanked = reRankTasks(tasksWithRanks);
      set((state) => {
        const newTaskRanks = new Map(state.taskRanks);
        newTaskRanks.set(filePath, reRanked);
        return { taskRanks: newTaskRanks };
      });
      saveTaskOrder(filePath, reRanked);
    } else {
      set((state) => {
        const newTaskRanks = new Map(state.taskRanks);
        newTaskRanks.set(filePath, newRanks);
        return { taskRanks: newTaskRanks };
      });
      saveTaskOrder(filePath, newRanks);
    }
  },

  resetOrder: (filePath) => {
    set((state) => {
      const newRanks = new Map(state.taskRanks);
      newRanks.delete(filePath);
      return { taskRanks: newRanks };
    });
    clearTaskOrder(filePath);
  },

  cleanupOrphans: (filePath, validTaskIds) => {
    cleanupOrphanedRanks(filePath, validTaskIds);
    // Reload from storage to get cleaned data
    get().loadFromStorage(filePath);
  },

  loadFromStorage: (filePath) => {
    const ranks = loadTaskOrder(filePath);
    set((state) => {
      const newRanks = new Map(state.taskRanks);
      newRanks.set(filePath, ranks);
      return { taskRanks: newRanks };
    });
  },

  saveToStorage: (filePath) => {
    const fileRanks = get().taskRanks.get(filePath);
    if (fileRanks) {
      saveTaskOrder(filePath, fileRanks);
    }
  },
}));
