import React, { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface Shortcut {
  key: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  { key: 'Cmd+K', description: 'Open command palette' },
  { key: 'Cmd+Shift+N', description: 'Quick capture' },
  { key: 'Cmd+P', description: 'Open file' },
  { key: 'Cmd+/', description: 'Toggle sidebar' },
  { key: 'Cmd+N', description: 'New note' },
  { key: '/', description: 'Insert template (in editor)' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close dialog' },
];

interface KeyboardShortcutsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledOnClose ? controlledOnClose : () => setInternalIsOpen(false);

  useHotkeys('shift+/', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(true);
    }
  }, {
    keydown: true,
    keyup: false,
    preventDefault: true,
  });

  useHotkeys('escape', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  }, {
    keydown: true,
    keyup: false,
    enabled: isOpen,
    preventDefault: true,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {shortcuts.map(({ key, description }) => (
              <div
                key={key}
                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">{description}</span>
                <kbd className="px-3 py-1 text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                  {key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Press <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">?</kbd> to toggle this dialog
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
