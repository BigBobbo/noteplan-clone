# NotePlan Self-Hosted Clone

A self-hosted, web-based note-taking application inspired by NotePlan, featuring local markdown storage, calendar integration, and powerful task management.

---

## 📋 Project Overview

This project recreates NotePlan's core functionality as a web application that stores notes in local markdown files. It's designed to be self-hosted, giving you complete control over your data.

### Key Features (Planned)

✅ **Local Markdown Storage** - All notes stored as plaintext .txt/.md files
✅ **Three-Pane Interface** - Familiar NotePlan layout
✅ **Daily Notes** - Auto-generated date-based notes
✅ **Calendar Integration** - Month/week views with date navigation
✅ **Time Blocking** - Visual timeline for scheduling
✅ **Task Management** - Todo items with completion tracking
✅ **Wiki-Style Links** - `[[Bi-directional linking]]` between notes
✅ **Full-Text Search** - Find anything across all notes
✅ **Templates** - Reusable note structures
✅ **Dark Mode** - Easy on the eyes
✅ **Real-Time Sync** - WebSocket-based file synchronization

---

## 🗂️ Project Structure

```
noteapp/
├── MASTER-PRP.md          # Overall project plan
├── PHASE-1-PRP.md         # Backend & API (2-3 weeks)
├── PHASE-2-PRP.md         # Frontend & UI (3-4 weeks)
├── PHASE-3-PRP.md         # Calendar system (2-3 weeks)
├── PHASE-4-PRP.md         # Advanced features (3-4 weeks)
├── PROJECT-SUMMARY.md     # Quick reference
├── GETTING-STARTED.md     # Setup instructions
└── README.md              # This file
```

---

## 🚀 Quick Start

### 1. Read the Documentation

Start by reading these documents in order:

1. **PROJECT-SUMMARY.md** - Get a high-level overview (5 min read)
2. **MASTER-PRP.md** - Understand the full project scope (15 min read)
3. **PHASE-1-PRP.md** - Dive into backend details (20 min read)
4. **GETTING-STARTED.md** - Follow setup instructions (10 min read)

### 2. Choose Your Tech Stack

**Backend Options:**
- **Node.js + Express** (Recommended - easier React integration)
- **Python + FastAPI** (Better for AI features later)

**Frontend:**
- **React + TypeScript** (Only option currently planned)

### 3. Set Up Development Environment

See **GETTING-STARTED.md** for detailed setup instructions.

Quick version:
```bash
cd noteapp
mkdir backend && cd backend
npm init -y
npm install express socket.io chokidar gray-matter markdown-it cors dotenv
npm install -D nodemon
```

### 4. Start Building

Follow Phase 1 implementation steps in **PHASE-1-PRP.md**

---

## 📊 Development Phases

### Phase 1: Core Foundation & Markdown Engine (2-3 weeks)
**Status:** 🔴 Not Started

Build the backend API and file management system.

**Key Deliverables:**
- File CRUD operations via REST API
- Markdown parsing (frontmatter, tasks, links)
- File system monitoring with WebSocket
- Folder structure initialization

**Tech:** Node.js, Express, Socket.io, Chokidar

---

### Phase 2: Web UI & Editor (3-4 weeks)
**Status:** 🔴 Not Started
**Dependencies:** Phase 1

Build the React frontend and markdown editor.

**Key Deliverables:**
- Three-pane layout (Sidebar, List, Editor)
- Markdown editor with live preview
- File browser and navigation
- Dark mode support
- Real-time file sync

**Tech:** React, TypeScript, TipTap, Tailwind CSS

---

### Phase 3: Calendar & Daily Notes (2-3 weeks)
**Status:** 🔴 Not Started
**Dependencies:** Phase 1, 2

Add calendar functionality and daily note automation.

**Key Deliverables:**
- Calendar views (month/week)
- Daily note auto-generation
- Timeline view for time blocks
- Date navigation
- Time block visualization

**Tech:** React Calendar, date-fns, DnD Kit

---

### Phase 4: Advanced Features (3-4 weeks)
**Status:** 🔴 Not Started
**Dependencies:** Phase 1, 2, 3

Complete the app with power-user features.

**Key Deliverables:**
- Task management system
- Bi-directional wiki-style linking
- Full-text search with context
- Template system
- Command palette (Cmd+K)

**Tech:** FlexSearch, cmdk

---

## 🎯 Current Status

**Phase:** Planning Complete ✅
**Next Step:** Begin Phase 1 Backend Development

---

## 📈 Progress Tracking

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| Phase 1 | 8 major tasks | 0/8 | 🔴 Not Started |
| Phase 2 | 9 major tasks | 0/9 | 🔴 Not Started |
| Phase 3 | 9 major tasks | 0/9 | 🔴 Not Started |
| Phase 4 | 8 major tasks | 0/8 | 🔴 Not Started |

**Overall Progress:** 0% (Planning: 100% ✅)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              Web Browser (React)                 │
│  ┌──────────┬──────────────┬─────────────────┐ │
│  │ Sidebar  │  Note List   │  Editor/View    │ │
│  │          │              │  + Timeline     │ │
│  └──────────┴──────────────┴─────────────────┘ │
└────────────────────┬────────────────────────────┘
                     │ REST API / WebSocket
┌────────────────────┴────────────────────────────┐
│           Backend Server (Node.js/Python)        │
│  ┌──────────────────────────────────────────┐  │
│  │  API Layer (Express/FastAPI)             │  │
│  │  - File routes                           │  │
│  │  - Calendar routes                       │  │
│  │  - Search routes                         │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Services Layer                          │  │
│  │  - File Manager                          │  │
│  │  - Markdown Parser                       │  │
│  │  - File Watcher (chokidar)              │  │
│  │  - Search Indexer                        │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  WebSocket Server (socket.io)            │  │
│  └──────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ File System
┌────────────────────┴────────────────────────────┐
│         Local Markdown Files (.txt/.md)          │
│  data/                                           │
│  ├── Calendar/          (Daily notes)           │
│  └── Notes/             (All other notes)       │
└──────────────────────────────────────────────────┘
```

---

## 💾 Data Storage

### File Structure
```
data/
├── Calendar/              # Daily notes
│   ├── 20251007.txt      # YYYYMMDD format
│   ├── 20251008.txt
│   └── ...
├── Notes/                # All other notes
│   ├── 10 - Projects/    # PARA method
│   ├── 20 - Areas/
│   ├── 30 - Resources/
│   ├── 40 - Archive/
│   └── @Templates/       # Note templates
└── Filters/              # (Future phase)
```

### Markdown Format
```markdown
---
title: Note Title
type: note
tags: [project, important]
---

# Content here

## Tasks
* Open task
* [x] Completed task

## Time Blocks
+ 09:00-11:00 Deep work session

## Notes
Regular markdown with [[Wiki Links]]
```

---

## 🔧 Technology Decisions

### Why Node.js?
- Fast development with JavaScript/TypeScript
- Excellent file system APIs
- Rich markdown ecosystem
- Seamless React integration
- Strong WebSocket support (socket.io)

### Why React?
- Component-based architecture
- Large ecosystem of libraries
- TypeScript support
- Excellent markdown editors available (TipTap)

### Why Local Storage?
- Complete data ownership
- No cloud dependencies
- Works offline
- Git-friendly (version control)
- Privacy and security

---

## 📖 Markdown Syntax Reference

The app will support NotePlan's extended markdown syntax:

### Tasks
```markdown
* Task name                    # Open
* [x] Completed task          # Done
* [>] Scheduled task          # Moved to future
* [-] Cancelled task          # Cancelled
```

### Time Blocks
```markdown
+ 08:00-09:00 Morning routine
+ 09:00-11:00 Deep work
+ 14:00-15:30 Team meeting
```

### Links
```markdown
[[Other Note]]                # Wiki-style link
[[Note Name|Alias Text]]      # Link with custom display
[External](https://...)       # Regular markdown link
```

### Special Syntax
```markdown
#tag                          # Hashtag
@person                       # Mention
>2025-10-08                  # Date reference
```

---

## 🎨 UI Design

The interface will closely match NotePlan's clean, three-pane layout:

- **Left Pane:** Folder tree and file browser
- **Middle Pane:** Note editor with markdown rendering
- **Right Pane:** Timeline (for daily notes) or backlinks

**Color Scheme:**
- Light mode: Clean whites and grays
- Dark mode: Comfortable dark grays (#1f1f1f, #333333)
- Accent color: Amber (#f59e0b) - matches NotePlan

---

## 🧪 Testing Strategy

### Phase 1 Testing
- Unit tests for file operations
- API endpoint tests (Postman)
- WebSocket connection tests

### Phase 2 Testing
- Component tests (React Testing Library)
- E2E tests (Playwright)
- Visual regression tests

### Phase 3 Testing
- Calendar navigation flows
- Time block creation/editing
- Daily note generation

### Phase 4 Testing
- Search accuracy
- Link resolution
- Task state management

---

## 🚧 Known Limitations

Things this clone **won't** have (initially):

- ❌ Native iOS/Mac apps (web only)
- ❌ iCloud sync (local files only)
- ❌ Plugin system (maybe later)
- ❌ AI features (maybe later)
- ❌ Mobile optimization (desktop-first)
- ❌ Real-time collaboration

These could be added in future phases!

---

## 🤝 Contributing

This is currently a personal project. Once Phase 1-2 are complete, contribution guidelines will be added.

---

## 📝 License

TBD - Will be chosen once initial development is complete.

---

## 🙏 Acknowledgments

- **NotePlan** - Inspiration and reference for features
- **Obsidian** - Ideas for linking and graph view
- **TipTap** - Excellent markdown editor
- **Tailwind CSS** - Modern styling framework

---

## 📞 Questions?

See **PROJECT-SUMMARY.md** for FAQ and common questions.

For development help, refer to:
- **GETTING-STARTED.md** - Setup and first steps
- **Phase PRPs** - Detailed implementation guides

---

## 🗓️ Timeline

**Estimated Total Time:** 10-14 weeks (100-140 hours)

- **Phase 1:** 2-3 weeks (Backend)
- **Phase 2:** 3-4 weeks (Frontend)
- **Phase 3:** 2-3 weeks (Calendar)
- **Phase 4:** 3-4 weeks (Advanced)

**MVP (Phases 1-2):** 5-7 weeks for basic usable app

---

## 🎯 Next Steps

1. ✅ Complete planning (DONE!)
2. ⏳ Review Phase 1 PRP in detail
3. ⏳ Set up development environment
4. ⏳ Begin Phase 1 implementation
5. ⏳ Build backend API
6. ⏳ Test with Postman
7. ⏳ Move to Phase 2

---

**Status:** 🟢 Planning Complete - Ready to Build!

**Last Updated:** October 7, 2025

**Project Start Date:** TBD (when you begin Phase 1)

---

*This is a living document. It will be updated as development progresses.*
