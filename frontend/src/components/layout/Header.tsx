import React from 'react';
import {
  MoonIcon,
  SunIcon,
  Bars3Icon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const { theme, toggleTheme, toggleSidebar, openNewFileModal } = useUIStore();

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Toggle Sidebar (Cmd+B)"
        >
          <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>

        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          NotePlan Clone
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* New Note Button */}
        <Button
          onClick={openNewFileModal}
          size="sm"
          className="flex items-center gap-2"
          title="New Note (Cmd+N)"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="hidden sm:inline">New Note</span>
        </Button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Toggle Theme (Cmd+Shift+D)"
        >
          {theme === 'dark' ? (
            <SunIcon className="h-5 w-5 text-gray-300" />
          ) : (
            <MoonIcon className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>
    </header>
  );
};
