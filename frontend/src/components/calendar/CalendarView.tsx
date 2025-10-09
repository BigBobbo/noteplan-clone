import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useCalendarStore } from '../../store/calendarStore';
import {
  getCalendarMonthGrid,
  formatDayOfMonth,
  isToday,
  isSameMonth,
  isSameDay
} from '../../utils/dateUtils';
import clsx from 'clsx';

interface DateCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isTodayDate: boolean;
  isSelected: boolean;
  onDayClick: (date: Date) => void;
}

const DateCell: React.FC<DateCellProps> = ({
  date,
  isCurrentMonth,
  isTodayDate,
  isSelected,
  onDayClick,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `date-${date.toISOString()}`,
    data: {
      type: 'date-cell',
      date,
    },
  });

  return (
    <button
      ref={setNodeRef}
      onClick={() => onDayClick(date)}
      className={clsx(
        'relative px-2 py-3 text-center border-r border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
        {
          'text-gray-400 dark:text-gray-600': !isCurrentMonth,
          'text-gray-900 dark:text-white': isCurrentMonth,
          'bg-blue-50 dark:bg-blue-900/20': isSelected,
          'font-bold': isTodayDate,
          'ring-2 ring-blue-400 ring-inset bg-blue-100 dark:bg-blue-900/40': isOver,
        }
      )}
    >
      {/* Day number */}
      <div
        className={clsx(
          'inline-flex items-center justify-center w-8 h-8 rounded-full',
          {
            'bg-blue-600 text-white': isTodayDate,
            'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800': isSelected && !isTodayDate,
          }
        )}
      >
        {formatDayOfMonth(date)}
      </div>

      {/* Drop indicator */}
      {isOver && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-sm pointer-events-none">
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Drop to schedule
          </div>
        </div>
      )}
    </button>
  );
};

export const CalendarView: React.FC = () => {
  const { currentDate, setDate } = useCalendarStore();

  const days = useMemo(() => getCalendarMonthGrid(currentDate), [currentDate]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayClick = (date: Date) => {
    setDate(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
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
      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const isSelected = isSameDay(date, currentDate);

          return (
            <DateCell
              key={index}
              date={date}
              isCurrentMonth={isCurrentMonth}
              isTodayDate={isTodayDate}
              isSelected={isSelected}
              onDayClick={handleDayClick}
            />
          );
        })}
      </div>
    </div>
  );
};
