import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import type { ParsedTask } from '../../services/taskService';
import { PriorityBadge } from '../tasks/PriorityBadge';
import { useTaskDetailsStore } from '../../store/taskDetailsStore';
import clsx from 'clsx';

interface KanbanCardProps {
  task: ParsedTask;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task }) => {
  const { masterToggleVisible, isCollapsed, toggleExpansion } = useTaskDetailsStore();
  const hasDetails = task.hasDetails && task.details;
  const isDetailsCollapsed = isCollapsed(task.id);
  const showDetails = masterToggleVisible && !isDetailsCollapsed && hasDetails;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      task,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDetails && masterToggleVisible) {
      toggleExpansion(task.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border border-gray-200 dark:border-gray-700',
        isDragging && 'opacity-50'
      )}
    >
      {/* Priority, Text, and Details Toggle */}
      <div className="flex items-start gap-2 mb-2">
        {task.priority && <PriorityBadge priority={task.priority} size="sm" />}
        <p className="text-sm text-gray-900 dark:text-gray-100 flex-1 leading-snug">
          {task.text}
        </p>

        {/* Details toggle button */}
        {hasDetails && masterToggleVisible && (
          <button
            onClick={handleToggleDetails}
            className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={showDetails ? 'Hide details' : 'Show details'}
          >
            {showDetails ? (
              <ChevronDownIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            )}
          </button>
        )}
      </div>

      {/* Task Details */}
      {showDetails && (
        <div className="mt-2 mb-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded border-l-2 border-blue-400 dark:border-blue-600">
          <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
            <ReactMarkdown>{task.details}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Subtask count */}
      {task.children.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {task.children.length} subtask{task.children.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Footer: Date and Tags */}
      <div className="flex flex-wrap gap-2 items-center">
        {task.date && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {format(task.date, 'MMM d')}
          </span>
        )}
        {task.tags
          .filter((t) => !t.startsWith('status-'))
          .slice(0, 3)
          .map((tag) => (
            <span
              key={tag}
              className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
            >
              #{tag}
            </span>
          ))}
        {task.tags.filter((t) => !t.startsWith('status-')).length > 3 && (
          <span className="text-xs text-gray-400">
            +{task.tags.filter((t) => !t.startsWith('status-')).length - 3}
          </span>
        )}
      </div>
    </div>
  );
};
