import { create } from 'zustand';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import type {
  FolderNode,
  FolderMetadata,
  FolderNodeWithMeta,
  CreateFolderRequest,
} from '../types';

interface FolderStore {
  folders: FolderNode | null;
  expandedFolders: Set<string>;
  selectedFolder: string | null;
  folderMetadata: Map<string, FolderMetadata>;
  loading: boolean;
  error: string | null;

  // Actions
  loadFolders: () => Promise<void>;
  createFolder: (parentPath: string, name: string) => Promise<void>;
  renameFolder: (path: string, newName: string) => Promise<void>;
  deleteFolder: (path: string) => Promise<void>;
  moveFolder: (sourcePath: string, targetPath: string) => Promise<void>;
  updateFolderMetadata: (path: string, metadata: Partial<FolderMetadata>) => Promise<void>;
  toggleFolder: (path: string) => void;
  selectFolder: (path: string | null) => void;
  isExpanded: (path: string) => boolean;
  loadFolderMetadata: (path: string) => Promise<void>;
  clearError: () => void;
}

export const useFolderStore = create<FolderStore>((set, get) => ({
  folders: null,
  expandedFolders: new Set(['Notes', 'Calendar']),
  selectedFolder: null,
  folderMetadata: new Map(),
  loading: false,
  error: null,

  loadFolders: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.getFolderTree();
      set({ folders: response.tree, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to load folders:', error);
      toast.error('Failed to load folder tree');
    }
  },

  createFolder: async (parentPath: string, name: string) => {
    try {
      set({ loading: true, error: null });

      const data: CreateFolderRequest = {
        name,
        parentPath,
      };

      const result = await api.createFolder(data);

      if (result.success) {
        toast.success(`Folder "${name}" created successfully`);
        // Reload folder tree to get the new folder
        await get().loadFolders();

        // Expand the parent folder to show the new folder
        if (parentPath) {
          const expanded = new Set(get().expandedFolders);
          expanded.add(parentPath);
          set({ expandedFolders: expanded });
        }
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to create folder:', error);
      toast.error(error.message || 'Failed to create folder');
      throw error;
    }
  },

  renameFolder: async (path: string, newName: string) => {
    try {
      set({ loading: true, error: null });

      const result = await api.renameFolder(path, { newName });

      if (result.success) {
        toast.success(`Folder renamed to "${newName}"`);

        // Reload folder tree
        await get().loadFolders();

        // Update selected folder if it was the renamed one
        const { selectedFolder } = get();
        if (selectedFolder === path) {
          set({ selectedFolder: result.newPath || null });
        }
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to rename folder:', error);
      toast.error(error.message || 'Failed to rename folder');
      throw error;
    }
  },

  deleteFolder: async (path: string) => {
    try {
      set({ loading: true, error: null });

      const result = await api.deleteFolder(path);

      if (result.success) {
        toast.success('Folder deleted successfully');

        // Reload folder tree
        await get().loadFolders();

        // Clear selection if deleted folder was selected
        const { selectedFolder } = get();
        if (selectedFolder === path) {
          set({ selectedFolder: null });
        }

        // Remove from expanded folders
        const expanded = new Set(get().expandedFolders);
        expanded.delete(path);
        set({ expandedFolders: expanded });

        // Remove metadata
        const metadata = new Map(get().folderMetadata);
        metadata.delete(path);
        set({ folderMetadata: metadata });
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to delete folder:', error);
      toast.error(error.message || 'Failed to delete folder');
      throw error;
    }
  },

  moveFolder: async (sourcePath: string, targetPath: string) => {
    try {
      set({ loading: true, error: null });

      const result = await api.moveFolder(sourcePath, { targetPath });

      if (result.success) {
        toast.success('Folder moved successfully');

        // Reload folder tree
        await get().loadFolders();

        // Update selected folder if it was the moved one
        const { selectedFolder } = get();
        if (selectedFolder === sourcePath) {
          set({ selectedFolder: result.newPath || null });
        }

        // Expand target folder to show moved folder
        const expanded = new Set(get().expandedFolders);
        expanded.add(targetPath);
        set({ expandedFolders: expanded });
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      console.error('Failed to move folder:', error);
      toast.error(error.message || 'Failed to move folder');
      throw error;
    }
  },

  updateFolderMetadata: async (path: string, metadata: Partial<FolderMetadata>) => {
    try {
      const result = await api.updateFolderMetadata(path, metadata);

      if (result.success) {
        // Update metadata in store
        const folderMetadata = new Map(get().folderMetadata);
        folderMetadata.set(path, result.metadata);
        set({ folderMetadata });

        toast.success('Folder settings updated');
      }
    } catch (error: any) {
      console.error('Failed to update folder metadata:', error);
      toast.error(error.message || 'Failed to update folder settings');
      throw error;
    }
  },

  loadFolderMetadata: async (path: string) => {
    try {
      const metadata = await api.getFolderMetadata(path);

      // Update metadata in store
      const folderMetadata = new Map(get().folderMetadata);
      folderMetadata.set(path, metadata);
      set({ folderMetadata });
    } catch (error: any) {
      console.error('Failed to load folder metadata:', error);
    }
  },

  toggleFolder: (path: string) => {
    const expanded = new Set(get().expandedFolders);
    if (expanded.has(path)) {
      expanded.delete(path);
    } else {
      expanded.add(path);
    }
    set({ expandedFolders: expanded });

    // Save to localStorage
    localStorage.setItem('folderExpansion', JSON.stringify(Array.from(expanded)));
  },

  selectFolder: (path: string | null) => {
    set({ selectedFolder: path });

    // Save to localStorage
    if (path) {
      localStorage.setItem('selectedFolder', path);
    } else {
      localStorage.removeItem('selectedFolder');
    }
  },

  isExpanded: (path: string) => {
    return get().expandedFolders.has(path);
  },

  clearError: () => set({ error: null }),
}));

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const savedExpansion = localStorage.getItem('folderExpansion');
  if (savedExpansion) {
    try {
      const expanded = JSON.parse(savedExpansion);
      useFolderStore.setState({ expandedFolders: new Set(expanded) });
    } catch (error) {
      console.error('Failed to parse saved folder expansion:', error);
    }
  }

  const savedSelection = localStorage.getItem('selectedFolder');
  if (savedSelection) {
    useFolderStore.setState({ selectedFolder: savedSelection });
  }
}
