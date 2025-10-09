import React from 'react';
import { MagnifyingGlassIcon, LinkIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface ReferenceEmptyProps {
  type: 'no-file' | 'no-references' | 'no-results';
  noteName?: string;
  onClearFilters?: () => void;
}

export const ReferenceEmpty: React.FC<ReferenceEmptyProps> = ({
  type,
  noteName,
  onClearFilters,
}) => {
  if (type === 'no-file') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No File Selected
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          Open a file to see all references to it. References will show where this note or tag is mentioned across your vault.
        </p>
      </div>
    );
  }

  if (type === 'no-references') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <LinkIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No References Found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
          {noteName ? (
            <>
              No references to <span className="font-medium">{noteName}</span> yet. Link to it from other notes using <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">[[{noteName}]]</code> or <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">#{noteName}</code>
            </>
          ) : (
            <>
              No references to this note yet. Link to it from other notes using wiki-links or tags.
            </>
          )}
        </p>
        <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
          <p>
            <strong>Wiki-link:</strong> <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">[[Note Name]]</code>
          </p>
          <p>
            <strong>Tag:</strong> <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">#tag</code> or <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">#[[Multi Word Tag]]</code>
          </p>
        </div>
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FunnelIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No References Match Filters
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
          Try adjusting your filters to see more references.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  return null;
};
