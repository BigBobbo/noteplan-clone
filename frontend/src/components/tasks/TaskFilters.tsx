import type { TaskFilter } from '../../services/taskService';

interface TaskFiltersProps {
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
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
  taskCounts,
}) => {
  return (
    <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
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
  );
};
