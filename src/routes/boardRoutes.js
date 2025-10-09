const express = require('express');
const router = express.Router();
const boardService = require('../services/boardService');
const { asyncHandler } = require('../middleware/errorHandler');
const { ValidationError } = require('../middleware/errorHandler');

/**
 * Board Routes
 * API endpoints for Kanban board management
 */

/**
 * GET /api/boards
 * Get all boards with active board ID
 */
router.get('/', asyncHandler(async (req, res) => {
  const boards = await boardService.getAllBoards();
  const activeBoard = await boardService.getActiveBoard();

  res.json({
    boards,
    activeBoard
  });
}));

/**
 * GET /api/boards/active
 * Get active board ID
 */
router.get('/active', asyncHandler(async (req, res) => {
  const activeBoard = await boardService.getActiveBoard();

  res.json({
    activeBoard
  });
}));

/**
 * PUT /api/boards/active
 * Set active board
 * Body: { boardId }
 */
router.put('/active', asyncHandler(async (req, res) => {
  const { boardId } = req.body;

  if (!boardId) {
    throw new ValidationError('Board ID is required');
  }

  const result = await boardService.setActiveBoard(boardId);

  res.json(result);
}));

/**
 * GET /api/boards/:id
 * Get a specific board
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const board = await boardService.getBoard(id);

  res.json(board);
}));

/**
 * POST /api/boards
 * Create a new board
 * Body: { name, columns, filterTags?, sortBy? }
 */
router.post('/', asyncHandler(async (req, res) => {
  const boardData = req.body;

  if (!boardData.name) {
    throw new ValidationError('Board name is required');
  }

  if (!boardData.columns || !Array.isArray(boardData.columns)) {
    throw new ValidationError('Columns array is required');
  }

  const newBoard = await boardService.createBoard(boardData);

  res.status(201).json(newBoard);
}));

/**
 * PUT /api/boards/:id
 * Update a board
 * Body: Partial board data
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedBoard = await boardService.updateBoard(id, updates);

  res.json(updatedBoard);
}));

/**
 * DELETE /api/boards/:id
 * Delete a board
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await boardService.deleteBoard(id);

  res.json(result);
}));

module.exports = router;
