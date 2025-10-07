# Phase 1: Core Foundation & Markdown Engine - Product Requirements & Planning

## Overview

Phase 1 establishes the foundational backend infrastructure for the NotePlan clone. This phase focuses on reliable file system operations, markdown parsing, and API design that will support all future phases.

**Goal:** Create a robust backend that can read, write, monitor, and serve markdown files through a RESTful API.

---

## Success Criteria

- ✅ Backend server runs on localhost
- ✅ Can perform CRUD operations on markdown files via API
- ✅ File system changes are detected and broadcast via WebSocket
- ✅ Markdown files are parsed with frontmatter, tasks, and links extracted
- ✅ Folder structure matches NotePlan's convention
- ✅ Basic error handling and validation in place
- ✅ Postman/curl tests pass for all endpoints

---

## Technical Specifications

### Technology Choice

**Recommended: Node.js + Express**

*Reasoning:*
- Fast development with JavaScript/TypeScript
- Excellent file system APIs
- Rich markdown ecosystem
- WebSocket support via socket.io
- Easy React integration in Phase 2

**Alternative: Python + FastAPI**
- Better for AI/ML features later
- Excellent async support
- Strong typing with Pydantic

### Core Dependencies (Node.js version)

```json
{
  "express": "^4.18.0",
  "socket.io": "^4.6.0",
  "chokidar": "^3.5.3",
  "gray-matter": "^4.0.3",
  "markdown-it": "^13.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.0",
  "date-fns": "^2.30.0"
}
```

---

## Architecture

### Directory Structure

```
noteplan-backend/
├── src/
│   ├── config/
│   │   └── config.js              # Configuration loader
│   ├── services/
│   │   ├── fileService.js         # File CRUD operations
│   │   ├── watcherService.js      # File system monitoring
│   │   ├── markdownService.js     # Markdown parsing
│   │   └── searchService.js       # Search indexing (basic)
│   ├── routes/
│   │   ├── fileRoutes.js          # File API endpoints
│   │   └── folderRoutes.js        # Folder API endpoints
│   ├── middleware/
│   │   ├── errorHandler.js        # Error handling
│   │   └── validator.js           # Request validation
│   ├── utils/
│   │   ├── pathUtils.js           # Path sanitization
│   │   └── dateUtils.js           # Date formatting
│   ├── websocket/
│   │   └── socketHandler.js       # WebSocket logic
│   └── server.js                  # Main entry point
├── tests/
│   ├── fileService.test.js
│   └── markdownService.test.js
├── .env.example
├── package.json
└── README.md
```

---

## Detailed Requirements

### 1. Configuration System

**Config File:** `.env`
```env
DATA_DIRECTORY=/Users/robertocallaghan/Documents/notes
PORT=3001
HOST=localhost
ENABLE_WEBSOCKET=true
LOG_LEVEL=info
```

**Config Loader Features:**
- Load from environment variables
- Validate data directory exists (or create it)
- Default values for missing config
- Expose config object to app

### 2. File Service

**Core Functions:**

```javascript
// fileService.js

/**
 * Get list of all files in data directory
 * @param {string} folder - Optional folder filter (e.g., 'Notes', 'Calendar')
 * @returns {Array} Array of file objects with metadata
 */
async listFiles(folder = null)

/**
 * Get file content and metadata
 * @param {string} relativePath - Path relative to data directory
 * @returns {Object} { content, metadata, parsed }
 */
async getFile(relativePath)

/**
 * Create or update a file
 * @param {string} relativePath - Path relative to data directory
 * @param {string} content - File content
 * @returns {Object} { success, path }
 */
async saveFile(relativePath, content)

/**
 * Delete a file
 * @param {string} relativePath - Path relative to data directory
 * @returns {Object} { success }
 */
async deleteFile(relativePath)

/**
 * Get folder tree structure
 * @returns {Object} Nested folder structure
 */
async getFolderTree()

/**
 * Initialize NotePlan folder structure if not exists
 */
async initializeFolders()
```

**Security Features:**
- Path traversal prevention (reject `../` in paths)
- Restrict to configured data directory
- Validate file extensions (.txt, .md only)

### 3. Markdown Service

**Parsing Capabilities:**

```javascript
// markdownService.js

/**
 * Parse markdown file into structured data
 * @param {string} content - Raw markdown content
 * @returns {Object} Parsed structure
 */
function parseMarkdown(content) {
  return {
    frontmatter: {},      // YAML frontmatter
    body: "",             // Main content
    tasks: [],            // Parsed tasks
    timeBlocks: [],       // Parsed time blocks
    links: [],            // Wiki-style links
    tags: [],             // #hashtags
    mentions: []          // @mentions
  }
}

/**
 * Extract tasks from markdown
 * Format: * Task name, * [x] Done task
 */
function extractTasks(content)

/**
 * Extract time blocks from markdown
 * Format: + HH:MM-HH:MM Description
 */
function extractTimeBlocks(content)

/**
 * Extract wiki-style links
 * Format: [[Note Name]], [[Note|Alias]]
 */
function extractLinks(content)

/**
 * Convert markdown to HTML
 */
function markdownToHtml(content)
```

**Regex Patterns:**
```javascript
const PATTERNS = {
  task: /^\* (\[[ xX>\-]\] )?(.+)$/gm,
  timeBlock: /^\+ (\d{2}:\d{2})-(\d{2}:\d{2}) (.+)$/gm,
  wikiLink: /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g,
  tag: /#([a-zA-Z0-9_-]+)/g,
  mention: /@([a-zA-Z0-9_-]+)/g,
  dateReference: />(\d{4}-\d{2}-\d{2})/g
}
```

### 4. Watcher Service

**File System Monitoring:**

```javascript
// watcherService.js

/**
 * Start watching data directory for changes
 * Emits events: 'file:created', 'file:modified', 'file:deleted'
 */
function startWatcher(dataDirectory, eventEmitter)

/**
 * Stop watching
 */
function stopWatcher()
```

**Events to Monitor:**
- File created
- File modified
- File deleted
- File renamed

**Debouncing:**
- Debounce rapid changes (e.g., during save) to 300ms

### 5. WebSocket Handler

**Real-time Communication:**

```javascript
// socketHandler.js

/**
 * Initialize WebSocket server
 */
function initializeSocket(server)

/**
 * Broadcast file change to all connected clients
 * @param {string} event - 'created', 'modified', 'deleted'
 * @param {string} path - File path
 */
function broadcastFileChange(event, path, content)

/**
 * Handle client connections
 */
function handleConnection(socket)
```

**Socket Events:**
```javascript
// Server emits
socket.emit('file:changed', { event, path, content })

// Client can emit (future)
socket.on('subscribe', (paths) => { ... })
```

### 6. API Routes

**File Routes:**

```
GET /api/files
  - List all files
  - Query params: ?folder=Notes&search=query
  - Returns: [{ path, name, folder, modified, size }]

GET /api/files/:path
  - Get file content and metadata
  - Params: path (URL encoded)
  - Returns: { content, metadata, parsed }

POST /api/files/:path
  - Create or update file
  - Body: { content }
  - Returns: { success, path }

DELETE /api/files/:path
  - Delete file
  - Returns: { success }

GET /api/folders
  - Get folder tree
  - Returns: { tree: {...} }

POST /api/folders/init
  - Initialize NotePlan folder structure
  - Returns: { success, created: [] }
```

**Date/Calendar Routes:**

```
GET /api/calendar/daily/:date
  - Get or create daily note
  - Params: date (YYYYMMDD)
  - Returns: { path, content, created }

POST /api/calendar/daily
  - Create daily note for today
  - Returns: { path, content }
```

---

## Implementation Steps

### Step 1: Project Setup (2 hours)
1. Initialize npm project
2. Install dependencies
3. Create directory structure
4. Set up ESLint/Prettier
5. Create .env.example

### Step 2: Configuration System (2 hours)
1. Create config loader
2. Validate environment variables
3. Add defaults
4. Test config loading

### Step 3: File Service (8 hours)
1. Implement path utilities
2. Build CRUD functions
3. Add folder tree generation
4. Implement security checks
5. Create initialization logic
6. Write unit tests

### Step 4: Markdown Service (6 hours)
1. Integrate gray-matter for frontmatter
2. Build task parser
3. Build time block parser
4. Build link extractor
5. Integrate markdown-it
6. Write unit tests

### Step 5: Watcher Service (4 hours)
1. Set up chokidar
2. Configure events
3. Add debouncing
4. Test with manual file changes

### Step 6: API Routes (6 hours)
1. Create Express router
2. Implement file routes
3. Implement folder routes
4. Add validation middleware
5. Add error handling
6. Test with Postman

### Step 7: WebSocket Integration (4 hours)
1. Set up socket.io
2. Connect watcher to socket
3. Implement broadcast logic
4. Test with WebSocket client

### Step 8: Integration Testing (4 hours)
1. Test full file lifecycle
2. Test watcher events
3. Test WebSocket broadcasts
4. Load test with many files

**Total Estimated Time: 36 hours (~2 weeks part-time)**

---

## Testing Strategy

### Unit Tests
- File path validation
- Markdown parsing accuracy
- Configuration loading
- Date utility functions

### Integration Tests
- Create → Read → Update → Delete flow
- Watcher detects external changes
- WebSocket receives broadcasts
- Folder initialization

### Manual Tests
```bash
# Test file creation
curl -X POST http://localhost:3001/api/files/Notes/test.txt \
  -H "Content-Type: application/json" \
  -d '{"content": "# Test Note\n* Task 1"}'

# Test file retrieval
curl http://localhost:3001/api/files/Notes/test.txt

# Test file listing
curl http://localhost:3001/api/files?folder=Notes

# Test folder tree
curl http://localhost:3001/api/folders
```

---

## Data Structures

### File Metadata Object
```javascript
{
  path: "Notes/10 - Projects/Project.txt",
  name: "Project.txt",
  folder: "Notes/10 - Projects",
  modified: "2025-10-07T10:30:00Z",
  created: "2025-10-01T09:00:00Z",
  size: 1024,
  type: "note" // or "daily", "template"
}
```

### Parsed Markdown Object
```javascript
{
  frontmatter: {
    title: "My Note",
    type: "empty-note",
    tags: ["project", "important"]
  },
  body: "Main content here...",
  tasks: [
    {
      text: "Task description",
      completed: false,
      scheduled: false,
      line: 10
    }
  ],
  timeBlocks: [
    {
      start: "09:00",
      end: "10:00",
      description: "Meeting",
      line: 5
    }
  ],
  links: [
    {
      target: "Other Note",
      alias: null,
      line: 15
    }
  ],
  tags: ["#productivity", "#work"],
  mentions: ["@john", "@sarah"]
}
```

### Folder Tree Object
```javascript
{
  name: "root",
  children: [
    {
      name: "Calendar",
      type: "folder",
      path: "Calendar",
      children: []
    },
    {
      name: "Notes",
      type: "folder",
      path: "Notes",
      children: [
        {
          name: "10 - Projects",
          type: "folder",
          path: "Notes/10 - Projects",
          children: [...]
        }
      ]
    }
  ]
}
```

---

## Error Handling

### Error Types
```javascript
class NotFoundError extends Error {
  constructor(path) {
    super(`File not found: ${path}`)
    this.statusCode = 404
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.statusCode = 400
  }
}

class SecurityError extends Error {
  constructor(message) {
    super(message)
    this.statusCode = 403
  }
}
```

### Error Response Format
```json
{
  "error": {
    "message": "File not found",
    "code": "NOT_FOUND",
    "path": "Notes/missing.txt"
  }
}
```

---

## Performance Considerations

1. **File Listing:** Cache file list, invalidate on changes
2. **Parsing:** Parse on-demand, not on list
3. **Watcher:** Debounce rapid changes
4. **Large Files:** Stream large files instead of loading to memory
5. **Search:** Build simple index (file paths and titles only for Phase 1)

---

## Security Checklist

- [ ] Path traversal prevention
- [ ] File extension validation
- [ ] Data directory restriction
- [ ] CORS configured for localhost
- [ ] Input sanitization
- [ ] Error messages don't leak system paths
- [ ] File size limits (e.g., 10MB max)

---

## Phase 1 Deliverables

### Code
- [x] Working Node.js backend server
- [x] All API endpoints implemented
- [x] WebSocket server functional
- [x] Unit tests passing

### Documentation
- [x] API documentation (Postman collection or OpenAPI spec)
- [x] Setup instructions (README.md)
- [x] Environment variable documentation

### Demo
- [x] Postman collection showing all endpoints
- [x] WebSocket client demo (simple HTML page)
- [x] Sample data directory with notes

---

## Transition to Phase 2

Once Phase 1 is complete, you'll have:
- A fully functional backend API
- Real-time file synchronization
- Markdown parsing infrastructure

Phase 2 will consume these APIs to build the React frontend, focusing purely on UI/UX without worrying about backend logic.

---

## Questions for Clarification

1. **Data Directory:** Should we use your existing NotePlan directory or create a separate one?
   - Existing: `/Users/robertocallaghan/Library/Containers/co.noteplan.NotePlan3/Data/Library/Application Support/co.noteplan.NotePlan3`
   - New: `/Users/robertocallaghan/Documents/notes`

2. **Port:** Is port 3001 acceptable? (3000 often used by React dev server)

3. **Language Preference:** Node.js or Python?

4. **Testing Framework:** Jest (Node) or Pytest (Python)?

---

*Phase 1 PRP Version: 1.0*
*Estimated Completion: 2-3 weeks*
*Dependencies: None*
