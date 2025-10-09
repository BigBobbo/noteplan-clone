import React, { useState } from 'react';
import {
  MoonIcon,
  SunIcon,
  Bars3Icon,
  PlusIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  BoltIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { useUIStore } from '../../store/uiStore';
import { useCalendarStore } from '../../store/calendarStore';
import { Button } from '../common/Button';
import { QuickCapture } from '../modals/QuickCapture';
import { KeyboardShortcuts } from '../modals/KeyboardShortcuts';

export const Header: React.FC = () => {
  const { theme, toggleTheme, toggleSidebar, openNewFileModal, openCommandPalette } = useUIStore();
  const { showTimeline, toggleTimeline } = useCalendarStore();
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  return (
    <>
      <QuickCapture isOpen={quickCaptureOpen} onClose={() => setQuickCaptureOpen(false)} />
      <KeyboardShortcuts isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
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
        {/* Command Palette */}
        <button
          onClick={openCommandPalette}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Command Palette (Cmd+K)"
        >
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Quick Capture */}
        <button
          onClick={() => setQuickCaptureOpen(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Quick Capture (Cmd+Shift+N)"
        >
          <BoltIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>

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

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Calendar/Timeline Toggle */}
        <button
          onClick={toggleTimeline}
          className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${
            showTimeline ? 'bg-amber-100 dark:bg-amber-900/30' : ''
          }`}
          title="Toggle Calendar Sidebar"
        >
          <CalendarIcon className={`h-5 w-5 ${
            showTimeline
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-gray-600 dark:text-gray-300'
          }`} />
        </button>

        {/* Keyboard Shortcuts Help */}
        <button
          onClick={() => setShortcutsOpen(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <QuestionMarkCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>

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
    </>
  );
};
