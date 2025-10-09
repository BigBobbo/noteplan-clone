import React, { useEffect, useRef, useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useFolderStore } from '../../store/folderStore';
import { useFileStore } from '../../store/fileStore';
import { MoveFolderPicker } from '../modals/MoveFolderPicker';
import clsx from 'clsx';
import type { FolderNode } from '../../types';

interface FolderContextMenuProps {
  folder: FolderNode;
  position: { x: number; y: number };
  isProtected: boolean;
  onClose: () => void;
  onCreateSubfolder: () => void;
}

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  folder,
  position,
  isProtected,
  onClose,
  onCreateSubfolder,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { renameFolder, deleteFolder, moveFolder } = useFolderStore();
  const { loadFiles } = useFileStore();
  const [showMovePicker, setShowMovePicker] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleRename = async () => {
    onClose();
    const newName = prompt('Enter new folder name:', folder.name);
    if (newName && newName.trim() && newName !== folder.name) {
      try {
        await renameFolder(folder.path, newName.trim());
        await loadFiles();
      } catch (error) {
        console.error('Failed to rename folder:', error);
      }
    }
  };

  const handleDelete = async () => {
    onClose();
    const confirmed = window.confirm(
      `Are you sure you want to delete the folder "${folder.name}" and all its contents? This action cannot be undone.`
    );
    if (confirmed) {
      try {
        await deleteFolder(folder.path);
        await loadFiles();
      } catch (error) {
        console.error('Failed to delete folder:', error);
      }
    }
  };

  const handleMove = () => {
    onClose();
    setShowMovePicker(true);
  };

  const handleMoveConfirm = async (targetPath: string) => {
    try {
      await moveFolder(folder.path, targetPath);
      await loadFiles();
      setShowMovePicker(false);
    } catch (error) {
      console.error('Failed to move folder:', error);
    }
  };

  const handleProperties = () => {
    onClose();
    // TODO: Open folder properties dialog
    console.log('Folder properties:', folder.name);
  };

  // Calculate menu position (prevent overflow)
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    zIndex: 1000,
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        style={menuStyle}
        className="z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[200px]"
      >
        {/* New Subfolder */}
        <button
          onClick={onCreateSubfolder}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
        >
          <PlusIcon className="h-4 w-4" />
          New Subfolder
        </button>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

        {/* Rename */}
        <button
          onClick={handleRename}
          disabled={isProtected}
          className={clsx(
            'w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2',
            isProtected
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300'
          )}
        >
          <PencilIcon className="h-4 w-4" />
          Rename
        </button>

        {/* Move */}
        <button
          onClick={handleMove}
          disabled={isProtected}
          className={clsx(
            'w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2',
            isProtected
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300'
          )}
        >
          <ArrowRightIcon className="h-4 w-4" />
          Move to...
        </button>

        {/* Properties */}
        <button
          onClick={handleProperties}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
        >
          <Cog6ToothIcon className="h-4 w-4" />
          Properties
        </button>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={isProtected}
          className={clsx(
            'w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2',
            isProtected
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'text-red-600 dark:text-red-400'
          )}
        >
          <TrashIcon className="h-4 w-4" />
          Delete Folder
        </button>
      </div>

      {/* Move Folder Picker Dialog */}
      <MoveFolderPicker
        isOpen={showMovePicker}
        onClose={() => setShowMovePicker(false)}
        onSelect={handleMoveConfirm}
        title={`Move "${folder.name}" to...`}
        currentPath={folder.path}
      />
    </>
  );
};
