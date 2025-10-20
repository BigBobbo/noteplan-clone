import type { TaskFilter } from '../../services/taskService';
import { ArrowPathIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useTaskDetailsStore } from '../../store/taskDetailsStore';
import clsx from 'clsx';

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
    p1: number;
    p2: number;
    p3: number;
    p4: number;
  };
}

const statusFilters: { value: TaskFilter; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '📋' },
  { value: 'active', label: 'Active', emoji: '⭐' },
  { value: 'completed', label: 'Completed', emoji: '✅' },
  { value: 'today', label: 'Today', emoji: '📅' },
  { value: 'scheduled', label: 'Scheduled', emoji: '⏰' },
];

const priorityFilters: { value: TaskFilter; label: string; color: string }[] = [
  { value: 'p1', label: 'P1', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' },
  { value: 'p2', label: 'P2', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700' },
  { value: 'p3', label: 'P3', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700' },
  { value: 'p4', label: 'P4', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' },
];

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  currentFilter,
  onFilterChange,
  onResetOrder,
  taskCounts,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const { masterToggleVisible, toggleMasterVisibility } = useTaskDetailsStore();

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
    <div className="flex flex-col gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
      {/* Status Filters Row */}
      <div className="flex gap-1 overflow-x-auto justify-between">
        <div className="flex gap-1">
          {statusFilters.map(({ value, label, emoji }) => {
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

        <div className="flex gap-2">
          {/* Master toggle for task details */}
          <button
            onClick={toggleMasterVisibility}
            className={clsx(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5',
              masterToggleVisible
                ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            title={masterToggleVisible ? 'Hide all task details' : 'Show all task details'}
          >
            {masterToggleVisible ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" />
            )}
            Details
          </button>

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
      </div>

      {/* Priority Filters Row */}
      <div className="flex gap-1 overflow-x-auto">
        <span className="text-xs text-gray-500 dark:text-gray-400 self-center mr-2 whitespace-nowrap">Priority:</span>
        {priorityFilters.map(({ value, label, color }) => {
          const isActive = currentFilter === value;
          const count = taskCounts?.[value];

          return (
            <button
              key={value}
              onClick={() => onFilterChange(value)}
              className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap border',
                isActive ? color : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className="ml-1 text-xs opacity-75">({count})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
