import { api } from './api';
import { useGlobalTaskStore } from '../store/globalTaskStore';
import { useFileStore } from '../store/fileStore';

class GlobalTaskIndexer {
  private isInitialized = false;
  private fileWatcherUnsubscribe: (() => void) | null = null;

  /**
   * Initialize the global task indexer
   * This should be called once when the app starts
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[GlobalTaskIndexer] Already initialized');
      return;
    }

    console.log('[GlobalTaskIndexer] Initializing...');

    try {
      // Load all files from the Notes folder
      await this.indexAllNotesFiles();

      // Subscribe to file changes
      this.setupFileWatcher();

      this.isInitialized = true;
      console.log('[GlobalTaskIndexer] Initialization complete');
    } catch (error) {
      console.error('[GlobalTaskIndexer] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Index all files in the Notes folder
   */
  private async indexAllNotesFiles() {
    console.log('[GlobalTaskIndexer] Loading all Notes files...');

    try {
      // Get all files from the API
      const response = await api.listFiles();
      const files = response.files || [];

      // Filter to NotePlan Notes directory (including nested subdirectories)
      const notesFiles = files.filter((file) => {
        const path = file.path || '';
        const folder = file.folder || '';
        const inNotesFolder =
          path.startsWith('Notes/') ||
          folder === 'Notes' ||
          folder.startsWith('Notes/');
        const hasSupportedExtension =
          path.endsWith('.txt') || path.endsWith('.md');
        return inNotesFolder && hasSupportedExtension;
      });

      console.log(`[GlobalTaskIndexer] Found ${notesFiles.length} Notes files to index`);

      // Load content for each file and index
      const filesWithContent = await Promise.all(
        notesFiles.map(async (file) => {
          try {
            const fileData = await api.getFile(file.path);
            return {
              path: file.path,
              content: fileData.content
            };
          } catch (error) {
            console.error(`[GlobalTaskIndexer] Failed to load ${file.path}:`, error);
            return null;
          }
        })
      );

      // Filter out failed loads and index
      const validFiles = filesWithContent.filter(f => f !== null) as Array<{ path: string; content: string }>;
      useGlobalTaskStore.getState().indexMultipleFiles(validFiles);

    } catch (error) {
      console.error('[GlobalTaskIndexer] Failed to load files:', error);
      throw error;
    }
  }

  /**
   * Setup file watcher to keep index in sync
   */
  private setupFileWatcher() {
    console.log('[GlobalTaskIndexer] Setting up file watcher...');

    // Subscribe to file store changes
    this.fileWatcherUnsubscribe = useFileStore.subscribe(
      (state) => {
        // When files change, check for updates to Notes files
        state.files.forEach(file => {
          // Check if file metadata has folder property, otherwise parse from path
          const folder = file.folder || (file.path?.includes('Notes/') ? 'Notes' : '');
          if (folder === 'Notes' &&
              (file.path.endsWith('.txt') || file.path.endsWith('.md'))) {
            // File metadata changed, but we don't have content here
            // The content will be indexed when the file is opened
            console.log(`[GlobalTaskIndexer] File metadata changed: ${file.path}`);
          }
        });
      }
    );

    // Also subscribe to current file changes
    useFileStore.subscribe(
      (state) => {
        const currentFile = state.currentFile;
        if (currentFile) {
          // Check folder from metadata
          const folder = currentFile.metadata.folder ||
                        (currentFile.metadata.path.includes('Notes/') ? 'Notes' : '');

          if (folder === 'Notes') {
            // Re-index current file when it changes
            useGlobalTaskStore.getState().indexFile(
              currentFile.metadata.path,
              currentFile.content
            );
          }
        }
      }
    );
  }

  /**
   * Manually refresh a specific file
   */
  async refreshFile(filePath: string) {
    console.log(`[GlobalTaskIndexer] Manually refreshing: ${filePath}`);

    try {
      const fileData = await api.getFile(filePath);
      useGlobalTaskStore.getState().indexFile(filePath, fileData.content);
    } catch (error) {
      console.error(`[GlobalTaskIndexer] Failed to refresh ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Manually refresh all files
   */
  async refreshAll() {
    console.log('[GlobalTaskIndexer] Manually refreshing all files...');
    await this.indexAllNotesFiles();
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.fileWatcherUnsubscribe) {
      this.fileWatcherUnsubscribe();
      this.fileWatcherUnsubscribe = null;
    }
    this.isInitialized = false;
    useGlobalTaskStore.getState().clearIndex();
    console.log('[GlobalTaskIndexer] Disposed');
  }
}

// Export singleton instance
export const globalTaskIndexer = new GlobalTaskIndexer();
