const path = require('path');

/**
 * Path utility functions for security and validation
 */

/**
 * Sanitize and validate a file path
 * Prevents path traversal attacks
 * @param {string} filePath - The path to sanitize
 * @returns {string} Sanitized path
 * @throws {Error} If path contains invalid characters or traversal attempts
 */
function sanitizePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Path must be a non-empty string');
  }

  // Remove leading/trailing whitespace
  filePath = filePath.trim();

  // Check for path traversal attempts
  if (filePath.includes('..')) {
    throw new Error('Path traversal detected: .. is not allowed');
  }

  // Check for absolute paths (should be relative to data directory)
  if (path.isAbsolute(filePath)) {
    throw new Error('Absolute paths are not allowed');
  }

  // Normalize the path (removes redundant separators, resolves . references)
  const normalized = path.normalize(filePath);

  // Additional check after normalization
  if (normalized.includes('..')) {
    throw new Error('Path traversal detected after normalization');
  }

  return normalized;
}

/**
 * Validate file extension
 * Only allows .txt and .md files
 * @param {string} filePath - The path to validate
 * @returns {boolean} True if extension is valid
 */
function isValidExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.txt' || ext === '.md';
}

/**
 * Ensure a file has a valid extension
 * @param {string} filePath - The path to validate
 * @throws {Error} If extension is invalid
 */
function validateExtension(filePath) {
  if (!isValidExtension(filePath)) {
    throw new Error(`Invalid file extension. Only .txt and .md files are allowed`);
  }
}

/**
 * Safely join paths
 * @param {string} base - Base directory
 * @param {string} relativePath - Relative path to join
 * @returns {string} Joined absolute path
 */
function safePath(base, relativePath) {
  const sanitized = sanitizePath(relativePath);
  const joined = path.join(base, sanitized);

  // Ensure the joined path is still within the base directory
  const relative = path.relative(base, joined);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path escapes base directory');
  }

  return joined;
}

/**
 * Extract folder path from a file path
 * @param {string} filePath - The file path
 * @returns {string} Folder path
 */
function getFolderPath(filePath) {
  return path.dirname(filePath);
}

/**
 * Get file name from path
 * @param {string} filePath - The file path
 * @returns {string} File name
 */
function getFileName(filePath) {
  return path.basename(filePath);
}

/**
 * Get file name without extension
 * @param {string} filePath - The file path
 * @returns {string} File name without extension
 */
function getFileNameWithoutExt(filePath) {
  const base = path.basename(filePath);
  const ext = path.extname(base);
  return base.slice(0, -ext.length);
}

module.exports = {
  sanitizePath,
  isValidExtension,
  validateExtension,
  safePath,
  getFolderPath,
  getFileName,
  getFileNameWithoutExt
};
