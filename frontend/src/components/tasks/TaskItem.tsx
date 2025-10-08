import { format } from 'date-fns';
import type { ParsedTask } from '../../services/taskService';

interface TaskItemProps {
  task: ParsedTask;
  onToggle: (taskId: string) => void;
  onReschedule?: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onReschedule,
}) => {
  return (
    <div className="task-item flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
      />
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${
            task.completed
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-gray-100'
          } ${task.important ? 'font-semibold' : ''}`}
        >
          {task.text}
        </span>
        <div className="flex flex-wrap gap-2 mt-1">
          {task.date && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span>📅</span>
              {format(task.date, 'MMM d, yyyy')}
            </span>
          )}
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              #{tag}
            </span>
          ))}
          {task.mentions.map((mention) => (
            <span
              key={mention}
              className="text-xs text-purple-600 dark:text-purple-400"
            >
              @{mention}
            </span>
          ))}
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
        </div>
      </div>
      {onReschedule && (
        <button
          onClick={() => onReschedule(task.id)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Reschedule task"
        >
          ⏰
        </button>
      )}
    </div>
  );
};
