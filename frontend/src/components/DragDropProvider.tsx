import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useTasks } from '../hooks/useTasks';
import { useFileStore } from '../store/fileStore';
import { KanbanCard } from './kanban/KanbanCard';
import { TimeBlockDialog } from './calendar/TimeBlockDialog';
import type { ParsedTask } from '../services/taskService';
import type { KanbanColumn } from '../types';

interface DragDropProviderProps {
  children: React.ReactNode;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({ children }) => {
  const [activeTask, setActiveTask] = useState<ParsedTask | null>(null);
  const [timeBlockDialog, setTimeBlockDialog] = useState<{
    task: ParsedTask;
    date: Date;
    initialTime?: string;
  } | null>(null);

  const { allTasks, createTaskReferenceInDailyNote } = useTasks();
  const { currentFile, saveFile } = useFileStore();

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

    if (!over) return;

    const task = active.data.current?.task as ParsedTask;
    const targetData = over.data.current;

    if (!task) return;

    // Handle drop on kanban column
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

    // Handle drop on calendar date cell
    if (targetData?.type === 'date-cell') {
      const targetDate = targetData.date as Date;

      // Create a simple task reference (no time block)
      await createTaskReferenceInDailyNote(task.id, targetDate);
      return;
    }

    // Handle drop on timeline
    if (targetData?.type === 'timeline') {
      const targetDate = targetData.date as Date;

      // Show time block dialog
      setTimeBlockDialog({
        task,
        date: targetDate,
        initialTime: '09:00', // Default start time
      });
    }
  };

  const handleTimeBlockSave = async (timeBlock: { start: string; end: string; duration: number }) => {
    if (!timeBlockDialog) return;

    const { task, date } = timeBlockDialog;

    // Create task reference with time block
    await createTaskReferenceInDailyNote(task.id, date, {
      id: `${task.id}-timeblock`,
      start: timeBlock.start,
      end: timeBlock.end,
      duration: timeBlock.duration,
      taskRef: task.id,
    });

    setTimeBlockDialog(null);
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

      {timeBlockDialog && (
        <TimeBlockDialog
          task={timeBlockDialog.task}
          date={timeBlockDialog.date}
          initialTime={timeBlockDialog.initialTime}
          onSave={handleTimeBlockSave}
          onCancel={() => setTimeBlockDialog(null)}
        />
      )}
    </DndContext>
  );
};
