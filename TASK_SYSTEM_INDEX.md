# Task Management System - Documentation Index

## Documents Created

This analysis includes comprehensive documentation about the NotePlan Clone task management system. Here are the documents:

### 1. **TASK_SYSTEM_ANALYSIS.md** (Main Document - 613 lines)
Complete analysis of the entire task management system.

**Contents:**
- How tasks are stored and referenced
- Timeline/calendar view and scheduling
- Drag-and-drop implementation details
- What happens when tasks are dropped to time slots
- Daily notes structure and task relationships
- Task referencing and linking system
- Complete data models for tasks and time blocks
- Key files and functions summary
- Data flow examples
- Architectural insights and patterns
- Current capabilities vs limitations

**When to Read:** For deep understanding of the entire system architecture and design decisions.

---

### 2. **TASK_SYSTEM_QUICK_REF.md** (Quick Reference)
One-page reference guide for developers.

**Contents:**
- Quick links to key files with line numbers
- Task storage format (GFM)
- Time block format
- Key data structures
- Drop zones and handlers table
- Drag flow summary
- File organization
- Two-level task system
- Critical functions
- Drop position calculation algorithm
- Common operations code snippets
- API endpoints
- Debugging tips
- Testing checklist

**When to Read:** For quick lookup while implementing or debugging. Keep this open as a reference.

---

### 3. **TASK_SYSTEM_DIAGRAMS.md** (Visual Reference)
ASCII diagrams showing architecture and flows.

**Contents:**
1. Overall system architecture (frontend → stores → backend → files)
2. Task parsing pipeline (file content → parsed → hierarchical → indexed)
3. Drag and drop complete flow (click → drag → drop → save → update UI)
4. Two-level task system (source tasks vs scheduled references)
5. Global task index structure and state
6. Task reference index structure
7. Content structure examples (actual markdown formats)
8. Component rendering hierarchy

**When to Read:** To visualize how components and systems interact. Great for understanding the big picture.

---

## Quick Navigation Guide

### By Use Case

**"I need to understand how tasks are stored"**
- Read: TASK_SYSTEM_ANALYSIS.md Section 1
- Reference: TASK_SYSTEM_QUICK_REF.md - Task Storage Format
- Diagram: TASK_SYSTEM_DIAGRAMS.md - Diagram 2 (Parsing Pipeline)

**"I'm implementing drag-and-drop functionality"**
- Read: TASK_SYSTEM_ANALYSIS.md Section 3-4
- Reference: TASK_SYSTEM_QUICK_REF.md - Drop Zones and Handlers
- Diagram: TASK_SYSTEM_DIAGRAMS.md - Diagram 3 (Drag Flow)
- Code: `/frontend/src/components/DragDropProvider.tsx` Line 67

**"I need to add a new task feature"**
- Read: TASK_SYSTEM_ANALYSIS.md Section 7-8
- Reference: TASK_SYSTEM_QUICK_REF.md - Key Data Structures
- Key Files: Check "Key Files and Functions" table

**"Tasks aren't showing up in the timeline"**
- Read: TASK_SYSTEM_ANALYSIS.md Section 2, 6
- Reference: TASK_SYSTEM_QUICK_REF.md - Debugging Tips
- Check: Is task being indexed? Is daily note created?

**"I'm modifying the calendar system"**
- Read: TASK_SYSTEM_ANALYSIS.md Section 2, 4
- Key Files: 
  - `/frontend/src/store/calendarStore.ts`
  - `/frontend/src/components/calendar/Timeline.tsx`
  - `/src/routes/calendarRoutes.js`

**"I'm working with task references"**
- Read: TASK_SYSTEM_ANALYSIS.md Section 5-6
- Key Files:
  - `/frontend/src/services/linkService.ts`
  - `/frontend/src/hooks/useTasks.ts` Line 90

---

## Key Concepts Summary

### Task ID System
```
filePath-lineNumber
Example: "Notes/project-x.txt-42"
```
- Unique across entire system
- Enables quick file location
- Line-based for editing

### Two-Level Task System

**Level 1: Source Tasks** (in Notes/)
- Permanent record
- Contains metadata and details
- One per task

**Level 2: References** (in Calendar/)
- Scheduled instances
- Point to source via `[[Task Name]]`
- Multiple per source task allowed

### Drop Targets
- **Timeline** → Creates time-blocked reference
- **Date Cell** → Creates unscheduled reference
- **Kanban Column** → Updates status tag
- **TimeBlock** → Repositions existing block

### File Structure
```
Notes/           - Source tasks
├─ project.txt
└─ goals.txt

Calendar/        - Daily notes with references
├─ 20251020.txt
├─ 20251021.txt
└─ 20251022.txt
```

---

## Development Workflow

### Adding a New Task Feature

1. **Understand the data model** (Section 7 of Analysis)
2. **Find relevant components** (Check key files table)
3. **Modify file parsing** if needed (taskService.ts)
4. **Update stores** if adding state (taskStore.ts or calendarStore.ts)
5. **Create UI component** (components/tasks/*.tsx)
6. **Add to drag-drop** if necessary (DragDropProvider.tsx)
7. **Test with automation** (See CLAUDE.md testing section)

### Testing a Feature

Use the checklist in TASK_SYSTEM_QUICK_REF.md:
- [ ] Task parses correctly
- [ ] Hierarchy builds
- [ ] Details extracted
- [ ] Global index updated
- [ ] Drag-drop works
- [ ] Reference created in daily note
- [ ] Original unchanged
- [ ] Multiple scheduling works
- [ ] File saved correctly

### Debugging Tips

**Task not showing:**
1. Check if it parses: `parseTasksFromContent()`
2. Check if indexed: `globalTaskStore.getAllTasks()`
3. Check hierarchy: Are child tasks hidden?

**Drag-drop not working:**
1. Check handlers in `DragDropProvider.tsx` Line 67
2. Verify drop target type matches
3. Check console logs for drag end event

**Daily note not saving:**
1. Check `fileStore.saveFile()` called
2. Verify file path format: `Calendar/YYYYMMDD.txt`
3. Check API response for errors

---

## Performance Considerations

- **Global indexing**: Happens on file change, not realtime
- **Parsing**: O(n) where n = lines in file
- **Hierarchy building**: O(n) with stack-based approach
- **Search**: O(n) linear search through all tasks
- **Drag calculation**: Runs on mouse move (throttled)

---

## Common Gotchas

1. **File path format**: Must be `Notes/` or `Calendar/YYYYMMDD.txt`
2. **Task storage**: Use `.txt` files, NOT `.md` files
3. **GFM format**: Must be `- [ ] Task`, NOT `[] Task`
4. **Line numbers**: Zero-based in code, one-based in UI
5. **Hierarchy**: Only root tasks draggable (by design)
6. **Section headers**: Must be exact: `## Timeblocking` not `## Time Blocking`

---

## Related Documentation

- `/CLAUDE.md` - Full project instructions and testing guidelines
- `/API_DOCUMENTATION.md` - REST API endpoints
- `/README.md` - Project overview

---

## Document Statistics

- **TASK_SYSTEM_ANALYSIS.md**: 613 lines, 12 sections
- **TASK_SYSTEM_QUICK_REF.md**: ~300 lines, quick reference format
- **TASK_SYSTEM_DIAGRAMS.md**: ~400 lines, 8 diagrams
- **TASK_SYSTEM_INDEX.md**: This document

---

## Last Updated

2025-10-20

---

## Next Steps

1. Read the relevant document for your task
2. Use Quick Reference for syntax and locations
3. Check Diagrams for architectural understanding
4. Reference original source files for implementation
5. Run tests to verify changes
6. Update this documentation if architecture changes

---

