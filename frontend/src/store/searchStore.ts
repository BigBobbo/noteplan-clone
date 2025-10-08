import { create } from 'zustand';
import type { SearchResult } from '../services/searchService';

interface SearchStore {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  isIndexing: boolean;

  // Actions
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setIsIndexing: (isIndexing: boolean) => void;
  clearResults: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  results: [],
  isSearching: false,
  isIndexing: false,

  setQuery: (query) => set({ query }),

  setResults: (results) => set({ results }),

  setIsSearching: (isSearching) => set({ isSearching }),

  setIsIndexing: (isIndexing) => set({ isIndexing }),

  clearResults: () => set({ results: [], query: '' }),
}));
