import React, { useState, useMemo } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { TaskTreeItem } from './TaskTreeItem';
import { TaskFilters } from './TaskFilters';
import { useGlobalTaskStore } from '../../store/globalTaskStore';
import { useFileStore } from '../../store/fileStore';
import { useTaskOrderStore } from '../../store/taskOrderStore';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronRightIcon, ChevronDownIcon, DocumentTextIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import type { ParsedTask } from '../../services/taskService';
import { toggleTaskAcrossFiles, rescheduleTaskAcrossFiles } from '../../services/crossFileTaskService';
import clsx from 'clsx';

type ViewMode = 'current' | 'multi';
type GroupBy = 'none' | 'file';

export const EnhancedTaskList: React.FC = () => {
  const { tasks, allTasks, filter, setFilter, toggleTask, rescheduleTask } = useTasks();
  const { currentFile } = useFileStore();
  const { allGlobalTasks } = useGlobalTaskStore();

  const [viewMode, setViewMode] = useState<ViewMode>('current');
  const [groupBy, setGroupBy] = useState<GroupBy>('file');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Check if we have a current file
  const hasCurrentFile = currentFile !== null;

  // Get tasks based on view mode
  const tasksToDisplay = useMemo(() => {
    if (viewMode === 'current') {
      return hasCurrentFile ? tasks : [];
    } else {
      // Multi-file view - get tasks from global store
      if (selectedFiles.size === 0) {
        // Show all if none selected
        return allGlobalTasks;
      } else {
        // Filter by selected files
        return allGlobalTasks.filter(task =>
          selectedFiles.has(task.file)
        );
      }
    }
  }, [viewMode, tasks, allGlobalTasks, hasCurrentFile, selectedFiles]);

  // Group tasks by file
  const tasksByFile = useMemo(() => {
    if (groupBy !== 'file' || viewMode === 'current') {
      return new Map([['current', tasksToDisplay]]);
    }

    const grouped = new Map<string, ParsedTask[]>();
    tasksToDisplay.forEach(task => {
      const fileName = task.file || 'unknown';
      if (!grouped.has(fileName)) {
        grouped.set(fileName, []);
      }
      grouped.get(fileName)!.push(task);
    });

    // Sort files by name
    const sortedEntries = Array.from(grouped.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    return new Map(sortedEntries);
  }, [tasksToDisplay, groupBy, viewMode]);

  // Get unique files for selection
  const availableFiles = useMemo(() => {
    const files = new Set<string>();
    allGlobalTasks.forEach(task => {
      if (task.file) {
        files.add(task.file);
      }
    });
    return Array.from(files).sort();
  }, [allGlobalTasks]);

  // Recursively count tasks
  const countTasks = (tasks: ParsedTask[]): number => {
    return tasks.reduce((count, task) => {
      return count + 1 + countTasks(task.children);
    }, 0);
  };

  // Calculate counts for each filter
  const taskCounts = useMemo(() => ({
    all: countTasks(tasksToDisplay),
    active: countTasks(tasksToDisplay.filter(t => !t.completed && !t.cancelled)),
    completed: countTasks(tasksToDisplay.filter(t => t.completed)),
    today: countTasks(tasksToDisplay.filter(t => {
      if (!t.date) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    })),
    scheduled: countTasks(tasksToDisplay.filter(t => t.date !== undefined)),
  }), [tasksToDisplay]);

  // Toggle task handler - uses different logic based on view mode
  const handleToggleTask = async (taskId: string) => {
    if (viewMode === 'current') {
      // Use the normal toggleTask from useTasks hook (works on current file)
      toggleTask(taskId);
    } else {
      // Multi-file mode - find task and use crossFileTaskService
      const task = allGlobalTasks.find(t => t.id === taskId);
      if (!task) {
        console.error('[EnhancedTaskList] Task not found:', taskId);
        return;
      }

      try {
        await toggleTaskAcrossFiles(task);
      } catch (error) {
        console.error('[EnhancedTaskList] Failed to toggle task:', error);
        // TODO: Show user-facing error message
      }
    }
  };

  // Reschedule task handler - uses different logic based on view mode
  const handleReschedule = async (taskId: string) => {
    if (viewMode === 'current') {
      // Use the normal rescheduleTask from useTasks hook
      const today = new Date();
      rescheduleTask(taskId, today);
    } else {
      // Multi-file mode - find task and use crossFileTaskService
      const task = allGlobalTasks.find(t => t.id === taskId);
      if (!task) {
        console.error('[EnhancedTaskList] Task not found for reschedule:', taskId);
        return;
      }

      try {
        const today = new Date();
        await rescheduleTaskAcrossFiles(task, today);
      } catch (error) {
        console.error('[EnhancedTaskList] Failed to reschedule task:', error);
      }
    }
  };

  const handleResetOrder = () => {
    if (!currentFile) return;
    const { resetOrder } = useTaskOrderStore.getState();
    resetOrder(currentFile.metadata.path);
  };

  const toggleFileExpanded = (fileName: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileName)) {
      newExpanded.delete(fileName);
    } else {
      newExpanded.add(fileName);
    }
    setExpandedFiles(newExpanded);
  };

  const toggleFileSelection = (fileName: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
    } else {
      newSelected.add(fileName);
    }
    setSelectedFiles(newSelected);
  };

  // Expand all files by default when first loading
  React.useEffect(() => {
    if (tasksByFile.size > 0 && expandedFiles.size === 0 && groupBy === 'file') {
      setExpandedFiles(new Set(tasksByFile.keys()));
    }
  }, [tasksByFile, expandedFiles.size, groupBy]);

  // Apply filter to tasks
  const getFilteredTasks = (tasks: ParsedTask[]) => {
    switch (filter) {
      case 'active':
        return tasks.filter(t => !t.completed && !t.cancelled);
      case 'completed':
        return tasks.filter(t => t.completed);
      case 'today':
        return tasks.filter(t => {
          if (!t.date) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const taskDate = new Date(t.date);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        });
      case 'scheduled':
        return tasks.filter(t => t.date !== undefined);
      default:
        return tasks;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tasks
            {currentFile && viewMode === 'current' && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                from {currentFile.metadata.path.split('/').pop()}
              </span>
            )}
            {viewMode === 'multi' && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                from {selectedFiles.size || availableFiles.length} files
              </span>
            )}
          </h2>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('current')}
              className={clsx(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                viewMode === 'current'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
              disabled={!hasCurrentFile}
              title="Show tasks from current file only"
            >
              <DocumentTextIcon className="h-4 w-4 inline-block mr-1" />
              Current File
            </button>
            <button
              onClick={() => setViewMode('multi')}
              className={clsx(
                'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                viewMode === 'multi'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
              title="Show tasks from multiple files"
            >
              <GlobeAltIcon className="h-4 w-4 inline-block mr-1" />
              Multi-File
            </button>
          </div>
        </div>

        {/* File selection for multi-file mode */}
        {viewMode === 'multi' && availableFiles.length > 1 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Select files to show:</div>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {availableFiles.map(fileName => {
                const shortName = fileName.split('/').pop() || fileName;
                const isSelected = selectedFiles.size === 0 || selectedFiles.has(fileName);
                return (
                  <button
                    key={fileName}
                    onClick={() => toggleFileSelection(fileName)}
                    className={clsx(
                      'px-2 py-1 rounded text-xs transition-colors',
                      isSelected
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    )}
                  >
                    {shortName.replace('.txt', '')}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      {(hasCurrentFile || viewMode === 'multi') && (
        <TaskFilters
          currentFilter={filter}
          onFilterChange={setFilter}
          onResetOrder={viewMode === 'current' ? handleResetOrder : undefined}
          taskCounts={taskCounts}
        />
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-2">
        {!hasCurrentFile && viewMode === 'current' ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No file selected</p>
            <p className="text-xs mt-2">
              Open a note file or switch to Multi-File view
            </p>
          </div>
        ) : tasksToDisplay.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No tasks found</p>
          </div>
        ) : groupBy === 'file' && viewMode === 'multi' ? (
          // Grouped view
          <div className="space-y-2">
            {Array.from(tasksByFile.entries()).map(([fileName, fileTasks]) => {
              const filteredTasks = getFilteredTasks(fileTasks);
              if (filteredTasks.length === 0 && filter !== 'all') {
                return null; // Skip empty groups when filtered
              }

              const shortName = fileName === 'current'
                ? (currentFile?.metadata.path.split('/').pop() || 'Current File')
                : (fileName.split('/').pop() || fileName);

              const isExpanded = expandedFiles.has(fileName);

              return (
                <div key={fileName} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* File header */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => toggleFileExpanded(fileName)}
                  >
                    <span className="text-gray-400">
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </span>
                    <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {shortName.replace('.txt', '')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({filteredTasks.length})
                    </span>
                  </div>

                  {/* Tasks for this file */}
                  {isExpanded && (
                    <div className="p-2 space-y-1">
                      {filteredTasks.filter(t => t.depth === 0).map(task => (
                        <TaskTreeItem
                          key={task.id}
                          task={task}
                          onToggle={handleToggleTask}
                          onReschedule={handleReschedule}
                          showSource={false} // Don't show source within groups
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Flat view
          <div className="space-y-1">
            {viewMode === 'current' ? (
              <SortableContext
                items={getFilteredTasks(tasksToDisplay).filter(t => t.depth === 0).map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {getFilteredTasks(tasksToDisplay).filter(t => t.depth === 0).map(task => (
                  <TaskTreeItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleTask}
                    onReschedule={handleReschedule}
                    showSource={viewMode === 'multi'}
                  />
                ))}
              </SortableContext>
            ) : (
              getFilteredTasks(tasksToDisplay).filter(t => t.depth === 0).map(task => (
                <TaskTreeItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onReschedule={handleReschedule}
                  showSource={viewMode === 'multi'}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};