/**
 * Custom Error Classes
 */

class NotFoundError extends Error {
  constructor(path) {
    super(`File not found: ${path}`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = 'NOT_FOUND';
    this.path = path;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
  }
}

class SecurityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SecurityError';
    this.statusCode = 403;
    this.code = 'SECURITY_ERROR';
  }
}

class FileSystemError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'FileSystemError';
    this.statusCode = 500;
    this.code = 'FILE_SYSTEM_ERROR';
    this.originalError = originalError;
  }
}

/**
 * Express error handling middleware
 * Catches all errors and formats them consistently
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  console.error(`[${err.name || 'Error'}] ${err.message}`);
  if (err.stack && process.env.LOG_LEVEL === 'debug') {
    console.error(err.stack);
  }

  // Default to 500 if status code not set
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Build error response
  const errorResponse = {
    error: {
      message: err.message || 'An unexpected error occurred',
      code: code
    }
  };

  // Add additional fields if available (but don't leak sensitive info)
  if (err.path && !err.path.includes('/Users/') && !err.path.includes('C:\\')) {
    errorResponse.error.path = err.path;
  }

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.path}`,
      code: 'ROUTE_NOT_FOUND'
    }
  });
}

/**
 * Async handler wrapper to catch promise rejections
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  NotFoundError,
  ValidationError,
  SecurityError,
  FileSystemError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
