import React, { useState } from 'react';
import { Editor } from '../editor/Editor';
import { TaskList } from '../tasks/TaskList';
import { KanbanBoard } from '../kanban/KanbanBoard';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

type MainViewType = 'editor' | 'tasks' | 'board';

export const MainView: React.FC = () => {
  const [currentView, setCurrentView] = useState<MainViewType>('editor');

  return (
    <div className="h-full flex-1 flex flex-col min-w-0">
      {/* View Tabs */}
      <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setCurrentView('editor')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
            currentView === 'editor'
              ? 'text-amber-600 dark:text-amber-400 border-amber-600 dark:border-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-transparent'
          )}
        >
          <DocumentTextIcon className="h-4 w-4" />
          <span>Editor</span>
        </button>
        <button
          onClick={() => setCurrentView('tasks')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
            currentView === 'tasks'
              ? 'text-amber-600 dark:text-amber-400 border-amber-600 dark:border-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-transparent'
          )}
        >
          <CheckCircleIcon className="h-4 w-4" />
          <span>Tasks</span>
        </button>
        <button
          onClick={() => setCurrentView('board')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
            currentView === 'board'
              ? 'text-amber-600 dark:text-amber-400 border-amber-600 dark:border-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-transparent'
          )}
        >
          <Squares2X2Icon className="h-4 w-4" />
          <span>Board</span>
        </button>
      </div>

      {/* View Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {currentView === 'editor' && <Editor />}
        {currentView === 'tasks' && (
          <div className="h-full overflow-y-auto p-4 bg-white dark:bg-gray-800">
            <TaskList />
          </div>
        )}
        {currentView === 'board' && <KanbanBoard />}
      </div>
    </div>
  );
};
