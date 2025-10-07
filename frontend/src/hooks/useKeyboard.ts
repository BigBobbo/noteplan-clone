import { useEffect } from 'react';
import { matchesShortcut, GLOBAL_SHORTCUTS, CALENDAR_SHORTCUTS } from '../utils/shortcuts';
import { useUIStore } from '../store/uiStore';
import { useFileStore } from '../store/fileStore';
import { useCalendarStore } from '../store/calendarStore';

export function useKeyboard() {
  const { toggleSidebar, toggleTheme, openNewFileModal } = useUIStore();
  const { currentFile, saveFile } = useFileStore();
  const { goToToday, goToPrevious, goToNext, toggleTimeline } = useCalendarStore();

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

      // Go to today (Cmd/Ctrl+T)
      if (matchesShortcut(event, CALENDAR_SHORTCUTS.GO_TO_TODAY)) {
        event.preventDefault();
        goToToday();
        return;
      }

      // Previous day (Cmd/Ctrl+Shift+[)
      if (matchesShortcut(event, CALENDAR_SHORTCUTS.PREVIOUS_DAY)) {
        event.preventDefault();
        goToPrevious();
        return;
      }

      // Next day (Cmd/Ctrl+Shift+])
      if (matchesShortcut(event, CALENDAR_SHORTCUTS.NEXT_DAY)) {
        event.preventDefault();
        goToNext();
        return;
      }

      // Toggle timeline (Cmd/Ctrl+L)
      if (matchesShortcut(event, CALENDAR_SHORTCUTS.TOGGLE_TIMELINE)) {
        event.preventDefault();
        toggleTimeline();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentFile, openNewFileModal, toggleSidebar, toggleTheme, saveFile, goToToday, goToPrevious, goToNext, toggleTimeline]);
}
