import React, { useState, useEffect } from 'react';
import type { TimeBlock } from '../../utils/timeBlockUtils';
import { calculateDuration } from '../../utils/timeBlockUtils';

interface TimeBlockEditDialogProps {
  block: TimeBlock;
  onSave: (updates: { start: string; end: string; description: string }) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export const TimeBlockEditDialog: React.FC<TimeBlockEditDialogProps> = ({
  block,
  onSave,
  onDelete,
  onCancel,
}) => {
  const [start, setStart] = useState(block.start);
  const [end, setEnd] = useState(block.end);
  const [description, setDescription] = useState(block.description);
  const [duration, setDuration] = useState(block.duration);

  // Update duration when start or end changes
  useEffect(() => {
    const calculatedDuration = calculateDuration(start, end);
    setDuration(calculatedDuration);
  }, [start, end]);

  const handleSave = () => {
    onSave({ start, end, description });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this time block?')) {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Edit Time Block
        </h3>

        {/* Time inputs */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="What are you working on?"
          />
        </div>

        {/* Duration display */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <span className="font-medium">Duration:</span> {duration} minutes ({Math.floor(duration / 60)}h {duration % 60}m)
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
