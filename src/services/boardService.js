const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const config = require('../config/config');
const { NotFoundError, ValidationError, FileSystemError } = require('../middleware/errorHandler');

/**
 * Board Service
 * Manages Kanban board configurations
 */

const BOARDS_FILE = path.join(config.dataDirectory, '.kanban-boards.json');

/**
 * Default board configuration
 */
const DEFAULT_CONFIG = {
  boards: [
    {
      id: 'default',
      name: 'Default Flow',
      columns: [
        { id: '0', name: 'No Status', tagFilter: '__no_status__', order: 0, color: '#9ca3af' },
        { id: '1', name: 'To Do', tagFilter: 'status-todo', order: 1 },
        { id: '2', name: 'In Progress', tagFilter: 'status-doing', order: 2 },
        { id: '3', name: 'Done', tagFilter: 'status-done', order: 3 }
      ],
      sortBy: 'priority',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  activeBoard: 'default',
  version: 1
};

/**
 * Load board configuration from file
 * @returns {Object} Board configuration
 */
async function loadBoards() {
  try {
    // Check if file exists
    if (!fsSync.existsSync(BOARDS_FILE)) {
      // Create default config
      await saveBoards(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }

    // Read and parse file
    const content = await fs.readFile(BOARDS_FILE, 'utf-8');
    const config = JSON.parse(content);

    // Validate structure
    if (!config.boards || !Array.isArray(config.boards)) {
      throw new Error('Invalid board configuration structure');
    }

    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      // JSON parse error - recreate with defaults
      console.error('Invalid JSON in boards file, recreating with defaults');
      await saveBoards(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    throw new FileSystemError(`Failed to load boards: ${error.message}`, error);
  }
}

/**
 * Save board configuration to file
 * @param {Object} config - Board configuration
 */
async function saveBoards(config) {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(BOARDS_FILE);
    if (!fsSync.existsSync(dataDir)) {
      await fs.mkdir(dataDir, { recursive: true });
    }

    // Write file
    await fs.writeFile(BOARDS_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    throw new FileSystemError(`Failed to save boards: ${error.message}`, error);
  }
}

/**
 * Get all boards
 * @returns {Array} Array of boards
 */
async function getAllBoards() {
  const config = await loadBoards();
  return config.boards;
}

/**
 * Get a specific board by ID
 * @param {string} boardId - Board ID
 * @returns {Object} Board object
 */
async function getBoard(boardId) {
  const config = await loadBoards();
  const board = config.boards.find(b => b.id === boardId);

  if (!board) {
    throw new NotFoundError(`Board not found: ${boardId}`);
  }

  return board;
}

/**
 * Create a new board
 * @param {Object} boardData - Board data (without id)
 * @returns {Object} Created board
 */
async function createBoard(boardData) {
  try {
    const config = await loadBoards();

    // Validate required fields
    if (!boardData.name || !boardData.columns) {
      throw new ValidationError('Board name and columns are required');
    }

    // Generate unique ID
    const id = `board-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create board object
    const newBoard = {
      id,
      name: boardData.name,
      columns: boardData.columns.map((col, index) => ({
        id: col.id || `col-${Date.now()}-${index}`,
        name: col.name,
        tagFilter: col.tagFilter,
        color: col.color,
        limit: col.limit,
        order: col.order !== undefined ? col.order : index
      })),
      filterTags: boardData.filterTags,
      sortBy: boardData.sortBy || 'priority',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to config
    config.boards.push(newBoard);
    await saveBoards(config);

    return newBoard;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new FileSystemError(`Failed to create board: ${error.message}`, error);
  }
}

/**
 * Update an existing board
 * @param {string} boardId - Board ID
 * @param {Object} updates - Partial board data to update
 * @returns {Object} Updated board
 */
async function updateBoard(boardId, updates) {
  try {
    const config = await loadBoards();
    const boardIndex = config.boards.findIndex(b => b.id === boardId);

    if (boardIndex === -1) {
      throw new NotFoundError(`Board not found: ${boardId}`);
    }

    // Update board
    const updatedBoard = {
      ...config.boards[boardIndex],
      ...updates,
      id: boardId, // Prevent ID changes
      updatedAt: new Date().toISOString()
    };

    config.boards[boardIndex] = updatedBoard;
    await saveBoards(config);

    return updatedBoard;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new FileSystemError(`Failed to update board: ${error.message}`, error);
  }
}

/**
 * Delete a board
 * @param {string} boardId - Board ID
 * @returns {Object} Success response
 */
async function deleteBoard(boardId) {
  try {
    const config = await loadBoards();
    const boardIndex = config.boards.findIndex(b => b.id === boardId);

    if (boardIndex === -1) {
      throw new NotFoundError(`Board not found: ${boardId}`);
    }

    // Prevent deleting the last board
    if (config.boards.length === 1) {
      throw new ValidationError('Cannot delete the last board');
    }

    // Remove board
    config.boards.splice(boardIndex, 1);

    // Update active board if needed
    if (config.activeBoard === boardId) {
      config.activeBoard = config.boards[0].id;
    }

    await saveBoards(config);

    return { success: true, activeBoard: config.activeBoard };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    throw new FileSystemError(`Failed to delete board: ${error.message}`, error);
  }
}

/**
 * Get active board ID
 * @returns {string} Active board ID
 */
async function getActiveBoard() {
  const config = await loadBoards();
  return config.activeBoard;
}

/**
 * Set active board
 * @param {string} boardId - Board ID to set as active
 * @returns {Object} Success response
 */
async function setActiveBoard(boardId) {
  try {
    const config = await loadBoards();

    // Verify board exists
    const board = config.boards.find(b => b.id === boardId);
    if (!board) {
      throw new NotFoundError(`Board not found: ${boardId}`);
    }

    config.activeBoard = boardId;
    await saveBoards(config);

    return { success: true, activeBoard: boardId };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new FileSystemError(`Failed to set active board: ${error.message}`, error);
  }
}

module.exports = {
  loadBoards,
  saveBoards,
  getAllBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  getActiveBoard,
  setActiveBoard
};
