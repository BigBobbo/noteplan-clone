import React, { useState, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useFileStore } from '../../store/fileStore';
import toast from 'react-hot-toast';

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCapture: React.FC<QuickCaptureProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3 | 4>(3);
  const { saveFile, getFile, createFile } = useFileStore();

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setInput('');
      setPriority(3);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    try {
      const inboxPath = 'Notes/Inbox.txt';
      const task = `* ${input} #p${priority}\n`;

      // Try to get existing file or create new one
      try {
        const fileData = await getFile(inboxPath);
        const newContent = fileData.content + task;
        await saveFile(inboxPath, newContent);
      } catch (error) {
        // File doesn't exist, create it
        await createFile(inboxPath, `# Inbox\n\n${task}`);
      }

      toast.success('Added to inbox');
      setInput('');
      onClose();
    } catch (error) {
      console.error('Failed to add to inbox:', error);
      toast.error('Failed to add to inbox');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/50">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Quick Capture
          </h3>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            autoFocus
            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-gray-100"
          />

          <div className="mt-4 flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Priority:
            </label>
            {[1, 2, 3, 4].map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p as 1 | 2 | 3 | 4)}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  priority === p
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                P{p}
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Inbox
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component with hotkey
export const QuickCaptureWithHotkey: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useHotkeys('mod+shift+n', (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  }, {
    keydown: true,
    keyup: false,
    preventDefault: true,
  });

  return <QuickCapture isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};
