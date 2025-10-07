import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { NewFileModal } from '../modals/NewFileModal';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useUIStore } from '../../store/uiStore';
import { useEffect } from 'react';

export const Layout: React.FC = () => {
  const { theme, setTheme } = useUIStore();

  // Initialize WebSocket connection
  useWebSocket();

  // Setup keyboard shortcuts
  useKeyboard();

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('noteplan-ui-storage');
    if (savedTheme) {
      try {
        const data = JSON.parse(savedTheme);
        if (data.state?.theme) {
          setTheme(data.state.theme);
        }
      } catch (e) {
        console.error('Failed to load theme:', e);
      }
    }
  }, [setTheme]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MarkdownEditor />
      </div>

      <NewFileModal />
    </div>
  );
};
