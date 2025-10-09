import { create } from 'zustand';
import type { Backlink, LinkGraph } from '../services/linkService';
import type { TaskReference } from '../types';

interface LinkStore {
  backlinks: Backlink[];
  linkGraph: LinkGraph | null;
  taskReferenceIndex: Map<string, TaskReference[]>;
  loading: boolean;

  // Actions
  setBacklinks: (backlinks: Backlink[]) => void;
  setLinkGraph: (graph: LinkGraph) => void;
  clearBacklinks: () => void;

  // Task reference actions
  setTaskReferenceIndex: (index: Map<string, TaskReference[]>) => void;
  getTaskBacklinks: (taskId: string) => TaskReference[];
  addTaskReference: (taskId: string, reference: TaskReference) => void;
  navigateToTask: (taskId: string) => void;
}

export const useLinkStore = create<LinkStore>((set, get) => ({
  backlinks: [],
  linkGraph: null,
  taskReferenceIndex: new Map(),
  loading: false,

  setBacklinks: (backlinks) => set({ backlinks }),

  setLinkGraph: (graph) => set({ linkGraph: graph }),

  clearBacklinks: () => set({ backlinks: [] }),

  setTaskReferenceIndex: (index) => set({ taskReferenceIndex: index }),

  getTaskBacklinks: (taskId) => {
    const { taskReferenceIndex } = get();
    return taskReferenceIndex.get(taskId) || [];
  },

  addTaskReference: (taskId, reference) => {
    const { taskReferenceIndex } = get();
    const existing = taskReferenceIndex.get(taskId) || [];
    existing.push(reference);
    taskReferenceIndex.set(taskId, existing);
    set({ taskReferenceIndex: new Map(taskReferenceIndex) });
  },

  navigateToTask: async (taskId) => {
    // Parse taskId format: "filepath:lineNumber"
    const [filePath, lineNumberStr] = taskId.split(':');
    const lineNumber = parseInt(lineNumberStr, 10);

    // Import stores dynamically to avoid circular dependencies
    const { useFileStore } = await import('./fileStore');
    const { useUIStore } = await import('./uiStore');

    // Load the file
    const fileStore = useFileStore.getState();
    const uiStore = useUIStore.getState();

    try {
      await fileStore.loadFile(filePath);

      // Scroll to the line (with a small delay to ensure editor is ready)
      setTimeout(() => {
        // Dispatch custom event that the editor can listen to
        window.dispatchEvent(new CustomEvent('scroll-to-line', {
          detail: { line: lineNumber, highlight: true }
        }));
      }, 100);
    } catch (error) {
      console.error('Failed to navigate to task:', error);
    }
  },
}));
