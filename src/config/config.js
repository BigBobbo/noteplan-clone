const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

/**
 * Configuration loader for the application
 * Loads from environment variables with validation and defaults
 */
class Config {
  constructor() {
    this.dataDirectory = process.env.DATA_DIRECTORY || path.join(process.env.HOME, 'Documents', 'notes');
    this.port = parseInt(process.env.PORT) || 3001;
    this.host = process.env.HOST || 'localhost';
    this.enableWebSocket = process.env.ENABLE_WEBSOCKET === 'true';
    this.logLevel = process.env.LOG_LEVEL || 'info';

    this.validate();
    this.ensureDataDirectory();
  }

  /**
   * Validate configuration values
   */
  validate() {
    if (!this.port || this.port < 1 || this.port > 65535) {
      throw new Error(`Invalid port: ${this.port}`);
    }

    if (!this.dataDirectory) {
      throw new Error('DATA_DIRECTORY is required');
    }

    const validLogLevels = ['error', 'warn', 'info', 'debug'];
    if (!validLogLevels.includes(this.logLevel)) {
      throw new Error(`Invalid log level: ${this.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
    }
  }

  /**
   * Ensure data directory exists, create if it doesn't
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDirectory)) {
      console.log(`Creating data directory: ${this.dataDirectory}`);
      fs.mkdirSync(this.dataDirectory, { recursive: true });
    }
  }

  /**
   * Get all config values
   */
  getAll() {
    return {
      dataDirectory: this.dataDirectory,
      port: this.port,
      host: this.host,
      enableWebSocket: this.enableWebSocket,
      logLevel: this.logLevel
    };
  }

  /**
   * Log configuration (without sensitive data)
   */
  log() {
    console.log('Configuration loaded:');
    console.log(`  Data Directory: ${this.dataDirectory}`);
    console.log(`  Server: ${this.host}:${this.port}`);
    console.log(`  WebSocket: ${this.enableWebSocket ? 'enabled' : 'disabled'}`);
    console.log(`  Log Level: ${this.logLevel}`);
  }
}

// Export singleton instance
module.exports = new Config();
