import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import {
  parseScheduledTasks,
  toggleDailyCompletion,
  getSourceFileName,
  formatTimeSlots,
  type ScheduledTaskInstance,
} from '../services/scheduledTasksService';
import { useFileStore } from '../store/fileStore';
import clsx from 'clsx';

interface ScheduledTasksSectionProps {
  dailyNoteContent: string;
  date: Date;
  onTaskClick?: (taskId: string, sourceFile: string) => void;
}

export const ScheduledTasksSection: React.FC<ScheduledTasksSectionProps> = ({
  dailyNoteContent,
  date,
  onTaskClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTaskInstance[]>([]);
  const { openFile } = useFileStore();

  // Parse scheduled tasks whenever content changes
  useEffect(() => {
    const tasks = parseScheduledTasks(dailyNoteContent, date);
    setScheduledTasks(tasks);
  }, [dailyNoteContent, date]);

  // Group tasks by source file
  const tasksBySource = useMemo(() => {
    const grouped = new Map<string, ScheduledTaskInstance[]>();

    scheduledTasks.forEach(task => {
      const fileName = getSourceFileName(task.sourceFile);
      if (!grouped.has(fileName)) {
        grouped.set(fileName, []);
      }
      grouped.get(fileName)!.push(task);
    });

    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [scheduledTasks]);

  const handleToggleCompletion = (taskId: string) => {
    setScheduledTasks(prev =>
      prev.map(task =>
        task.taskId === taskId
          ? { ...task, completedForDay: !task.completedForDay }
          : task
      )
    );

    const task = scheduledTasks.find(t => t.taskId === taskId);
    if (task) {
      toggleDailyCompletion(taskId, date, !task.completedForDay);
    }
  };

  const handleTaskClick = (task: ScheduledTaskInstance) => {
    if (onTaskClick) {
      onTaskClick(task.taskId, task.sourceFile);
    } else {
      // Default: open the source file
      openFile(task.sourceFile);
    }
  };

  if (scheduledTasks.length === 0) {
    return null; // Don't show section if no tasks scheduled
  }

  return (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-2 rounded transition-colors group"
      >
        {isExpanded ? (
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-gray-500" />
        )}
        <CalendarIcon className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Scheduled Tasks for Today
        </h3>
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          {scheduledTasks.length} {scheduledTasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </button>

      {/* Task List */}
      {isExpanded && (
        <div className="mt-3 ml-2 space-y-4">
          {tasksBySource.map(([sourceFileName, tasks]) => (
            <div key={sourceFileName} className="space-y-2">
              {/* Source File Header */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                <span>From: {sourceFileName}</span>
              </div>

              {/* Tasks from this source */}
              <div className="ml-5 space-y-1">
                {tasks.map(task => (
                  <ScheduledTaskItem
                    key={task.taskId}
                    task={task}
                    onToggle={() => handleToggleCompletion(task.taskId)}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ScheduledTaskItemProps {
  task: ScheduledTaskInstance;
  onToggle: () => void;
  onClick: () => void;
}

const ScheduledTaskItem: React.FC<ScheduledTaskItemProps> = ({
  task,
  onToggle,
  onClick,
}) => {
  return (
    <div className="flex items-start gap-2 group hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 py-1.5 rounded transition-colors">
      {/* Daily completion checkbox */}
      <input
        type="checkbox"
        checked={task.completedForDay}
        onChange={onToggle}
        className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
        title="Mark as done for today (doesn't affect source task)"
      />

      {/* Task content */}
      <div className="flex-1 min-w-0">
        {/* Task text with link */}
        <button
          onClick={onClick}
          className={clsx(
            'text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm',
            {
              'line-through text-gray-400 dark:text-gray-600': task.completedForDay,
              'text-gray-900 dark:text-white': !task.completedForDay,
            }
          )}
        >
          {task.task.text}
        </button>

        {/* Time slots */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTimeSlots(task.timeSlots)}
          </span>

          {/* Priority badge */}
          {task.task.priority && (
            <span
              className={clsx(
                'text-xs px-1.5 py-0.5 rounded font-medium',
                {
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
                    task.task.priority === 1,
                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400':
                    task.task.priority === 2,
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                    task.task.priority === 3,
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400':
                    task.task.priority === 4,
                }
              )}
            >
              P{task.task.priority}
            </span>
          )}

          {/* Tags */}
          {task.task.tags && task.task.tags.length > 0 && (
            <div className="flex gap-1">
              {task.task.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  {tag}
                </span>
              ))}
              {task.task.tags.length > 2 && (
                <span className="text-xs text-gray-400">
                  +{task.task.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Source task status indicator */}
      {task.task.completed && (
        <div
          className="mt-1 text-xs text-green-600 dark:text-green-400"
          title="Task is completed in source file"
        >
          ✓ Completed
        </div>
      )}
    </div>
  );
};
