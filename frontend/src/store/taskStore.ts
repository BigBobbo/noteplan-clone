import { create } from 'zustand';
import type { ParsedTask, TaskFilter } from '../services/taskService';

interface TaskStore {
  tasks: ParsedTask[];
  filter: TaskFilter;
  loading: boolean;
  expandedTasks: Set<string>; // Track which parent tasks are expanded

  // Actions
  setTasks: (tasks: ParsedTask[]) => void;
  addTask: (task: ParsedTask) => void;
  updateTask: (taskId: string, updates: Partial<ParsedTask>) => void;
  removeTask: (taskId: string) => void;
  setFilter: (filter: TaskFilter) => void;
  getFilteredTasks: () => ParsedTask[];

  // NEW: Hierarchy actions
  toggleSubtasks: (taskId: string) => void;
  isTaskExpanded: (taskId: string) => boolean;
  updateTaskPriority: (taskId: string, priority: 1 | 2 | 3 | 4) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  filter: 'all',
  loading: false,
  expandedTasks: new Set<string>(),

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

    const filterTask = (task: ParsedTask): boolean => {
      switch (filter) {
        case 'active':
          return !task.completed && !task.cancelled;
        case 'completed':
          return task.completed;
        case 'today':
          if (task.date) {
            const taskDate = new Date(task.date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() === today.getTime();
          }
          return false;
        case 'scheduled':
          return task.date !== undefined;
        case 'all':
        default:
          return true;
      }
    };

    const filterRecursive = (tasks: ParsedTask[]): ParsedTask[] => {
      return tasks
        .filter(filterTask)
        .map((task) => ({
          ...task,
          children: filterRecursive(task.children),
        }));
    };

    return filterRecursive(tasks);
  },

  toggleSubtasks: (taskId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedTasks);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      return { expandedTasks: newExpanded };
    }),

  isTaskExpanded: (taskId) => {
    const { expandedTasks } = get();
    return expandedTasks.has(taskId);
  },

  updateTaskPriority: (taskId, priority) =>
    set((state) => {
      const updateRecursive = (tasks: ParsedTask[]): ParsedTask[] => {
        return tasks.map((task) => {
          if (task.id === taskId) {
            return { ...task, priority };
          }
          return {
            ...task,
            children: updateRecursive(task.children),
          };
        });
      };

      return { tasks: updateRecursive(state.tasks) };
    }),
}));
