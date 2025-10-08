import { useEffect, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import { useSearchStore } from '../store/searchStore';
import { searchService } from '../services/searchService';
import { api } from '../services/api';

export const useSearch = () => {
  const { files } = useFileStore();
  const {
    query,
    results,
    isSearching,
    isIndexing,
    setQuery,
    setResults,
    setIsSearching,
    setIsIndexing,
    clearResults,
  } = useSearchStore();

  // Index files on mount and when files change
  useEffect(() => {
    const indexAllFiles = async () => {
      if (files.length === 0) return;

      setIsIndexing(true);
      try {
        // Load all file contents
        const filesWithContent = await Promise.all(
          files.map(async (file) => {
            try {
              const fileData = await api.getFile(file.path);
              return {
                path: file.path,
                name: file.name,
                content: fileData.content,
              };
            } catch (error) {
              console.error(`Failed to load file ${file.path}:`, error);
              return null;
            }
          })
        );

        const validFiles = filesWithContent.filter(
          (f): f is NonNullable<typeof f> => f !== null
        );

        await searchService.indexFiles(validFiles);
      } catch (error) {
        console.error('Failed to index files:', error);
      } finally {
        setIsIndexing(false);
      }
    };

    indexAllFiles();
  }, [files, setIsIndexing]);

  const search = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        clearResults();
        return;
      }

      setIsSearching(true);
      setQuery(searchQuery);

      try {
        const searchResults = await searchService.search(searchQuery);
        setResults(searchResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [setQuery, setResults, setIsSearching, clearResults]
  );

  return {
    query,
    results,
    isSearching,
    isIndexing,
    search,
    clearResults,
  };
};
