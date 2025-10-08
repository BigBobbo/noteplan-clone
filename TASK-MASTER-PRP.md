# MASTER PRP: Advanced Task Management System

## Project Overview

This document outlines the complete implementation plan for adding advanced task management features to the NotePlan clone. The system will support nested subtasks, priority levels, drag-and-drop functionality, customizable Kanban boards, calendar integration with time blocking, and a comprehensive template system.

**Core Philosophy:**
- **Local-first:** All data stored in markdown files
- **Markdown-native:** Features encoded in plaintext
- **Flexible:** Adaptable to different workflows
- **Performant:** Handle 1000+ tasks smoothly

---

## High-Level Goals

### Primary Objectives
1. ✅ **Nested task hierarchy** - Unlimited depth subtasks with indentation
2. ✅ **Priority system** - P1-P4 tags with visual indicators
3. ✅ **Kanban boards** - Multiple custom boards with flexible columns
4. ✅ **Calendar drag-drop** - Schedule tasks by dragging to dates
5. ✅ **Time blocking** - Visual timeline with multiple duration inputs
6. ✅ **Task references** - Link tasks to daily notes without moving them
7. ✅ **Template system** - Reusable content with variables and triggers
8. ✅ **Quick capture** - Instant inbox for brain dumps
9. ✅ **Performance** - Optimized for large datasets

### User Workflow
1. **Capture:** Quick capture (Cmd+Shift+N) → tasks go to Inbox
2. **Organize:** Drag tasks to Kanban columns (status tags)
3. **Schedule:** Drag from Kanban to calendar dates (creates references)
4. **Time block:** Drag to timeline slots for focused work
5. **Execute:** Check off tasks, see progress across all views
6. **Review:** Use templates (e.g., /weekly) for reflection

---

## 4-Phase Implementation Plan

### Phase 1: Enhanced Task Foundation (2-3 weeks)
**Goal:** Build the core task management infrastructure

**Key Features:**
- Nested subtasks with indentation parsing
- Priority tags (#p1 through #p4)
- Tree view UI with expand/collapse
- @dnd-kit installation and setup
- Enhanced task data model

**Success Metrics:**
- Parse 3+ levels of nested tasks
- Display priority badges (P1=red, P2=orange, P3=yellow, P4=blue)
- Handle 1000+ tasks without lag
- Preserve exact indentation when saving

**Technical Foundation:**
- Updated task parser with nesting logic
- Parent-child relationship tracking
- Hierarchical filtering
- Drag-drop infrastructure ready

---

### Phase 2: Kanban Board System (2-3 weeks)
**Goal:** Implement customizable Kanban boards with flexible status tags

**Key Features:**
- Multiple saved board configurations
- Custom columns mapped to any tags
- Drag tasks between columns (updates tags)
- Board editor UI
- WIP limits (optional)

**Success Metrics:**
- Create boards with 2-10 columns
- Drag-drop updates markdown files instantly
- Switch between multiple boards
- Boards persist across sessions
- Filter boards by tags (e.g., show only #work tasks)

**Technical Foundation:**
- Board storage in `.kanban-boards.json`
- DnD context for kanban cards
- Tag-based column filtering
- View switcher (List / Board / Calendar)

---

### Phase 3: Calendar Integration & Time Blocking (3-4 weeks)
**Goal:** Enable scheduling and time blocking via drag-drop

**Key Features:**
- Drag tasks from board/list to calendar dates
- Drag to timeline for time blocking
- Task references in daily notes (original stays in place)
- 4 duration input methods (preset, range, text, drag-resize)
- Bi-directional linking with navigation
- Backlinks panel showing references

**Success Metrics:**
- Drag from kanban to date creates `[[reference]]`
- Original task untouched
- Links clickable and navigate to source
- Time blocks render on timeline
- Resize handles adjust duration
- Conflict detection for overlapping blocks

**Technical Foundation:**
- Link parsing and indexing system
- Reference creation in daily notes
- Timeline drop zones every 15 minutes
- Navigation between files
- Link graph (future: visual graph view)

---

### Phase 4: Templates & Polish (2 weeks)
**Goal:** Add productivity tools and polish the experience

**Key Features:**
- Template storage in `@Templates/` folder
- Variable substitution (date, time, cursor, etc.)
- 3 trigger methods: Cmd+K, `/slash`, sidebar button
- Quick capture modal (Cmd+Shift+N)
- Performance optimization (virtualization, debouncing, memoization)
- Smooth animations (framer-motion)
- Onboarding tour for new users
- Keyboard shortcuts help (?)

**Success Metrics:**
- All 3 template triggers work
- Quick capture appears in <100ms
- Templates support variables
- 1000+ tasks render smoothly
- 60fps animations
- Empty states are helpful

**Technical Foundation:**
- Template parser with frontmatter
- Web Worker for search indexing
- react-window for virtualization
- Debounced file saves (300ms)
- Memoized task parsing

---

## Markdown Syntax Reference

### Task Syntax
```markdown
* Open task
* [x] Completed task
* [>] Scheduled/forwarded task
* [-] Cancelled task
* [!] Important task
```

### Nesting (4 spaces = 1 level)
```markdown
* Parent task #p1 #status-doing >2025-10-10
    * Child subtask #p2
        * Nested subtask
    * Another child
```

### Priority & Tags
```markdown
* High priority task #p1
* Medium priority #p2 @john #project-alpha
* Low priority #p4 #status-done
```

### Time Blocks
```markdown
+ 09:00-11:00 Deep work session
+ 14:00-15:30 Team meeting
```

### Task References
```markdown
* [[Write Q4 report]]
* [[Project > Subtask name]]
+ 09:00-11:00 [[Task name]] #timeblock
```

### Templates
```markdown
---
title: Weekly Review
trigger: /weekly
category: Productivity
---

# Weekly Review - {{date}}

## Completed This Week
* {{cursor}}
```

---

## Technical Architecture

### Data Flow

```
┌─────────────────────────────────────────────────┐
│                   User Action                    │
│  (Drag task, edit markdown, insert template)    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              Frontend (React/TS)                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Components (Kanban, Calendar, Editor)   │  │
│  └────────────────┬─────────────────────────┘  │
│                   │                              │
│  ┌────────────────▼─────────────────────────┐  │
│  │  Stores (Zustand)                        │  │
│  │  - taskStore: Task state & filtering     │  │
│  │  - boardStore: Kanban board configs      │  │
│  │  - linkStore: Reference index            │  │
│  │  - templateStore: Template cache         │  │
│  └────────────────┬─────────────────────────┘  │
│                   │                              │
│  ┌────────────────▼─────────────────────────┐  │
│  │  Services                                │  │
│  │  - taskService: Parse/update tasks       │  │
│  │  - linkService: Resolve references       │  │
│  │  - boardService: Board CRUD              │  │
│  │  - templateService: Template rendering   │  │
│  └────────────────┬─────────────────────────┘  │
└───────────────────┼──────────────────────────────┘
                    │
                    ▼ HTTP/WebSocket
┌─────────────────────────────────────────────────┐
│              Backend (Node.js)                   │
│  ┌──────────────────────────────────────────┐  │
│  │  API Routes                              │  │
│  │  - /api/files: CRUD operations           │  │
│  │  - /api/boards: Board management         │  │
│  │  - /api/search: Full-text search         │  │
│  └────────────────┬─────────────────────────┘  │
│                   │                              │
│  ┌────────────────▼─────────────────────────┐  │
│  │  File Manager                            │  │
│  │  - Read/write markdown files             │  │
│  │  - File watching (chokidar)              │  │
│  │  - Backup/sync                           │  │
│  └────────────────┬─────────────────────────┘  │
└───────────────────┼──────────────────────────────┘
                    │
                    ▼ File System
┌─────────────────────────────────────────────────┐
│         Local Markdown Files (.txt/.md)          │
│  data/                                           │
│  ├── Calendar/          (Daily notes)           │
│  ├── Notes/                                      │
│  │   ├── @Templates/   (Template files)         │
│  │   ├── Inbox.txt     (Quick capture)          │
│  │   └── ...           (All other notes)        │
│  └── .kanban-boards.json (Board configs)        │
└──────────────────────────────────────────────────┘
```

---

## File Structure

```
noteapp/
├── backend/
│   ├── routes/
│   │   ├── fileRoutes.js     (existing)
│   │   └── boardRoutes.js    (NEW - Phase 2)
│   ├── services/
│   │   ├── fileService.js    (existing)
│   │   └── boardService.js   (NEW - Phase 2)
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── tasks/
│   │   │   │   ├── TaskList.tsx           (existing)
│   │   │   │   ├── TaskItem.tsx           (existing)
│   │   │   │   ├── TaskTreeItem.tsx       (NEW - Phase 1)
│   │   │   │   ├── PriorityBadge.tsx      (NEW - Phase 1)
│   │   │   │   └── TaskActions.tsx        (NEW - Phase 1)
│   │   │   ├── kanban/
│   │   │   │   ├── KanbanBoard.tsx        (NEW - Phase 2)
│   │   │   │   ├── KanbanColumn.tsx       (NEW - Phase 2)
│   │   │   │   ├── KanbanCard.tsx         (NEW - Phase 2)
│   │   │   │   ├── BoardSelector.tsx      (NEW - Phase 2)
│   │   │   │   └── BoardEditor.tsx        (NEW - Phase 2)
│   │   │   ├── calendar/
│   │   │   │   ├── CalendarView.tsx       (existing, update)
│   │   │   │   ├── Timeline.tsx           (existing, update)
│   │   │   │   └── TimeBlockDialog.tsx    (NEW - Phase 3)
│   │   │   ├── sidebar/
│   │   │   │   ├── TemplatesPanel.tsx     (NEW - Phase 4)
│   │   │   │   └── BacklinksPanel.tsx     (NEW - Phase 3)
│   │   │   └── modals/
│   │   │       └── QuickCapture.tsx       (NEW - Phase 4)
│   │   ├── services/
│   │   │   ├── taskService.ts             (existing, update)
│   │   │   ├── boardService.ts            (NEW - Phase 2)
│   │   │   ├── linkService.ts             (NEW - Phase 3)
│   │   │   └── templateService.ts         (NEW - Phase 4)
│   │   ├── store/
│   │   │   ├── taskStore.ts               (existing, update)
│   │   │   ├── boardStore.ts              (NEW - Phase 2)
│   │   │   ├── linkStore.ts               (NEW - Phase 3)
│   │   │   └── templateStore.ts           (NEW - Phase 4)
│   │   ├── hooks/
│   │   │   ├── useTasks.ts                (existing, update)
│   │   │   └── useDebouncedSave.ts        (NEW - Phase 4)
│   │   └── workers/
│   │       └── searchWorker.ts            (NEW - Phase 4)
│   └── package.json
│
├── data/
│   ├── Calendar/
│   │   └── 20251010.txt
│   ├── Notes/
│   │   ├── @Templates/                    (NEW - Phase 4)
│   │   │   ├── Weekly Review.txt
│   │   │   └── Daily Standup.txt
│   │   └── Inbox.txt                      (NEW - Phase 4)
│   └── .kanban-boards.json                (NEW - Phase 2)
│
├── TASK-MASTER-PRP.md                     (this file)
├── TASK-PHASE-1-PRP.md
├── TASK-PHASE-2-PRP.md
├── TASK-PHASE-3-PRP.md
└── TASK-PHASE-4-PRP.md
```

---

## Dependencies & Libraries

### New Dependencies (to install)

**Phase 1:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Phase 4:**
```bash
npm install react-window framer-motion react-joyride
```

### Existing Dependencies (already installed)
- React, TypeScript
- Zustand (state management)
- TipTap (markdown editor)
- date-fns (date formatting)
- Tailwind CSS (styling)
- Socket.io (real-time sync)

---

## Timeline & Milestones

### Overall Timeline: 9-12 weeks

| Phase | Duration | Key Milestone |
|-------|----------|---------------|
| **Phase 1** | 2-3 weeks | Nested tasks + priorities working |
| **Phase 2** | 2-3 weeks | Kanban boards fully functional |
| **Phase 3** | 3-4 weeks | Calendar drag-drop + time blocking |
| **Phase 4** | 2 weeks | Templates + performance polish |

### MVP Checkpoint (End of Phase 2)
After Phase 2, you'll have a **fully functional task management system** with:
- ✅ Nested tasks with priorities
- ✅ Custom Kanban boards
- ✅ Drag-drop between columns
- ✅ All data in markdown files

**Decision point:** Could ship here and add calendar/templates later!

---

## Testing Strategy

### Per-Phase Testing
Each phase includes:
- **Manual tests** - User workflow verification
- **Edge cases** - Boundary conditions
- **Performance tests** - Load testing with 1000+ items
- **File integrity** - Markdown preservation

### Integration Testing
- Cross-phase features work together
- No data corruption across workflows
- Performance remains acceptable with all features enabled

### User Acceptance
- Daily use by developer (dogfooding)
- Real workflows validate design
- Iterate based on friction points

---

## Risk Mitigation

### Technical Risks

**Risk: Markdown file corruption**
- Mitigation: Thorough parser testing, backup system, undo/redo

**Risk: Performance degradation with large datasets**
- Mitigation: Virtualization, memoization, Web Workers, profiling

**Risk: Complex parent-child relationships**
- Mitigation: Comprehensive test suite, clear data model, validation

**Risk: Drag-drop conflicts**
- Mitigation: Clear visual feedback, conflict detection, undo support

### Scope Risks

**Risk: Feature creep**
- Mitigation: Strict phase boundaries, MVP checkpoints, defer nice-to-haves

**Risk: Timeline overrun**
- Mitigation: 20% buffer in estimates, weekly progress reviews, cut scope if needed

---

## Future Enhancements (Beyond Phase 4)

### Phase 5 Ideas (Post-MVP)
1. **Task dependencies** - "This blocks that"
2. **Recurring tasks** - Daily/weekly/monthly automation
3. **Statistics dashboard** - Productivity metrics
4. **Graph view** - Visualize task/note relationships
5. **Mobile responsive** - Touch-friendly interface
6. **Plugin system** - Extensibility for custom features
7. **AI features** - Smart suggestions, auto-categorization
8. **Export/import** - Share boards, sync across devices
9. **Collaboration** - Shared boards (requires backend changes)
10. **Custom fields** - Extensible task metadata

---

## Success Criteria

### Phase 1 Complete ✅
- Can create 5+ level nested tasks
- Priority badges display correctly
- 1000 tasks render without lag
- Indentation preserved in markdown

### Phase 2 Complete ✅
- 3+ custom boards configured
- Drag-drop updates tags instantly
- Switch between boards smoothly
- Board configs persist

### Phase 3 Complete ✅
- Drag from board to calendar works
- Time blocks render on timeline
- Links navigate to source tasks
- All 4 duration methods functional

### Phase 4 Complete ✅
- Templates insert via all 3 triggers
- Quick capture under 100ms
- Smooth 60fps animations
- Onboarding tour runs on first use

### Overall Success ✅
- **Local-first:** All data in markdown
- **Fast:** Sub-100ms interactions
- **Reliable:** No data loss
- **Intuitive:** Minimal learning curve
- **Powerful:** Supports complex workflows

---

## Getting Started

1. **Read this Master PRP** - Understand full scope
2. **Review Phase 1 PRP** - Detailed implementation steps
3. **Start Phase 1** - Install dependencies, update parser
4. **Test thoroughly** - Ensure phase works before moving on
5. **Proceed to Phase 2** - Repeat process

---

## Questions & Answers

**Q: Can I skip phases?**
A: No, each phase depends on the previous. However, you can pause after Phase 2 for an MVP.

**Q: What if markdown syntax conflicts with existing notes?**
A: The syntax is backward-compatible. Existing tasks continue to work, new features are opt-in.

**Q: How do I handle merge conflicts with markdown files?**
A: Use Git's merge strategy for text files. Conflicts are rare since each task is a separate line.

**Q: Can I change the indentation level (e.g., 2 spaces instead of 4)?**
A: Yes, this is configurable in the parser settings.

**Q: What happens to tasks when I delete a board?**
A: Tasks keep their tags, they just won't appear in that board view anymore. Files are untouched.

**Q: Can I export my boards to share with others?**
A: Yes, the `.kanban-boards.json` file is portable. Copy to another instance.

---

## Maintenance & Support

### Documentation
- Each phase has detailed PRP
- Code comments explain complex logic
- README updated with new features

### Version Control
- Git commits per feature
- Semantic versioning (major.minor.patch)
- Changelog maintained

### Backup Strategy
- Markdown files are version-controlled
- Board configs backed up with files
- Easy restore from any point

---

**Status:** 🟢 Planning Complete - Ready to Build

**Last Updated:** 2025-10-08

**Next Action:** Begin Phase 1 - Install @dnd-kit and update task parser

---

*This is the master reference document. Refer to individual phase PRPs for detailed implementation steps.*
