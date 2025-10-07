const express = require('express');
const http = require('http');
const cors = require('cors');
const { EventEmitter } = require('events');

// Configuration
const config = require('./config/config');

// Services
const watcherService = require('./services/watcherService');

// WebSocket
const socketHandler = require('./websocket/socketHandler');

// Routes
const fileRoutes = require('./routes/fileRoutes');
const folderRoutes = require('./routes/folderRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

// Middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

/**
 * NotePlan Backend Server
 * Main entry point for the application
 */

// Create Express app
const app = express();
const server = http.createServer(app);

// Create event emitter for file system events
const fileEventEmitter = new EventEmitter();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    config: {
      dataDirectory: config.dataDirectory,
      port: config.port,
      webSocketEnabled: config.enableWebSocket
    }
  });
});

// API Routes
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/calendar', calendarRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'NotePlan Backend API',
    version: '1.0.0',
    description: 'A self-hosted note-taking application inspired by NotePlan',
    endpoints: {
      health: '/health',
      files: '/api/files',
      folders: '/api/folders',
      calendar: '/api/calendar'
    },
    documentation: 'See README.md for API documentation'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize WebSocket
if (config.enableWebSocket) {
  socketHandler.initializeSocket(server, fileEventEmitter);
}

// Start file watcher
watcherService.startWatcher(fileEventEmitter);

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

async function shutdown() {
  console.log('\nShutting down gracefully...');

  // Stop file watcher
  await watcherService.stopWatcher();

  // Close WebSocket server
  socketHandler.closeSocket();

  // Close HTTP server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Start server
const PORT = config.port;
const HOST = config.host;

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('=================================');
  console.log('  NotePlan Backend Server');
  console.log('=================================');
  config.log();
  console.log('=================================');
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`API docs: http://${HOST}:${PORT}/`);
  console.log('=================================');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

module.exports = { app, server };
