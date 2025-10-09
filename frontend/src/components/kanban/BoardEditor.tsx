import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useBoardStore } from '../../store/boardStore';
import type { KanbanColumn } from '../../types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface BoardEditorProps {
  isOpen: boolean;
  onClose: () => void;
  boardId?: string; // If provided, edit existing board, otherwise create new
}

export const BoardEditor: React.FC<BoardEditorProps> = ({
  isOpen,
  onClose,
  boardId,
}) => {
  const { boards, createBoard, updateBoard } = useBoardStore();
  const existingBoard = boardId ? boards.find((b) => b.id === boardId) : null;

  const [name, setName] = useState(existingBoard?.name || '');
  const [columns, setColumns] = useState<Omit<KanbanColumn, 'id'>[]>(
    existingBoard?.columns || [
      { name: 'To Do', tagFilter: 'status-todo', order: 0 },
      { name: 'In Progress', tagFilter: 'status-doing', order: 1 },
      { name: 'Done', tagFilter: 'status-done', order: 2 },
    ]
  );
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'manual'>(
    existingBoard?.sortBy || 'priority'
  );

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        name: 'New Column',
        tagFilter: 'status-new',
        order: columns.length,
      },
    ]);
  };

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (
    index: number,
    field: keyof Omit<KanbanColumn, 'id'>,
    value: any
  ) => {
    const updatedColumns = [...columns];
    updatedColumns[index] = { ...updatedColumns[index], [field]: value };
    setColumns(updatedColumns);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a board name');
      return;
    }

    if (columns.length === 0) {
      alert('Please add at least one column');
      return;
    }

    const boardData = {
      name: name.trim(),
      columns: columns.map((col, index) => ({
        ...col,
        id: existingBoard?.columns[index]?.id || `col-${Date.now()}-${index}`,
        order: index,
      })),
      sortBy,
    };

    if (boardId) {
      await updateBoard(boardId, boardData);
    } else {
      await createBoard(boardData);
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={boardId ? 'Edit Board' : 'New Board'}>
      <div className="space-y-4">
        {/* Board Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Board Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="My Board"
          />
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort Tasks By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'priority' | 'date' | 'manual')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="priority">Priority</option>
            <option value="date">Date</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        {/* Columns */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Columns
            </label>
            <Button onClick={handleAddColumn} variant="secondary" size="sm">
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Column
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {columns.map((column, index) => (
              <div
                key={index}
                className="flex gap-2 items-start p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={column.name}
                    onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Column Name"
                  />
                  <input
                    type="text"
                    value={column.tagFilter}
                    onChange={(e) => handleColumnChange(index, 'tagFilter', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="status-todo"
                  />
                </div>
                <button
                  onClick={() => handleRemoveColumn(index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="primary">
            {boardId ? 'Save Changes' : 'Create Board'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
