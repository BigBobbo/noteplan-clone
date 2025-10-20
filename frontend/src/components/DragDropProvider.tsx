import React, { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useTasks } from '../hooks/useTasks';
import { useFileStore } from '../store/fileStore';
import { useTaskOrderStore } from '../store/taskOrderStore';
import { useCalendarStore } from '../store/calendarStore';
import { useGlobalTaskStore } from '../store/globalTaskStore';
import { KanbanCard } from './kanban/KanbanCard';
import type { ParsedTask } from '../services/taskService';
import type { KanbanColumn } from '../types';
import type { TimeBlock } from '../utils/timeBlockUtils';
import {
  minutesToTime,
  timeToMinutes,
  calculateTimeFromPosition,
  addMinutesToTime
} from '../utils/timeBlockUtils';

interface DragDropProviderProps {
  children: React.ReactNode;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({ children }) => {
  const [activeTask, setActiveTask] = useState<ParsedTask | null>(null);

  // Mouse position tracking for accurate drop positioning
  const mousePositionRef = useRef({ x: 0, y: 0 });

  const { allTasks, createTaskReferenceInDailyNote } = useTasks();
  const { currentFile, saveFile } = useFileStore();
  const { reorderTasks } = useTaskOrderStore();
  const { updateTimeBlock } = useCalendarStore();

  // Track mouse position during drag operations
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener('mousemove', updateMousePosition);
    return () => document.removeEventListener('mousemove', updateMousePosition);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as ParsedTask;
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    console.log('=== DRAG END ===', {
      hasOver: !!over,
      activeId: active.id,
      activeType: active.data.current?.type,
      activeHasBlock: !!active.data.current?.block,
      overId: over?.id,
      overType: over?.data.current?.type,
      delta: event.delta,
    });

    if (!over) return;

    const sourceData = active.data.current;
    const targetData = over.data.current;

    console.log('handleDragEnd:', {
      sourceType: sourceData?.type,
      targetType: targetData?.type,
      hasBlock: !!sourceData?.block,
      delta: event.delta,
    });

    // TYPE 1: Task reordering within TaskList (SortableContext)
    if (sourceData?.type === 'sortable-task' && targetData?.type === 'sortable-task') {
      if (!currentFile) return;

      // Get root-level tasks only
      const rootTasks = allTasks.filter((t) => t.depth === 0);

      // Sort by rank
      const sortedTasks = [...rootTasks].sort((a, b) => {
        const rankA = a.rank ?? a.line;
        const rankB = b.rank ?? b.line;
        return rankA - rankB;
      });

      // Find indices
      const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
      const newIndex = sortedTasks.findIndex((t) => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      // Reorder
      const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);

      // Update store
      reorderTasks(currentFile.metadata.path, newOrder);
      return;
    }

    // TYPE 1.5: TimeBlock repositioning on timeline (MUST be before task check!)
    if (sourceData?.type === 'timeblock' && targetData?.type === 'timeline') {
      console.log('✅ Entered TYPE 1.5: TimeBlock repositioning handler');
      const block = sourceData.block as TimeBlock;
      const timelineRect = over.rect;
      const mouseY = mousePositionRef.current.y;

      // Calculate new time from drop position using mouse position
      const newStartTime = calculateTimeFromPosition(mouseY, timelineRect);
      const newStartMinutes = timeToMinutes(newStartTime);
      const newEndMinutes = newStartMinutes + block.duration;

      console.log('[TimeBlock Reposition]', {
        mouseY: mouseY,
        timelineTop: timelineRect.top,
        relativeY: mouseY - timelineRect.top,
        oldTime: block.start,
        newTime: newStartTime,
        blockId: block.id
      });

      // Only update if time changed
      if (newStartTime !== block.start) {
        console.log('Updating timeblock:', {
          oldStart: block.start,
          newStart: newStartTime,
          newEnd: minutesToTime(newEndMinutes),
        });

        try {
          // Update the timeblock with new times
          await updateTimeBlock(block.id, {
            start: newStartTime,
            end: minutesToTime(newEndMinutes),
          });
          console.log('✅ Timeblock updated successfully');
        } catch (error) {
          console.error('❌ Failed to update timeblock:', error);
        }
      } else {
        console.log('⚠️ Time did not change (may have snapped to same position)');
      }
      return;
    }

    const task = sourceData?.task as ParsedTask;

    if (!task) return;

    // TYPE 2: Handle drop on kanban column
    if (targetData?.type === 'kanban-column' && currentFile) {
      const targetColumn = targetData.column as KanbanColumn;

      const isNoStatusColumn = targetColumn.tagFilter === '__no_status__';
      const taskHasNoStatus = !task.tags.some((tag) => tag.startsWith('status-'));

      // Check if task is already in the target state
      if (isNoStatusColumn && taskHasNoStatus) {
        return; // Already has no status
      }
      if (!isNoStatusColumn && task.tags.includes(targetColumn.tagFilter)) {
        return; // Already has the target tag
      }

      // Find old status tag
      const oldStatusTag = task.tags.find((tag) => tag.startsWith('status-'));

      // Update task tags in markdown content
      const lines = currentFile.content.split('\n');
      const line = lines[task.line];

      if (!line) return;

      let newLine = line;

      // Remove old status tag (if any)
      if (oldStatusTag) {
        newLine = newLine.replace(`#${oldStatusTag}`, '').trim();
      }

      // Add new status tag (if not the "no status" column)
      if (!isNoStatusColumn) {
        newLine = `${newLine} #${targetColumn.tagFilter}`;
      }

      lines[task.line] = newLine;
      await saveFile(currentFile.metadata.path, lines.join('\n'));
      return;
    }

    // TYPE 3: Handle drop on calendar date cell
    if (targetData?.type === 'date-cell') {
      const targetDate = targetData.date as Date;

      // Create a simple task reference (no time block)
      await createTaskReferenceInDailyNote(task.id, targetDate);
      return;
    }

    // TYPE 4: Handle drop on timeline (task to timeblock)
    if (task && targetData?.type === 'timeline') {
      const targetDate = targetData.date as Date;
      const timelineElement = over.rect; // Timeline droppable rect

      // Calculate drop time from mouse position
      const mouseY = mousePositionRef.current.y;
      const dropTime = calculateTimeFromPosition(mouseY, timelineElement);

      // Create timeblock directly without dialog
      const duration = 60; // Default 1 hour duration
      const endTime = addMinutesToTime(dropTime, duration);

      console.log('[Task Drop on Timeline]', {
        mouseY: mouseY,
        timelineTop: timelineElement.top,
        relativeY: mouseY - timelineElement.top,
        calculatedTime: dropTime,
        taskId: task.id,
        taskText: task.text
      });

      try {
        await createTaskReferenceInDailyNote(task.id, targetDate, {
          id: `${task.id}-timeblock-${Date.now()}`,
          start: dropTime,
          end: endTime,
          duration: duration,
          taskRef: task.id,
          description: task.text
        });
        console.log('✅ TimeBlock created successfully at', dropTime);
      } catch (error) {
        console.error('❌ Failed to create timeblock:', error);
      }

      return;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}

      <DragOverlay>
        {activeTask && <KanbanCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
};
