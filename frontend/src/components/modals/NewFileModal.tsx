import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useFileStore } from '../../store/fileStore';
import { Button } from '../common/Button';

export const NewFileModal: React.FC = () => {
  const { newFileModalOpen, closeNewFileModal } = useUIStore();
  const { createFile } = useFileStore();
  const [filename, setFilename] = useState('');
  const [folder, setFolder] = useState('Notes');
  const [creating, setCreating] = useState(false);

  if (!newFileModalOpen) return null;

  const handleCreate = async () => {
    if (!filename.trim()) return;

    setCreating(true);
    try {
      const path = `${folder}/${filename}.txt`;
      const content = `# ${filename}\n\n`;
      await createFile(path, content);
      closeNewFileModal();
      setFilename('');
    } catch (error) {
      console.error('Failed to create file:', error);
      alert('Failed to create file');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    closeNewFileModal();
    setFilename('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Create New Note
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Folder
            </label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="Notes">Notes</option>
              <option value="Calendar">Calendar</option>
              <option value="Templates">Templates</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              File Name
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="My Note"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              .txt extension will be added automatically
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!filename.trim() || creating}
          >
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
};
