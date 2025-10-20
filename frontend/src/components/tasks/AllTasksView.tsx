import React, { useEffect, useState } from 'react';
import { useGlobalTaskStore } from '../../store/globalTaskStore';
import { TaskTreeItem } from './TaskTreeItem';
import { TaskFilters } from './TaskFilters';
import type { ParsedTask } from '../../services/taskService';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export const AllTasksView: React.FC = () => {
  const { allGlobalTasks, isIndexing } = useGlobalTaskStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'today' | 'scheduled'>('all');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Group tasks by file
  const tasksByFile = React.useMemo(() => {
    const grouped = new Map<string, ParsedTask[]>();

    allGlobalTasks.forEach(task => {
      const fileName = task.file;
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
  }, [allGlobalTasks]);

  // Apply filters
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

  // Recursively count tasks
  const countTasks = (tasks: ParsedTask[]): number => {
    return tasks.reduce((count, task) => {
      return count + 1 + countTasks(task.children);
    }, 0);
  };

  // Calculate counts for each filter
  const taskCounts = {
    all: countTasks(allGlobalTasks),
    active: countTasks(getFilteredTasks(allGlobalTasks)),
    completed: countTasks(allGlobalTasks.filter(t => t.completed)),
    today: countTasks(getFilteredTasks(allGlobalTasks)),
    scheduled: countTasks(allGlobalTasks.filter(t => t.date !== undefined)),
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

  // Expand all files by default when first loading
  useEffect(() => {
    if (tasksByFile.size > 0 && expandedFiles.size === 0) {
      setExpandedFiles(new Set(tasksByFile.keys()));
    }
  }, [tasksByFile.size]);

  if (isIndexing) {
    return (
      <div className="p-4">
        <div className="text-gray-500 dark:text-gray-400 text-center">
          Indexing tasks from all Notes files...
        </div>
      </div>
    );
  }

  if (allGlobalTasks.length === 0) {
    return (
      <div className="p-4">
        <div className="text-gray-500 dark:text-gray-400 text-center">
          No tasks found in Notes files
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <TaskFilters
        filter={filter}
        onFilterChange={setFilter}
        taskCounts={taskCounts}
        showResetOrder={false}
      />

      <div className="flex-1 overflow-y-auto">
        {Array.from(tasksByFile.entries()).map(([fileName, fileTasks]) => {
          const filteredTasks = getFilteredTasks(fileTasks);
          if (filteredTasks.length === 0 && filter !== 'all') {
            return null; // Skip files with no matching tasks
          }

          const isExpanded = expandedFiles.has(fileName);
          const shortName = fileName.split('/').pop() || fileName;

          return (
            <div key={fileName} className="mb-4">
              {/* File header */}
              <div
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer sticky top-0 z-10"
                onClick={() => toggleFileExpanded(fileName)}
              >
                <span className="text-gray-400">
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {shortName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'})
                </span>
              </div>

              {/* Tasks for this file */}
              {isExpanded && (
                <div className="pl-2">
                  {filteredTasks.map((task) => (
                    <TaskTreeItem
                      key={task.id}
                      task={task}
                      onToggle={() => {
                        // Toggle is handled globally - we need to refresh from the file
                        console.log('Toggle task globally:', task.id);
                      }}
                      onReschedule={() => {
                        // Reschedule is handled globally
                        console.log('Reschedule task globally:', task.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {tasksByFile.size} {tasksByFile.size === 1 ? 'file' : 'files'} • {' '}
          {taskCounts.all} total {taskCounts.all === 1 ? 'task' : 'tasks'}
        </div>
      </div>
    </div>
  );
};