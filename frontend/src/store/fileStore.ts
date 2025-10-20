import { create } from 'zustand';
import { api } from '../services/api';
import type { FileMetadata, FileData, FolderNode } from '../types';

interface FileStore {
  files: FileMetadata[];
  folders: FolderNode | null;
  currentFile: FileData | null;
  loading: boolean;
  error: string | null;
  lastSaveTimestamp: Record<string, number>; // Track when files were last saved by this client

  // Actions
  loadFiles: () => Promise<void>;
  loadFolders: () => Promise<void>;
  openFile: (path: string) => Promise<void>;
  saveFile: (path: string, content: string) => Promise<void>;
  createFile: (path: string, content?: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  setCurrentFile: (file: FileData | null) => void;
  updateFileInStore: (path: string, content: string) => void;
  addFileToStore: (file: FileMetadata) => void;
  removeFileFromStore: (path: string) => void;
  clearError: () => void;
  shouldIgnoreExternalChange: (path: string) => boolean;
  moveNoteToFolder: (notePath: string, targetFolder: string) => Promise<void>;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  folders: null,
  currentFile: null,
  loading: false,
  error: null,
  lastSaveTimestamp: {},

  loadFiles: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.listFiles();
      set({ files: response.files, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to load files:', error);
    }
  },

  loadFolders: async () => {
    try {
      const response = await api.getFolderTree();
      set({ folders: response.tree });
    } catch (error: any) {
      set({ error: error.message });
      console.error('Failed to load folders:', error);
    }
  },

  openFile: async (path: string) => {
    try {
      set({ loading: true, error: null });
      let fileData = await api.getFile(path);

      // Check if migration to GFM format is needed
      const { hasLegacyFormat, migrateToGFMFormat } = await import('../utils/migrateToGFMFormat');

      if (hasLegacyFormat(fileData.content)) {
        console.log(`[fileStore] Migrating ${path} to GFM format`);
        const migratedContent = migrateToGFMFormat(fileData.content);

        // Save migrated content
        await api.saveFile(path, migratedContent);

        // Update fileData with migrated content
        fileData = {
          ...fileData,
          content: migratedContent,
        };
      }

      set({ currentFile: fileData, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to open file:', error);
    }
  },

  saveFile: async (path: string, content: string) => {
    try {
      // Record timestamp before save
      const saveTimestamp = Date.now();
      set((state) => ({
        lastSaveTimestamp: {
          ...state.lastSaveTimestamp,
          [path]: saveTimestamp,
        },
      }));

      await api.saveFile(path, content);

      // Update current file if it's the one being saved
      const { currentFile } = get();
      if (currentFile && currentFile.metadata.path === path) {
        set({
          currentFile: {
            ...currentFile,
            content,
          },
        });
      }

      // Update file in list
      const { files } = get();
      const fileIndex = files.findIndex((f) => f.path === path);
      if (fileIndex !== -1) {
        const updatedFiles = [...files];
        updatedFiles[fileIndex] = {
          ...updatedFiles[fileIndex],
          modified: new Date().toISOString(),
        };
        set({ files: updatedFiles });
      }
    } catch (error: any) {
      set({ error: error.message });
      console.error('Failed to save file:', error);
      throw error;
    }
  },

  createFile: async (path: string, content = '') => {
    try {
      set({ loading: true, error: null });
      await api.saveFile(path, content);

      // Reload files to get the new file
      await get().loadFiles();

      // Open the new file
      await get().openFile(path);

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to create file:', error);
      throw error;
    }
  },

  deleteFile: async (path: string) => {
    try {
      set({ loading: true, error: null });
      await api.deleteFile(path);

      // Remove from store
      get().removeFileFromStore(path);

      // Clear current file if it was deleted
      const { currentFile } = get();
      if (currentFile && currentFile.metadata.path === path) {
        set({ currentFile: null });
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to delete file:', error);
      throw error;
    }
  },

  setCurrentFile: (file) => set({ currentFile: file }),

  updateFileInStore: (path) => {
    const { files } = get();
    const fileIndex = files.findIndex((f) => f.path === path);
    if (fileIndex !== -1) {
      const updatedFiles = [...files];
      updatedFiles[fileIndex] = {
        ...updatedFiles[fileIndex],
        modified: new Date().toISOString(),
      };
      set({ files: updatedFiles });
    }
  },

  addFileToStore: (file) => {
    const { files } = get();
    set({ files: [...files, file] });
  },

  removeFileFromStore: (path) => {
    const { files } = get();
    set({ files: files.filter((f) => f.path !== path) });
  },

  clearError: () => set({ error: null }),

  shouldIgnoreExternalChange: (path: string) => {
    const { lastSaveTimestamp } = get();
    const lastSave = lastSaveTimestamp[path];
    if (!lastSave) return false;

    // Ignore changes within 2 seconds of our last save
    const timeSinceLastSave = Date.now() - lastSave;
    return timeSinceLastSave < 2000;
  },

  moveNoteToFolder: async (notePath: string, targetFolder: string) => {
    try {
      set({ loading: true, error: null });

      // Call the API to move the note
      const result = await api.moveNote(notePath, { targetFolder });

      if (result.success) {
        // Update the file list
        const { files, currentFile } = get();

        // Remove old file and add with new path
        const updatedFiles = files.filter(f => f.path !== notePath);
        const movedFile = files.find(f => f.path === notePath);

        if (movedFile && result.newPath) {
          const newFile = {
            ...movedFile,
            path: result.newPath,
            folder: targetFolder,
            modified: new Date().toISOString()
          };
          updatedFiles.push(newFile);
        }

        set({ files: updatedFiles });

        // Update current file if it was the moved one
        if (currentFile && currentFile.metadata.path === notePath && result.newPath) {
          set({
            currentFile: {
              ...currentFile,
              metadata: {
                ...currentFile.metadata,
                path: result.newPath,
                folder: targetFolder
              }
            }
          });
        }

        // Reload files to ensure consistency
        await get().loadFiles();
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to move note:', error);
      throw error;
    }
  },
}));
