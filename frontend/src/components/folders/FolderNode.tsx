import React, { useState, useMemo } from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  LockClosedIcon,
  EllipsisVerticalIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useFolderStore } from '../../store/folderStore';
import { useFileStore } from '../../store/fileStore';
import { FolderContextMenu } from './FolderContextMenu';
import { FileContextMenu } from './FileContextMenu';
import { formatRelativeTime } from '../../utils/format';
import clsx from 'clsx';
import type { FolderNode as FolderNodeType } from '../../types';

interface FolderNodeProps {
  folder: FolderNodeType;
  level: number;
  onCreateSubfolder: (parentPath: string) => void;
}

export const FolderNode: React.FC<FolderNodeProps> = ({
  folder,
  level,
  onCreateSubfolder,
}) => {
  const { isExpanded, toggleFolder, selectFolder, selectedFolder } = useFolderStore();
  const { files, currentFile, openFile, moveNoteToFolder } = useFileStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFileContextMenu, setShowFileContextMenu] = useState(false);
  const [fileContextMenuPosition, setFileContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const expanded = isExpanded(folder.path);
  const isSelected = selectedFolder === folder.path;
  const hasChildren = folder.children && folder.children.length > 0;

  // Check if folder is protected
  const isProtected = ['Calendar', 'Templates', '@Templates'].includes(folder.name);

  // Get files in this folder (direct children only, not recursive)
  const folderFiles = useMemo(() => {
    return files.filter((file) => {
      if (folder.path === '') {
        return file.folder === '' || file.folder === '.';
      }
      return file.folder === folder.path;
    });
  }, [files, folder.path]);

  // Count all notes in this folder and subfolders
  const noteCount = useMemo(() => {
    return files.filter((file) => {
      if (folder.path === '') {
        return file.folder === '' || file.folder === '.';
      }
      return file.folder === folder.path || file.folder.startsWith(folder.path + '/');
    }).length;
  }, [files, folder.path]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Allow toggling if folder has subfolders OR files
    if (hasChildren || folderFiles.length > 0) {
      toggleFolder(folder.path);
    }
  };

  const handleSelect = () => {
    selectFolder(folder.path);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement inline rename
    console.log('Double-click rename for:', folder.name);
  };

  const handleFileClick = (filePath: string) => {
    openFile(filePath);
  };

  // Drag and drop handlers for folder
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const filePath = e.dataTransfer.getData('text/file-path');
      if (filePath) {
        console.log('Moving file:', filePath, 'to folder:', folder.path);
        await moveNoteToFolder(filePath, folder.path);
      }
    } catch (error) {
      console.error('Failed to move file:', error);
    }
  };

  // Drag handlers for file items
  const handleFileDragStart = (e: React.DragEvent, filePath: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/file-path', filePath);
  };

  // Context menu handler for files
  const handleFileContextMenu = (e: React.MouseEvent, filePath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(filePath);
    setFileContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowFileContextMenu(true);
  };

  const renderFiles = () => {
    if (!expanded || folderFiles.length === 0) {
      return null;
    }

    return (
      <div className="space-y-0.5">
        {folderFiles.map((file) => {
          const isActive = currentFile?.metadata.path === file.path;

          return (
            <button
              key={file.path}
              draggable
              onDragStart={(e) => handleFileDragStart(e, file.path)}
              onClick={() => handleFileClick(file.path)}
              onContextMenu={(e) => handleFileContextMenu(e, file.path)}
              className={clsx(
                'w-full flex items-start gap-2 px-2 py-1.5 rounded text-left transition-colors cursor-move group',
                isActive
                  ? 'bg-amber-100 dark:bg-amber-900/50'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
              title="Drag to move or right-click for options"
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
    );
  };

  const renderChildren = () => {
    if (!expanded || !hasChildren) {
      return null;
    }

    return folder.children!.map((child) => (
      <FolderNode
        key={child.path}
        folder={child}
        level={level + 1}
        onCreateSubfolder={onCreateSubfolder}
      />
    ));
  };

  return (
    <>
      <div
        className={clsx(
          'flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
          isSelected && 'bg-amber-100 dark:bg-amber-900/30',
          isDragOver && 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 border-dashed',
          'group'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Chevron */}
        {(hasChildren || folderFiles.length > 0) ? (
          <button
            onClick={handleToggle}
            className="flex items-center justify-center w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {expanded ? (
              <ChevronDownIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-4 h-4" />
        )}

        {/* Folder Icon */}
        <div className="flex-shrink-0">
          {isProtected ? (
            <div className="relative">
              <FolderIcon className={clsx(
                'h-4 w-4',
                isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'
              )} />
              <LockClosedIcon className="h-2 w-2 absolute -bottom-0.5 -right-0.5 text-gray-500" />
            </div>
          ) : expanded ? (
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
        </div>

        {/* Folder Name */}
        <span
          className={clsx(
            'flex-1 text-sm font-medium truncate',
            isSelected
              ? 'text-amber-900 dark:text-amber-100'
              : 'text-gray-700 dark:text-gray-300'
          )}
          title={folder.name}
        >
          {folder.name}
        </span>

        {/* Note Count */}
        {noteCount > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({noteCount})
          </span>
        )}

        {/* Context Menu Button */}
        <button
          onClick={handleContextMenu}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-opacity"
        >
          <EllipsisVerticalIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Files in this folder */}
      {renderFiles()}

      {/* Subfolders */}
      {renderChildren()}

      {/* Folder Context Menu */}
      {showContextMenu && (
        <FolderContextMenu
          folder={folder}
          position={contextMenuPosition}
          isProtected={isProtected}
          onClose={() => setShowContextMenu(false)}
          onCreateSubfolder={() => {
            setShowContextMenu(false);
            onCreateSubfolder(folder.path);
          }}
        />
      )}

      {/* File Context Menu */}
      {showFileContextMenu && selectedFile && (
        <FileContextMenu
          file={files.find(f => f.path === selectedFile)!}
          position={fileContextMenuPosition}
          onClose={() => {
            setShowFileContextMenu(false);
            setSelectedFile(null);
          }}
        />
      )}
    </>
  );
};
