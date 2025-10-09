import { create } from 'zustand';
import type { Reference, ReferenceFilters, SortOption } from '../types';
import { filterReferences, sortReferences, linkMention } from '../services/referenceService';
import { api } from '../services/api';

interface ReferenceStore {
  references: Reference[];
  referenceIndex: Map<string, Reference[]>;
  filters: ReferenceFilters;
  sortBy: SortOption;
  loading: boolean;
  indexedAt: Date | null;
  referenceCache: Map<string, { references: Reference[]; timestamp: number }>;

  // Actions
  setReferences: (refs: Reference[]) => void;
  updateReferenceIndex: (index: Map<string, Reference[]>) => void;
  setFilter: (filter: Partial<ReferenceFilters>) => void;
  setSortBy: (sort: SortOption) => void;
  clearFilters: () => void;
  getFilteredReferences: () => Reference[];
  linkUnlinkedMention: (refId: string, linkType: 'wikilink' | 'tag') => Promise<void>;
  getCachedReferences: (targetName: string) => Reference[] | null;
  setCachedReferences: (targetName: string, references: Reference[]) => void;
  setLoading: (loading: boolean) => void;
}

const defaultFilters: ReferenceFilters = {
  types: ['tag', 'wikilink', 'unlinked', 'task'],
  fileTypes: ['daily', 'note', 'template'],
  folders: [],
};

export const useReferenceStore = create<ReferenceStore>((set, get) => ({
  references: [],
  referenceIndex: new Map(),
  filters: defaultFilters,
  sortBy: 'modified',
  loading: false,
  indexedAt: null,
  referenceCache: new Map(),

  setReferences: (refs) => set({ references: refs }),

  updateReferenceIndex: (index) => set({ referenceIndex: index, indexedAt: new Date() }),

  setFilter: (filter) =>
    set((state) => ({
      filters: { ...state.filters, ...filter },
    })),

  setSortBy: (sort) => set({ sortBy: sort }),

  clearFilters: () => set({ filters: defaultFilters }),

  getFilteredReferences: () => {
    const { references, filters, sortBy } = get();

    // Apply filters
    const filtered = filterReferences(references, {
      types: filters.types,
      fileTypes: filters.fileTypes,
      dateRange: filters.dateRange,
    });

    // Apply sorting
    return sortReferences(filtered, sortBy);
  },

  linkUnlinkedMention: async (refId: string, linkType: 'wikilink' | 'tag') => {
    const { references } = get();

    // Find the reference
    const ref = references.find((r) => r.id === refId);
    if (!ref || ref.type !== 'unlinked') {
      throw new Error('Reference not found or not an unlinked mention');
    }

    try {
      // Load the file
      const fileData = await api.getFile(ref.sourceFile);

      // Convert the mention to a link
      const newContent = linkMention(
        fileData.content,
        ref.line,
        ref.targetName,
        linkType
      );

      // Save the file
      await api.saveFile(ref.sourceFile, newContent);

      // Remove this reference from the list (it's now linked)
      set((state) => ({
        references: state.references.filter((r) => r.id !== refId),
      }));

      // Clear cache for this target
      const { referenceCache } = get();
      referenceCache.delete(ref.targetName);
      set({ referenceCache: new Map(referenceCache) });
    } catch (error) {
      console.error('Failed to link mention:', error);
      throw error;
    }
  },

  getCachedReferences: (targetName: string) => {
    const { referenceCache } = get();
    const cached = referenceCache.get(targetName);

    if (!cached) return null;

    // Check if cache is fresh (5 minutes)
    const age = Date.now() - cached.timestamp;
    const cacheTTL = 5 * 60 * 1000; // 5 minutes

    if (age > cacheTTL) {
      // Cache expired
      referenceCache.delete(targetName);
      set({ referenceCache: new Map(referenceCache) });
      return null;
    }

    return cached.references;
  },

  setCachedReferences: (targetName: string, references: Reference[]) => {
    const { referenceCache } = get();
    referenceCache.set(targetName, {
      references,
      timestamp: Date.now(),
    });
    set({ referenceCache: new Map(referenceCache) });
  },

  setLoading: (loading) => set({ loading }),
}));
