import React, { useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useCalendarStore } from '../../store/calendarStore';
import { useFileStore } from '../../store/fileStore';
import { TimeBlock } from './TimeBlock';
import { generateHourSlots, formatHour } from '../../utils/timeBlockUtils';
import { isCalendarFile } from '../../utils/dateUtils';

const HOUR_HEIGHT = 60; // pixels per hour

export const Timeline: React.FC = () => {
  const { timeBlocks, refreshTimeBlocks, currentDate } = useCalendarStore();
  const { currentFile } = useFileStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  const hours = generateHourSlots();

  const { setNodeRef: setTimelineRef, isOver } = useDroppable({
    id: 'timeline',
    data: {
      type: 'timeline',
      date: currentDate,
    },
  });

  // Scroll to current time on mount
  useEffect(() => {
    if (timelineRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = currentHour * HOUR_HEIGHT - 100; // Offset for better visibility
      timelineRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  // Refresh time blocks when current file content changes (for calendar files)
  useEffect(() => {
    if (currentFile && isCalendarFile(currentFile.metadata.path)) {
      // Debounce the refresh to avoid too many API calls
      const timer = setTimeout(() => {
        refreshTimeBlocks();
      }, 500); // Wait 500ms after last content change

      return () => clearTimeout(timer);
    }
  }, [currentFile?.content, currentFile?.metadata.path, refreshTimeBlocks]);

  // Get current time for the "now" indicator
  const getCurrentTimePosition = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return hours * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  };

  const currentTimeTop = getCurrentTimePosition();

  return (
    <div className="h-full bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
      {/* Timeline */}
      <div ref={timelineRef} className="flex-1 overflow-y-auto relative">
        {/* Hour slots */}
        <div
          ref={setTimelineRef}
          className="relative"
          style={{ height: `${24 * HOUR_HEIGHT}px` }}
        >
          {hours.map((hour) => (
            <div
              key={hour}
              className="relative border-b border-gray-100 dark:border-gray-700"
              style={{ height: `${HOUR_HEIGHT}px` }}
            >
              {/* Hour label */}
              <div className="absolute top-0 left-0 px-3 py-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {formatHour(hour)}
                </span>
              </div>

              {/* Half-hour line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-gray-100 dark:border-gray-700"
                style={{ top: `${HOUR_HEIGHT / 2}px` }}
              />
            </div>
          ))}

          {/* Time blocks */}
          {timeBlocks.map((block) => (
            <TimeBlock key={block.id} block={block} hourHeight={HOUR_HEIGHT} />
          ))}

          {/* Current time indicator */}
          <div
            className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
            style={{ top: `${currentTimeTop}px` }}
          >
            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500" />
          </div>

          {/* Drop indicator overlay */}
          {isOver && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-500 pointer-events-none z-20 flex items-center justify-center">
              <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                Drop to create time block
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
