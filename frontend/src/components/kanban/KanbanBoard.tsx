import React, { useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useTasks } from '../../hooks/useTasks';
import { KanbanColumn } from './KanbanColumn';
import { BoardSelector } from './BoardSelector';
import { Loading } from '../common/Loading';

export const KanbanBoard: React.FC = () => {
  const { activeBoard, loading, loadBoards } = useBoardStore();
  const { allTasks } = useTasks();

  // Load boards on mount
  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading text="Loading boards..." />
      </div>
    );
  }

  if (!activeBoard) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-lg mb-4">No board selected</p>
        <p className="text-sm">Create a new board to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {activeBoard.name}
        </h2>
        <BoardSelector />
      </div>

      {/* Board Content */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden bg-gray-50 dark:bg-gray-900">
        <div className="h-full p-4 whitespace-nowrap" style={{ display: 'inline-block', minWidth: '100%' }}>
          <div className="inline-flex gap-4 h-full">
            {activeBoard.columns
              .sort((a, b) => a.order - b.order)
              .map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={allTasks}
                  boardFilters={activeBoard.filterTags}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
