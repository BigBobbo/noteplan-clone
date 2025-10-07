const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const config = require('../config/config');
const pathUtils = require('../utils/pathUtils');
const { NotFoundError, ValidationError, SecurityError, FileSystemError } = require('../middleware/errorHandler');

/**
 * File Service
 * Handles all file system operations for notes
 */

/**
 * Get list of all files in data directory
 * @param {string} folder - Optional folder filter (e.g., 'Notes', 'Calendar')
 * @returns {Array} Array of file objects with metadata
 */
async function listFiles(folder = null) {
  try {
    const dataDir = config.dataDirectory;
    const searchPath = folder ? path.join(dataDir, folder) : dataDir;

    // Check if directory exists
    if (!fsSync.existsSync(searchPath)) {
      return [];
    }

    const files = await getAllFiles(searchPath, dataDir);

    // Filter by folder if specified
    if (folder) {
      return files.filter(file => file.folder === folder || file.folder.startsWith(folder + '/'));
    }

    return files;
  } catch (error) {
    throw new FileSystemError(`Failed to list files: ${error.message}`, error);
  }
}

/**
 * Recursively get all files in a directory
 * @param {string} dir - Directory to search
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Array} Array of file objects
 */
async function getAllFiles(dir, baseDir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively get files from subdirectories
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      // Only include .txt and .md files
      if (pathUtils.isValidExtension(entry.name)) {
        const stats = await fs.stat(fullPath);
        const relativePath = path.relative(baseDir, fullPath);

        files.push({
          path: relativePath,
          name: entry.name,
          folder: path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath),
          modified: stats.mtime.toISOString(),
          created: stats.birthtime.toISOString(),
          size: stats.size,
          type: getFileType(relativePath)
        });
      }
    }
  }

  return files;
}

/**
 * Determine file type based on path
 * @param {string} relativePath - Relative path
 * @returns {string} File type (note, daily, template)
 */
function getFileType(relativePath) {
  if (relativePath.startsWith('Calendar/')) {
    return 'daily';
  } else if (relativePath.startsWith('Templates/')) {
    return 'template';
  }
  return 'note';
}

/**
 * Get file content and metadata
 * @param {string} relativePath - Path relative to data directory
 * @returns {Object} { content, metadata, parsed }
 */
async function getFile(relativePath) {
  try {
    // Sanitize and validate path
    const sanitized = pathUtils.sanitizePath(relativePath);
    pathUtils.validateExtension(sanitized);

    const fullPath = pathUtils.safePath(config.dataDirectory, sanitized);

    // Check if file exists
    if (!fsSync.existsSync(fullPath)) {
      throw new NotFoundError(relativePath);
    }

    // Read file content
    const content = await fs.readFile(fullPath, 'utf-8');

    // Get file stats
    const stats = await fs.stat(fullPath);

    return {
      content,
      metadata: {
        path: relativePath,
        name: pathUtils.getFileName(relativePath),
        folder: pathUtils.getFolderPath(relativePath),
        modified: stats.mtime.toISOString(),
        created: stats.birthtime.toISOString(),
        size: stats.size,
        type: getFileType(relativePath)
      }
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof SecurityError) {
      throw error;
    }
    throw new FileSystemError(`Failed to read file: ${error.message}`, error);
  }
}

/**
 * Create or update a file
 * @param {string} relativePath - Path relative to data directory
 * @param {string} content - File content
 * @returns {Object} { success, path }
 */
async function saveFile(relativePath, content) {
  try {
    // Sanitize and validate path
    const sanitized = pathUtils.sanitizePath(relativePath);
    pathUtils.validateExtension(sanitized);

    // Validate content
    if (typeof content !== 'string') {
      throw new ValidationError('Content must be a string');
    }

    // Check file size (10MB limit)
    const sizeInBytes = Buffer.byteLength(content, 'utf-8');
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (sizeInBytes > maxSize) {
      throw new ValidationError(`File size exceeds maximum limit of 10MB`);
    }

    const fullPath = pathUtils.safePath(config.dataDirectory, sanitized);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');

    return {
      success: true,
      path: relativePath
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SecurityError) {
      throw error;
    }
    throw new FileSystemError(`Failed to save file: ${error.message}`, error);
  }
}

/**
 * Delete a file
 * @param {string} relativePath - Path relative to data directory
 * @returns {Object} { success }
 */
async function deleteFile(relativePath) {
  try {
    // Sanitize and validate path
    const sanitized = pathUtils.sanitizePath(relativePath);
    pathUtils.validateExtension(sanitized);

    const fullPath = pathUtils.safePath(config.dataDirectory, sanitized);

    // Check if file exists
    if (!fsSync.existsSync(fullPath)) {
      throw new NotFoundError(relativePath);
    }

    // Delete file
    await fs.unlink(fullPath);

    return {
      success: true
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof SecurityError) {
      throw error;
    }
    throw new FileSystemError(`Failed to delete file: ${error.message}`, error);
  }
}

/**
 * Get folder tree structure
 * @returns {Object} Nested folder structure
 */
async function getFolderTree() {
  try {
    const dataDir = config.dataDirectory;

    if (!fsSync.existsSync(dataDir)) {
      await fs.mkdir(dataDir, { recursive: true });
      return { name: 'root', children: [] };
    }

    const tree = await buildTree(dataDir, dataDir);
    return tree;
  } catch (error) {
    throw new FileSystemError(`Failed to get folder tree: ${error.message}`, error);
  }
}

/**
 * Recursively build folder tree
 * @param {string} dir - Directory to build tree from
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Object} Tree structure
 */
async function buildTree(dir, baseDir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const relativePath = path.relative(baseDir, dir);

  const node = {
    name: relativePath === '' ? 'root' : path.basename(dir),
    type: 'folder',
    path: relativePath === '' ? '' : relativePath,
    children: []
  };

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const subTree = await buildTree(fullPath, baseDir);
      node.children.push(subTree);
    }
  }

  return node;
}

/**
 * Initialize NotePlan folder structure
 * Creates Calendar, Notes, and Templates folders if they don't exist
 * @returns {Object} { success, created: [] }
 */
async function initializeFolders() {
  try {
    const dataDir = config.dataDirectory;
    const folders = ['Calendar', 'Notes', 'Templates'];
    const created = [];

    for (const folder of folders) {
      const folderPath = path.join(dataDir, folder);
      if (!fsSync.existsSync(folderPath)) {
        await fs.mkdir(folderPath, { recursive: true });
        created.push(folder);
      }
    }

    return {
      success: true,
      created
    };
  } catch (error) {
    throw new FileSystemError(`Failed to initialize folders: ${error.message}`, error);
  }
}

/**
 * Check if a file exists
 * @param {string} relativePath - Path relative to data directory
 * @returns {boolean} True if file exists
 */
async function fileExists(relativePath) {
  try {
    const sanitized = pathUtils.sanitizePath(relativePath);
    const fullPath = pathUtils.safePath(config.dataDirectory, sanitized);
    return fsSync.existsSync(fullPath);
  } catch (error) {
    return false;
  }
}

module.exports = {
  listFiles,
  getFile,
  saveFile,
  deleteFile,
  getFolderTree,
  initializeFolders,
  fileExists
};
