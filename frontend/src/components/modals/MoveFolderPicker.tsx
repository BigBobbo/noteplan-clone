import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { FolderIcon, FolderOpenIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useFolderStore } from '../../store/folderStore';
import clsx from 'clsx';
import type { FolderNode } from '../../types';

interface MoveFolderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (targetPath: string) => Promise<void>;
  title?: string;
  currentPath?: string; // Optional: to exclude current folder from options
  excludePaths?: string[]; // Optional: paths to exclude from selection
}

export const MoveFolderPicker: React.FC<MoveFolderPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Destination Folder',
  currentPath,
  excludePaths = [],
}) => {
  const { folders } = useFolderStore();
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['Notes', 'Calendar', 'Templates'])
  );
  const [loading, setLoading] = useState(false);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleSelect = async () => {
    if (!selectedPath) return;

    try {
      setLoading(true);
      await onSelect(selectedPath);
      onClose();
    } catch (error) {
      console.error('Failed to move:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFolderNode = (node: FolderNode, level: number = 0): JSX.Element | null => {
    if (!node.path) return null;

    // Check if this folder should be excluded
    const shouldExclude =
      node.path === currentPath ||
      excludePaths.includes(node.path) ||
      (currentPath && node.path.startsWith(currentPath + '/'));

    if (shouldExclude) {
      // Still render children if folder has them
      if (node.children && node.children.length > 0) {
        return (
          <>
            {node.children.map((child) => renderFolderNode(child, level))}
          </>
        );
      }
      return null;
    }

    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedPath === node.path;
    const isProtected = ['Calendar', 'Templates', '@Templates'].includes(node.name);

    return (
      <div key={node.path}>
        <button
          onClick={() => setSelectedPath(node.path)}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            isSelected && 'bg-amber-100 dark:bg-amber-900/30'
          )}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {/* Chevron */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.path);
              }}
              className="flex items-center justify-center w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronRightIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}

          {/* Folder Icon */}
          {isExpanded ? (
            <FolderOpenIcon className={clsx(
              'h-4 w-4',
              isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'
            )} />
          ) : (
            <FolderIcon className={clsx(
              'h-4 w-4',
              isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'
            )} />
          )}

          {/* Folder Name */}
          <span className={clsx(
            'flex-1 text-sm',
            isSelected
              ? 'font-semibold text-gray-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300'
          )}>
            {node.name}
          </span>

          {/* Protected Badge */}
          {isProtected && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              System
            </span>
          )}
        </button>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map((child) => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFolderTree = () => {
    if (!folders) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No folders available
        </div>
      );
    }

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
        {folders.children && folders.children.length > 0 ? (
          folders.children.map((child) => renderFolderNode(child, 0))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No folders found
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div className="space-y-4">
        {/* Folder Tree */}
        <div className="max-h-96 overflow-y-auto">
          {renderFolderTree()}
        </div>

        {/* Selected Path Display */}
        {selectedPath && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Selected:</span> {selectedPath}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSelect}
            disabled={!selectedPath || loading}
          >
            {loading ? 'Moving...' : 'Move Here'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
