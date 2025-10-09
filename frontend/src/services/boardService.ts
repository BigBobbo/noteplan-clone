import axios from 'axios';
import type { KanbanBoard, KanbanColumn, BoardResponse, ParsedTask } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Board Service
 * Handles Kanban board API communication
 */

/**
 * Load all boards and active board ID
 */
export const loadBoards = async (): Promise<BoardResponse> => {
  const response = await axios.get<BoardResponse>(`${API_BASE_URL}/api/boards`);
  return response.data;
};

/**
 * Get a specific board
 */
export const getBoard = async (boardId: string): Promise<KanbanBoard> => {
  const response = await axios.get<KanbanBoard>(`${API_BASE_URL}/api/boards/${boardId}`);
  return response.data;
};

/**
 * Create a new board
 */
export const createBoard = async (
  board: Omit<KanbanBoard, 'id' | 'createdAt' | 'updatedAt'>
): Promise<KanbanBoard> => {
  const response = await axios.post<KanbanBoard>(`${API_BASE_URL}/api/boards`, board);
  return response.data;
};

/**
 * Update an existing board
 */
export const updateBoard = async (
  boardId: string,
  updates: Partial<KanbanBoard>
): Promise<KanbanBoard> => {
  const response = await axios.put<KanbanBoard>(
    `${API_BASE_URL}/api/boards/${boardId}`,
    updates
  );
  return response.data;
};

/**
 * Delete a board
 */
export const deleteBoard = async (boardId: string): Promise<{ success: boolean; activeBoard: string }> => {
  const response = await axios.delete<{ success: boolean; activeBoard: string }>(
    `${API_BASE_URL}/api/boards/${boardId}`
  );
  return response.data;
};

/**
 * Get active board ID
 */
export const getActiveBoard = async (): Promise<string> => {
  const response = await axios.get<{ activeBoard: string }>(`${API_BASE_URL}/api/boards/active`);
  return response.data.activeBoard;
};

/**
 * Set active board
 */
export const setActiveBoard = async (boardId: string): Promise<{ success: boolean; activeBoard: string }> => {
  const response = await axios.put<{ success: boolean; activeBoard: string }>(
    `${API_BASE_URL}/api/boards/active`,
    { boardId }
  );
  return response.data;
};

/**
 * Filter tasks for a specific column
 */
export const getTasksForColumn = (
  tasks: ParsedTask[],
  column: KanbanColumn,
  boardFilters?: string[]
): ParsedTask[] => {
  const filterRecursive = (taskList: ParsedTask[]): ParsedTask[] => {
    return taskList.flatMap((task) => {
      // Special handling for "no status" column
      const isNoStatusColumn = column.tagFilter === '__no_status__';

      let hasColumnTag: boolean;
      if (isNoStatusColumn) {
        // For "no status" column, check if task has NO status-* tags
        hasColumnTag = !task.tags.some((tag) => tag.startsWith('status-'));
      } else {
        // Regular column - check if task has the column's tag
        hasColumnTag = task.tags.includes(column.tagFilter);
      }

      // Check if task matches board filters (if any)
      const matchesBoardFilter =
        !boardFilters ||
        boardFilters.length === 0 ||
        boardFilters.some((filter) => task.tags.includes(filter));

      // Collect matching tasks (including this one if it matches, and any matching children)
      const matchingTasks: ParsedTask[] = [];

      if (hasColumnTag && matchesBoardFilter) {
        matchingTasks.push(task);
      }

      // Recursively check children
      if (task.children.length > 0) {
        matchingTasks.push(...filterRecursive(task.children));
      }

      return matchingTasks;
    });
  };

  return filterRecursive(tasks);
};

/**
 * Update task tags when moving between columns
 */
export const updateTaskTags = (
  task: ParsedTask,
  oldTag: string | undefined,
  newTag: string
): string[] => {
  // Remove old status tag if it exists
  let updatedTags = task.tags.filter((tag) => tag !== oldTag);

  // Add new status tag if not already present
  if (!updatedTags.includes(newTag)) {
    updatedTags.push(newTag);
  }

  return updatedTags;
};
