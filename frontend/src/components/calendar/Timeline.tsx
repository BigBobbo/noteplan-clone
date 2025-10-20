import React, { useRef, useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDndContext } from '@dnd-kit/core';
import { useCalendarStore } from '../../store/calendarStore';
import { useFileStore } from '../../store/fileStore';
import { TimeBlock } from './TimeBlock';
import { TimeBlockEditDialog } from './TimeBlockEditDialog';
import { generateHourSlots, formatHour, getTimeFromPixelPosition } from '../../utils/timeBlockUtils';
import { isCalendarFile } from '../../utils/dateUtils';
import type { TimeBlock as TimeBlockType } from '../../utils/timeBlockUtils';

const HOUR_HEIGHT = 60; // pixels per hour

export const Timeline: React.FC = () => {
  const { timeBlocks, refreshTimeBlocks, currentDate, updateTimeBlock, deleteTimeBlock } = useCalendarStore();
  const { currentFile } = useFileStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  const hours = generateHourSlots();
  const [editingBlock, setEditingBlock] = useState<TimeBlockType | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [timelineRect, setTimelineRect] = useState<DOMRect | null>(null);

  const { setNodeRef: setTimelineRef, isOver, rect } = useDroppable({
    id: 'timeline',
    data: {
      type: 'timeline',
      date: currentDate,
    },
  });

  // Get the active drag item to determine what's being dragged
  const { active } = useDndContext();
  const isDraggingTask = active?.data.current?.task !== undefined;
  const isDraggingTimeBlock = active?.data.current?.type === 'timeblock';

  // Track mouse position for drop indicator
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener('mousemove', updateMousePosition);
    return () => document.removeEventListener('mousemove', updateMousePosition);
  }, []);

  // Update timeline bounds when dragging
  useEffect(() => {
    if (isOver && timelineRef.current) {
      setTimelineRect(timelineRef.current.getBoundingClientRect());
    }
  }, [isOver]);

  // Load daily note and timeblocks on mount and when date changes
  useEffect(() => {
    const { loadDailyNote } = useCalendarStore.getState();
    loadDailyNote(currentDate);
  }, [currentDate]);

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

  // Handler for editing a timeblock
  const handleEditBlock = (block: TimeBlockType) => {
    setEditingBlock(block);
  };

  // Handler for saving edited timeblock
  const handleSaveEdit = async (updates: { start: string; end: string; description: string }) => {
    if (!editingBlock) return;

    try {
      await updateTimeBlock(editingBlock.id, updates);
      setEditingBlock(null);
    } catch (error) {
      console.error('Failed to update timeblock:', error);
    }
  };

  // Handler for deleting timeblock
  const handleDeleteBlock = async () => {
    if (!editingBlock) return;

    try {
      await deleteTimeBlock(editingBlock.id);
      setEditingBlock(null);
    } catch (error) {
      console.error('Failed to delete timeblock:', error);
    }
  };

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
            <TimeBlock
              key={block.id}
              block={block}
              hourHeight={HOUR_HEIGHT}
              onEdit={handleEditBlock}
            />
          ))}

          {/* Current time indicator */}
          <div
            className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
            style={{ top: `${currentTimeTop}px` }}
          >
            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500" />
          </div>

          {/* Drop indicator - show time position when dragging a task */}
          {isOver && isDraggingTask && !isDraggingTimeBlock && timelineRect && (
            <div
              className="absolute left-0 right-0 h-1 bg-blue-500 pointer-events-none z-20"
              style={{
                top: `${Math.max(0, Math.min(timelineRect.height, mousePosition.y - timelineRect.top))}px`
              }}
            >
              {/* Time label */}
              <span className="absolute -top-8 left-12 bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-medium shadow-lg">
                Drop at {getTimeFromPixelPosition(mousePosition.y - timelineRect.top, HOUR_HEIGHT)}
              </span>

              {/* Dot at the start of the line */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-blue-500 shadow-lg" />
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {editingBlock && (
        <TimeBlockEditDialog
          block={editingBlock}
          onSave={handleSaveEdit}
          onDelete={handleDeleteBlock}
          onCancel={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
};
