# Getting Started - Phase 1 Implementation

## Prerequisites

Before starting, ensure you have:
- [ ] Node.js 18+ installed (or Python 3.9+ if choosing Python)
- [ ] Code editor (VS Code recommended)
- [ ] Git installed
- [ ] Postman or similar API testing tool
- [ ] Basic understanding of REST APIs and WebSockets

---

## Quick Start Commands

### Node.js Setup (Recommended)

```bash
# Navigate to project directory
cd /Users/robertocallaghan/Documents/claude/noteapp

# Create backend directory
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express socket.io chokidar gray-matter markdown-it cors dotenv date-fns

# Install dev dependencies
npm install -D nodemon @types/node typescript @types/express

# Create TypeScript config (if using TypeScript)
npx tsc --init

# Create project structure
mkdir -p src/{config,services,routes,middleware,utils,websocket,tests}
mkdir -p data/{Calendar,Notes,Filters}
mkdir -p data/Notes/{10\ -\ Projects,20\ -\ Areas,30\ -\ Resources,40\ -\ Archive,@Templates}

# Create .env file
touch .env
```

### Python Setup (Alternative)

```bash
# Navigate to project directory
cd /Users/robertocallaghan/Documents/claude/noteapp

# Create backend directory
mkdir backend
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn python-socketio watchdog python-frontmatter markdown python-dotenv

# Create project structure
mkdir -p src/{config,services,routes,middleware,utils,websocket,tests}
mkdir -p data/{Calendar,Notes,Filters}
mkdir -p data/Notes/{10\ -\ Projects,20\ -\ Areas,30\ -\ Resources,40\ -\ Archive,@Templates}

# Create .env file
touch .env
```

---

## Configuration

### Create .env file

```bash
# /Users/robertocallaghan/Documents/claude/noteapp/backend/.env

# Data directory (where markdown files are stored)
DATA_DIRECTORY=/Users/robertocallaghan/Documents/claude/noteapp/backend/data

# Server configuration
PORT=3001
HOST=localhost

# Features
ENABLE_WEBSOCKET=true

# Logging
LOG_LEVEL=info
```

### Create package.json scripts (Node.js)

Edit `package.json` and add:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  }
}
```

---

## Development Checklist

### Phase 1 - Week 1

**Day 1-2: Setup & Config (4 hours)**
- [ ] Set up project structure
- [ ] Create config loader
- [ ] Test environment variable loading
- [ ] Create basic Express server (or FastAPI)
- [ ] Test server runs on port 3001

**Day 3-4: File Service (8 hours)**
- [ ] Implement `listFiles()`
- [ ] Implement `getFile()`
- [ ] Implement `saveFile()`
- [ ] Implement `deleteFile()`
- [ ] Implement `getFolderTree()`
- [ ] Add path validation and security
- [ ] Write unit tests

**Day 5-7: Markdown Service (6 hours)**
- [ ] Integrate gray-matter for frontmatter
- [ ] Build task parser (`* Task`)
- [ ] Build time block parser (`+ HH:MM-HH:MM`)
- [ ] Build wiki-link extractor (`[[Link]]`)
- [ ] Test with sample markdown files
- [ ] Handle edge cases

### Phase 1 - Week 2

**Day 8-9: File Watcher (4 hours)**
- [ ] Set up chokidar (or watchdog)
- [ ] Detect file created/modified/deleted
- [ ] Add debouncing
- [ ] Test with manual file edits

**Day 10-11: API Routes (6 hours)**
- [ ] Create file routes (GET, POST, DELETE)
- [ ] Create folder routes
- [ ] Add validation middleware
- [ ] Add error handling
- [ ] Test all endpoints with Postman

**Day 12-13: WebSocket (4 hours)**
- [ ] Set up socket.io
- [ ] Connect file watcher to WebSocket
- [ ] Broadcast file changes
- [ ] Test with WebSocket client

**Day 14: Testing & Documentation (4 hours)**
- [ ] Run full test suite
- [ ] Test with many files
- [ ] Write API documentation
- [ ] Create Postman collection
- [ ] Document any issues

---

## First Code to Write

### 1. Basic Server (Node.js)

Create `src/server.js`:

```javascript
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
```

Test it:
```bash
npm run dev
# Visit http://localhost:3001/health
```

### 2. Config Loader

Create `src/config/config.js`:

```javascript
const path = require('path')
const fs = require('fs')

const config = {
  dataDirectory: process.env.DATA_DIRECTORY || path.join(__dirname, '../../data'),
  port: parseInt(process.env.PORT || '3001'),
  host: process.env.HOST || 'localhost',
  enableWebSocket: process.env.ENABLE_WEBSOCKET === 'true',
  logLevel: process.env.LOG_LEVEL || 'info'
}

// Validate data directory exists
if (!fs.existsSync(config.dataDirectory)) {
  console.log(`Creating data directory: ${config.dataDirectory}`)
  fs.mkdirSync(config.dataDirectory, { recursive: true })
}

module.exports = config
```

### 3. First API Endpoint

Create `src/routes/fileRoutes.js`:

```javascript
const express = require('express')
const router = express.Router()
const fileService = require('../services/fileService')

// List all files
router.get('/', async (req, res, next) => {
  try {
    const { folder } = req.query
    const files = await fileService.listFiles(folder)
    res.json({ files })
  } catch (error) {
    next(error)
  }
})

// Get single file
router.get('/:path(*)', async (req, res, next) => {
  try {
    const { path } = req.params
    const file = await fileService.getFile(path)
    res.json(file)
  } catch (error) {
    next(error)
  }
})

module.exports = router
```

---

## Testing Strategy

### Test with Postman

**Collection setup:**

1. **Health Check**
   - GET `http://localhost:3001/health`
   - Should return: `{ status: 'ok', timestamp: '...' }`

2. **List Files**
   - GET `http://localhost:3001/api/files`
   - Should return: `{ files: [...] }`

3. **Create File**
   - POST `http://localhost:3001/api/files/Notes/test.txt`
   - Body: `{ "content": "# Test Note\n* Task 1" }`
   - Should return: `{ success: true, path: 'Notes/test.txt' }`

4. **Get File**
   - GET `http://localhost:3001/api/files/Notes/test.txt`
   - Should return file content and metadata

5. **Delete File**
   - DELETE `http://localhost:3001/api/files/Notes/test.txt`
   - Should return: `{ success: true }`

### Test with Sample Data

Create test file:
```bash
echo "# Test Daily Note

## To Do
* Task 1
* [x] Completed task

## Timeblocking
+ 09:00-11:00 Deep work
+ 14:00-15:00 Meeting

## Notes
Testing [[Other Note]] linking." > data/Calendar/20251007.txt
```

Then test that your API can:
- Read this file
- Parse the tasks
- Parse the time blocks
- Extract the wiki link

---

## Common Issues & Solutions

### Issue: Port already in use
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

### Issue: Permission denied on data directory
```bash
# Fix permissions
chmod -R 755 data/
```

### Issue: Module not found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: File watcher not triggering
- Check file watcher is started
- Try editing file and wait 1 second (debounce)
- Check console for watcher events

---

## Validation Checklist

Before moving to Phase 2, verify:

- [ ] Server starts without errors
- [ ] Can create files via API
- [ ] Can read files via API
- [ ] Can update files via API
- [ ] Can delete files via API
- [ ] Can list all files
- [ ] Can get folder tree
- [ ] File watcher detects changes
- [ ] WebSocket broadcasts changes
- [ ] Markdown parsing works (tasks, time blocks, links)
- [ ] All paths are validated (no `../` attacks)
- [ ] Error handling returns proper status codes
- [ ] Postman collection tests all pass

---

## Next Phase

Once Phase 1 is complete and tested:

1. Review Phase 2 PRP
2. Set up React frontend project
3. Connect to Phase 1 API
4. Build UI components

---

## Getting Help

### Resources
- **Express docs:** https://expressjs.com/
- **Socket.io docs:** https://socket.io/
- **Markdown-it docs:** https://github.com/markdown-it/markdown-it
- **Chokidar docs:** https://github.com/paulmillr/chokidar

### Debugging Tips
1. Use `console.log()` liberally
2. Check browser Network tab for API calls
3. Use Postman to isolate backend issues
4. Check file permissions
5. Verify environment variables are loaded

### Common Commands
```bash
# View logs
npm run dev

# Test single endpoint
curl http://localhost:3001/health

# Check file contents
cat data/Calendar/20251007.txt

# List all files
ls -R data/

# Watch for file changes
watch -n 1 "ls -l data/Calendar"
```

---

## Progress Tracking

Create a simple checklist in your daily note:

```markdown
## NotePlan Clone - Phase 1 Progress

### Week 1
* [x] Project setup
* [x] Config system
* [ ] File service
* [ ] Markdown parser

### Week 2
* [ ] File watcher
* [ ] API routes
* [ ] WebSocket
* [ ] Testing
```

---

*Good luck! Start with setting up the project structure and getting a basic server running. Then tackle each service one at a time.*

*Remember: Start simple, test often, and iterate.*
