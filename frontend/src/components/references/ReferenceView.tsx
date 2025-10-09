import React from 'react';
import { useReferences } from '../../hooks/useReferences';
import { useFileStore } from '../../store/fileStore';
import { ReferenceList } from './ReferenceList';
import { ReferenceFiltersComponent } from './ReferenceFilters';
import { ReferenceEmpty } from './ReferenceEmpty';
import { getTargetName } from '../../services/referenceService';

export const ReferenceView: React.FC = () => {
  const { currentFile } = useFileStore();
  const {
    references,
    groupedReferences,
    counts,
    loading,
    filters,
    sortBy,
    setFilter,
    setSortBy,
    clearFilters,
    navigateToReference,
    linkMention,
  } = useReferences();

  const targetName = currentFile ? getTargetName(currentFile.metadata) : null;

  // Handle link mention
  const handleLinkMention = async (refId: string, linkType: 'wikilink' | 'tag') => {
    try {
      await linkMention(refId, linkType);
    } catch (error) {
      console.error('Failed to link mention:', error);
      alert('Failed to link mention. Please try again.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              References
              {targetName && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  to "{targetName}"
                </span>
              )}
            </h2>
            {counts.filtered > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Showing {counts.filtered} {counts.filtered === 1 ? 'reference' : 'references'}
                {counts.total !== counts.filtered && (
                  <span> (filtered from {counts.total})</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      {currentFile && (
        <ReferenceFiltersComponent
          filters={filters}
          sortBy={sortBy}
          onFilterChange={setFilter}
          onSortChange={setSortBy}
          onClearFilters={clearFilters}
        />
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!currentFile ? (
          <ReferenceEmpty type="no-file" />
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : counts.total === 0 ? (
          <ReferenceEmpty type="no-references" noteName={targetName || undefined} />
        ) : counts.filtered === 0 ? (
          <ReferenceEmpty type="no-results" onClearFilters={clearFilters} />
        ) : (
          <div className="p-4">
            <ReferenceList
              references={references}
              groupedReferences={groupedReferences}
              counts={counts}
              onNavigate={navigateToReference}
              onLink={handleLinkMention}
            />
          </div>
        )}
      </div>
    </div>
  );
};
