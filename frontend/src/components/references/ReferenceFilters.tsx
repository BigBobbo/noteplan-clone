import React from 'react';
import type { ReferenceFilters, SortOption } from '../../types';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ReferenceFiltersProps {
  filters: ReferenceFilters;
  sortBy: SortOption;
  onFilterChange: (filter: Partial<ReferenceFilters>) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
}

export const ReferenceFiltersComponent: React.FC<ReferenceFiltersProps> = ({
  filters,
  sortBy,
  onFilterChange,
  onSortChange,
  onClearFilters,
}) => {
  const hasActiveFilters =
    filters.types.length !== 4 || // Not all types selected
    filters.fileTypes.length !== 3 || // Not all file types selected
    filters.dateRange !== undefined;

  const toggleType = (type: 'tag' | 'wikilink' | 'unlinked' | 'task') => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];

    onFilterChange({ types: newTypes });
  };

  const toggleFileType = (fileType: 'daily' | 'note' | 'template') => {
    const newFileTypes = filters.fileTypes.includes(fileType)
      ? filters.fileTypes.filter((ft) => ft !== fileType)
      : [...filters.fileTypes, fileType];

    onFilterChange({ fileTypes: newFileTypes });
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filters
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
          >
            <XMarkIcon className="h-3 w-3" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reference Types */}
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
            Reference Types
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleType('tag')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filters.types.includes('tag')
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Tags
            </button>
            <button
              onClick={() => toggleType('wikilink')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filters.types.includes('wikilink')
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Links
            </button>
            <button
              onClick={() => toggleType('task')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filters.types.includes('task')
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => toggleType('unlinked')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filters.types.includes('unlinked')
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-400 dark:border-gray-600'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Mentions
            </button>
          </div>
        </div>

        {/* File Types */}
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
            File Types
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleFileType('daily')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filters.fileTypes.includes('daily')
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Daily Notes
            </button>
            <button
              onClick={() => toggleFileType('note')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filters.fileTypes.includes('note')
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => toggleFileType('template')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filters.fileTypes.includes('template')
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
              }`}
            >
              Templates
            </button>
          </div>
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="text-sm px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="modified">Date Modified</option>
          <option value="created">Date Created</option>
          <option value="filename">File Name (A-Z)</option>
          <option value="count">Reference Count</option>
        </select>
      </div>
    </div>
  );
};
