# NotePlan Self-Hosted Clone - Master Product Requirements & Planning Document

## Executive Summary

This document outlines the plan to build a self-hosted web application that replicates core NotePlan functionality with local markdown file storage. The project is broken down into **4 major phases** to ensure manageable development and iterative delivery.

## Product Analysis

### NotePlan Core Features (from analysis)

**Daily/Calendar System:**
- Daily notes with date-based naming (YYYYMMDD.txt)
- Weekly, monthly, yearly note generation
- Time blocking with timeline view
- Calendar integration

**Note Management:**
- Markdown-based storage
- Folder-based organization (Projects, Areas, Resources, Archive)
- Bi-directional linking [[Note Name]]
- Templates system
- Rich markdown editor

**Task Management:**
- Todo items with `* ` prefix
- Scheduled tasks with `+ HH:MM-HH:MM` format
- Task filters and views
- Task completion tracking

**User Interface:**
- Three-pane layout: Sidebar, Note List, Editor
- Timeline/calendar view
- Command bar for quick actions
- Search and navigation

### Your Priority Features

1. **Local markdown storage** - Files stored locally in accessible format
2. **Web app interface** - Browser-based application matching NotePlan's layout
3. **Core functionality** - Daily notes, tasks, time blocking, note linking

## Recommended Approach: 4-Phase Development

Given the complexity, I recommend **breaking this into 4 separate but connected projects**, each with its own PRP:

### Phase 1: Core Foundation & Markdown Engine
**Estimated Time:** 2-3 weeks
**Dependencies:** None
**Focus:** Backend infrastructure and markdown file management

### Phase 2: Web UI & Editor
**Estimated Time:** 3-4 weeks
**Dependencies:** Phase 1
**Focus:** React frontend with markdown editor

### Phase 3: Calendar & Daily Notes
**Estimated Time:** 2-3 weeks
**Dependencies:** Phase 1 & 2
**Focus:** Calendar system and daily note automation

### Phase 4: Advanced Features
**Estimated Time:** 3-4 weeks
**Dependencies:** All previous
**Focus:** Task management, linking, search, templates

---

## Technology Stack Recommendation

### Backend
- **Node.js + Express** or **FastAPI (Python)**
- File system monitoring (chokidar for Node, watchdog for Python)
- WebSocket for real-time sync

### Frontend
- **React** with TypeScript
- **TipTap** or **CodeMirror** for markdown editing
- **React Router** for navigation
- **Tailwind CSS** for styling (matches NotePlan's modern aesthetic)

### Storage
- Local filesystem (markdown .txt/.md files)
- JSON metadata files for indexing
- SQLite for search index (optional optimization)

### Additional Tools
- **markdown-it** or **remark** for parsing
- **gray-matter** for frontmatter parsing
- **date-fns** for date handling

---

## File Structure Analysis

Based on your NotePlan installation:

```
Data Root/
├── Calendar/           # Daily notes (YYYYMMDD.txt)
├── Notes/             # All other notes
│   ├── 10 - Projects/
│   ├── 20 - Areas/
│   ├── 30 - Resources/
│   ├── 40 - Archive/
│   └── @Templates/
├── Filters/           # Saved searches/filters
└── Plugins/           # Extensions (future phase)
```

### Markdown Format Patterns

**Daily Note Format:**
```markdown
Title or direct content (no frontmatter always)

## Today's Plan
+ 08:00-09:00 Time block item
+ 09:00-11:00 Another block

## To Do
* Task item 1
* Task item 2

## Notes/Ideas
Regular markdown content
Links: [[Other Note]]
```

**Template Format:**
```markdown
---
title: Template Name
type: empty-note
documentation: https://...
---
## Section 1
Content...
```

---

## Phase Breakdown with Deliverables

### Phase 1: Core Foundation & Markdown Engine
[See PHASE-1-PRP.md for detailed breakdown]

**Key Deliverables:**
1. File system service (read/write/watch markdown files)
2. Markdown parser (frontmatter, links, tasks)
3. REST API for file operations
4. Folder structure initialization
5. WebSocket for file changes

**Core APIs:**
- `GET /api/files` - List all files
- `GET /api/files/:path` - Get file content
- `POST /api/files/:path` - Create/update file
- `DELETE /api/files/:path` - Delete file
- `GET /api/folders` - Get folder tree
- `WS /ws` - File change notifications

### Phase 2: Web UI & Editor
[See PHASE-2-PRP.md for detailed breakdown]

**Key Deliverables:**
1. Three-pane layout (Sidebar, List, Editor)
2. Markdown editor with preview
3. File browser with folder navigation
4. Note creation/editing interface
5. Dark mode support

**UI Components:**
- Collapsible sidebar with folder tree
- Note list with search/filter
- Rich markdown editor (TipTap)
- Resizable panes
- Responsive mobile layout

### Phase 3: Calendar & Daily Notes
[See PHASE-3-PRP.md for detailed breakdown]

**Key Deliverables:**
1. Calendar view component
2. Daily note auto-generation
3. Date navigation
4. Timeline view for time blocks
5. Calendar/Notes folder separation

**Features:**
- Create daily notes with YYYYMMDD.txt naming
- Calendar picker for date navigation
- Today/Yesterday/Tomorrow quick navigation
- Parse and display time blocks visually
- Drag-and-drop time block creation

### Phase 4: Advanced Features
[See PHASE-4-PRP.md for detailed breakdown]

**Key Deliverables:**
1. Task management system (parse `*` items)
2. Bi-directional linking `[[Note]]`
3. Full-text search
4. Template system
5. Task filters and views

**Features:**
- Task parsing and rendering
- Task completion toggle
- Backlink discovery and display
- Search with results preview
- Template insertion
- Scheduled tasks (future date links)

---

## Data Storage Format

### File Naming
- Daily notes: `YYYYMMDD.txt` (e.g., `20251007.txt`)
- Regular notes: `Note Title.txt` or `.md`
- Templates: Any name in `@Templates/` folder

### Markdown Extensions Used by NotePlan

**Task Items:**
```markdown
* Task (todo)
* [x] Completed task
* [>] Scheduled/forwarded task
* [-] Cancelled task
```

**Time Blocks:**
```markdown
+ 08:00-09:00 Task description
+ 14:30-15:30 Another task
```

**Links:**
```markdown
[[Note Name]]           # Wiki-style link
[[Note Name|Alias]]     # Link with alias
[External](http://...)  # Standard markdown link
```

**Special Syntax:**
```markdown
#tag                    # Tags
@person                 # Mentions
>2025-10-08            # Date reference/schedule
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                 Web Browser                      │
│  ┌──────────┬──────────────┬─────────────────┐ │
│  │ Sidebar  │  Note List   │  Editor/View    │ │
│  │ (Folders)│  (Files)     │  (Content)      │ │
│  └──────────┴──────────────┴─────────────────┘ │
└────────────────────┬────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────┴────────────────────────────┐
│              Backend Server                      │
│  ┌──────────────────────────────────────────┐  │
│  │         API Layer (Express/FastAPI)      │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │        Business Logic Layer              │  │
│  │  - File Manager                          │  │
│  │  - Markdown Parser                       │  │
│  │  - Link Resolver                         │  │
│  │  - Task Parser                           │  │
│  │  - Search Engine                         │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │     Storage Layer (File System)          │  │
│  │  - File Watcher                          │  │
│  │  - Index/Cache (SQLite optional)         │  │
│  └──────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────┐
│         Local File System                        │
│           (Markdown Files)                       │
└──────────────────────────────────────────────────┘
```

---

## Configuration Approach

### User Configuration File (`.noteplan-config.json`)
```json
{
  "dataDirectory": "/path/to/notes",
  "serverPort": 3000,
  "theme": "light",
  "defaultFolder": "Notes",
  "dateFormat": "YYYYMMDD",
  "enableWebSocket": true,
  "searchIndexing": true
}
```

### Environment Variables
```env
NOTEPLAN_DATA_DIR=/Users/user/Documents/notes
NOTEPLAN_PORT=3000
NOTEPLAN_HOST=localhost
```

---

## Security Considerations

Since this is self-hosted:

1. **No authentication initially** - Assumes trusted local network
2. **File system access** - Restricted to configured data directory
3. **CORS** - Configured for localhost only
4. **Path traversal protection** - Validate all file paths
5. **Optional:** Add basic auth for network access

---

## Development Workflow

### For Each Phase:
1. Create detailed PRP document
2. Set up project structure
3. Implement backend/API
4. Build frontend components
5. Integration testing
6. Create demo/documentation
7. Iterate based on feedback

### Testing Strategy:
- Unit tests for file operations
- Integration tests for API endpoints
- E2E tests for critical user flows
- Manual testing with real markdown files

---

## Success Metrics

### Phase 1 Success:
- ✅ Can read/write markdown files via API
- ✅ File changes detected and broadcast
- ✅ Folder structure properly initialized

### Phase 2 Success:
- ✅ Can browse and open notes
- ✅ Can edit and save markdown content
- ✅ UI matches NotePlan's layout

### Phase 3 Success:
- ✅ Daily notes auto-create on date selection
- ✅ Calendar navigation works smoothly
- ✅ Time blocks parse and display

### Phase 4 Success:
- ✅ Tasks parse and toggle properly
- ✅ Links navigate between notes
- ✅ Search returns relevant results
- ✅ Templates can be inserted

---

## Future Enhancements (Post-Phase 4)

1. **Mobile responsive design**
2. **Plugin system** (like NotePlan)
3. **Multiple vaults/data directories**
4. **Git integration** for version control
5. **Export functionality** (PDF, HTML)
6. **Real-time collaboration** (if desired)
7. **Cloud sync options** (Dropbox, Google Drive)
8. **iOS/Android apps** (React Native/Capacitor)

---

## Recommended Next Steps

1. **Review this master PRP** - Ensure alignment with your vision
2. **Choose starting phase** - I recommend Phase 1
3. **Review Phase 1 PRP** (will create separately)
4. **Set up development environment**
5. **Begin implementation**

Each phase can be completed independently, allowing you to have a working product early and iterate based on actual usage.

---

## Questions to Clarify

Before starting Phase 1, please confirm:

1. **Primary OS target?** (Mac/Linux/Windows/All)
2. **Programming language preference?** (Node.js vs Python)
3. **Single user or multi-user?** (Affects architecture)
4. **Existing note location?** Use your current NotePlan directory or separate?
5. **Browser target?** (Chrome/Safari/Firefox/All)

---

## Estimated Total Time

- **Phase 1:** 2-3 weeks (20-30 hours)
- **Phase 2:** 3-4 weeks (30-40 hours)
- **Phase 3:** 2-3 weeks (20-30 hours)
- **Phase 4:** 3-4 weeks (30-40 hours)

**Total:** 10-14 weeks (100-140 hours) for full feature parity with core NotePlan

**MVP (Phases 1-2):** 5-7 weeks (50-70 hours) for basic usable app

---

*Document Version: 1.0*
*Created: 2025-10-07*
*Project: NotePlan Self-Hosted Clone*
