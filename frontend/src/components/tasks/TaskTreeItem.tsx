import { format } from 'date-fns';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type { ParsedTask } from '../../services/taskService';
import { PriorityBadge } from './PriorityBadge';
import { useTaskStore } from '../../store/taskStore';

interface TaskTreeItemProps {
  task: ParsedTask;
  onToggle: (taskId: string) => void;
  onReschedule?: (taskId: string) => void;
}

export const TaskTreeItem: React.FC<TaskTreeItemProps> = ({
  task,
  onToggle,
  onReschedule,
}) => {
  const { toggleSubtasks, isTaskExpanded } = useTaskStore();
  const hasChildren = task.children && task.children.length > 0;
  const isExpanded = isTaskExpanded(task.id);

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSubtasks(task.id);
  };

  return (
    <div className="task-tree-item">
      {/* Main task row */}
      <div
        className={clsx(
          'flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors',
          task.depth > 0 && 'ml-6' // Indent by depth
        )}
        style={{ paddingLeft: `${task.depth * 24}px` }}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={handleExpand}
            className="flex-shrink-0 mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" /> // Spacer for alignment
        )}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 flex-shrink-0"
        />

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Task text */}
            <span
              className={clsx(
                'text-sm',
                task.completed
                  ? 'line-through text-gray-400 dark:text-gray-500'
                  : 'text-gray-900 dark:text-gray-100',
                task.important && !task.completed && 'font-semibold'
              )}
            >
              {task.text}
            </span>

            {/* Priority badge */}
            {task.priority && (
              <PriorityBadge priority={task.priority} size="sm" />
            )}
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-2 mt-1">
            {/* Date */}
            {task.date && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span>📅</span>
                {format(task.date, 'MMM d, yyyy')}
              </span>
            )}

            {/* Tags */}
            {task.tags
              .filter((tag) => !tag.match(/^p[1-4]$/)) // Exclude priority tags
              .map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  #{tag}
                </span>
              ))}

            {/* Mentions */}
            {task.mentions.map((mention) => (
              <span
                key={mention}
                className="text-xs text-purple-600 dark:text-purple-400"
              >
                @{mention}
              </span>
            ))}

            {/* Status badges */}
            {task.scheduled && (
              <span className="text-xs text-orange-600 dark:text-orange-400">
                [Scheduled]
              </span>
            )}
            {task.cancelled && (
              <span className="text-xs text-red-600 dark:text-red-400">
                [Cancelled]
              </span>
            )}

            {/* Children count */}
            {hasChildren && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({task.children.length} subtask{task.children.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>

        {/* Reschedule button */}
        {onReschedule && (
          <button
            onClick={() => onReschedule(task.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Reschedule task"
          >
            ⏰
          </button>
        )}
      </div>

      {/* Recursively render children */}
      {hasChildren && isExpanded && (
        <div className="task-children">
          {task.children.map((child) => (
            <TaskTreeItem
              key={child.id}
              task={child}
              onToggle={onToggle}
              onReschedule={onReschedule}
            />
          ))}
        </div>
      )}
    </div>
  );
};
