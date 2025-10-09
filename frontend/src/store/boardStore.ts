import { create } from 'zustand';
import type { KanbanBoard, KanbanColumn } from '../types';
import * as boardService from '../services/boardService';

interface BoardStore {
  boards: KanbanBoard[];
  activeBoard: KanbanBoard | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadBoards: () => Promise<void>;
  setActiveBoard: (boardId: string) => Promise<void>;
  createBoard: (board: Omit<KanbanBoard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBoard: (boardId: string, updates: Partial<KanbanBoard>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  addColumn: (boardId: string, column: Omit<KanbanColumn, 'id'>) => void;
  removeColumn: (boardId: string, columnId: string) => void;
  reorderColumns: (boardId: string, columnIds: string[]) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  boards: [],
  activeBoard: null,
  loading: false,
  error: null,

  loadBoards: async () => {
    set({ loading: true, error: null });
    try {
      const response = await boardService.loadBoards();
      const activeBoard = response.boards.find((b) => b.id === response.activeBoard) || null;

      set({
        boards: response.boards,
        activeBoard,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load boards:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load boards',
        loading: false,
      });
    }
  },

  setActiveBoard: async (boardId: string) => {
    try {
      await boardService.setActiveBoard(boardId);
      const board = get().boards.find((b) => b.id === boardId);

      if (board) {
        set({ activeBoard: board });
      }
    } catch (error) {
      console.error('Failed to set active board:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to set active board',
      });
    }
  },

  createBoard: async (boardData) => {
    set({ loading: true, error: null });
    try {
      const newBoard = await boardService.createBoard(boardData);

      set((state) => ({
        boards: [...state.boards, newBoard],
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to create board:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create board',
        loading: false,
      });
    }
  },

  updateBoard: async (boardId: string, updates: Partial<KanbanBoard>) => {
    try {
      const updatedBoard = await boardService.updateBoard(boardId, updates);

      set((state) => ({
        boards: state.boards.map((b) => (b.id === boardId ? updatedBoard : b)),
        activeBoard: state.activeBoard?.id === boardId ? updatedBoard : state.activeBoard,
      }));
    } catch (error) {
      console.error('Failed to update board:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update board',
      });
    }
  },

  deleteBoard: async (boardId: string) => {
    try {
      const result = await boardService.deleteBoard(boardId);

      set((state) => {
        const remainingBoards = state.boards.filter((b) => b.id !== boardId);
        const newActiveBoard = remainingBoards.find((b) => b.id === result.activeBoard) || null;

        return {
          boards: remainingBoards,
          activeBoard: newActiveBoard,
        };
      });
    } catch (error) {
      console.error('Failed to delete board:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete board',
      });
    }
  },

  addColumn: (boardId: string, column: Omit<KanbanColumn, 'id'>) => {
    set((state) => {
      const board = state.boards.find((b) => b.id === boardId);
      if (!board) return state;

      const newColumn: KanbanColumn = {
        ...column,
        id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      const updatedBoard = {
        ...board,
        columns: [...board.columns, newColumn],
        updatedAt: new Date().toISOString(),
      };

      // Update in backend
      boardService.updateBoard(boardId, { columns: updatedBoard.columns });

      return {
        boards: state.boards.map((b) => (b.id === boardId ? updatedBoard : b)),
        activeBoard: state.activeBoard?.id === boardId ? updatedBoard : state.activeBoard,
      };
    });
  },

  removeColumn: (boardId: string, columnId: string) => {
    set((state) => {
      const board = state.boards.find((b) => b.id === boardId);
      if (!board) return state;

      const updatedBoard = {
        ...board,
        columns: board.columns.filter((c) => c.id !== columnId),
        updatedAt: new Date().toISOString(),
      };

      // Update in backend
      boardService.updateBoard(boardId, { columns: updatedBoard.columns });

      return {
        boards: state.boards.map((b) => (b.id === boardId ? updatedBoard : b)),
        activeBoard: state.activeBoard?.id === boardId ? updatedBoard : state.activeBoard,
      };
    });
  },

  reorderColumns: (boardId: string, columnIds: string[]) => {
    set((state) => {
      const board = state.boards.find((b) => b.id === boardId);
      if (!board) return state;

      const reorderedColumns = columnIds
        .map((id, index) => {
          const column = board.columns.find((c) => c.id === id);
          return column ? { ...column, order: index } : null;
        })
        .filter((c): c is KanbanColumn => c !== null);

      const updatedBoard = {
        ...board,
        columns: reorderedColumns,
        updatedAt: new Date().toISOString(),
      };

      // Update in backend
      boardService.updateBoard(boardId, { columns: updatedBoard.columns });

      return {
        boards: state.boards.map((b) => (b.id === boardId ? updatedBoard : b)),
        activeBoard: state.activeBoard?.id === boardId ? updatedBoard : state.activeBoard,
      };
    });
  },
}));
