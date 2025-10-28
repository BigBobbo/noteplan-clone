import React, { useMemo, useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useCalendarStore } from '../../store/calendarStore';
import { useGlobalTaskStore } from '../../store/globalTaskStore';
import {
  getCalendarMonthGrid,
  formatDayOfMonth,
  isToday,
  isSameMonth,
  isSameDay,
  toNotePlanDate
} from '../../utils/dateUtils';
import { parseScheduledTasks } from '../../services/scheduledTasksService';
import { toggleTaskAcrossFiles } from '../../services/crossFileTaskService';
import { api } from '../../services/api';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type { ParsedTask } from '../../services/taskService';

interface DateCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isTodayDate: boolean;
  isSelected: boolean;
  tasks: ParsedTask[];
  onDayClick: (date: Date) => void;
}

const DateCell: React.FC<DateCellProps> = ({
  date,
  isCurrentMonth,
  isTodayDate,
  isSelected,
  tasks,
  onDayClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_COLLAPSED_TASKS = 3;

  const { setNodeRef, isOver } = useDroppable({
    id: `date-${date.toISOString()}`,
    data: {
      type: 'date-cell',
      date,
    },
  });

  const visibleTasks = isExpanded ? tasks : tasks.slice(0, MAX_COLLAPSED_TASKS);
  const hiddenCount = tasks.length - MAX_COLLAPSED_TASKS;

  const handleTaskToggle = async (e: React.MouseEvent, task: ParsedTask) => {
    e.stopPropagation();
    try {
      await toggleTaskAcrossFiles(task);
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'relative px-2 py-2 border-r border-b border-gray-100 dark:border-gray-700 min-h-[120px] flex flex-col',
        {
          'text-gray-400 dark:text-gray-600': !isCurrentMonth,
          'text-gray-900 dark:text-white': isCurrentMonth,
          'bg-blue-50 dark:bg-blue-900/20': isSelected,
          'ring-2 ring-blue-400 ring-inset bg-blue-100 dark:bg-blue-900/40': isOver,
        }
      )}
    >
      {/* Day number and expand toggle */}
      <div className="flex items-start justify-between mb-1">
        <button
          onClick={() => onDayClick(date)}
          className={clsx(
            'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
            {
              'bg-blue-600 text-white hover:bg-blue-700': isTodayDate,
              'ring-2 ring-blue-500': isSelected && !isTodayDate,
              'font-bold': isTodayDate,
            }
          )}
        >
          {formatDayOfMonth(date)}
        </button>

        {/* Expand/collapse toggle */}
        {tasks.length > MAX_COLLAPSED_TASKS && (
          <button
            onClick={handleExpandToggle}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        )}
      </div>

      {/* Tasks list */}
      <div className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
        {visibleTasks.map((task) => (
          <div
            key={task.id}
            className={clsx(
              'flex items-start gap-1 px-1 py-0.5 rounded text-xs group hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors',
              {
                'opacity-60': task.completed,
              }
            )}
          >
            {/* Checkbox */}
            <button
              onClick={(e) => handleTaskToggle(e, task)}
              className="flex-shrink-0 mt-0.5"
            >
              <div
                className={clsx(
                  'h-3 w-3 rounded-sm border flex items-center justify-center',
                  {
                    'bg-green-100 border-green-600 dark:bg-green-900/30 dark:border-green-400': task.completed,
                    'border-gray-400 dark:border-gray-600 hover:border-gray-600 dark:hover:border-gray-400': !task.completed,
                    'border-l-4 border-l-red-500': !task.completed && task.priority === 1,
                    'border-l-4 border-l-orange-500': !task.completed && task.priority === 2,
                    'border-l-4 border-l-yellow-500': !task.completed && task.priority === 3,
                  }
                )}
              >
                {task.completed && (
                  <span className="text-green-600 dark:text-green-400 text-xs font-bold">✓</span>
                )}
              </div>
            </button>

            {/* Task text */}
            <span
              className={clsx(
                'flex-1 truncate leading-tight',
                {
                  'line-through text-gray-500 dark:text-gray-500': task.completed,
                  'text-gray-900 dark:text-gray-200': !task.completed,
                }
              )}
              title={task.text}
            >
              {task.text}
            </span>
          </div>
        ))}

        {/* Show more indicator */}
        {!isExpanded && hiddenCount > 0 && (
          <button
            onClick={handleExpandToggle}
            className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-left px-1 py-0.5"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>

      {/* Drop indicator */}
      {isOver && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-sm pointer-events-none bg-blue-50/50 dark:bg-blue-900/20">
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Drop to schedule
          </div>
        </div>
      )}
    </div>
  );
};

export const CalendarView: React.FC = () => {
  const { currentDate, setDate } = useCalendarStore();
  const { allGlobalTasks } = useGlobalTaskStore();

  const days = useMemo(() => getCalendarMonthGrid(currentDate), [currentDate]);

  // State for daily notes content
  const [dailyNotesContent, setDailyNotesContent] = useState<Map<string, string>>(new Map());

  // Load daily notes for all days in the month
  useEffect(() => {
    const loadDailyNotes = async () => {
      const notesMap = new Map<string, string>();

      for (const day of days) {
        try {
          const dateStr = toNotePlanDate(day);
          const fileData = await api.getDailyNote(dateStr);
          notesMap.set(day.toDateString(), fileData.content);
        } catch (error) {
          // Daily note doesn't exist, that's okay
          notesMap.set(day.toDateString(), '');
        }
      }

      setDailyNotesContent(notesMap);
    };

    loadDailyNotes();
  }, [days]);

  // Group tasks by date (both scheduled and timeblocked)
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, ParsedTask[]>();

    // Initialize all days with empty arrays
    days.forEach(day => {
      grouped.set(day.toDateString(), []);
    });

    // 1. Add tasks with scheduled dates (>YYYY-MM-DD)
    allGlobalTasks.forEach(task => {
      if (task.date) {
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        const dateKey = taskDate.toDateString();

        if (grouped.has(dateKey)) {
          grouped.get(dateKey)!.push(task);
        }
      }
    });

    // 2. Add timeblocked tasks from daily notes
    days.forEach(day => {
      const dateKey = day.toDateString();
      const content = dailyNotesContent.get(dateKey);

      if (content) {
        const scheduledTasks = parseScheduledTasks(content, day);

        scheduledTasks.forEach(scheduledTask => {
          const tasks = grouped.get(dateKey) || [];

          // Check if this task is already in the list (to avoid duplicates)
          const alreadyAdded = tasks.some(t => t.id === scheduledTask.task.id);

          if (!alreadyAdded) {
            tasks.push(scheduledTask.task);
            grouped.set(dateKey, tasks);
          }
        });
      }
    });

    // Sort tasks within each day by priority and completion status
    grouped.forEach((tasks, date) => {
      tasks.sort((a, b) => {
        // Incomplete tasks first
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Then by priority (lower number = higher priority)
        if (a.priority && b.priority) {
          return a.priority - b.priority;
        }
        if (a.priority) return -1;
        if (b.priority) return 1;
        // Then by importance
        if (a.important !== b.important) {
          return a.important ? -1 : 1;
        }
        return 0;
      });
    });

    return grouped;
  }, [days, allGlobalTasks, dailyNotesContent]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayClick = (date: Date) => {
    setDate(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 auto-rows-fr flex-1 overflow-auto">
        {days.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const isSelected = isSameDay(date, currentDate);
          const dayTasks = tasksByDate.get(date.toDateString()) || [];

          return (
            <DateCell
              key={index}
              date={date}
              isCurrentMonth={isCurrentMonth}
              isTodayDate={isTodayDate}
              isSelected={isSelected}
              tasks={dayTasks}
              onDayClick={handleDayClick}
            />
          );
        })}
      </div>
    </div>
  );
};
