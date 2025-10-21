import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface TaskDetailsProps {
  details: string;
  onSave: (newDetails: string) => void;
  onDelete: () => void;
  isExpanded: boolean;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({
  details,
  onSave,
  onDelete,
  isExpanded,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(details);

  // Debug logging
  useEffect(() => {
    console.log('[TaskDetails] Received details:', JSON.stringify(details));
    console.log('[TaskDetails] Contains newlines:', details.includes('\n'));
    console.log('[TaskDetails] Line count:', details.split('\n').length);
  }, [details]);

  if (!isExpanded) {
    return null;
  }

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(details);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Delete task details?')) {
      onDelete();
    }
  };

  return (
    <div
      className={clsx(
        'ml-10 mt-1 mb-2 p-3 rounded-md border-l-2 transition-colors',
        'bg-gray-50 dark:bg-gray-800/50',
        'border-blue-400 dark:border-blue-600'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full min-h-[80px] p-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleCancel();
                  } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSave();
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded p-1 -m-1 transition-colors"
              onDoubleClick={() => setIsEditing(true)}
              title="Double-click to edit"
            >
              <ReactMarkdown
                components={{
                  // Ensure paragraphs render with proper spacing
                  p: ({children}) => <p className="mb-2">{children}</p>,
                  // Ensure lists render properly
                  ul: ({children}) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                  li: ({children}) => <li className="mb-1">{children}</li>,
                  // Code blocks
                  pre: ({children}) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-2 overflow-x-auto">{children}</pre>,
                  code: ({children}) => <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{children}</code>,
                }}
              >
                {details}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              title="Edit details"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete details"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
