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

/**
 * Create a new folder
 * @param {string} parentPath - Parent folder path relative to data directory
 * @param {string} name - Folder name
 * @returns {Object} { success, path, operationId }
 */
async function createFolder(parentPath, name) {
  try {
    // Validate folder name
    const nameValidation = validateFolderName(name);
    if (!nameValidation.valid) {
      throw new ValidationError(nameValidation.error);
    }

    // Build full path
    const sanitizedParent = pathUtils.sanitizePath(parentPath);
    const folderPath = path.join(config.dataDirectory, sanitizedParent, name);

    // Check if folder already exists
    if (fsSync.existsSync(folderPath)) {
      throw new ValidationError('A folder with this name already exists');
    }

    // Check folder limit (50 max, excluding Calendar and Templates)
    const currentCount = await countFolders();
    if (currentCount >= 50) {
      throw new ValidationError('Maximum folder limit (50) reached');
    }

    // Check nesting depth (max 5 levels)
    const depth = calculateNestingDepth(path.join(sanitizedParent, name));
    if (depth > 5) {
      throw new ValidationError('Maximum nesting depth (5 levels) exceeded');
    }

    // Create the folder
    await fs.mkdir(folderPath, { recursive: true });

    const relativePath = path.join(sanitizedParent, name);
    const operationId = generateOperationId();

    return {
      success: true,
      path: relativePath,
      operationId
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new FileSystemError(`Failed to create folder: ${error.message}`, error);
  }
}

/**
 * Rename a folder
 * @param {string} folderPath - Current folder path
 * @param {string} newName - New folder name
 * @returns {Object} { success, oldPath, newPath, affectedFiles, operationId }
 */
async function renameFolder(folderPath, newName) {
  try {
    // Validate new name
    const nameValidation = validateFolderName(newName);
    if (!nameValidation.valid) {
      throw new ValidationError(nameValidation.error);
    }

    // Check if folder is protected
    if (isProtectedFolder(folderPath)) {
      throw new ValidationError('Cannot rename system folder');
    }

    const sanitizedPath = pathUtils.sanitizePath(folderPath);
    const oldFullPath = path.join(config.dataDirectory, sanitizedPath);

    // Check if folder exists
    if (!fsSync.existsSync(oldFullPath)) {
      throw new NotFoundError(folderPath);
    }

    // Build new path
    const parentDir = path.dirname(sanitizedPath);
    const newPath = parentDir === '.' ? newName : path.join(parentDir, newName);
    const newFullPath = path.join(config.dataDirectory, newPath);

    // Check if new name already exists
    if (fsSync.existsSync(newFullPath)) {
      throw new ValidationError('A folder with this name already exists');
    }

    // Get all files that will be affected
    const affectedFiles = await getAllFiles(oldFullPath, oldFullPath);

    // Rename the folder
    await fs.rename(oldFullPath, newFullPath);

    const operationId = generateOperationId();

    return {
      success: true,
      oldPath: sanitizedPath,
      newPath,
      affectedFiles: affectedFiles.map(f => path.join(newPath, path.relative(oldFullPath, path.join(oldFullPath, f.name)))),
      operationId
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    throw new FileSystemError(`Failed to rename folder: ${error.message}`, error);
  }
}

/**
 * Delete a folder and all its contents
 * @param {string} folderPath - Folder path to delete
 * @returns {Object} { success, deletedFiles, deletedFolders, operationId }
 */
async function deleteFolder(folderPath) {
  try {
    // Check if folder is protected
    if (isProtectedFolder(folderPath)) {
      throw new ValidationError('Cannot delete system folder');
    }

    const sanitizedPath = pathUtils.sanitizePath(folderPath);
    const fullPath = path.join(config.dataDirectory, sanitizedPath);

    // Check if folder exists
    if (!fsSync.existsSync(fullPath)) {
      throw new NotFoundError(folderPath);
    }

    // Get all files and subfolders before deletion
    const allFiles = await getAllFiles(fullPath, fullPath);
    const allFolders = await getAllSubfolders(fullPath, fullPath);

    // Delete the folder recursively
    await fs.rm(fullPath, { recursive: true, force: true });

    const operationId = generateOperationId();

    return {
      success: true,
      path: sanitizedPath,
      deletedFiles: allFiles.map(f => f.path),
      deletedFolders: allFolders,
      operationId
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    throw new FileSystemError(`Failed to delete folder: ${error.message}`, error);
  }
}

/**
 * Move a folder to a new location
 * @param {string} sourcePath - Source folder path
 * @param {string} targetPath - Target parent folder path
 * @returns {Object} { success, oldPath, newPath, affectedFiles, operationId }
 */
async function moveFolder(sourcePath, targetPath) {
  try {
    // Check if source folder is protected
    if (isProtectedFolder(sourcePath)) {
      throw new ValidationError('Cannot move system folder');
    }

    const sanitizedSource = pathUtils.sanitizePath(sourcePath);
    const sanitizedTarget = pathUtils.sanitizePath(targetPath);

    const sourceFullPath = path.join(config.dataDirectory, sanitizedSource);
    const folderName = path.basename(sanitizedSource);
    const newPath = path.join(sanitizedTarget, folderName);
    const targetFullPath = path.join(config.dataDirectory, newPath);

    // Check if source exists
    if (!fsSync.existsSync(sourceFullPath)) {
      throw new NotFoundError(sourcePath);
    }

    // Check for circular reference
    if (newPath.startsWith(sanitizedSource + path.sep) || newPath === sanitizedSource) {
      throw new ValidationError('Cannot move folder into itself or its children');
    }

    // Check nesting depth
    const depth = calculateNestingDepth(newPath);
    if (depth > 5) {
      throw new ValidationError('Maximum nesting depth (5 levels) exceeded');
    }

    // Check if target already has folder with same name
    if (fsSync.existsSync(targetFullPath)) {
      throw new ValidationError('A folder with this name already exists at target location');
    }

    // Get all affected files
    const affectedFiles = await getAllFiles(sourceFullPath, sourceFullPath);

    // Move the folder
    await fs.rename(sourceFullPath, targetFullPath);

    const operationId = generateOperationId();

    return {
      success: true,
      oldPath: sanitizedSource,
      newPath,
      affectedFiles: affectedFiles.map(f => path.join(newPath, path.relative(sourceFullPath, path.join(sourceFullPath, f.name)))),
      operationId
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    throw new FileSystemError(`Failed to move folder: ${error.message}`, error);
  }
}

/**
 * Get folder metadata
 * @param {string} folderPath - Folder path
 * @returns {Object} Folder metadata or empty object
 */
async function getFolderMetadata(folderPath) {
  try {
    const sanitizedPath = pathUtils.sanitizePath(folderPath);
    const metadataPath = path.join(config.dataDirectory, sanitizedPath, '.folder-meta.json');

    if (!fsSync.existsSync(metadataPath)) {
      return {};
    }

    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

/**
 * Update folder metadata
 * @param {string} folderPath - Folder path
 * @param {Object} metadata - Metadata to save
 * @returns {Object} { success, metadata }
 */
async function updateFolderMetadata(folderPath, metadata) {
  try {
    const sanitizedPath = pathUtils.sanitizePath(folderPath);
    const folderFullPath = path.join(config.dataDirectory, sanitizedPath);

    // Check if folder exists
    if (!fsSync.existsSync(folderFullPath)) {
      throw new NotFoundError(folderPath);
    }

    const metadataPath = path.join(folderFullPath, '.folder-meta.json');

    // Merge with existing metadata
    let existingMetadata = {};
    if (fsSync.existsSync(metadataPath)) {
      const content = await fs.readFile(metadataPath, 'utf-8');
      existingMetadata = JSON.parse(content);
    }

    const updatedMetadata = {
      ...existingMetadata,
      ...metadata,
      modified: new Date().toISOString()
    };

    // Validate metadata size (10KB max)
    const metadataJson = JSON.stringify(updatedMetadata, null, 2);
    if (Buffer.byteLength(metadataJson, 'utf-8') > 10 * 1024) {
      throw new ValidationError('Metadata size exceeds maximum limit of 10KB');
    }

    await fs.writeFile(metadataPath, metadataJson, 'utf-8');

    return {
      success: true,
      metadata: updatedMetadata
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    throw new FileSystemError(`Failed to update folder metadata: ${error.message}`, error);
  }
}

/**
 * Move a note to a different folder
 * @param {string} notePath - Note path
 * @param {string} targetFolder - Target folder path
 * @returns {Object} { success, oldPath, newPath, operationId }
 */
async function moveNote(notePath, targetFolder) {
  try {
    const sanitizedNote = pathUtils.sanitizePath(notePath);
    const sanitizedTarget = pathUtils.sanitizePath(targetFolder);

    const noteFullPath = path.join(config.dataDirectory, sanitizedNote);
    const noteName = path.basename(sanitizedNote);
    const newPath = path.join(sanitizedTarget, noteName);
    const targetFullPath = path.join(config.dataDirectory, newPath);

    // Check if source exists
    if (!fsSync.existsSync(noteFullPath)) {
      throw new NotFoundError(notePath);
    }

    // Check if target folder exists
    const targetFolderFullPath = path.join(config.dataDirectory, sanitizedTarget);
    if (!fsSync.existsSync(targetFolderFullPath)) {
      throw new NotFoundError(targetFolder);
    }

    // Check if file already exists at target
    if (fsSync.existsSync(targetFullPath)) {
      throw new ValidationError('A file with this name already exists at target location');
    }

    // Move the file
    await fs.rename(noteFullPath, targetFullPath);

    const operationId = generateOperationId();

    return {
      success: true,
      oldPath: sanitizedNote,
      newPath,
      operationId
    };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    throw new FileSystemError(`Failed to move note: ${error.message}`, error);
  }
}

/**
 * Move multiple notes to a folder
 * @param {string[]} notePaths - Array of note paths
 * @param {string} targetFolder - Target folder path
 * @returns {Object} { success, movedNotes, failedNotes, operationId }
 */
async function bulkMoveNotes(notePaths, targetFolder) {
  const movedNotes = [];
  const failedNotes = [];

  for (const notePath of notePaths) {
    try {
      const result = await moveNote(notePath, targetFolder);
      movedNotes.push({
        oldPath: result.oldPath,
        newPath: result.newPath
      });
    } catch (error) {
      failedNotes.push({
        path: notePath,
        error: error.message
      });
    }
  }

  const operationId = generateOperationId();

  return {
    success: failedNotes.length === 0,
    movedNotes,
    failedNotes,
    operationId: failedNotes.length === 0 ? operationId : null
  };
}

// Helper functions

/**
 * Validate folder name
 * @param {string} name - Folder name to validate
 * @returns {Object} { valid, error }
 */
function validateFolderName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Folder name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Folder name cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Folder name exceeds maximum length of 100 characters' };
  }

  // Check for invalid characters: / \ : * ? " < > |
  const invalidChars = /[\/\\:*?"<>|]/;
  if (invalidChars.test(trimmed)) {
    return { valid: false, error: 'Folder name contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Check if folder is protected
 * @param {string} folderPath - Folder path to check
 * @returns {boolean} True if protected
 */
function isProtectedFolder(folderPath) {
  const normalized = folderPath.replace(/\\/g, '/').toLowerCase();
  return normalized === 'calendar' ||
         normalized === 'templates' ||
         normalized === '@templates' ||
         normalized.startsWith('calendar/') ||
         normalized.startsWith('templates/') ||
         normalized.startsWith('@templates/');
}

/**
 * Calculate nesting depth of a path
 * @param {string} folderPath - Folder path
 * @returns {number} Nesting depth
 */
function calculateNestingDepth(folderPath) {
  const normalized = folderPath.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(p => p.length > 0);

  // Don't count top-level folders (Calendar, Notes, Templates)
  const topLevel = ['calendar', 'notes', 'templates', '@templates'];
  const firstPart = parts[0]?.toLowerCase();

  if (topLevel.includes(firstPart)) {
    return parts.length - 1;
  }

  return parts.length;
}

/**
 * Count total folders (excluding Calendar and Templates)
 * @returns {number} Folder count
 */
async function countFolders() {
  try {
    const dataDir = config.dataDirectory;
    const notesPath = path.join(dataDir, 'Notes');

    if (!fsSync.existsSync(notesPath)) {
      return 0;
    }

    let count = 0;

    async function countInDir(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== '.folder-meta.json') {
          count++;
          const subPath = path.join(dir, entry.name);
          await countInDir(subPath);
        }
      }
    }

    await countInDir(notesPath);
    return count;
  } catch (error) {
    return 0;
  }
}

/**
 * Get all subfolders recursively
 * @param {string} dir - Directory to search
 * @param {string} baseDir - Base directory
 * @returns {Array} Array of folder paths
 */
async function getAllSubfolders(dir, baseDir) {
  const folders = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      folders.push(relativePath);

      const subFolders = await getAllSubfolders(fullPath, baseDir);
      folders.push(...subFolders);
    }
  }

  return folders;
}

/**
 * Generate a unique operation ID for undo
 * @returns {string} Operation ID
 */
function generateOperationId() {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  listFiles,
  getFile,
  saveFile,
  deleteFile,
  getFolderTree,
  initializeFolders,
  fileExists,
  createFolder,
  renameFolder,
  deleteFolder,
  moveFolder,
  getFolderMetadata,
  updateFolderMetadata,
  moveNote,
  bulkMoveNotes
};
