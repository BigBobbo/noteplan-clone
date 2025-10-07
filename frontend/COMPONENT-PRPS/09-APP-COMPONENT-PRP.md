# App Component - Implementation Guide

## Overview
Main App component that initializes the application, sets up global hooks, and renders the layout with modals.

## File Location
`src/App.tsx`

## Implementation

```tsx
import React, { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { NewFileModal } from './components/modals/NewFileModal';
import { DeleteConfirm } from './components/modals/DeleteConfirm';
import { useWebSocket } from './hooks/useWebSocket';
import { useKeyboard } from './hooks/useKeyboard';
import { useUIStore } from './store/uiStore';
import { useFileStore } from './store/fileStore';
import { Loading } from './components/common/Loading';

function App() {
  const { theme } = useUIStore();
  const { error, clearError } = useFileStore();

  // Initialize WebSocket connection
  useWebSocket();

  // Initialize keyboard shortcuts
  useKeyboard();

  // Apply theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initialize folders on mount
  const { initializeFolders } = useFileStore();
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
    <div className="App">
      {/* Main Layout */}
      <Layout />

      {/* Modals */}
      <NewFileModal />
      <DeleteConfirm />

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
  );
}

export default App;
```

## Features
- **Layout Rendering**: Main 3-pane layout
- **Modal Management**: New File and Delete Confirm modals
- **WebSocket Init**: Connects to real-time updates
- **Keyboard Shortcuts**: Global keyboard handling
- **Theme Application**: Applies dark mode class to HTML
- **Folder Initialization**: Creates default folders on first run
- **Error Display**: Global error toast notification
- **Loading States**: Handles async initialization

## Responsibilities
1. Initialize services (WebSocket, API)
2. Apply global settings (theme)
3. Render main layout
4. Render modals
5. Show global errors
6. Set up keyboard shortcuts

## Testing Checklist
- [ ] App renders without errors
- [ ] Theme persists after reload
- [ ] WebSocket connects on mount
- [ ] Keyboard shortcuts work
- [ ] Modals open/close correctly
- [ ] Error toast appears and dismisses
- [ ] Folders initialized on first run
- [ ] Dark mode toggles correctly
