const { ValidationError } = require('./errorHandler');

/**
 * Validation Middleware
 * Request validation utilities
 */

/**
 * Validate request body has required fields
 * @param {Array} requiredFields - Array of required field names
 * @returns {Function} Middleware function
 */
function validateBody(requiredFields = []) {
  return (req, res, next) => {
    if (!req.body) {
      throw new ValidationError('Request body is required');
    }

    const missingFields = requiredFields.filter(field => !(field in req.body));

    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    next();
  };
}

/**
 * Validate request has required query parameters
 * @param {Array} requiredParams - Array of required parameter names
 * @returns {Function} Middleware function
 */
function validateQuery(requiredParams = []) {
  return (req, res, next) => {
    const missingParams = requiredParams.filter(param => !(param in req.query));

    if (missingParams.length > 0) {
      throw new ValidationError(`Missing required query parameters: ${missingParams.join(', ')}`);
    }

    next();
  };
}

/**
 * Validate content type is JSON
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function validateJSON(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');

    if (!contentType || !contentType.includes('application/json')) {
      throw new ValidationError('Content-Type must be application/json');
    }
  }

  next();
}

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove null bytes
  return input.replace(/\0/g, '');
}

/**
 * Validate and sanitize file path
 * @param {string} filePath - File path to validate
 * @returns {string} Sanitized path
 */
function validateFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('File path must be a non-empty string');
  }

  // Check for path traversal
  if (filePath.includes('..')) {
    throw new ValidationError('Path traversal is not allowed');
  }

  // Check for absolute paths
  if (filePath.startsWith('/') || filePath.match(/^[a-zA-Z]:\\/)) {
    throw new ValidationError('Absolute paths are not allowed');
  }

  return sanitizeString(filePath);
}

/**
 * Validate pagination parameters
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function validatePagination(req, res, next) {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      throw new ValidationError('Page must be a positive integer');
    }
    req.query.page = pageNum;
  } else {
    req.query.page = 1;
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }
    req.query.limit = limitNum;
  } else {
    req.query.limit = 50;
  }

  next();
}

module.exports = {
  validateBody,
  validateQuery,
  validateJSON,
  sanitizeString,
  validateFilePath,
  validatePagination
};
