import { create } from 'zustand';

interface TaskDetailsStore {
  // Global toggle state (master toggle visibility)
  masterToggleVisible: boolean;

  // Per-task collapsed state (Set of taskId that are explicitly collapsed)
  // When master toggle is ON, tasks NOT in this set are shown by default
  collapsedTasks: Set<string>;

  // Actions
  toggleMasterVisibility: () => void;
  setMasterVisibility: (visible: boolean) => void;
  toggleExpansion: (taskId: string) => void;
  setCollapsed: (taskId: string, collapsed: boolean) => void;
  isCollapsed: (taskId: string) => boolean;

  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const useTaskDetailsStore = create<TaskDetailsStore>((set, get) => ({
  masterToggleVisible: true,
  collapsedTasks: new Set(),

  toggleMasterVisibility: () => {
    set((state) => {
      const newVisibility = !state.masterToggleVisible;

      // When turning master toggle ON, clear all collapsed states
      // (start fresh with all details expanded)
      const newCollapsed = newVisibility ? new Set<string>() : state.collapsedTasks;

      localStorage.setItem('showTaskDetails', JSON.stringify(newVisibility));
      return {
        masterToggleVisible: newVisibility,
        collapsedTasks: newCollapsed
      };
    });
  },

  setMasterVisibility: (visible: boolean) => {
    set({ masterToggleVisible: visible });
    localStorage.setItem('showTaskDetails', JSON.stringify(visible));
  },

  toggleExpansion: (taskId: string) => {
    set((state) => {
      const newCollapsed = new Set(state.collapsedTasks);

      if (newCollapsed.has(taskId)) {
        // Task is collapsed, expand it (remove from set)
        newCollapsed.delete(taskId);
      } else {
        // Task is expanded, collapse it (add to set)
        newCollapsed.add(taskId);
      }

      return { collapsedTasks: newCollapsed };
    });
  },

  setCollapsed: (taskId: string, collapsed: boolean) => {
    set((state) => {
      const newCollapsed = new Set(state.collapsedTasks);
      if (collapsed) {
        newCollapsed.add(taskId);
      } else {
        newCollapsed.delete(taskId);
      }
      return { collapsedTasks: newCollapsed };
    });
  },

  isCollapsed: (taskId: string) => {
    return get().collapsedTasks.has(taskId);
  },

  loadFromStorage: () => {
    const stored = localStorage.getItem('showTaskDetails');
    if (stored) {
      try {
        set({ masterToggleVisible: JSON.parse(stored) });
      } catch (error) {
        console.error('Failed to load showTaskDetails from localStorage:', error);
      }
    }
  },

  saveToStorage: () => {
    const { masterToggleVisible } = get();
    localStorage.setItem('showTaskDetails', JSON.stringify(masterToggleVisible));
  },
}));

// Initialize from localStorage on import
useTaskDetailsStore.getState().loadFromStorage();
