import React, { useState, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import clsx from 'clsx';

/**
 * QuickCapture Component
 *
 * Global quick capture modal for instant task inbox.
 * Triggered by Cmd+Shift+N (Mac) or Ctrl+Shift+N (Windows).
 *
 * Features:
 * - Quick task capture without navigation
 * - Priority selection (P1-P4)
 * - Appends to Inbox.txt
 * - Toast confirmation
 * - ESC to cancel
 */

const INBOX_PATH = 'Notes/Inbox.txt';

interface QuickCaptureProps {
  // Optional: custom inbox path
  inboxPath?: string;
}

export const QuickCapture: React.FC<QuickCaptureProps> = ({
  inboxPath = INBOX_PATH
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3 | 4 | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register global keyboard shortcut
  useHotkeys('mod+shift+n', (e) => {
    e.preventDefault();
    setIsOpen(true);
  }, { enableOnFormTags: true });

  // Close on ESC
  useHotkeys('esc', () => {
    if (isOpen) {
      handleClose();
    }
  }, { enableOnFormTags: true, enabled: isOpen });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        const input = document.getElementById('quick-capture-input');
        input?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setInput('');
    setPriority(null);
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsSubmitting(true);

    try {
      // Build task line with optional priority
      const priorityTag = priority ? ` #p${priority}` : '';
      const taskLine = `- [ ] ${input.trim()}${priorityTag}`;

      // Get current inbox content
      let currentContent = '';
      try {
        const fileData = await api.getFile(inboxPath);
        currentContent = fileData.content;
      } catch (error) {
        // Inbox doesn't exist yet - that's ok, we'll create it
        currentContent = '# Inbox\n\n';
      }

      // Append new task
      const updatedContent = currentContent.trimEnd() + '\n' + taskLine + '\n';

      // Save to inbox
      await api.saveFile(inboxPath, updatedContent);

      // Success!
      toast.success('Added to inbox', {
        duration: 2000,
        position: 'bottom-right',
        icon: '✅'
      });

      // Close and reset
      handleClose();
    } catch (error) {
      console.error('[QuickCapture] Failed to add task:', error);
      toast.error('Failed to add task. Please try again.', {
        duration: 4000,
        position: 'bottom-right'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const priorities = [
    { value: 1, label: 'P1', color: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400' },
    { value: 2, label: 'P2', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400' },
    { value: 3, label: 'P3', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 4, label: 'P4', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 pointer-events-none">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 pointer-events-auto border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Capture
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Add a task to your inbox
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Close (ESC)"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Input */}
          <div className="px-6 py-4">
            <input
              id="quick-capture-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          {/* Priority Selector */}
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority:
              </label>
              <div className="flex gap-2">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(priority === p.value ? null : p.value as 1 | 2 | 3 | 4)}
                    className={clsx(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      priority === p.value
                        ? `${p.color} ring-2 ring-offset-1 ring-current`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                    )}
                    disabled={isSubmitting}
                  >
                    {p.label}
                  </button>
                ))}
                {priority && (
                  <button
                    onClick={() => setPriority(null)}
                    className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    disabled={isSubmitting}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">Enter</kbd>
              {' '}to add • {' '}
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">ESC</kbd>
              {' '}to cancel
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isSubmitting}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  !input.trim() || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                )}
              >
                {isSubmitting ? 'Adding...' : 'Add to Inbox'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
