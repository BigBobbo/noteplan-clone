# Delete Confirmation Modal - Implementation Guide

## Overview
Simple confirmation dialog for deleting files with warning message.

## File Location
`src/components/modals/DeleteConfirm.tsx`

## Implementation

```tsx
import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useUIStore } from '../../store/uiStore';
import { useFileStore } from '../../store/fileStore';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const DeleteConfirm: React.FC = () => {
  const { deleteConfirmOpen, closeDeleteConfirm, fileToDelete } = useUIStore();
  const { deleteFile, files } = useFileStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileName = fileToDelete
    ? files.find((f) => f.path === fileToDelete)?.name || fileToDelete
    : '';

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      setLoading(true);
      setError('');
      await deleteFile(fileToDelete);
      closeDeleteConfirm();
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    closeDeleteConfirm();
  };

  return (
    <Modal
      isOpen={deleteConfirmOpen}
      onClose={handleClose}
      title="Delete Note"
      size="sm"
    >
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{fileName}</span>?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This action cannot be undone.
            </p>
          </div>
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
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

## Features
- **Warning Icon**: Visual indicator of destructive action
- **File Name Display**: Shows which file will be deleted
- **Warning Message**: "This action cannot be undone"
- **Error Handling**: Shows error if delete fails
- **Loading State**: Disables buttons while deleting
- **Danger Button**: Red delete button
- **ESC to Cancel**: Closes modal without deleting

## Usage

In a component (e.g., Sidebar):

```tsx
import { useUIStore } from '../store/uiStore';

function FileItem({ file }) {
  const { openDeleteConfirm } = useUIStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDeleteConfirm(file.path);
  };

  return (
    <div>
      {/* ... file content ... */}
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

## Testing Checklist
- [ ] Modal opens with correct file name
- [ ] Warning icon displays
- [ ] Cancel button closes without deleting
- [ ] Delete button removes file
- [ ] Error message shows on failure
- [ ] Loading state works
- [ ] ESC key cancels
- [ ] Current file closes if deleted
