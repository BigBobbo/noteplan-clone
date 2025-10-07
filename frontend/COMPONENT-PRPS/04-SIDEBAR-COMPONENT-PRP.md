# Sidebar Component - Implementation Guide

## Overview
File browser sidebar that displays files grouped by folder with search functionality.

## File Location
`src/components/layout/Sidebar.tsx`

## Dependencies
```typescript
import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { formatRelativeTime } from '../../utils/format';
import clsx from 'clsx';
```

## Implementation

```tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { formatRelativeTime } from '../../utils/format';
import { Loading } from '../common/Loading';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const { files, loading, loadFiles, openFile, currentFile } = useFileStore();
  const { sidebarCollapsed, sidebarWidth } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['Notes', 'Calendar'])
  );

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Group files by folder
  const groupedFiles = useMemo(() => {
    const groups: Record<string, typeof files> = {};

    files.forEach((file) => {
      const folder = file.folder || 'Root';
      if (!groups[folder]) {
        groups[folder] = [];
      }
      groups[folder].push(file);
    });

    return groups;
  }, [files]);

  // Filter files by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedFiles;

    const filtered: Record<string, typeof files> = {};
    const query = searchQuery.toLowerCase();

    Object.entries(groupedFiles).forEach(([folder, folderFiles]) => {
      const matchingFiles = folderFiles.filter((file) =>
        file.name.toLowerCase().includes(query)
      );

      if (matchingFiles.length > 0) {
        filtered[folder] = matchingFiles;
      }
    });

    return filtered;
  }, [groupedFiles, searchQuery]);

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (path: string) => {
    openFile(path);
  };

  if (sidebarCollapsed) {
    return null;
  }

  return (
    <aside
      className="border-r border-gray-200 dark:border-gray-700 bg-stone-50 dark:bg-gray-900 flex flex-col"
      style={{ width: sidebarWidth }}
    >
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <Loading size="sm" text="Loading files..." />
        ) : Object.keys(filteredGroups).length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            {searchQuery ? 'No files found' : 'No files yet'}
          </div>
        ) : (
          <div className="space-y-1">
            {Object.entries(filteredGroups).map(([folder, folderFiles]) => (
              <div key={folder}>
                {/* Folder Header */}
                <button
                  onClick={() => toggleFolder(folder)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors text-left"
                >
                  {expandedFolders.has(folder) ? (
                    <FolderOpenIcon className="h-4 w-4 text-amber-500" />
                  ) : (
                    <FolderIcon className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {folder}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {folderFiles.length}
                  </span>
                </button>

                {/* Files in Folder */}
                {expandedFolders.has(folder) && (
                  <div className="ml-4 space-y-0.5 mt-0.5">
                    {folderFiles.map((file) => {
                      const isActive =
                        currentFile?.metadata.path === file.path;

                      return (
                        <button
                          key={file.path}
                          onClick={() => handleFileClick(file.path)}
                          className={clsx(
                            'w-full flex items-start gap-2 px-2 py-1.5 rounded text-left transition-colors',
                            isActive
                              ? 'bg-amber-100 dark:bg-amber-900'
                              : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                          )}
                        >
                          <DocumentTextIcon
                            className={clsx(
                              'h-4 w-4 mt-0.5 flex-shrink-0',
                              isActive
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-gray-400'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={clsx(
                                'text-sm truncate',
                                isActive
                                  ? 'font-semibold text-gray-900 dark:text-white'
                                  : 'text-gray-700 dark:text-gray-300'
                              )}
                            >
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {formatRelativeTime(file.modified)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
```

## Features
- **Search Bar**: Filter files by name
- **Folder Grouping**: Files organized by folder
- **Collapsible Folders**: Expand/collapse to show/hide files
- **Active File Highlight**: Current file shown with amber background
- **File Metadata**: Shows last modified time
- **Loading State**: Spinner while loading files
- **Empty State**: Message when no files found

## Styling Notes
- Fixed width from `useUIStore`
- Scrollable file list
- Folder icons change when expanded
- Active file gets amber highlight
- Dark mode support throughout

## State Management
- Uses `useFileStore` for file data
- Uses `useUIStore` for sidebar state
- Local state for search and expanded folders

## Testing Checklist
- [ ] Files load on mount
- [ ] Search filters files correctly
- [ ] Folders expand/collapse
- [ ] Active file highlighted
- [ ] Click file opens it
- [ ] Loading state shows
- [ ] Empty state shows
- [ ] Dark mode works
- [ ] Scroll works for long lists
