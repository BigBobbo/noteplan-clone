/**
 * Keyboard shortcut definitions and handlers
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  handler: () => void;
}

/**
 * Check if keyboard event matches shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: Partial<KeyboardShortcut>
): boolean {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

  // Safety check for event.key
  if (!event.key) {
    return false;
  }

  if (shortcut.key && event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  if (shortcut.ctrl && !ctrlKey) return false;
  if (shortcut.cmd && !event.metaKey) return false;
  if (shortcut.shift && !event.shiftKey) return false;
  if (shortcut.alt && !event.altKey) return false;

  return true;
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: Partial<KeyboardShortcut>): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.cmd) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcut.key) parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

/**
 * Global shortcuts configuration
 */
export const GLOBAL_SHORTCUTS = {
  NEW_NOTE: {
    key: 'n',
    ctrl: true,
    description: 'Create new note',
  },
  SAVE: {
    key: 's',
    ctrl: true,
    description: 'Save current note',
  },
  TOGGLE_SIDEBAR: {
    key: 'b',
    ctrl: true,
    description: 'Toggle sidebar',
  },
  TOGGLE_THEME: {
    key: 'd',
    ctrl: true,
    shift: true,
    description: 'Toggle dark mode',
  },
  QUICK_SWITCHER: {
    key: 'p',
    ctrl: true,
    description: 'Quick file switcher',
  },
  SEARCH: {
    key: 'f',
    ctrl: true,
    description: 'Search in current note',
  },
  COMMAND_PALETTE: {
    key: 'k',
    ctrl: true,
    description: 'Open command palette',
  },
};

/**
 * Editor shortcuts configuration
 */
export const EDITOR_SHORTCUTS = {
  BOLD: {
    key: 'b',
    ctrl: true,
    description: 'Bold text',
  },
  ITALIC: {
    key: 'i',
    ctrl: true,
    description: 'Italic text',
  },
  LINK: {
    key: 'k',
    ctrl: true,
    shift: true,
    description: 'Insert link',
  },
  HEADING_UP: {
    key: ']',
    ctrl: true,
    description: 'Increase heading level',
  },
  HEADING_DOWN: {
    key: '[',
    ctrl: true,
    description: 'Decrease heading level',
  },
};

/**
 * Calendar shortcuts configuration
 */
export const CALENDAR_SHORTCUTS = {
  GO_TO_TODAY: {
    key: 't',
    ctrl: true,
    description: 'Go to today',
  },
  PREVIOUS_DAY: {
    key: '[',
    ctrl: true,
    shift: true,
    description: 'Go to previous day',
  },
  NEXT_DAY: {
    key: ']',
    ctrl: true,
    shift: true,
    description: 'Go to next day',
  },
  TOGGLE_TIMELINE: {
    key: 'l',
    ctrl: true,
    description: 'Toggle timeline view',
  },
};
