const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Folder Routes
 * API endpoints for folder operations
 */

/**
 * GET /api/folders
 * Get folder tree structure
 */
router.get('/', asyncHandler(async (req, res) => {
  const tree = await fileService.getFolderTree();

  res.json({
    tree
  });
}));

/**
 * POST /api/folders/init
 * Initialize NotePlan folder structure
 * Creates Calendar, Notes, and Templates folders if they don't exist
 */
router.post('/init', asyncHandler(async (req, res) => {
  const result = await fileService.initializeFolders();

  res.json(result);
}));

module.exports = router;
