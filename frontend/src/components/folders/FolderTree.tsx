import React, { useEffect, useState, useMemo } from 'react';
import { FolderNode } from './FolderNode';
import { CreateFolderDialog } from '../modals/CreateFolderDialog';
import { BreadcrumbNav } from './BreadcrumbNav';
import { useFolderStore } from '../../store/folderStore';
import { useFileStore } from '../../store/fileStore';
import { Button } from '../common/Button';
import { PlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type { FolderNode as FolderNodeType } from '../../types';

export const FolderTree: React.FC = () => {
  const { folders, loadFolders, createFolder, loading, selectedFolder } = useFolderStore();
  const { loadFiles } = useFileStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createParentPath, setCreateParentPath] = useState('Notes');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleCreateFolder = async (name: string) => {
    await createFolder(createParentPath, name);
    await loadFiles(); // Refresh file list
  };

  const handleNewFolderClick = () => {
    setCreateParentPath('Notes');
    setShowCreateDialog(true);
  };

  const handleNewSubfolderClick = (parentPath: string) => {
    setCreateParentPath(parentPath);
    setShowCreateDialog(true);
  };

  // Filter folders based on search query
  const filterNode = (node: FolderNodeType, query: string): FolderNodeType | null => {
    if (!node) return null;

    const lowerQuery = query.toLowerCase();
    const nameMatches = node.name.toLowerCase().includes(lowerQuery);

    // Filter children recursively
    const filteredChildren = node.children
      ?.map(child => filterNode(child, query))
      .filter((child): child is FolderNodeType => child !== null) || [];

    // Include node if name matches OR any children match
    if (nameMatches || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children,
      };
    }

    return null;
  };

  const filteredFolders = useMemo(() => {
    if (!folders || !searchQuery.trim()) return folders;
    return filterNode(folders, searchQuery.trim());
  }, [folders, searchQuery]);

  const renderFolderChildren = (node: FolderNodeType, level: number = 0) => {
    if (!node.children || node.children.length === 0) {
      return null;
    }

    return node.children.map((child) => (
      <FolderNode
        key={child.path}
        folder={child}
        level={level}
        onCreateSubfolder={handleNewSubfolderClick}
      />
    ));
  };

  if (loading && !folders) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading folders...
      </div>
    );
  }

  if (!folders) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No folders found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <BreadcrumbNav currentPath={selectedFolder} />
      </div>

      {/* Search Bar */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folders..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* New Folder Button */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNewFolderClick}
          className="w-full"
        >
          <PlusIcon className="h-4 w-4" />
          New Folder
        </Button>
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery && !filteredFolders?.children?.length ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No folders match "{searchQuery}"
          </div>
        ) : (
          renderFolderChildren(filteredFolders || folders, 0)
        )}
      </div>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreateFolder={handleCreateFolder}
        parentPath={createParentPath}
      />
    </div>
  );
};
