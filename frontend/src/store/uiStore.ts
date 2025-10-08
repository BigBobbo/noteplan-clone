import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, EditorMode } from '../types';

interface UIStore {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarWidth: number;

  // Theme
  theme: Theme;

  // Editor
  editorMode: EditorMode;

  // Modals
  newFileModalOpen: boolean;
  deleteConfirmOpen: boolean;
  settingsModalOpen: boolean;
  commandPaletteOpen: boolean;
  fileToDelete: string | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setEditorMode: (mode: EditorMode) => void;
  openNewFileModal: () => void;
  closeNewFileModal: () => void;
  openDeleteConfirm: (path: string) => void;
  closeDeleteConfirm: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  toggleCommandPalette: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarWidth: 300,
      theme: 'light',
      editorMode: 'wysiwyg',
      newFileModalOpen: false,
      deleteConfirmOpen: false,
      settingsModalOpen: false,
      commandPaletteOpen: false,
      fileToDelete: null,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';

          // Update DOM
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }

          return { theme: newTheme };
        }),

      setTheme: (theme) => {
        // Update DOM
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        set({ theme });
      },

      setEditorMode: (mode) => set({ editorMode: mode }),

      openNewFileModal: () => set({ newFileModalOpen: true }),
      closeNewFileModal: () => set({ newFileModalOpen: false }),

      openDeleteConfirm: (path) =>
        set({ deleteConfirmOpen: true, fileToDelete: path }),
      closeDeleteConfirm: () =>
        set({ deleteConfirmOpen: false, fileToDelete: null }),

      openSettingsModal: () => set({ settingsModalOpen: true }),
      closeSettingsModal: () => set({ settingsModalOpen: false }),

      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
    }),
    {
      name: 'noteplan-ui-storage',
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        theme: state.theme,
        editorMode: state.editorMode,
      }),
    }
  )
);
