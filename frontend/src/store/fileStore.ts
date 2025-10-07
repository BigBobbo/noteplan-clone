import { create } from 'zustand';
import { api } from '../services/api';
import type { FileMetadata, FileData, FolderNode } from '../types';

interface FileStore {
  files: FileMetadata[];
  folders: FolderNode | null;
  currentFile: FileData | null;
  loading: boolean;
  error: string | null;

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
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  folders: null,
  currentFile: null,
  loading: false,
  error: null,

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
      const fileData = await api.getFile(path);
      set({ currentFile: fileData, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to open file:', error);
    }
  },

  saveFile: async (path: string, content: string) => {
    try {
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

  updateFileInStore: (path, content) => {
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
}));
