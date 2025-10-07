const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');
const markdownService = require('../services/markdownService');
const { asyncHandler } = require('../middleware/errorHandler');
const { ValidationError } = require('../middleware/errorHandler');

/**
 * File Routes
 * API endpoints for file operations
 */

/**
 * GET /api/files
 * List all files
 * Query params: ?folder=Notes&search=query
 */
router.get('/', asyncHandler(async (req, res) => {
  const { folder, search } = req.query;

  let files = await fileService.listFiles(folder);

  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    files = files.filter(file =>
      file.name.toLowerCase().includes(searchLower) ||
      file.path.toLowerCase().includes(searchLower)
    );
  }

  res.json({
    files,
    count: files.length
  });
}));

/**
 * GET /api/files/*
 * Get file content and metadata
 * Path parameter: file path (e.g., /api/files/Notes/test.txt)
 */
router.get('/*', asyncHandler(async (req, res) => {
  // Get the path from the URL (everything after /api/files/)
  const filePath = req.params[0];

  if (!filePath) {
    throw new ValidationError('File path is required');
  }

  // Get file content
  const fileData = await fileService.getFile(filePath);

  // Parse markdown
  const parsed = markdownService.parseMarkdown(fileData.content);

  res.json({
    ...fileData,
    parsed
  });
}));

/**
 * POST /api/files/*
 * Create or update file
 * Path parameter: file path
 * Body: { content }
 */
router.post('/*', asyncHandler(async (req, res) => {
  const filePath = req.params[0];

  if (!filePath) {
    throw new ValidationError('File path is required');
  }

  const { content } = req.body;

  if (content === undefined || content === null) {
    throw new ValidationError('Content is required in request body');
  }

  if (typeof content !== 'string') {
    throw new ValidationError('Content must be a string');
  }

  const result = await fileService.saveFile(filePath, content);

  res.json(result);
}));

/**
 * DELETE /api/files/*
 * Delete file
 * Path parameter: file path
 */
router.delete('/*', asyncHandler(async (req, res) => {
  const filePath = req.params[0];

  if (!filePath) {
    throw new ValidationError('File path is required');
  }

  const result = await fileService.deleteFile(filePath);

  res.json(result);
}));

module.exports = router;
