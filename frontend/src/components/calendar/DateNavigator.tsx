import React from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { toFullDisplayDate, toShortDisplayDate, formatMonthYear } from '../../utils/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export const DateNavigator: React.FC = () => {
  const { currentDate, view, goToPrevious, goToNext, goToToday } = useCalendarStore();

  const getDisplayText = () => {
    if (view === 'day') {
      return toFullDisplayDate(currentDate);
    } else if (view === 'month') {
      return formatMonthYear(currentDate);
    } else {
      // week view
      return toShortDisplayDate(currentDate);
    }
  };

  const getPreviousLabel = () => {
    if (view === 'day') return 'Previous Day';
    if (view === 'month') return 'Previous Month';
    return 'Previous Week';
  };

  const getNextLabel = () => {
    if (view === 'day') return 'Next Day';
    if (view === 'month') return 'Next Month';
    return 'Next Week';
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center space-x-4">
        {/* Previous button */}
        <button
          onClick={goToPrevious}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={getPreviousLabel()}
          aria-label={getPreviousLabel()}
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Current date display */}
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getDisplayText()}
          </h2>
        </div>

        {/* Next button */}
        <button
          onClick={goToNext}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={getNextLabel()}
          aria-label={getNextLabel()}
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Today button */}
      <button
        onClick={goToToday}
        className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
      >
        Today
      </button>
    </div>
  );
};
