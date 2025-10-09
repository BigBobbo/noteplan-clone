import { useEffect, useCallback } from 'react';
import { useFileStore } from '../store/fileStore';
import { useReferenceStore } from '../store/referenceStore';
import { findReferences, getTargetName } from '../services/referenceService';
import { api } from '../services/api';
import type { ReferenceOptions } from '../types';

export const useReferences = (options: ReferenceOptions = {}) => {
  const { files, currentFile } = useFileStore();
  const {
    references,
    filters,
    sortBy,
    loading,
    setReferences,
    getFilteredReferences,
    setFilter,
    setSortBy,
    clearFilters,
    linkUnlinkedMention,
    getCachedReferences,
    setCachedReferences,
    setLoading,
  } = useReferenceStore();

  // Load references when current file changes
  useEffect(() => {
    if (!currentFile) {
      setReferences([]);
      return;
    }

    const loadReferences = async () => {
      const targetName = getTargetName(currentFile.metadata);
      if (!targetName) {
        setReferences([]);
        return;
      }

      // Check cache first
      const cached = getCachedReferences(targetName);
      if (cached) {
        setReferences(cached);
        return;
      }

      setLoading(true);
      try {
        // Load all files with content
        const filesWithContent = await Promise.all(
          files.map(async (file) => {
            try {
              const fileData = await api.getFile(file.path);
              return {
                path: file.path,
                name: file.name,
                content: fileData.content,
                metadata: file,
              };
            } catch (error) {
              console.error(`Error loading file ${file.path}:`, error);
              return null;
            }
          })
        );

        // Filter out failed loads
        const validFiles = filesWithContent.filter(
          (f): f is NonNullable<typeof f> => f !== null
        );

        // Find references
        const refs = await findReferences(targetName, validFiles, {
          includeUnlinked: true,
          contextLines: 2,
          caseSensitive: false,
          minMentionLength: 3,
          ...options,
        });

        setReferences(refs);
        setCachedReferences(targetName, refs);
      } catch (error) {
        console.error('Error finding references:', error);
        setReferences([]);
      } finally {
        setLoading(false);
      }
    };

    loadReferences();
  }, [currentFile, files]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get filtered and sorted references
  const filteredReferences = getFilteredReferences();

  // Navigate to a reference
  const navigateToReference = useCallback(
    async (refId: string) => {
      const ref = references.find((r) => r.id === refId);
      if (!ref) return;

      try {
        // Load the file
        const { openFile } = useFileStore.getState();
        await openFile(ref.sourceFile);

        // Scroll to the line (with a small delay to ensure editor is ready)
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('scroll-to-line', {
              detail: { line: ref.line, highlight: true },
            })
          );
        }, 100);
      } catch (error) {
        console.error('Failed to navigate to reference:', error);
      }
    },
    [references]
  );

  // Link an unlinked mention
  const handleLinkMention = useCallback(
    async (refId: string, linkType: 'wikilink' | 'tag' = 'wikilink') => {
      try {
        await linkUnlinkedMention(refId, linkType);

        // Reload references for current file
        const targetName = getTargetName(currentFile?.metadata || null);
        if (targetName) {
          // Clear cache
          const { referenceCache } = useReferenceStore.getState();
          referenceCache.delete(targetName);

          // Trigger reload by changing loading state
          setLoading(true);
          setTimeout(() => setLoading(false), 100);
        }
      } catch (error) {
        console.error('Failed to link mention:', error);
        throw error;
      }
    },
    [currentFile, linkUnlinkedMention, setLoading]
  );

  // Group references
  const groupedReferences = useCallback(() => {
    const groups: {
      direct: typeof filteredReferences;
      tasks: typeof filteredReferences;
      unlinked: typeof filteredReferences;
    } = {
      direct: [],
      tasks: [],
      unlinked: [],
    };

    filteredReferences.forEach((ref) => {
      if (ref.type === 'unlinked') {
        groups.unlinked.push(ref);
      } else if (ref.type === 'task') {
        groups.tasks.push(ref);
      } else {
        groups.direct.push(ref);
      }
    });

    return groups;
  }, [filteredReferences]);

  // Get reference counts
  const counts = {
    total: references.length,
    filtered: filteredReferences.length,
    byType: {
      tag: references.filter((r) => r.type === 'tag').length,
      wikilink: references.filter((r) => r.type === 'wikilink').length,
      task: references.filter((r) => r.type === 'task').length,
      unlinked: references.filter((r) => r.type === 'unlinked').length,
    },
    byFileType: {
      daily: references.filter((r) => r.isDaily).length,
      note: references.filter((r) => !r.isDaily && !r.sourceFile.includes('Templates')).length,
      template: references.filter((r) => r.sourceFile.includes('Templates')).length,
    },
  };

  return {
    references: filteredReferences,
    allReferences: references,
    groupedReferences: groupedReferences(),
    counts,
    loading,
    filters,
    sortBy,
    setFilter,
    setSortBy,
    clearFilters,
    navigateToReference,
    linkMention: handleLinkMention,
  };
};
