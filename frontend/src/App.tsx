import { useEffect } from 'react';
import { DragDropProvider } from './components/DragDropProvider';
import { Layout } from './components/layout/Layout';
import { NewFileModal } from './components/modals/NewFileModal';
import { DeleteConfirm } from './components/modals/DeleteConfirm';
import { CommandPalette } from './components/command/CommandPalette';
import { useWebSocket } from './hooks/useWebSocket';
import { useKeyboard } from './hooks/useKeyboard';
import { useUIStore } from './store/uiStore';
import { useFileStore } from './store/fileStore';

function App() {
  const { theme } = useUIStore();
  const { error, clearError } = useFileStore();

  // Initialize WebSocket connection
  useWebSocket();

  // Initialize keyboard shortcuts
  useKeyboard();

  // Apply theme on mount
  useEffect(() => {
    // Set data-theme attribute instead of class
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initialize folders on mount
  useEffect(() => {
    const init = async () => {
      try {
        const api = (await import('./services/api')).api;
        await api.initializeFolders();
      } catch (err) {
        console.error('Failed to initialize folders:', err);
      }
    };
    init();
  }, []);

  return (
    <DragDropProvider>
      <div className="App">
        {/* Main Layout */}
        <Layout />

        {/* Modals */}
        <NewFileModal />
        <DeleteConfirm />

        {/* Command Palette */}
        <CommandPalette />

        {/* Global Error Toast */}
        {error && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragDropProvider>
  );
}

export default App;
