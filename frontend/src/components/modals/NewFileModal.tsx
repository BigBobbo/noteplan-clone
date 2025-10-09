import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useUIStore } from '../../store/uiStore';
import { useFileStore } from '../../store/fileStore';
import { useFolderStore } from '../../store/folderStore';
import type { FolderNode } from '../../types';

export const NewFileModal: React.FC = () => {
  const { newFileModalOpen, closeNewFileModal } = useUIStore();
  const { createFile } = useFileStore();
  const { folders, loadFolders, selectedFolder } = useFolderStore();

  const [fileName, setFileName] = useState('');
  const [folder, setFolder] = useState(selectedFolder || 'Notes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load folders when modal opens
  useEffect(() => {
    if (newFileModalOpen && !folders) {
      loadFolders();
    }
  }, [newFileModalOpen, folders, loadFolders]);

  // Update selected folder when it changes
  useEffect(() => {
    if (selectedFolder) {
      setFolder(selectedFolder);
    }
  }, [selectedFolder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fileName.trim()) {
      setError('File name is required');
      return;
    }

    // Add .txt extension if not provided
    const fullFileName = fileName.endsWith('.txt') || fileName.endsWith('.md')
      ? fileName
      : `${fileName}.txt`;

    const filePath = `${folder}/${fullFileName}`;

    try {
      setLoading(true);
      await createFile(filePath, `# ${fileName}\n\n`);

      // Reset and close
      setFileName('');
      setFolder('Notes');
      closeNewFileModal();
    } catch (err: any) {
      setError(err.message || 'Failed to create file');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFileName('');
    setError('');
    closeNewFileModal();
  };

  // Build flat list of all folders for dropdown
  const folderOptions = useMemo(() => {
    const options: Array<{ path: string; label: string; depth: number }> = [];

    const traverse = (node: FolderNode, depth: number = 0) => {
      if (!node) return;

      // Add current node if it has a path (skip root)
      if (node.path) {
        const indent = '  '.repeat(depth);
        options.push({
          path: node.path,
          label: `${indent}${node.name}`,
          depth
        });
      }

      // Add children
      if (node.children && node.children.length > 0) {
        node.children
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(child => traverse(child, depth + 1));
      }
    };

    if (folders) {
      traverse(folders);
    }

    // Ensure Notes, Calendar, Templates are at the top if they exist
    const rootFolders = ['Notes', 'Calendar', 'Templates'];
    const sorted = options.sort((a, b) => {
      const aRoot = rootFolders.indexOf(a.path.split('/')[0]);
      const bRoot = rootFolders.indexOf(b.path.split('/')[0]);

      if (aRoot !== -1 && bRoot !== -1) return aRoot - bRoot;
      if (aRoot !== -1) return -1;
      if (bRoot !== -1) return 1;
      return a.path.localeCompare(b.path);
    });

    return sorted;
  }, [folders]);

  return (
    <Modal
      isOpen={newFileModalOpen}
      onClose={handleClose}
      title="Create New Note"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Name Input */}
        <div>
          <label
            htmlFor="fileName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Note Name
          </label>
          <input
            id="fileName"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="My New Note"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            autoFocus
            disabled={loading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            .txt extension will be added automatically
          </p>
        </div>

        {/* Folder Selection */}
        <div>
          <label
            htmlFor="folder"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Folder
          </label>
          <select
            id="folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
            disabled={loading}
          >
            {folderOptions.length > 0 ? (
              folderOptions.map((option) => (
                <option key={option.path} value={option.path}>
                  {option.label}
                </option>
              ))
            ) : (
              <>
                <option value="Notes">Notes</option>
                <option value="Calendar">Calendar</option>
                <option value="Templates">Templates</option>
              </>
            )}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Note will be created in: {folder}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !fileName.trim()}>
            {loading ? 'Creating...' : 'Create Note'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
