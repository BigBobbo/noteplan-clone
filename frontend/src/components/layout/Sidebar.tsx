import React, { useEffect } from 'react';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { formatRelativeTime } from '../../utils/format';
import { Button } from '../common/Button';

export const Sidebar: React.FC = () => {
  const { files, currentFile, loadFiles, openFile, loading } = useFileStore();
  const { sidebarCollapsed, openNewFileModal } = useUIStore();

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  if (sidebarCollapsed) {
    return null;
  }

  return (
    <div className="w-64 bg-stone-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Notes</h2>
        <Button
          size="sm"
          className="w-full"
          onClick={openNewFileModal}
        >
          + New Note
        </Button>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No notes yet. Create one!
          </div>
        ) : (
          <div className="py-2">
            {files.map((file) => {
              const isActive = currentFile?.metadata.path === file.path;

              return (
                <button
                  key={file.path}
                  onClick={() => openFile(file.path)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                    isActive
                      ? 'bg-amber-100 dark:bg-amber-900 border-l-4 border-amber-500'
                      : ''
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {file.folder && <span>{file.folder} • </span>}
                    {formatRelativeTime(file.modified)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
