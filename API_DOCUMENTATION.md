# NotePlan Backend API Documentation

## Overview

The NotePlan Backend API provides RESTful endpoints for managing markdown notes, folders, and calendar entries. It also includes WebSocket support for real-time file system change notifications.

**Base URL:** `http://localhost:3001`

**Version:** 1.0.0

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [File Endpoints](#file-endpoints)
4. [Folder Endpoints](#folder-endpoints)
5. [Calendar Endpoints](#calendar-endpoints)
6. [WebSocket Events](#websocket-events)
7. [Error Responses](#error-responses)

---

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env to set your data directory

# Start development server
npm run dev

# Start production server
npm start
```

### Configuration

Edit `.env` file:

```env
DATA_DIRECTORY=/path/to/your/notes
PORT=3001
HOST=localhost
ENABLE_WEBSOCKET=true
LOG_LEVEL=info
```

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-07T10:00:00.000Z",
  "uptime": 123.456,
  "config": {
    "dataDirectory": "/Users/username/Documents/notes",
    "port": 3001,
    "webSocketEnabled": true
  }
}
```

---

## Authentication

Currently, the API does not require authentication. This is suitable for local, self-hosted deployments. For production use, consider adding authentication middleware.

---

## File Endpoints

### List All Files

List all files in the data directory.

**Endpoint:** `GET /api/files`

**Query Parameters:**
- `folder` (optional) - Filter by folder path (e.g., `Notes`, `Calendar`)
- `search` (optional) - Search files by name or path

**Example Request:**
```bash
curl http://localhost:3001/api/files?folder=Notes
```

**Example Response:**
```json
{
  "files": [
    {
      "path": "Notes/test.txt",
      "name": "test.txt",
      "folder": "Notes",
      "modified": "2025-10-07T10:00:00.000Z",
      "created": "2025-10-07T09:00:00.000Z",
      "size": 1024,
      "type": "note"
    }
  ],
  "count": 1
}
```

---

### Get File Content

Get the content and metadata of a specific file.

**Endpoint:** `GET /api/files/{path}`

**Path Parameters:**
- `path` - Relative path to the file (e.g., `Notes/test.txt`)

**Example Request:**
```bash
curl http://localhost:3001/api/files/Notes/test.txt
```

**Example Response:**
```json
{
  "content": "# Test Note\n\n* Task 1\n* [x] Completed task",
  "metadata": {
    "path": "Notes/test.txt",
    "name": "test.txt",
    "folder": "Notes",
    "modified": "2025-10-07T10:00:00.000Z",
    "created": "2025-10-07T09:00:00.000Z",
    "size": 1024,
    "type": "note"
  },
  "parsed": {
    "frontmatter": {},
    "body": "# Test Note\n\n* Task 1\n* [x] Completed task",
    "tasks": [
      {
        "text": "Task 1",
        "completed": false,
        "scheduled": false,
        "canceled": false,
        "line": 3
      },
      {
        "text": "Completed task",
        "completed": true,
        "scheduled": false,
        "canceled": false,
        "line": 4
      }
    ],
    "timeBlocks": [],
    "links": [],
    "tags": [],
    "mentions": [],
    "dateReferences": []
  }
}
```

---

### Create or Update File

Create a new file or update an existing file.

**Endpoint:** `POST /api/files/{path}`

**Path Parameters:**
- `path` - Relative path for the file (e.g., `Notes/new-note.txt`)

**Request Body:**
```json
{
  "content": "# My Note\n\nThis is the content."
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/files/Notes/test.txt \
  -H "Content-Type: application/json" \
  -d '{"content": "# Test Note\n\n* Task 1"}'
```

**Example Response:**
```json
{
  "success": true,
  "path": "Notes/test.txt"
}
```

---

### Delete File

Delete a file.

**Endpoint:** `DELETE /api/files/{path}`

**Path Parameters:**
- `path` - Relative path to the file

**Example Request:**
```bash
curl -X DELETE http://localhost:3001/api/files/Notes/old-note.txt
```

**Example Response:**
```json
{
  "success": true
}
```

---

## Folder Endpoints

### Get Folder Tree

Get the complete folder tree structure.

**Endpoint:** `GET /api/folders`

**Example Request:**
```bash
curl http://localhost:3001/api/folders
```

**Example Response:**
```json
{
  "tree": {
    "name": "root",
    "type": "folder",
    "path": "",
    "children": [
      {
        "name": "Calendar",
        "type": "folder",
        "path": "Calendar",
        "children": []
      },
      {
        "name": "Notes",
        "type": "folder",
        "path": "Notes",
        "children": [
          {
            "name": "10 - Projects",
            "type": "folder",
            "path": "Notes/10 - Projects",
            "children": []
          }
        ]
      }
    ]
  }
}
```

---

### Initialize Folder Structure

Initialize the NotePlan folder structure (Calendar, Notes, Templates).

**Endpoint:** `POST /api/folders/init`

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/folders/init
```

**Example Response:**
```json
{
  "success": true,
  "created": ["Calendar", "Notes", "Templates"]
}
```

---

## Calendar Endpoints

### Get Daily Note by Date

Get or create a daily note for a specific date.

**Endpoint:** `GET /api/calendar/daily/:date`

**Path Parameters:**
- `date` - Date in YYYYMMDD format (e.g., `20251007`)

**Example Request:**
```bash
curl http://localhost:3001/api/calendar/daily/20251007
```

**Example Response (existing file):**
```json
{
  "content": "# Monday, October 7, 2025\n\n## Tasks\n\n## Notes\n\n",
  "metadata": {
    "path": "Calendar/20251007.txt",
    "name": "20251007.txt",
    "folder": "Calendar",
    "modified": "2025-10-07T10:00:00.000Z",
    "created": "2025-10-07T09:00:00.000Z",
    "size": 512,
    "type": "daily"
  },
  "created": false
}
```

**Example Response (new file):**
```json
{
  "content": "# Monday, October 7, 2025\n\n## Tasks\n\n## Notes\n\n",
  "metadata": {
    "path": "Calendar/20251007.txt",
    "name": "20251007.txt",
    "folder": "Calendar",
    "modified": "2025-10-07T10:00:00.000Z",
    "created": "2025-10-07T10:00:00.000Z",
    "size": 512,
    "type": "daily"
  },
  "created": true
}
```

---

### Create Today's Daily Note

Create a daily note for today.

**Endpoint:** `POST /api/calendar/daily`

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/calendar/daily
```

**Example Response:**
```json
{
  "content": "# Monday, October 7, 2025\n\n## Tasks\n\n## Notes\n\n",
  "metadata": {
    "path": "Calendar/20251007.txt",
    "name": "20251007.txt",
    "folder": "Calendar",
    "modified": "2025-10-07T10:00:00.000Z",
    "created": "2025-10-07T10:00:00.000Z",
    "size": 512,
    "type": "daily"
  },
  "created": true
}
```

---

## WebSocket Events

Connect to WebSocket server at `ws://localhost:3001`

### Client Events

#### Connect

Emitted when client connects successfully.

**Event:** `connected`

**Payload:**
```json
{
  "message": "Connected to NotePlan server",
  "timestamp": "2025-10-07T10:00:00.000Z"
}
```

#### Subscribe to Paths

Subscribe to changes for specific file paths.

**Event:** `subscribe`

**Payload:**
```json
{
  "paths": ["Notes/test.txt", "Calendar/20251007.txt"]
}
```

**Response:**
```json
{
  "paths": ["Notes/test.txt", "Calendar/20251007.txt"]
}
```

#### Ping

Send ping for keep-alive.

**Event:** `ping`

**Response:** `pong`
```json
{
  "timestamp": "2025-10-07T10:00:00.000Z"
}
```

---

### Server Events

#### File Changed

Emitted when a file is created, modified, or deleted.

**Event:** `file:changed`

**Payload:**
```json
{
  "event": "modified",
  "path": "Notes/test.txt",
  "type": "file",
  "timestamp": "2025-10-07T10:00:00.000Z"
}
```

Event types: `created`, `modified`, `deleted`

#### Directory Changed

Emitted when a directory is created or deleted.

**Event:** `directory:changed`

**Payload:**
```json
{
  "event": "created",
  "path": "Notes/10 - Projects",
  "type": "directory",
  "timestamp": "2025-10-07T10:00:00.000Z"
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "path": "optional/file/path"
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `NOT_FOUND` | 404 | File or resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request parameters or body |
| `SECURITY_ERROR` | 403 | Security violation (e.g., path traversal) |
| `FILE_SYSTEM_ERROR` | 500 | File system operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `ROUTE_NOT_FOUND` | 404 | API endpoint not found |

### Example Error Response

```json
{
  "error": {
    "message": "File not found: Notes/missing.txt",
    "code": "NOT_FOUND",
    "path": "Notes/missing.txt"
  }
}
```

---

## Rate Limiting

Currently, there is no rate limiting. For production deployments, consider adding rate limiting middleware.

---

## CORS

CORS is enabled for all origins in development. For production, configure allowed origins in `src/server.js`.

---

## File Constraints

- **Maximum file size:** 10 MB
- **Allowed extensions:** `.txt`, `.md`
- **Path restrictions:** No path traversal (`..`), no absolute paths
- **Debounce delay:** 300ms for file system events

---

## Development

### Run Tests

```bash
npm test
```

### Run with Auto-Reload

```bash
npm run dev
```

### Debug Mode

Set `LOG_LEVEL=debug` in `.env` to see detailed logs.

---

## Example Client Code

### JavaScript/Node.js

```javascript
const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:3001';

// List files
async function listFiles() {
  const response = await axios.get(`${API_BASE}/api/files`);
  console.log(response.data);
}

// Create file
async function createFile(path, content) {
  const response = await axios.post(`${API_BASE}/api/files/${path}`, {
    content
  });
  console.log(response.data);
}

// WebSocket connection
const socket = io(API_BASE);

socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.on('file:changed', (data) => {
  console.log('File changed:', data);
});
```

### cURL Examples

See individual endpoint sections above for cURL examples.

---

## Support

For issues or questions, please refer to the main README.md and project documentation.

---

**Last Updated:** October 7, 2025

**API Version:** 1.0.0
