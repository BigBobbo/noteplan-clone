import { useEffect, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useUIStore } from '../store/uiStore';
import { useFileStore } from '../store/fileStore';
import { useCalendarStore } from '../store/calendarStore';

export function useKeyboard() {
  const { toggleSidebar, toggleTheme, openNewFileModal, commandPaletteOpen, openCommandPalette, closeCommandPalette } = useUIStore();
  const { currentFile, saveFile } = useFileStore();
  const { goToToday, goToPrevious, goToNext, toggleTimeline } = useCalendarStore();

  // Debounce protection
  const lastCmdKPress = useRef<number>(0);

  useEffect(() => {
    console.log('[useKeyboard] Keyboard shortcuts registered');
  }, []);

  // Command Palette (Cmd/Ctrl+K) - state-based with debounce
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    const timeSinceLast = now - lastCmdKPress.current;

    console.log('[useKeyboard] Cmd+K pressed, state:', commandPaletteOpen, 'timeSince:', timeSinceLast);

    // Debounce: ignore rapid successive calls
    if (timeSinceLast < 200) {
      console.log('[useKeyboard] Cmd+K BLOCKED by debounce');
      return;
    }

    lastCmdKPress.current = now;

    // Toggle based on current state
    if (commandPaletteOpen) {
      closeCommandPalette();
    } else {
      openCommandPalette();
    }
  }, {
    keydown: true,
    keyup: false,
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  }, [commandPaletteOpen, openCommandPalette, closeCommandPalette]);

  // New note (Cmd/Ctrl+N)
  useHotkeys('mod+n', (e) => {
    console.log('[useKeyboard] Cmd+N pressed');
    e.preventDefault();
    e.stopPropagation();
    openNewFileModal();
  }, {
    keydown: true,
    keyup: false,
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  }, [openNewFileModal]);

  // Save (Cmd/Ctrl+S)
  useHotkeys('mod+s', (e) => {
    console.log('[useKeyboard] Cmd+S pressed');
    e.preventDefault();
    if (currentFile) {
      saveFile(currentFile.metadata.path, currentFile.content);
    }
  }, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  }, [currentFile, saveFile]);

  // Toggle sidebar (Cmd/Ctrl+B)
  useHotkeys('mod+b', (e) => {
    console.log('[useKeyboard] Cmd+B pressed');
    e.preventDefault();
    toggleSidebar();
  }, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  }, [toggleSidebar]);

  // Toggle theme (Cmd/Ctrl+Shift+D)
  useHotkeys('mod+shift+d', (e) => {
    console.log('[useKeyboard] Cmd+Shift+D pressed');
    e.preventDefault();
    toggleTheme();
  }, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  }, [toggleTheme]);

  // Go to today (Cmd/Ctrl+T)
  useHotkeys('mod+t', (e) => {
    console.log('[useKeyboard] Cmd+T pressed');
    e.preventDefault();
    goToToday();
  }, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  }, [goToToday]);

  // Previous day (Cmd/Ctrl+Shift+[)
  useHotkeys('mod+shift+[', (e) => {
    console.log('[useKeyboard] Cmd+Shift+[ pressed');
    e.preventDefault();
    goToPrevious();
  }, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  }, [goToPrevious]);

  // Next day (Cmd/Ctrl+Shift+])
  useHotkeys('mod+shift+]', (e) => {
    console.log('[useKeyboard] Cmd+Shift+] pressed');
    e.preventDefault();
    goToNext();
  }, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  }, [goToNext]);

  // Toggle timeline (Cmd/Ctrl+L)
  useHotkeys('mod+l', (e) => {
    console.log('[useKeyboard] Cmd+L pressed');
    e.preventDefault();
    toggleTimeline();
  }, {
    preventDefault: true,
    enableOnFormTags: true,
    enableOnContentEditable: true,
  }, [toggleTimeline]);
}
