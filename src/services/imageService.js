const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * Image Service
 * Handles image storage, validation, and cleanup for NotePlan clone
 */
class ImageService {
  constructor() {
    this.assetsDir = path.join(config.dataDirectory, 'Notes', 'assets');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
  }

  /**
   * Ensure assets directory exists
   */
  async ensureAssetsDir() {
    try {
      await fs.access(this.assetsDir);
    } catch (error) {
      console.log(`Creating assets directory: ${this.assetsDir}`);
      await fs.mkdir(this.assetsDir, { recursive: true });
    }
  }

  /**
   * Generate timestamp-based filename
   * Format: image-YYYY-MM-DD-HHMMSS.ext
   * @param {string} originalName - Original filename
   * @returns {string} Generated filename
   */
  generateFilename(originalName) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const timestamp = `${year}-${month}-${day}-${hours}${minutes}${seconds}`;

    // Get extension from original name
    const ext = path.extname(originalName).toLowerCase();
    const validExt = this.allowedExtensions.includes(ext) ? ext : '.png';

    return `image-${timestamp}${validExt}`;
  }

  /**
   * Validate image file
   * @param {Object} file - Multer file object
   * @returns {Object} Validation result { valid, error, warning }
   */
  validateImage(file) {
    const result = { valid: true, error: null, warning: null };

    // Check file exists
    if (!file) {
      result.valid = false;
      result.error = 'No file provided';
      return result;
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      result.valid = false;
      result.error = `Invalid file type. Allowed: ${this.allowedExtensions.join(', ')}`;
      return result;
    }

    // Check mime type
    if (!file.mimetype.startsWith('image/')) {
      result.valid = false;
      result.error = 'File is not an image';
      return result;
    }

    // Check file size (warning only, not rejection)
    if (file.size > this.maxFileSize) {
      result.warning = `Image is large (${(file.size / 1024 / 1024).toFixed(2)}MB). Consider resizing.`;
    }

    return result;
  }

  /**
   * Save uploaded image to assets directory
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} Result with filename, path, size
   */
  async saveImage(file) {
    await this.ensureAssetsDir();

    // Validate
    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate filename
    const filename = this.generateFilename(file.originalname);
    const absolutePath = path.join(this.assetsDir, filename);
    const relativePath = `assets/${filename}`;

    // Save file
    await fs.writeFile(absolutePath, file.buffer);

    console.log(`Image saved: ${relativePath} (${(file.size / 1024).toFixed(2)}KB)`);

    return {
      filename,
      relativePath,
      absolutePath,
      size: file.size,
      warning: validation.warning
    };
  }

  /**
   * Get absolute path from relative path
   * @param {string} relativePath - Relative path (e.g., "assets/image-2025-10-24-143022.png")
   * @returns {string} Absolute path
   */
  getAbsolutePath(relativePath) {
    return path.join(config.dataDirectory, 'Notes', relativePath);
  }

  /**
   * Delete image file
   * @param {string} filename - Image filename
   * @returns {Promise<boolean>} Success status
   */
  async deleteImage(filename) {
    try {
      const absolutePath = path.join(this.assetsDir, filename);
      await fs.unlink(absolutePath);
      console.log(`Image deleted: ${filename}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete image ${filename}:`, error.message);
      return false;
    }
  }

  /**
   * Find all images in assets directory
   * @returns {Promise<Array<string>>} Array of filenames
   */
  async listImages() {
    try {
      await this.ensureAssetsDir();
      const files = await fs.readdir(this.assetsDir);
      return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return this.allowedExtensions.includes(ext);
      });
    } catch (error) {
      console.error('Failed to list images:', error.message);
      return [];
    }
  }

  /**
   * Find all image references in markdown content
   * @param {string} content - Markdown content
   * @returns {Array<string>} Array of image filenames
   */
  findImageReferences(content) {
    const imageRegex = /!\[.*?\]\((assets\/[^)]+)\)/g;
    const references = [];
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      const relativePath = match[1]; // "assets/image-2025-10-24-143022.png"
      const filename = path.basename(relativePath);
      references.push(filename);
    }

    return references;
  }

  /**
   * Find orphaned images (images not referenced in any note)
   * @param {Array<Object>} notes - Array of note objects with content
   * @returns {Promise<Array<string>>} Array of orphaned image filenames
   */
  async findOrphanedImages(notes) {
    const allImages = await this.listImages();
    const referencedImages = new Set();

    // Find all referenced images across all notes
    notes.forEach(note => {
      if (note.content) {
        const refs = this.findImageReferences(note.content);
        refs.forEach(ref => referencedImages.add(ref));
      }
    });

    // Find orphaned images
    const orphaned = allImages.filter(image => !referencedImages.has(image));

    if (orphaned.length > 0) {
      console.log(`Found ${orphaned.length} orphaned images:`, orphaned);
    }

    return orphaned;
  }

  /**
   * Clean up orphaned images
   * @param {Array<Object>} notes - Array of note objects with content
   * @returns {Promise<Object>} Result with deleted count and filenames
   */
  async cleanupOrphanedImages(notes) {
    const orphaned = await this.findOrphanedImages(notes);
    const deleted = [];

    for (const filename of orphaned) {
      const success = await this.deleteImage(filename);
      if (success) {
        deleted.push(filename);
      }
    }

    console.log(`Cleaned up ${deleted.length} orphaned images`);

    return {
      count: deleted.length,
      filenames: deleted
    };
  }

  /**
   * Get image statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    const images = await this.listImages();
    let totalSize = 0;

    for (const filename of images) {
      try {
        const filePath = path.join(this.assetsDir, filename);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      } catch (error) {
        // Ignore errors for individual files
      }
    }

    return {
      count: images.length,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      assetsDir: this.assetsDir
    };
  }
}

// Export singleton instance
module.exports = new ImageService();
