import { useEffect } from 'react';
import { websocket } from '../services/websocket';
import { useFileStore } from '../store/fileStore';
import type { FileChangedEvent } from '../types';

export function useWebSocket() {
  const { updateFileInStore, removeFileFromStore, currentFile, openFile, shouldIgnoreExternalChange } =
    useFileStore();

  useEffect(() => {
    // Connect to WebSocket
    websocket.connect();

    // Handle file changes
    const handleFileChanged = async (data: FileChangedEvent) => {
      const { event, path } = data;

      if (event === 'modified') {
        // Check if this change was caused by our own save
        if (shouldIgnoreExternalChange(path)) {
          console.log('Ignoring self-triggered file change:', path);
          return;
        }

        // If current file was modified externally, reload it
        if (currentFile && currentFile.metadata.path === path) {
          console.log('Current file modified externally, reloading...');
          await openFile(path);
        } else {
          updateFileInStore(path, '');
        }
      } else if (event === 'created') {
        // Reload file list to get new file
        const { loadFiles } = useFileStore.getState();
        await loadFiles();
      } else if (event === 'deleted') {
        removeFileFromStore(path);
      }
    };

    websocket.on('file:changed', handleFileChanged);

    // Cleanup
    return () => {
      websocket.off('file:changed', handleFileChanged);
      websocket.disconnect();
    };
  }, [currentFile, shouldIgnoreExternalChange]);

  return {
    isConnected: websocket.isConnected(),
    subscribe: websocket.subscribe.bind(websocket),
    unsubscribe: websocket.unsubscribe.bind(websocket),
  };
}
