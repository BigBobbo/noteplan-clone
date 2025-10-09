import { useTasks } from '../../hooks/useTasks';
import { TaskTreeItem } from './TaskTreeItem';
import { TaskFilters } from './TaskFilters';
import type { ParsedTask } from '../../services/taskService';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useTaskOrderStore } from '../../store/taskOrderStore';
import { useFileStore } from '../../store/fileStore';
import { useState, useEffect, useMemo } from 'react';

export const TaskList: React.FC = () => {
  const { tasks, allTasks, filter, setFilter, toggleTask, rescheduleTask } =
    useTasks();
  const { reorderTasks } = useTaskOrderStore();
  const { currentFile } = useFileStore();

  // Only root-level tasks can be reordered
  const rootTasks = useMemo(() => {
    return tasks.filter(task => task.depth === 0);
  }, [tasks]);

  // Sort tasks by rank (memoized to avoid re-renders)
  const sortedTasks = useMemo(() => {
    return [...rootTasks].sort((a, b) => {
      const rankA = a.rank ?? a.line;
      const rankB = b.rank ?? b.line;
      return rankA - rankB;
    });
  }, [rootTasks]);

  // Recursively count tasks
  const countTasks = (tasks: ParsedTask[]): number => {
    return tasks.reduce((count, task) => {
      return count + 1 + countTasks(task.children);
    }, 0);
  };

  // Recursively count tasks matching a filter
  const countFilteredTasks = (
    tasks: ParsedTask[],
    filterFn: (task: ParsedTask) => boolean
  ): number => {
    return tasks.reduce((count, task) => {
      const matches = filterFn(task) ? 1 : 0;
      return count + matches + countFilteredTasks(task.children, filterFn);
    }, 0);
  };

  // Calculate counts for each filter
  const taskCounts = {
    all: countTasks(allTasks),
    active: countFilteredTasks(
      allTasks,
      (t) => !t.completed && !t.cancelled
    ),
    completed: countFilteredTasks(allTasks, (t) => t.completed),
    today: countFilteredTasks(allTasks, (t) => {
      if (!t.date) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    }),
    scheduled: countFilteredTasks(allTasks, (t) => t.date !== undefined),
  };

  const handleReschedule = (taskId: string) => {
    // For now, we'll just use today's date
    // In a real implementation, we'd show a date picker
    const today = new Date();
    rescheduleTask(taskId, today);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !currentFile) return;

    const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
    const newIndex = sortedTasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);

    // Update ranks in store (this will trigger a re-render via useTasks)
    reorderTasks(currentFile.metadata.path, newOrder);
  };

  const handleResetOrder = () => {
    if (!currentFile) return;

    const { resetOrder } = useTaskOrderStore.getState();
    resetOrder(currentFile.metadata.path);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tasks
        </h2>
      </div>

      <TaskFilters
        currentFilter={filter}
        onFilterChange={setFilter}
        onResetOrder={handleResetOrder}
        taskCounts={taskCounts}
      />

      <div className="flex-1 overflow-y-auto p-2">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No tasks found</p>
            <p className="text-xs mt-1">
              Create tasks by starting a line with *
            </p>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {sortedTasks.map((task) => (
                  <TaskTreeItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onReschedule={handleReschedule}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
