# NotePlan Task System - Architecture Diagrams

## 1. Overall System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NotePlan Frontend                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              MainView (Tab Switcher)                 │   │
│  │  [Editor] [Raw] [Tasks] [Board] [References]        │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                │                                             │
│   ┌────────────┼────────────┬──────────────┬─────────────┐  │
│   │            │            │              │             │  │
│ ┌─▼──┐   ┌──────▼──┐  ┌───▼──┐   ┌──────▼──┐   ┌──────▼┐ │
│ │    │   │Enhanced │  │      │   │ Kanban  │   │ Ref   │ │
│ │    │   │ TaskList│  │ Refs │   │ Board   │   │erence │ │
│ │ Ed │   │         │  │      │   │         │   │ Panel │ │
│ │itor│   │ - Global│  │ Wiki │   │ Columns │   │       │ │
│ │    │   │   Tasks │  │ Links│   │ - Cards │   │ Tags  │ │
│ └────┘   └─────────┘  └──────┘   └────────┘   └───────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │
         │  useTasks() hook
         │
┌────────┴──────────────────────────────────────────────────────┐
│              Zustand Stores (State Management)                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐  ┌────────────────────────────────┐   │
│  │   taskStore         │  │  globalTaskStore              │   │
│  │  (current file)     │  │  (all files indexed)          │   │
│  ├─────────────────────┤  ├────────────────────────────────┤   │
│  │ tasks: []           │  │ tasksByFile: Map<path, []>    │   │
│  │ filter: 'all'       │  │ allGlobalTasks: []            │   │
│  │ expandedTasks: Set  │  │ isIndexing: bool              │   │
│  └─────────────────────┘  └────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ calendarStore (Daily notes & timeblocks)               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ currentDate: Date                                        │   │
│  │ timeBlocks: TimeBlock[]                                  │   │
│  │ dailyNotes: Map<dateStr, FileData>                       │   │
│  │ showTimeline: bool                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ fileStore (Current editor file)                         │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ currentFile: FileData                                    │   │
│  │ files: FileMetadata[]                                    │   │
│  │ folders: FolderNode                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
         │
         │  API calls
         │
┌────────▼──────────────────────────────────────────────────────┐
│              Backend Services                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET /api/calendar/daily/:date     ← Load/create daily note   │
│  GET /api/calendar/timeblocks/:date ← Parse time blocks       │
│  GET /api/files/...                ← Load file content        │
│  POST /api/files/...               ← Save file content        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
         │
┌────────▼──────────────────────────────────────────────────────┐
│              File System                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ~/Documents/notes/Notes/                                      │
│  ├── project-x.txt        (source tasks)                       │
│  ├── weekly-goals.txt                                          │
│  └── backlog.txt                                               │
│                                                                 │
│  ~/Documents/notes/Calendar/                                   │
│  ├── 20251020.txt         (daily with time blocks)             │
│  ├── 20251021.txt                                              │
│  └── 20251022.txt                                              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## 2. Task Parsing Pipeline

```
┌──────────────────────┐
│  File Content (.txt) │
└──────────┬───────────┘
           │
           │ split by '\n'
           ▼
┌──────────────────────────────────┐
│     Raw Lines []                 │
│  "- [ ] Build feature X"         │
│  "  Requirements:"               │
│  "  - Req 1"                     │
│  "  - Req 2"                     │
└──────────┬───────────────────────┘
           │
           │ parseTask(line) for each line
           ▼
┌──────────────────────────────────┐
│     ParsedTask[]                 │
│  {                               │
│    id: "Notes/project.txt-0"    │
│    text: "Build feature X"      │
│    line: 0                      │
│    depth: 0                     │
│    details: "Requirements:\n..."│
│    tags: []                     │
│  }                              │
└──────────┬───────────────────────┘
           │
           │ buildTaskHierarchy()
           ▼
┌──────────────────────────────────┐
│   Hierarchical Tasks []          │
│  Task (depth: 0)                │
│  ├── child 1 (depth: 1)         │
│  ├── child 2 (depth: 1)         │
│  └── child 3 (depth: 1)         │
│                                  │
│  Task 2 (depth: 0)              │
│  └── child 1 (depth: 1)         │
└──────────┬───────────────────────┘
           │
           │ Store in globalTaskStore
           ▼
┌──────────────────────────────────┐
│  Global Indexed Tasks            │
│  Searchable Across All Files     │
└──────────────────────────────────┘
```

## 3. Drag and Drop Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Action                               │
│  Drags "Build feature X" task from Tasks tab                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ TaskTreeItem               │
    │ useSortable({             │
    │   id: task.id,            │
    │   data: {                 │
    │     type: 'sortable-task',│
    │     task: {...}           │
    │   }                       │
    │ })                        │
    └────────────┬──────────────┘
                 │
                 │ onDragStart
                 ▼
    ┌────────────────────────────┐
    │ DragDropProvider           │
    │ setActiveTask(task)        │
    └────────────┬──────────────┘
                 │
                 │ Mouse move tracking (global)
                 ▼
    ┌────────────────────────────┐
    │ mousePositionRef.current   │
    │ { x: 150, y: 320 }         │
    └────────────────────────────┘
                 │
                 │ User drags over Timeline
                 ▼
    ┌────────────────────────────┐
    │ Timeline (useDroppable)    │
    │ id='timeline'              │
    │ Shows drop indicator       │
    │ Calculates time from Y     │
    └────────────────────────────┘
                 │
                 │ User releases at 09:15
                 ▼
    ┌────────────────────────────┐
    │ onDragEnd fires            │
    │ active.data.type check     │
    │  → 'sortable-task'         │
    │ targetData.type check      │
    │  → 'timeline'              │
    └────────────┬──────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │ calculateTimeFromPosition()             │
    │ Input:                                  │
    │  - mouseY: 320                          │
    │  - timelineRect.top: 200                │
    │  - HOUR_HEIGHT: 60                      │
    │ Process:                                │
    │  - relativeY = 320 - 200 = 120          │
    │  - totalMin = (120/60)*60 = 120         │
    │  - snapped = round(120/15)*15 = 120     │
    │ Output: "02:00" → "09:15" with offset  │
    └────────────┬──────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │ createTaskReferenceInDailyNote()        │
    │                                         │
    │ Step 1: Find task                       │
    │   useGlobalTaskStore.getTaskById()      │
    │   → Found: "Build feature X"            │
    │                                         │
    │ Step 2: Load/create daily note          │
    │   Calendar/20251020.txt                 │
    │                                         │
    │ Step 3: Generate reference line         │
    │   "+ 09:15-10:15 [[Build feature X]]"  │
    │                                         │
    │ Step 4: Append to section               │
    │   appendToSection(content,              │
    │     "## Timeblocking", line)            │
    │                                         │
    │ Step 5: Save file                       │
    │   api.saveFile(path, newContent)        │
    │                                         │
    │ Step 6: Update link index               │
    │   addTaskReference(taskId, ref)         │
    └────────────┬──────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │ calendarStore.refreshTimeBlocks()       │
    │ → Re-parse timeblocks                   │
    │ → Update UI                             │
    │ → Show new TimeBlock on timeline        │
    └────────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │ Result Visible to User                 │
    │ Timeline shows:                         │
    │  + 09:15-10:15 Build feature X         │
    │                                         │
    │ Calendar/20251020.txt contains:        │
    │  + 09:15-10:15 [[Build feature X]]    │
    │                                         │
    │ Notes/project.txt unchanged:            │
    │  - [ ] Build feature X                 │
    └────────────────────────────────────────┘
```

## 4. Two-Level Task System

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  LEVEL 1: SOURCE TASK (Notes folder)                       │
│  ═════════════════════════════════════════════             │
│                                                              │
│  File: Notes/project-x.txt                                  │
│  ┌──────────────────────────────────────────────┐          │
│  │ - [ ] Build feature X #p1 @alice             │          │
│  │   Requirements:                              │          │
│  │   - Design database schema                   │          │
│  │   - Implement API endpoints                  │          │
│  │   - Write unit tests                         │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  This is the PERMANENT, AUTHORITATIVE record               │
│  - Lives in project notes                                   │
│  - Contains full metadata and details                       │
│  - Updated when task definition changes                     │
│  - One per task (no duplication)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
              │                           │
              │                           │
        References            References
        20251020              20251021
              │                           │
              ▼                           ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│ LEVEL 2A: TIME-BLOCKED  │   │ LEVEL 2B: UNSCHEDULED   │
│ REFERENCE               │   │ REFERENCE               │
│                         │   │                         │
│ Calendar/20251020.txt   │   │ Calendar/20251021.txt   │
│                         │   │                         │
│ ## Timeblocking         │   │ ## Tasks                │
│ + 09:00-10:00 Morning   │   │ * [[Build feature X]]   │
│ + 10:00-11:00 Standup   │   │ * Other task            │
│ + 11:00-12:00           │   │                         │
│   [[Build feature X]]   │   │ (No specific time)      │
│   #timeblock            │   │                         │
│                         │   │                         │
│ + 13:00-14:30 Meeting   │   │                         │
│                         │   │                         │
└─────────────────────────┘   └─────────────────────────┘

These are LIGHTWEIGHT POINTERS to the source task
- Point to original via [[Task Name]] syntax
- Include time block information if scheduled
- Can be deleted without losing the task
- Updating source updates all references
- One task can appear on many days
```

## 5. Global Task Index

```
┌──────────────────────────────────────────────────────────┐
│             Global Task Store State                       │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  tasksByFile: Map<filePath, ParsedTask[]>                │
│  ═════════════════════════════════════════              │
│                                                            │
│  "Notes/project-x.txt" → [                              │
│    { id: ".../0", text: "Build feature", ... },         │
│    { id: ".../5", text: "Deploy", ... }                 │
│  ]                                                        │
│                                                            │
│  "Notes/weekly-goals.txt" → [                           │
│    { id: ".../0", text: "Review goals", ... }           │
│  ]                                                        │
│                                                            │
│  "Calendar/20251020.txt" → [                            │
│    { id: ".../0", text: "Morning routine", ... }        │
│  ]                                                        │
│                                                            │
│  allGlobalTasks: ParsedTask[] (flattened)               │
│  ═════════════════════════════════════════              │
│  [                                                        │
│    { id: "Notes/project-x.txt-0", ... },              │
│    { id: "Notes/project-x.txt-5", ... },              │
│    { id: "Notes/weekly-goals.txt-0", ... },           │
│    { id: "Calendar/20251020.txt-0", ... }             │
│  ]                                                        │
│                                                            │
│  Searchable by:                                           │
│  - getTaskById(taskId)         → Find specific task      │
│  - getTasksByFile(filePath)    → Get all from file       │
│  - getAllTasks()               → Get all tasks            │
│                                                            │
└──────────────────────────────────────────────────────────┘

Updated by:
  - File watcher detecting changes
  - indexFile(path, content) called
  - Auto-refreshed on file save
  - Triggers component re-renders
```

## 6. Task Reference Index

```
┌──────────────────────────────────────────────────────────┐
│              Task Reference Index                         │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Map<taskId, TaskReference[]>                            │
│                                                            │
│  "Notes/project.txt-0" (Build feature X)               │
│  └── [                                                   │
│    {                                                     │
│      id: "Calendar/20251020.txt:8",                     │
│      taskId: "Notes/project.txt-0",                     │
│      sourceFile: "Notes/project.txt",                   │
│      date: 2025-10-20,                                  │
│      timeBlock: {                                       │
│        id: "...",                                       │
│        start: "09:15",                                  │
│        end: "10:15",                                    │
│        duration: 60,                                    │
│        taskRef: "Notes/project.txt-0"                   │
│      },                                                 │
│      type: "timeblock",                                 │
│      createdAt: 2025-10-20T09:15:00Z                    │
│    },                                                    │
│    {                                                     │
│      id: "Calendar/20251021.txt:5",                     │
│      taskId: "Notes/project.txt-0",                     │
│      sourceFile: "Notes/project.txt",                   │
│      date: 2025-10-21,                                  │
│      type: "reference",                                 │
│      createdAt: 2025-10-21T08:00:00Z                    │
│    }                                                     │
│  ]                                                       │
│                                                            │
│  Allows queries:                                          │
│  - Which dates is this task scheduled?                   │
│  - Is this task time-blocked?                            │
│  - What times is it blocked?                             │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

## 7. Content Structure Examples

```
NOTES FILE: Notes/project.txt
═══════════════════════════════

# Project X

## Design Phase
- [ ] Requirement gathering
- [x] Architecture design
  Completed on 2025-10-15

- [ ] Database design
  Schema design for user tables
  Performance considerations:
  - Use indexed columns
  - Optimize for queries

  Child tasks:
  - [ ] Design user table
  - [ ] Design session table

## Development
- [ ] Build feature X #p1 @alice
  Requirements:
  - Design database schema
  - Implement API endpoints
  - Write unit tests

  Notes:
  - Estimated 20 hours
  - Blocking feature Y

- [ ] Build feature Y #p2
- [x] Deploy to staging >2025-10-18

═══════════════════════════════════════════════════════════════

CALENDAR FILE: Calendar/20251020.txt
════════════════════════════════════

# Monday, October 20, 2025

## Routines
* Check [[Monthly Goals]]
* Check [[Waiting For]]

## Timeblocking
+ 08:00-09:00 Morning routine
+ 09:00-10:30 [[Build feature X]] #timeblock
+ 10:30-11:00 Standup meeting
+ 11:00-12:00 Code review
+ 13:00-14:00 [[Database design]] #timeblock
+ 14:00-14:30 1-on-1 with manager

## Tasks
* [[Build database schema]]
* [[Write test for auth]]
* Review PRs

## Notes
- Had good meeting with team
- Decided on SQL approach for DB
```

## 8. Component Rendering Hierarchy

```
┌─────────────────────────────────────────────┐
│           MainView                          │
│  Tab selector → current view                │
└────────────────┬────────────────────────────┘
                 │
                 ├──→ Editor Tab
                 │    └─ Editor component
                 │
                 ├──→ Raw Tab
                 │    └─ RawTextEditor
                 │
                 ├──→ Tasks Tab
                 │    └─ EnhancedTaskList
                 │        ├─ TaskFilters
                 │        └─ SortableContext (if reordering)
                 │           └─ TaskTreeItem (for each root task)
                 │              ├─ Checkbox
                 │              ├─ Task text
                 │              ├─ Tags/mentions/dates
                 │              ├─ Expand button
                 │              └─ (if expanded) TaskDetails
                 │                 └─ Nested TaskTreeItem
                 │
                 ├──→ Board Tab
                 │    └─ KanbanBoard
                 │       └─ KanbanColumn
                 │          └─ KanbanCard (draggable)
                 │
                 └──→ References Tab
                      └─ ReferenceView
                         └─ ReferenceList

All wrapped in DragDropProvider:
  ├─ DndContext (from @dnd-kit)
  ├─ DragOverlay (shows ghost card)
  └─ handleDragEnd() - Routes drops
```

