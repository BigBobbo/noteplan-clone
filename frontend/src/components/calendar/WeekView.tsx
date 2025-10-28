import React, { useMemo, useState, useEffect } from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useCalendarStore } from '../../store/calendarStore';
import { useGlobalTaskStore } from '../../store/globalTaskStore';
import { getWeekDays, formatDayOfWeek, formatDayOfMonth, isToday, isSameDay, toNotePlanDate } from '../../utils/dateUtils';
import { toggleTaskAcrossFiles, rescheduleTaskAcrossFiles } from '../../services/crossFileTaskService';
import { parseScheduledTasks, type ScheduledTaskInstance } from '../../services/scheduledTasksService';
import { api } from '../../services/api';
import clsx from 'clsx';
import { CheckCircleIcon, CircleStackIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { ParsedTask } from '../../services/taskService';

interface DraggableTaskProps {
  task: ParsedTask;
  onToggle: (task: ParsedTask) => void;
}

const DraggableTask: React.FC<DraggableTaskProps> = ({ task, onToggle }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `week-task-${task.id}`,
    data: {
      type: 'task',
      task,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx(
        'p-2 rounded-lg border text-sm',
        'hover:shadow-sm transition-shadow cursor-grab active:cursor-grabbing',
        {
          'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700': !task.completed,
          'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 opacity-60': task.completed,
          'border-l-4 border-l-red-500': task.important,
          'opacity-50': isDragging,
        }
      )}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task);
          }}
          className="flex-shrink-0 mt-0.5"
        >
          {task.completed ? (
            <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <div className="h-4 w-4 rounded border-2 border-gray-400 dark:border-gray-600" />
          )}
        </button>

        {/* Task text */}
        <div className="flex-1 min-w-0">
          <div className={clsx('break-words', {
            'line-through text-gray-500 dark:text-gray-400': task.completed,
            'text-gray-900 dark:text-white': !task.completed,
          })}>
            {task.text}
          </div>

          {/* Task metadata */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
            {/* Show time slots if this task is timeblocked */}
            {(task as any).timeSlots && (task as any).timeSlots.length > 0 && (
              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                <ClockIcon className="h-3 w-3" />
                {(task as any).timeSlots.map((slot: any) => `${slot.start}-${slot.end}`).join(', ')}
              </span>
            )}
            {task.priority && (
              <span className={clsx('font-semibold', {
                'text-red-600 dark:text-red-400': task.priority === 1,
                'text-orange-600 dark:text-orange-400': task.priority === 2,
                'text-yellow-600 dark:text-yellow-400': task.priority === 3,
              })}>
                P{task.priority}
              </span>
            )}
            {task.tags.length > 0 && (
              <span className="text-blue-600 dark:text-blue-400">
                {task.tags.map(tag => `#${tag}`).join(' ')}
              </span>
            )}
          </div>

          {/* Task details preview */}
          {task.details && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {task.details}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface DayColumnProps {
  date: Date;
  tasks: ParsedTask[];
  isToday: boolean;
  isSelected: boolean;
  onDayClick: (date: Date) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({ date, tasks, isToday: isTodayDate, isSelected, onDayClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `week-date-${date.toISOString()}`,
    data: {
      type: 'date-cell',
      date,
    },
  });

  const handleTaskToggle = async (task: ParsedTask) => {
    try {
      await toggleTaskAcrossFiles(task);
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'flex-1 min-w-0 border-r border-gray-200 dark:border-gray-700 last:border-r-0',
        'flex flex-col',
        {
          'bg-blue-50 dark:bg-blue-900/10': isTodayDate,
          'bg-blue-100 dark:bg-blue-900/20': isSelected,
          'ring-2 ring-blue-400 ring-inset': isOver,
        }
      )}
    >
      {/* Day header */}
      <button
        onClick={() => onDayClick(date)}
        className={clsx(
          'p-3 border-b border-gray-200 dark:border-gray-700 text-center',
          'hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors',
          {
            'bg-blue-600 text-white hover:bg-blue-700': isTodayDate,
          }
        )}
      >
        <div className={clsx('text-xs font-semibold uppercase tracking-wider', {
          'text-gray-600 dark:text-gray-400': !isTodayDate,
          'text-white': isTodayDate,
        })}>
          {formatDayOfWeek(date)}
        </div>
        <div className={clsx('text-2xl font-bold mt-1', {
          'text-gray-900 dark:text-white': !isTodayDate,
          'text-white': isTodayDate,
        })}>
          {formatDayOfMonth(date)}
        </div>
      </button>

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-4">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableTask key={task.id} task={task} onToggle={handleTaskToggle} />
          ))
        )}
      </div>

      {/* Drop indicator */}
      {isOver && (
        <div className="absolute inset-x-0 bottom-0 bg-blue-500 text-white text-xs text-center py-2 pointer-events-none">
          Drop to schedule for {formatDayOfWeek(date, false)}
        </div>
      )}
    </div>
  );
};

export const WeekView: React.FC = () => {
  const { currentDate, setDate } = useCalendarStore();
  const { allGlobalTasks } = useGlobalTaskStore();

  // Get all days in the current week
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // State for timeblocked tasks from daily notes
  const [dailyNotesContent, setDailyNotesContent] = useState<Map<string, string>>(new Map());

  // Load daily notes for the week
  useEffect(() => {
    const loadDailyNotes = async () => {
      const notesMap = new Map<string, string>();

      for (const day of weekDays) {
        try {
          const dateStr = toNotePlanDate(day);
          const fileData = await api.getDailyNote(dateStr);
          notesMap.set(day.toDateString(), fileData.content);
        } catch (error) {
          console.log(`No daily note found for ${day.toDateString()}`);
          notesMap.set(day.toDateString(), '');
        }
      }

      setDailyNotesContent(notesMap);
    };

    loadDailyNotes();
  }, [weekDays]);

  // Group tasks by date (including both scheduled tasks and timeblocked tasks)
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, ParsedTask[]>();

    // Initialize all days with empty arrays
    weekDays.forEach(day => {
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
    weekDays.forEach(day => {
      const dateKey = day.toDateString();
      const content = dailyNotesContent.get(dateKey);

      if (content) {
        const scheduledTasks = parseScheduledTasks(content, day);

        scheduledTasks.forEach(scheduledTask => {
          const tasks = grouped.get(dateKey) || [];

          // Check if this task is already in the list (to avoid duplicates)
          const alreadyAdded = tasks.some(t => t.id === scheduledTask.task.id);

          if (!alreadyAdded) {
            // Add a marker to indicate this task has timeblocks
            const taskWithTimeInfo = {
              ...scheduledTask.task,
              timeSlots: scheduledTask.timeSlots, // Add time slot info
            };
            tasks.push(taskWithTimeInfo as ParsedTask);
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
  }, [weekDays, allGlobalTasks, dailyNotesContent]);

  const handleDayClick = (date: Date) => {
    setDate(date);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Week grid */}
      <div className="flex-1 flex overflow-hidden">
        {weekDays.map((date) => {
          const dateKey = date.toDateString();
          const dayTasks = tasksByDate.get(dateKey) || [];
          const isTodayDate = isToday(date);
          const isSelected = isSameDay(date, currentDate);

          return (
            <DayColumn
              key={dateKey}
              date={date}
              tasks={dayTasks}
              isToday={isTodayDate}
              isSelected={isSelected}
              onDayClick={handleDayClick}
            />
          );
        })}
      </div>
    </div>
  );
};
