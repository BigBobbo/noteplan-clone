import React, { useEffect, useState } from 'react';
import { useFileStore } from '../../store/fileStore';

export const RawTextEditor: React.FC = () => {
  const { currentFile, saveFile } = useFileStore();
  const [localContent, setLocalContent] = useState('');
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Update local content when file changes
  useEffect(() => {
    if (currentFile) {
      setLocalContent(currentFile.content);
    }
  }, [currentFile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Debounced auto-save
    const timeout = setTimeout(() => {
      if (currentFile) {
        saveFile(currentFile.metadata.path, newContent);
      }
    }, 1000);

    setSaveTimeout(timeout);
  };

  // Empty state - no file selected
  if (!currentFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg">Select a note to view raw content</p>
          <p className="text-sm mt-2">The raw text will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 h-full">
      <textarea
        value={localContent}
        onChange={handleChange}
        className="w-full h-full p-6 font-mono text-sm
                   bg-white dark:bg-gray-800
                   text-gray-900 dark:text-gray-100
                   focus:outline-none resize-none
                   placeholder:text-gray-400 dark:placeholder:text-gray-500"
        placeholder="Start typing..."
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
};
