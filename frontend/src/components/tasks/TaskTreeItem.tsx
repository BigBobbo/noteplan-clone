import { format } from 'date-fns';
import { ChevronRightIcon, ChevronDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type { ParsedTask } from '../../services/taskService';
import { PriorityBadge } from './PriorityBadge';
import { useTaskStore } from '../../store/taskStore';
import { useTaskDetailsStore } from '../../store/taskDetailsStore';
import { useFileStore } from '../../store/fileStore';
import { updateTaskDetails } from '../../services/taskService';
import { TaskDetails } from './TaskDetails';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskTreeItemProps {
  task: ParsedTask;
  onToggle: (taskId: string) => void;
  onReschedule?: (taskId: string) => void;
  showSource?: boolean;
}

export const TaskTreeItem: React.FC<TaskTreeItemProps> = ({
  task,
  onToggle,
  onReschedule,
  showSource = false,
}) => {
  const { toggleSubtasks, isTaskExpanded } = useTaskStore();
  const {
    toggleExpansion,
    isCollapsed: isDetailsCollapsed,
    masterToggleVisible,
  } = useTaskDetailsStore();
  const { currentFile, saveFile } = useFileStore();

  const hasChildren = task.children && task.children.length > 0;
  const isExpanded = isTaskExpanded(task.id);
  // Show details if: master toggle is ON AND task is not explicitly collapsed AND has details
  const showDetails = masterToggleVisible && !isDetailsCollapsed(task.id) && !!task.details;

  // Only enable drag-and-drop for root-level tasks
  const isRootTask = task.depth === 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !isRootTask, // Disable dragging for child tasks
    data: {
      type: 'sortable-task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isRootTask ? 'grab' : 'default',
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSubtasks(task.id);
  };

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (masterToggleVisible && task.hasDetails) {
      toggleExpansion(task.id);
    }
  };

  const handleSaveDetails = async (newDetails: string) => {
    if (!currentFile) return;

    const updatedContent = updateTaskDetails(
      currentFile.content,
      task.line,
      newDetails,
      task.depth
    );

    await saveFile(currentFile.metadata.path, updatedContent);
  };

  const handleDeleteDetails = async () => {
    if (!currentFile) return;

    const updatedContent = updateTaskDetails(
      currentFile.content,
      task.line,
      undefined,
      task.depth
    );

    await saveFile(currentFile.metadata.path, updatedContent);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="task-tree-item"
    >
      {/* Main task row */}
      <div
        {...(isRootTask ? attributes : {})}
        {...(isRootTask ? listeners : {})}
        className={clsx(
          'flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors',
          task.depth > 0 && 'ml-6', // Indent by depth
          isDragging && 'bg-blue-50 dark:bg-blue-900/20'
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

            {/* Details indicator */}
            {task.hasDetails && masterToggleVisible && (
              <button
                onClick={handleToggleDetails}
                className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={showDetails ? 'Collapse details' : 'Expand details'}
              >
                {showDetails ? (
                  <ChevronDownIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
              </button>
            )}
            {task.hasDetails && !masterToggleVisible && (
              <DocumentTextIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            )}

            {/* Priority badge */}
            {task.priority && (
              <PriorityBadge priority={task.priority} size="sm" />
            )}
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-2 mt-1">
            {/* Source file indicator */}
            {showSource && task.file && (
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                <DocumentTextIcon className="h-3 w-3" />
                {task.file.split('/').pop()?.replace('.txt', '') || task.file}
              </span>
            )}

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

      {/* Task Details */}
      {task.details && (
        <TaskDetails
          details={task.details}
          onSave={handleSaveDetails}
          onDelete={handleDeleteDetails}
          isExpanded={!!showDetails}
        />
      )}

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
