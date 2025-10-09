import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { KanbanColumn as KanbanColumnType } from '../../types';
import type { ParsedTask } from '../../services/taskService';
import { getTasksForColumn } from '../../services/boardService';
import { KanbanCard } from './KanbanCard';
import clsx from 'clsx';

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: ParsedTask[];
  boardFilters?: string[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  boardFilters,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'kanban-column',
      column,
    },
  });

  const columnTasks = getTasksForColumn(tasks, column, boardFilters);

  // Sort tasks if needed
  const sortedTasks = [...columnTasks].sort((a, b) => {
    // Priority sorting: higher priority first (1 is highest)
    if (a.priority && b.priority) {
      return a.priority - b.priority;
    }
    if (a.priority) return -1;
    if (b.priority) return 1;

    // Date sorting: earlier dates first
    if (a.date && b.date) {
      return a.date.getTime() - b.date.getTime();
    }
    if (a.date) return -1;
    if (b.date) return 1;

    return 0;
  });

  const isAtLimit = column.limit && columnTasks.length >= column.limit;

  return (
    <div
      className={clsx(
        'flex flex-col rounded-lg p-4 min-w-[320px] max-w-[320px] transition-colors',
        isOver
          ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400'
          : 'bg-gray-100 dark:bg-gray-800 border-2 border-transparent'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {column.color && (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
          )}
          <h3 className="font-semibold text-gray-900 dark:text-white">{column.name}</h3>
        </div>
        <span
          className={clsx(
            'text-sm px-2 py-0.5 rounded-full',
            isAtLimit
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          )}
        >
          {columnTasks.length}
          {column.limit && ` / ${column.limit}`}
        </span>
      </div>

      {/* WIP Limit Warning */}
      {isAtLimit && (
        <div className="mb-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
          WIP limit reached
        </div>
      )}

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 space-y-3 min-h-[200px] overflow-y-auto',
          isOver && 'ring-2 ring-amber-400 ring-inset rounded'
        )}
      >
        {sortedTasks.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
            Drop tasks here
          </div>
        ) : (
          sortedTasks.map((task) => <KanbanCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
};
