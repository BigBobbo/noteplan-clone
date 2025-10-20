import { create } from 'zustand';
import { api } from '../services/api';
import { toNotePlanDate, getPreviousDay, getNextDay, getPreviousMonth, getNextMonth } from '../utils/dateUtils';
import type { TimeBlock } from '../utils/timeBlockUtils';
import type { FileData } from '../types';
import { useFileStore } from './fileStore';

export type CalendarView = 'day' | 'week' | 'month';

interface CalendarStore {
  currentDate: Date;
  view: CalendarView;
  timeBlocks: TimeBlock[];
  dailyNotes: Map<string, FileData>;
  loading: boolean;
  error: string | null;
  showTimeline: boolean;

  // Date navigation
  setDate: (date: Date) => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;

  // View management
  setView: (view: CalendarView) => void;
  toggleTimeline: () => void;

  // Daily note operations
  loadDailyNote: (date: Date) => Promise<void>;
  createDailyNote: (date: Date) => Promise<void>;

  // Time block operations
  loadTimeBlocks: (date: Date) => Promise<void>;
  refreshTimeBlocks: () => Promise<void>; // Refresh current date's time blocks
  addTimeBlock: (block: Omit<TimeBlock, 'id' | 'line'>) => Promise<void>;
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => Promise<void>;
  deleteTimeBlock: (id: string) => Promise<void>;

  // Utility
  clearError: () => void;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  currentDate: new Date(),
  view: 'day',
  timeBlocks: [],
  dailyNotes: new Map(),
  loading: false,
  error: null,
  showTimeline: true,

  setDate: (date: Date) => {
    set({ currentDate: date });
    // Automatically load the daily note for the new date
    get().loadDailyNote(date);
  },

  goToToday: () => {
    const today = new Date();
    get().setDate(today);
  },

  goToPrevious: () => {
    const { currentDate, view } = get();
    let newDate: Date;

    if (view === 'day') {
      newDate = getPreviousDay(currentDate);
    } else if (view === 'month') {
      newDate = getPreviousMonth(currentDate);
    } else {
      // week view
      newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
    }

    get().setDate(newDate);
  },

  goToNext: () => {
    const { currentDate, view } = get();
    let newDate: Date;

    if (view === 'day') {
      newDate = getNextDay(currentDate);
    } else if (view === 'month') {
      newDate = getNextMonth(currentDate);
    } else {
      // week view
      newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
    }

    get().setDate(newDate);
  },

  setView: (view: CalendarView) => {
    set({ view });
  },

  toggleTimeline: () => {
    set((state) => ({ showTimeline: !state.showTimeline }));
  },

  loadDailyNote: async (date: Date) => {
    try {
      set({ loading: true, error: null });

      const dateStr = toNotePlanDate(date);
      const fileData = await api.getDailyNote(dateStr);

      // Update daily notes cache
      const { dailyNotes } = get();
      dailyNotes.set(dateStr, fileData);
      set({ dailyNotes: new Map(dailyNotes) });

      // Set as current file in fileStore
      useFileStore.getState().setCurrentFile(fileData);

      // Load time blocks
      await get().loadTimeBlocks(date);

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to load daily note:', error);
    }
  },

  createDailyNote: async (date: Date) => {
    try {
      set({ loading: true, error: null });

      const dateStr = toNotePlanDate(date);
      const fileData = await api.getDailyNote(dateStr);

      // Update daily notes cache
      const { dailyNotes } = get();
      dailyNotes.set(dateStr, fileData);
      set({ dailyNotes: new Map(dailyNotes) });

      // Set as current file
      useFileStore.getState().setCurrentFile(fileData);

      // Load time blocks
      await get().loadTimeBlocks(date);

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to create daily note:', error);
    }
  },

  loadTimeBlocks: async (date: Date) => {
    try {
      const dateStr = toNotePlanDate(date);
      const response = await api.getTimeBlocks(dateStr);

      set({ timeBlocks: response.timeBlocks || [] });
    } catch (error: any) {
      console.error('Failed to load time blocks:', error);
      // Don't set error state for time blocks, just use empty array
      set({ timeBlocks: [] });
    }
  },

  refreshTimeBlocks: async () => {
    const { currentDate } = get();
    await get().loadTimeBlocks(currentDate);
  },

  addTimeBlock: async (block: Omit<TimeBlock, 'id' | 'line'>) => {
    try {
      const fileStore = useFileStore.getState();
      const { currentFile } = fileStore;

      if (!currentFile) {
        throw new Error('No file is currently open');
      }

      // Import time block utilities
      const { insertTimeBlockInContent } = await import('../utils/timeBlockUtils');

      // Insert the time block into the content
      const newContent = insertTimeBlockInContent(currentFile.content, block);

      // Save the file
      await fileStore.saveFile(currentFile.metadata.path, newContent);

      // Reload time blocks
      await get().loadTimeBlocks(get().currentDate);
    } catch (error: any) {
      set({ error: error.message });
      console.error('Failed to add time block:', error);
      throw error;
    }
  },

  updateTimeBlock: async (id: string, updates: Partial<TimeBlock>) => {
    try {
      const fileStore = useFileStore.getState();
      const { currentFile } = fileStore;

      if (!currentFile) {
        throw new Error('No file is currently open');
      }

      // Find the time block
      const { timeBlocks } = get();
      const block = timeBlocks.find(b => b.id === id);

      if (!block) {
        throw new Error('Time block not found');
      }

      // Create updated block
      const updatedBlock = {
        start: updates.start || block.start,
        end: updates.end || block.end,
        description: updates.description || block.description
      };

      // Import time block utilities
      const { updateTimeBlockInContent } = await import('../utils/timeBlockUtils');

      // Update the time block in the content
      const newContent = updateTimeBlockInContent(currentFile.content, block, updatedBlock);

      console.log('📝 Updated content, saving file...');

      // Save the file
      await fileStore.saveFile(currentFile.metadata.path, newContent);

      console.log('💾 File saved, reloading timeblocks...');

      // Reload time blocks
      await get().loadTimeBlocks(get().currentDate);

      const reloadedBlocks = get().timeBlocks;
      console.log('🔄 Timeblocks reloaded. Count:', reloadedBlocks.length, 'First block:', reloadedBlocks[0]);
    } catch (error: any) {
      set({ error: error.message });
      console.error('Failed to update time block:', error);
      throw error;
    }
  },

  deleteTimeBlock: async (id: string) => {
    try {
      const fileStore = useFileStore.getState();
      const { currentFile } = fileStore;

      if (!currentFile) {
        throw new Error('No file is currently open');
      }

      // Find the time block
      const { timeBlocks } = get();
      const block = timeBlocks.find(b => b.id === id);

      if (!block) {
        throw new Error('Time block not found');
      }

      // Import time block utilities
      const { deleteTimeBlockFromContent } = await import('../utils/timeBlockUtils');

      // Delete the time block from the content
      const newContent = deleteTimeBlockFromContent(currentFile.content, block);

      // Save the file
      await fileStore.saveFile(currentFile.metadata.path, newContent);

      // Reload time blocks
      await get().loadTimeBlocks(get().currentDate);
    } catch (error: any) {
      set({ error: error.message });
      console.error('Failed to delete time block:', error);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
