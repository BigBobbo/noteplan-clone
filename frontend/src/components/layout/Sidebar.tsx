import React, { useEffect, useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { formatRelativeTime } from '../../utils/format';
import { Loading } from '../common/Loading';
import { TaskList } from '../tasks/TaskList';
import { SearchBar } from '../search/SearchBar';
import { BacklinkPanel } from '../links/BacklinkPanel';
import { TemplateManager } from '../templates/TemplateManager';
import { FolderTree } from '../folders/FolderTree';
import { useFolderSync } from '../../hooks/useFolderSync';
import clsx from 'clsx';

type SidebarView = 'files' | 'tasks' | 'board' | 'search' | 'links' | 'templates';

export const Sidebar: React.FC = () => {
  const { files, loading, loadFiles, openFile, currentFile } = useFileStore();
  const { sidebarCollapsed, sidebarWidth } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<SidebarView>('files');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['Notes', 'Calendar'])
  );

  // Sync folder changes via WebSocket
  useFolderSync();

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
      {/* View Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
        <button
          onClick={() => setCurrentView('files')}
          className={clsx(
            'flex-1 px-2 py-2.5 text-xs font-medium transition-colors flex flex-col items-center justify-center gap-1 min-w-[60px]',
            currentView === 'files'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <FolderIcon className="h-4 w-4" />
          <span>Files</span>
        </button>
        <button
          onClick={() => setCurrentView('tasks')}
          className={clsx(
            'flex-1 px-2 py-2.5 text-xs font-medium transition-colors flex flex-col items-center justify-center gap-1 min-w-[60px]',
            currentView === 'tasks'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <CheckCircleIcon className="h-4 w-4" />
          <span>Tasks</span>
        </button>
        <button
          onClick={() => setCurrentView('board')}
          className={clsx(
            'flex-1 px-2 py-2.5 text-xs font-medium transition-colors flex flex-col items-center justify-center gap-1 min-w-[60px]',
            currentView === 'board'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <Squares2X2Icon className="h-4 w-4" />
          <span>Board</span>
        </button>
        <button
          onClick={() => setCurrentView('search')}
          className={clsx(
            'flex-1 px-2 py-2.5 text-xs font-medium transition-colors flex flex-col items-center justify-center gap-1 min-w-[60px]',
            currentView === 'search'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          <span>Search</span>
        </button>
        <button
          onClick={() => setCurrentView('links')}
          className={clsx(
            'flex-1 px-2 py-2.5 text-xs font-medium transition-colors flex flex-col items-center justify-center gap-1 min-w-[60px]',
            currentView === 'links'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <LinkIcon className="h-4 w-4" />
          <span>Links</span>
        </button>
        <button
          onClick={() => setCurrentView('templates')}
          className={clsx(
            'flex-1 px-2 py-2.5 text-xs font-medium transition-colors flex flex-col items-center justify-center gap-1 min-w-[60px]',
            currentView === 'templates'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
          <span className="whitespace-nowrap">Templates</span>
        </button>
      </div>

      {/* View Content */}
      {currentView === 'files' && <FolderTree />}

      {currentView === 'tasks' && (
        <div className="flex-1 overflow-hidden">
          <TaskList />
        </div>
      )}

      {currentView === 'search' && (
        <div className="flex-1 overflow-y-auto p-4">
          <SearchBar />
        </div>
      )}

      {currentView === 'links' && (
        <div className="flex-1 overflow-hidden">
          <BacklinkPanel />
        </div>
      )}

      {currentView === 'board' && (
        <div className="flex-1 overflow-hidden p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">Board view is available in the main editor area.</p>
            <p>Use the tabs above the editor to switch between Editor, Tasks, and Board views.</p>
          </div>
        </div>
      )}

      {currentView === 'templates' && (
        <div className="flex-1 overflow-hidden">
          <TemplateManager />
        </div>
      )}
    </aside>
  );
};
