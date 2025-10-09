import React, { useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Button } from '../common/Button';
import clsx from 'clsx';

export const BoardSelector: React.FC = () => {
  const { boards, activeBoard, setActiveBoard } = useBoardStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleBoardChange = async (boardId: string) => {
    await setActiveBoard(boardId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-sm font-medium">
          {activeBoard?.name || 'Select Board'}
        </span>
        <svg
          className={clsx(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <div className="py-1">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleBoardChange(board.id)}
                  className={clsx(
                    'w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between',
                    activeBoard?.id === board.id
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <span>{board.name}</span>
                  {activeBoard?.id === board.id && (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Actions */}
            <div className="py-1">
              <button
                onClick={() => {
                  // TODO: Open board editor modal
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                New Board
              </button>
              <button
                onClick={() => {
                  // TODO: Open board settings modal
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                Manage Boards
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
