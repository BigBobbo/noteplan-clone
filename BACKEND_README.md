# NotePlan Backend - Setup & Usage Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env to set your preferences
# Default settings should work fine for local development
```

### 3. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start at `http://localhost:3001`

---

## Environment Configuration

Edit `.env` file to customize:

```env
# Where to store your notes
DATA_DIRECTORY=/Users/robertocallaghan/Documents/notes

# Server configuration
PORT=3001
HOST=localhost

# Features
ENABLE_WEBSOCKET=true

# Logging (info, debug, warn, error)
LOG_LEVEL=info
```

---

## Testing the API

### Initialize Folder Structure

```bash
curl -X POST http://localhost:3001/api/folders/init
```

This creates the basic folder structure:
- `Calendar/` - Daily notes
- `Notes/` - All other notes
- `Templates/` - Note templates

### Create a Test Note

```bash
curl -X POST http://localhost:3001/api/files/Notes/test.txt \
  -H "Content-Type: application/json" \
  -d '{"content": "# Test Note\n\n* This is a task\n* [x] This is completed"}'
```

### List All Files

```bash
curl http://localhost:3001/api/files
```

### Get a File

```bash
curl http://localhost:3001/api/files/Notes/test.txt
```

### Create Today's Daily Note

```bash
curl -X POST http://localhost:3001/api/calendar/daily
```

### Check Server Health

```bash
curl http://localhost:3001/health
```

---

## Project Structure

```
src/
├── config/
│   └── config.js              # Configuration loader
├── services/
│   ├── fileService.js         # File CRUD operations
│   ├── watcherService.js      # File system monitoring
│   └── markdownService.js     # Markdown parsing
├── routes/
│   ├── fileRoutes.js          # File API endpoints
│   ├── folderRoutes.js        # Folder API endpoints
│   └── calendarRoutes.js      # Calendar/daily note endpoints
├── middleware/
│   ├── errorHandler.js        # Error handling
│   └── validator.js           # Request validation
├── utils/
│   ├── pathUtils.js           # Path sanitization
│   └── dateUtils.js           # Date formatting
├── websocket/
│   └── socketHandler.js       # WebSocket logic
└── server.js                  # Main entry point
```

---

## Features

### ✅ Implemented (Phase 1)

- **File Operations**
  - Create, read, update, delete notes
  - List files with filtering
  - Folder tree navigation
  - Automatic folder creation

- **Markdown Parsing**
  - Frontmatter extraction (YAML)
  - Task parsing (`* Task`, `* [x] Done`)
  - Time block parsing (`+ 09:00-10:00 Meeting`)
  - Wiki-style links (`[[Note Name]]`)
  - Hashtags and mentions
  - Date references

- **Real-time Updates**
  - WebSocket server for live file changes
  - File system monitoring with chokidar
  - Debounced change events
  - Client subscription system

- **Calendar System**
  - Daily note creation
  - Date-based file naming (YYYYMMDD)
  - Auto-generated daily note templates

- **Security**
  - Path traversal prevention
  - File extension validation (.txt, .md only)
  - File size limits (10MB max)
  - Input sanitization

---

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

---

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, change it in `.env`:

```env
PORT=3002
```

### Data Directory Permissions

Ensure the DATA_DIRECTORY path is writable:

```bash
mkdir -p /Users/robertocallaghan/Documents/notes
chmod 755 /Users/robertocallaghan/Documents/notes
```

### WebSocket Connection Issues

If WebSocket isn't connecting, check:
1. `ENABLE_WEBSOCKET=true` in `.env`
2. Firewall settings allow port 3001
3. Client is connecting to correct URL

### File Watcher Not Working

If file changes aren't detected:
1. Check DATA_DIRECTORY exists and is accessible
2. Ensure files have `.txt` or `.md` extension
3. Check console logs for watcher errors

---

## Development

### Running Tests

```bash
npm test
```

### Debug Mode

Enable detailed logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Adding New Routes

1. Create route file in `src/routes/`
2. Import in `src/server.js`
3. Add to Express app: `app.use('/api/your-route', yourRoute)`

---

## Performance Notes

- File listing is cached and invalidated on changes
- Markdown parsing happens on-demand, not during listing
- File watcher uses debouncing (300ms) to reduce events
- Large files (>10MB) are rejected

---

## Next Steps

- ✅ Phase 1 Complete: Backend API
- ⏳ Phase 2: React Frontend
- ⏳ Phase 3: Calendar UI
- ⏳ Phase 4: Advanced Features

---

## Questions?

- API Reference: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Project Overview: [README.md](./README.md)
- Phase 1 Details: [PHASE-1-PRP.md](./PHASE-1-PRP.md)

---

**Backend Status:** ✅ Complete and Ready

**Last Updated:** October 7, 2025
