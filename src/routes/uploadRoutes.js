const express = require('express');
const multer = require('multer');
const imageService = require('../services/imageService');

const router = express.Router();

// Configure multer for memory storage (we'll handle file saving manually)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB hard limit (we warn at 5MB)
  },
  fileFilter: (req, file, cb) => {
    // Basic mime type check
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/upload
 * Upload an image file
 *
 * Request: multipart/form-data with 'image' field
 * Response: { success, filename, relativePath, size, warning? }
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    console.log(`Upload request: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)}KB)`);

    // Save image using imageService
    const result = await imageService.saveImage(req.file);

    res.json({
      success: true,
      filename: result.filename,
      relativePath: result.relativePath,
      size: result.size,
      warning: result.warning || null
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image'
    });
  }
});

/**
 * GET /api/upload/stats
 * Get image storage statistics
 *
 * Response: { count, totalSize, totalSizeMB, assetsDir }
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await imageService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Failed to get image stats:', error);
    res.status(500).json({
      error: error.message || 'Failed to get statistics'
    });
  }
});

/**
 * POST /api/upload/cleanup
 * Clean up orphaned images (images not referenced in any note)
 *
 * Request body: { notes: Array<{ content: string }> }
 * Response: { count, filenames }
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes || !Array.isArray(notes)) {
      return res.status(400).json({
        error: 'Notes array is required'
      });
    }

    const result = await imageService.cleanupOrphanedImages(notes);

    res.json({
      success: true,
      count: result.count,
      filenames: result.filenames
    });

  } catch (error) {
    console.error('Image cleanup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cleanup images'
    });
  }
});

/**
 * DELETE /api/upload/:filename
 * Delete a specific image
 *
 * Response: { success }
 */
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }

    const success = await imageService.deleteImage(filename);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({
        success: false,
        error: 'Image not found or could not be deleted'
      });
    }

  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete image'
    });
  }
});

module.exports = router;
