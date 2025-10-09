import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { FolderIcon } from '@heroicons/react/24/outline';

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => Promise<void>;
  parentPath?: string;
}

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
  parentPath = 'Notes',
}) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setError('');
      setIsCreating(false);
    }
  }, [isOpen]);

  const validateFolderName = (name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return 'Folder name is required';
    }

    if (name.length > 100) {
      return 'Folder name exceeds maximum length of 100 characters';
    }

    // Check for invalid characters: / \ : * ? " < > |
    const invalidChars = /[\/\\:*?"<>|]/;
    if (invalidChars.test(name)) {
      return 'Folder name contains invalid characters (/ \\ : * ? " < > |)';
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFolderName(value);

    // Clear error when user types
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = folderName.trim();
    const validationError = validateFolderName(trimmedName);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      await onCreateFolder(trimmedName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create folder');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Folder"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Folder Name Input */}
        <div>
          <label htmlFor="folder-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Folder name
          </label>
          <input
            id="folder-name"
            type="text"
            value={folderName}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter folder name"
            autoFocus
            disabled={isCreating}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {folderName.length}/100 characters
          </p>
        </div>

        {/* Location Info */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Location:</span> {parentPath || 'Notes'}
          </p>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 Tip: Use numbers to control sort order (e.g., "10 - Projects")
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isCreating || !folderName.trim()}
          >
            <FolderIcon className="h-4 w-4" />
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
