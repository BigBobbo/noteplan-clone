import React, { useMemo } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import {
  getCalendarMonthGrid,
  formatDayOfMonth,
  formatMonthYear,
  isToday,
  isSameMonth,
  isSameDay,
  getPreviousMonth,
  getNextMonth
} from '../../utils/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export const MiniCalendar: React.FC = () => {
  const { currentDate, setDate } = useCalendarStore();

  const days = useMemo(() => getCalendarMonthGrid(currentDate), [currentDate]);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const handleDayClick = (date: Date) => {
    setDate(date);
  };

  const handlePreviousMonth = () => {
    setDate(getPreviousMonth(currentDate));
  };

  const handleNextMonth = () => {
    setDate(getNextMonth(currentDate));
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
      {/* Month header with navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePreviousMonth}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Previous month"
        >
          <ChevronLeftIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>

        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatMonthYear(currentDate)}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Next month"
        >
          <ChevronRightIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const isSelected = isSameDay(date, currentDate);

          return (
            <button
              key={index}
              onClick={() => handleDayClick(date)}
              className={clsx(
                'relative aspect-square flex items-center justify-center text-xs rounded transition-colors',
                {
                  'text-gray-400 dark:text-gray-600': !isCurrentMonth,
                  'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700': isCurrentMonth && !isSelected && !isTodayDate,
                  'bg-blue-600 text-white hover:bg-blue-700': isTodayDate,
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-semibold': isSelected && !isTodayDate,
                }
              )}
            >
              {formatDayOfMonth(date)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
