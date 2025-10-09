import { useEffect } from 'react';
import { websocket } from '../services/websocket';
import { useFolderStore } from '../store/folderStore';
import { useFileStore } from '../store/fileStore';
import type {
  FolderCreatedEvent,
  FolderRenamedEvent,
  FolderDeletedEvent,
  FolderMovedEvent,
  NoteMovedEvent,
  FolderMetadataUpdatedEvent,
} from '../types';

/**
 * Hook to sync folder changes via WebSocket
 * Listens for folder events and updates the local store
 */
export const useFolderSync = () => {
  const { loadFolders, loadFolderMetadata } = useFolderStore();
  const { loadFiles } = useFileStore();

  useEffect(() => {

    // Handle folder created
    const handleFolderCreated = (data: FolderCreatedEvent) => {
      console.log('Folder created via WebSocket:', data.path);
      // Reload folder tree to show new folder
      loadFolders();
    };

    // Handle folder renamed
    const handleFolderRenamed = (data: FolderRenamedEvent) => {
      console.log('Folder renamed via WebSocket:', data.oldPath, '->', data.newPath);
      // Reload folder tree and files (paths may have changed)
      loadFolders();
      loadFiles();
    };

    // Handle folder deleted
    const handleFolderDeleted = (data: FolderDeletedEvent) => {
      console.log('Folder deleted via WebSocket:', data.path);
      // Reload folder tree and files
      loadFolders();
      loadFiles();
    };

    // Handle folder moved
    const handleFolderMoved = (data: FolderMovedEvent) => {
      console.log('Folder moved via WebSocket:', data.oldPath, '->', data.newPath);
      // Reload folder tree and files (paths may have changed)
      loadFolders();
      loadFiles();
    };

    // Handle note moved
    const handleNoteMoved = (data: NoteMovedEvent) => {
      console.log('Note moved via WebSocket:', data.oldPath, '->', data.newPath);
      // Reload files to reflect new location
      loadFiles();
    };

    // Handle folder metadata updated
    const handleFolderMetadataUpdated = (data: FolderMetadataUpdatedEvent) => {
      console.log('Folder metadata updated via WebSocket:', data.path);
      // Reload metadata for this folder
      loadFolderMetadata(data.path);
    };

    // Register event listeners
    websocket.on('folder:created', handleFolderCreated);
    websocket.on('folder:renamed', handleFolderRenamed);
    websocket.on('folder:deleted', handleFolderDeleted);
    websocket.on('folder:moved', handleFolderMoved);
    websocket.on('note:moved', handleNoteMoved);
    websocket.on('folder:metadata-updated', handleFolderMetadataUpdated);

    // Cleanup
    return () => {
      websocket.off('folder:created', handleFolderCreated);
      websocket.off('folder:renamed', handleFolderRenamed);
      websocket.off('folder:deleted', handleFolderDeleted);
      websocket.off('folder:moved', handleFolderMoved);
      websocket.off('note:moved', handleNoteMoved);
      websocket.off('folder:metadata-updated', handleFolderMetadataUpdated);
    };
  }, [loadFolders, loadFiles, loadFolderMetadata]);
};
