import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRightIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { useFileStore } from '../../store/fileStore';
import { MoveFolderPicker } from '../modals/MoveFolderPicker';
import type { FileMetadata } from '../../types';

interface FileContextMenuProps {
  file: FileMetadata;
  position: { x: number; y: number };
  onClose: () => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  file,
  position,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { deleteFile, moveNoteToFolder } = useFileStore();
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

  const handleRename = () => {
    onClose();
    const newName = prompt('Enter new file name:', file.name);
    if (newName && newName.trim() && newName !== file.name) {
      // TODO: Implement file rename
      console.log('Rename file:', file.path, 'to', newName);
    }
  };

  const handleMove = () => {
    onClose();
    setShowMovePicker(true);
  };

  const handleMoveConfirm = async (targetPath: string) => {
    try {
      await moveNoteToFolder(file.path, targetPath);
      setShowMovePicker(false);
    } catch (error) {
      console.error('Failed to move file:', error);
    }
  };

  const handleDuplicate = () => {
    onClose();
    // TODO: Implement file duplication
    console.log('Duplicate file:', file.path);
  };

  const handleDelete = async () => {
    onClose();
    const confirmed = window.confirm(
      `Are you sure you want to delete "${file.name}"? This action cannot be undone.`
    );
    if (confirmed) {
      try {
        await deleteFile(file.path);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
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
        className="z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px]"
      >
        {/* Rename */}
        <button
          onClick={handleRename}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
        >
          <PencilIcon className="h-4 w-4" />
          Rename
        </button>

        {/* Move */}
        <button
          onClick={handleMove}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
        >
          <ArrowRightIcon className="h-4 w-4" />
          Move to...
        </button>

        {/* Duplicate */}
        <button
          onClick={handleDuplicate}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
          Duplicate
        </button>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
        >
          <TrashIcon className="h-4 w-4" />
          Delete
        </button>
      </div>

      {/* Move Folder Picker Dialog */}
      <MoveFolderPicker
        isOpen={showMovePicker}
        onClose={() => setShowMovePicker(false)}
        onSelect={handleMoveConfirm}
        title={`Move "${file.name}" to...`}
      />
    </>
  );
};
