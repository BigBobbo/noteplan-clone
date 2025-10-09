const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');
const { asyncHandler } = require('../middleware/errorHandler');
const { broadcast } = require('../websocket/socketHandler');

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

/**
 * POST /api/folders/create
 * Create a new folder
 */
router.post('/create', asyncHandler(async (req, res) => {
  const { name, parentPath = 'Notes' } = req.body;

  if (!name) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Folder name is required'
      }
    });
  }

  const result = await fileService.createFolder(parentPath, name);

  // Broadcast folder creation event
  broadcast('folder:created', {
    path: result.path,
    timestamp: new Date().toISOString()
  });

  res.status(201).json(result);
}));

/**
 * PUT /api/folders/rename
 * Rename a folder
 */
router.put('/rename', asyncHandler(async (req, res) => {
  const { folderPath, newName } = req.body;

  if (!folderPath) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Folder path is required'
      }
    });
  }

  if (!newName) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'New folder name is required'
      }
    });
  }

  const result = await fileService.renameFolder(folderPath, newName);

  // Broadcast folder rename event
  broadcast('folder:renamed', {
    oldPath: result.oldPath,
    newPath: result.newPath,
    affectedFiles: result.affectedFiles,
    timestamp: new Date().toISOString()
  });

  res.json(result);
}));

/**
 * DELETE /api/folders/delete
 * Delete a folder
 */
router.delete('/delete', asyncHandler(async (req, res) => {
  const { folderPath } = req.body;
  const { confirm } = req.query;

  if (!folderPath) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Folder path is required'
      }
    });
  }

  if (confirm !== 'true') {
    return res.status(400).json({
      error: {
        code: 'CONFIRMATION_REQUIRED',
        message: 'Must set confirm=true to delete folder'
      }
    });
  }

  const result = await fileService.deleteFolder(folderPath);

  // Broadcast folder deletion event
  broadcast('folder:deleted', {
    path: result.path,
    deletedFiles: result.deletedFiles,
    deletedFolders: result.deletedFolders,
    timestamp: new Date().toISOString()
  });

  res.json(result);
}));

/**
 * PUT /api/folders/move
 * Move a folder to a new location
 */
router.put('/move', asyncHandler(async (req, res) => {
  const { sourcePath, targetPath } = req.body;

  if (!sourcePath) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Source path is required'
      }
    });
  }

  if (!targetPath) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Target path is required'
      }
    });
  }

  const result = await fileService.moveFolder(sourcePath, targetPath);

  // Broadcast folder move event
  broadcast('folder:moved', {
    oldPath: result.oldPath,
    newPath: result.newPath,
    affectedFiles: result.affectedFiles,
    timestamp: new Date().toISOString()
  });

  res.json(result);
}));

/**
 * GET /api/folders/metadata
 * Get folder metadata
 */
router.get('/metadata', asyncHandler(async (req, res) => {
  const { folderPath } = req.query;

  if (!folderPath) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Folder path is required'
      }
    });
  }

  const metadata = await fileService.getFolderMetadata(folderPath);

  res.json(metadata);
}));

/**
 * PUT /api/folders/metadata
 * Update folder metadata
 */
router.put('/metadata', asyncHandler(async (req, res) => {
  const { folderPath, metadata } = req.body;

  if (!folderPath) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Folder path is required'
      }
    });
  }

  const result = await fileService.updateFolderMetadata(folderPath, metadata);

  // Broadcast metadata update event
  broadcast('folder:metadata-updated', {
    path: folderPath,
    metadata: result.metadata,
    timestamp: new Date().toISOString()
  });

  res.json(result);
}));

/**
 * POST /api/folders/notes/move
 * Move a note to a different folder
 */
router.post('/notes/move', asyncHandler(async (req, res) => {
  const { notePath, targetFolder } = req.body;

  if (!notePath) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Note path is required'
      }
    });
  }

  if (!targetFolder) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Target folder is required'
      }
    });
  }

  const result = await fileService.moveNote(notePath, targetFolder);

  // Broadcast note move event
  broadcast('note:moved', {
    oldPath: result.oldPath,
    newPath: result.newPath,
    timestamp: new Date().toISOString()
  });

  res.json(result);
}));

/**
 * POST /api/notes/bulk-move
 * Move multiple notes to a folder
 */
router.post('/notes/bulk-move', asyncHandler(async (req, res) => {
  const { notePaths, targetFolder } = req.body;

  if (!notePaths || !Array.isArray(notePaths)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Note paths array is required'
      }
    });
  }

  if (!targetFolder) {
    return res.status(400).json({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Target folder is required'
      }
    });
  }

  const result = await fileService.bulkMoveNotes(notePaths, targetFolder);

  // Broadcast bulk move event
  if (result.movedNotes.length > 0) {
    broadcast('notes:bulk-moved', {
      movedNotes: result.movedNotes,
      failedNotes: result.failedNotes,
      targetFolder,
      timestamp: new Date().toISOString()
    });
  }

  // Return 207 Multi-Status if there were failures
  const statusCode = result.success ? 200 : 207;
  res.status(statusCode).json(result);
}));

module.exports = router;
