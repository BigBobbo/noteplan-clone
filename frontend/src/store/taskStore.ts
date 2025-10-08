import { create } from 'zustand';
import type { ParsedTask, TaskFilter } from '../services/taskService';

interface TaskStore {
  tasks: ParsedTask[];
  filter: TaskFilter;
  loading: boolean;

  // Actions
  setTasks: (tasks: ParsedTask[]) => void;
  addTask: (task: ParsedTask) => void;
  updateTask: (taskId: string, updates: Partial<ParsedTask>) => void;
  removeTask: (taskId: string) => void;
  setFilter: (filter: TaskFilter) => void;
  getFilteredTasks: () => ParsedTask[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  filter: 'all',
  loading: false,

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),

  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    })),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),

  setFilter: (filter) => set({ filter }),

  getFilteredTasks: () => {
    const { tasks, filter } = get();
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
  },
}));
