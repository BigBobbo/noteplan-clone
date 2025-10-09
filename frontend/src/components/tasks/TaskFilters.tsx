import type { TaskFilter } from '../../services/taskService';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface TaskFiltersProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onResetOrder?: () => void;
  taskCounts?: {
    all: number;
    active: number;
    completed: number;
    today: number;
    scheduled: number;
  };
}

const filters: { value: TaskFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '📋' },
  { value: 'active', label: 'Active', emoji: '⭐' },
  { value: 'completed', label: 'Completed', emoji: '✅' },
  { value: 'today', label: 'Today', emoji: '📅' },
  { value: 'scheduled', label: 'Scheduled', emoji: '⏰' },
];

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  currentFilter,
  onFilterChange,
  onResetOrder,
  taskCounts,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetOrder = () => {
    if (showConfirm) {
      onResetOrder?.();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto justify-between">
      <div className="flex gap-1">
        {filters.map(({ value, label, emoji }) => {
          const isActive = currentFilter === value;
          const count = taskCounts?.[value];

          return (
            <button
              key={value}
              onClick={() => onFilterChange(value)}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <span className="mr-1">{emoji}</span>
              {label}
              {count !== undefined && count > 0 && (
                <span className="ml-1.5 text-xs opacity-75">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {onResetOrder && (
        <button
          onClick={handleResetOrder}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5
            ${
              showConfirm
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
          title="Reset task order to default (by line number)"
        >
          <ArrowPathIcon className="h-4 w-4" />
          {showConfirm ? 'Click to confirm' : 'Reset Order'}
        </button>
      )}
    </div>
  );
};
