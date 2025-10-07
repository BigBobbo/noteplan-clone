const { Server } = require('socket.io');
const config = require('../config/config');

/**
 * WebSocket Handler
 * Manages real-time communication with clients
 */

let io = null;

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 * @param {EventEmitter} fileEventEmitter - Event emitter from watcher service
 * @returns {Server} Socket.io server instance
 */
function initializeSocket(server, fileEventEmitter) {
  if (!config.enableWebSocket) {
    console.log('WebSocket disabled in configuration');
    return null;
  }

  console.log('Initializing WebSocket server');

  io = new Server(server, {
    cors: {
      origin: '*', // In production, configure this properly
      methods: ['GET', 'POST']
    }
  });

  // Handle client connections
  io.on('connection', (socket) => {
    handleConnection(socket);
  });

  // Listen to file change events from watcher
  if (fileEventEmitter) {
    fileEventEmitter.on('file:changed', (data) => {
      broadcastFileChange(data);
    });

    fileEventEmitter.on('directory:changed', (data) => {
      broadcastDirectoryChange(data);
    });
  }

  console.log('WebSocket server initialized');

  return io;
}

/**
 * Handle client connections
 * @param {Socket} socket - Client socket
 */
function handleConnection(socket) {
  console.log(`Client connected: ${socket.id}`);

  // Send welcome message
  socket.emit('connected', {
    message: 'Connected to NotePlan server',
    timestamp: new Date().toISOString()
  });

  // Handle client subscription to specific paths
  socket.on('subscribe', (data) => {
    if (data && data.paths && Array.isArray(data.paths)) {
      data.paths.forEach(path => {
        socket.join(`path:${path}`);
        console.log(`Client ${socket.id} subscribed to ${path}`);
      });

      socket.emit('subscribed', {
        paths: data.paths
      });
    }
  });

  // Handle client unsubscription
  socket.on('unsubscribe', (data) => {
    if (data && data.paths && Array.isArray(data.paths)) {
      data.paths.forEach(path => {
        socket.leave(`path:${path}`);
        console.log(`Client ${socket.id} unsubscribed from ${path}`);
      });

      socket.emit('unsubscribed', {
        paths: data.paths
      });
    }
  });

  // Handle ping for keep-alive
  socket.on('ping', () => {
    socket.emit('pong', {
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
}

/**
 * Broadcast file change to all connected clients
 * @param {Object} data - File change data
 * @param {string} data.event - Event type (created, modified, deleted)
 * @param {string} data.path - File path
 * @param {string} data.type - Type (file or directory)
 */
function broadcastFileChange(data) {
  if (!io) {
    return;
  }

  const { event, path, type } = data;

  console.log(`Broadcasting file change: ${event} ${path}`);

  // Broadcast to all clients
  io.emit('file:changed', {
    event,
    path,
    type,
    timestamp: new Date().toISOString()
  });

  // Also broadcast to subscribers of this specific path
  io.to(`path:${path}`).emit('file:changed', {
    event,
    path,
    type,
    timestamp: new Date().toISOString()
  });
}

/**
 * Broadcast directory change to all connected clients
 * @param {Object} data - Directory change data
 */
function broadcastDirectoryChange(data) {
  if (!io) {
    return;
  }

  const { event, path, type } = data;

  console.log(`Broadcasting directory change: ${event} ${path}`);

  io.emit('directory:changed', {
    event,
    path,
    type,
    timestamp: new Date().toISOString()
  });
}

/**
 * Broadcast custom message to all clients
 * @param {string} eventName - Event name
 * @param {Object} data - Event data
 */
function broadcast(eventName, data) {
  if (!io) {
    return;
  }

  io.emit(eventName, {
    ...data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get number of connected clients
 * @returns {number} Number of connected clients
 */
function getConnectedClients() {
  if (!io) {
    return 0;
  }

  return io.engine.clientsCount;
}

/**
 * Close WebSocket server
 */
function closeSocket() {
  if (io) {
    console.log('Closing WebSocket server');
    io.close();
    io = null;
  }
}

module.exports = {
  initializeSocket,
  broadcastFileChange,
  broadcastDirectoryChange,
  broadcast,
  getConnectedClients,
  closeSocket
};
