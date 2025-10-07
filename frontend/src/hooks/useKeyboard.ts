import { useEffect } from 'react';
import { matchesShortcut, GLOBAL_SHORTCUTS } from '../utils/shortcuts';
import { useUIStore } from '../store/uiStore';
import { useFileStore } from '../store/fileStore';

export function useKeyboard() {
  const { toggleSidebar, toggleTheme, openNewFileModal } = useUIStore();
  const { currentFile, saveFile } = useFileStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // New note (Cmd/Ctrl+N)
      if (matchesShortcut(event, GLOBAL_SHORTCUTS.NEW_NOTE)) {
        event.preventDefault();
        openNewFileModal();
        return;
      }

      // Save (Cmd/Ctrl+S)
      if (matchesShortcut(event, GLOBAL_SHORTCUTS.SAVE)) {
        event.preventDefault();
        if (currentFile) {
          saveFile(currentFile.metadata.path, currentFile.content);
        }
        return;
      }

      // Toggle sidebar (Cmd/Ctrl+B)
      if (matchesShortcut(event, GLOBAL_SHORTCUTS.TOGGLE_SIDEBAR)) {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      // Toggle theme (Cmd/Ctrl+Shift+D)
      if (matchesShortcut(event, GLOBAL_SHORTCUTS.TOGGLE_THEME)) {
        event.preventDefault();
        toggleTheme();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentFile, openNewFileModal, toggleSidebar, toggleTheme, saveFile]);
}
