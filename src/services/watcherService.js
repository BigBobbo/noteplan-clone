const chokidar = require('chokidar');
const path = require('path');
const config = require('../config/config');

/**
 * Watcher Service
 * Monitors file system for changes and emits events
 */

let watcher = null;
let eventEmitter = null;
let debounceTimers = new Map();

const DEBOUNCE_DELAY = 300; // milliseconds

/**
 * Start watching data directory for changes
 * @param {EventEmitter} emitter - Event emitter to emit file change events
 */
function startWatcher(emitter) {
  if (watcher) {
    console.log('Watcher already running');
    return;
  }

  eventEmitter = emitter;
  const dataDirectory = config.dataDirectory;

  console.log(`Starting file watcher on: ${dataDirectory}`);

  watcher = chokidar.watch(dataDirectory, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true, // don't emit events for initial files
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  });

  // File created
  watcher.on('add', (filePath) => {
    handleFileEvent('created', filePath);
  });

  // File modified
  watcher.on('change', (filePath) => {
    handleFileEvent('modified', filePath);
  });

  // File deleted
  watcher.on('unlink', (filePath) => {
    handleFileEvent('deleted', filePath);
  });

  // Directory created
  watcher.on('addDir', (dirPath) => {
    handleDirectoryEvent('created', dirPath);
  });

  // Directory deleted
  watcher.on('unlinkDir', (dirPath) => {
    handleDirectoryEvent('deleted', dirPath);
  });

  // Error handling
  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
  });

  // Ready
  watcher.on('ready', () => {
    console.log('File watcher ready');
  });
}

/**
 * Handle file change event with debouncing
 * @param {string} event - Event type (created, modified, deleted)
 * @param {string} filePath - Absolute file path
 */
function handleFileEvent(event, filePath) {
  // Get relative path
  const relativePath = path.relative(config.dataDirectory, filePath);

  // Only process .txt and .md files
  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.txt' && ext !== '.md') {
    return;
  }

  // Debounce rapid changes
  const key = `${event}:${relativePath}`;

  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
  }

  const timer = setTimeout(() => {
    console.log(`File ${event}: ${relativePath}`);

    if (eventEmitter) {
      eventEmitter.emit('file:changed', {
        event,
        path: relativePath,
        type: 'file'
      });
    }

    debounceTimers.delete(key);
  }, DEBOUNCE_DELAY);

  debounceTimers.set(key, timer);
}

/**
 * Handle directory change event
 * @param {string} event - Event type (created, deleted)
 * @param {string} dirPath - Absolute directory path
 */
function handleDirectoryEvent(event, dirPath) {
  const relativePath = path.relative(config.dataDirectory, dirPath);

  console.log(`Directory ${event}: ${relativePath}`);

  if (eventEmitter) {
    eventEmitter.emit('directory:changed', {
      event,
      path: relativePath,
      type: 'directory'
    });
  }
}

/**
 * Stop watching
 */
async function stopWatcher() {
  if (watcher) {
    console.log('Stopping file watcher');

    // Clear all debounce timers
    debounceTimers.forEach(timer => clearTimeout(timer));
    debounceTimers.clear();

    await watcher.close();
    watcher = null;
    eventEmitter = null;
  }
}

/**
 * Check if watcher is running
 * @returns {boolean} True if watcher is running
 */
function isWatching() {
  return watcher !== null;
}

/**
 * Get watched paths
 * @returns {Array} Array of watched paths
 */
function getWatchedPaths() {
  if (!watcher) {
    return [];
  }

  return Object.keys(watcher.getWatched());
}

module.exports = {
  startWatcher,
  stopWatcher,
  isWatching,
  getWatchedPaths
};
