# NotePlan Clone - Task Management System Analysis

## Executive Summary

The NotePlan clone implements a sophisticated task management system that bridges topic-based notes (stored in `Notes/` folder) and daily notes (stored in `Calendar/` folder with YYYYMMDD naming). Tasks can be:
1. Defined in topic-based notes and dragged to the timeline
2. Scheduled as time blocks in daily notes
3. Referenced across notes using wiki-style links
4. Reordered with custom rankings
5. Filtered and organized hierarchically

The system uses a global task index that scans all files to maintain a unified task view, while preserving task definitions in their original locations.

---

## 1. How Tasks are Currently Stored and Referenced

### 1.1 Task Storage Format

All tasks are stored as **GitHub Flavored Markdown (GFM)** format in `.txt` files:

```markdown
- [ ] Open task
- [x] Completed task
- [-] Cancelled task
- [>] Scheduled/forwarded task
- [!] Important task
```

**Legacy Format (Auto-migrated):**
```markdown
[] Open task  (automatically converted to - [ ] Open task)
```

### 1.2 Task Metadata Extraction

Tasks parse several metadata patterns from text:

```markdown
- [ ] Task text >2025-10-20 #p1 #project @person
       │         │           │  │         └─ Mention
       │         │           │  └─────────── Priority tag
       │         │           └──────────── Scheduled date
       └─────────────────────────────── Task text
```

**Extracted Metadata:**
- **Status**: Open, Completed, Cancelled, Scheduled, Important
- **Date**: `>YYYY-MM-DD` format for scheduling
- **Priority**: `#p1`, `#p2`, `#p3`, `#p4` tags
- **Tags**: `#any-tag` format
- **Mentions**: `@person` format
- **Details**: Indented content after task (multi-line support)

### 1.3 Global Task Index

**File**: `/frontend/src/store/globalTaskStore.ts`

Maintains a global index of all tasks from all files:

```typescript
interface GlobalTaskStore {
  tasksByFile: Map<string, ParsedTask[]>;  // File path → tasks
  allGlobalTasks: ParsedTask[];             // Flat array of all tasks
  isIndexing: boolean;
  lastIndexTime: Date | null;
}
```

**Key Features:**
- Indexes both `Notes/` and `Calendar/` files
- Recursively searches for tasks including child tasks
- Auto-refreshes when files change
- Provides lookup by task ID
- Supports hierarchical task relationships

### 1.4 Task ID System

Task IDs are composite identifiers that ensure uniqueness:

```
taskId = `${filePath}-${lineNumber}`
Example: "Notes/project-x.txt-42"
```

---

## 2. Timeline/Calendar and Scheduling

### 2.1 Daily Note Structure

Daily notes created automatically with template in `Calendar/YYYYMMDD.txt`:

```markdown
# Monday, October 20, 2025

## Timeblocking
+ 08:00-09:00 Morning routine
+ 09:00-11:00 Deep work

## Tasks
* Items to complete
```

### 2.2 Time Block Format

Time blocks stored with start-end-description format:

```markdown
+ 09:00-10:30 Task description
- 10:30-11:00 Another task
```

Parsed as:

```typescript
interface TimeBlock {
  id: string;           // "09:00-10:30-{lineNumber}"
  start: string;        // "09:00"
  end: string;          // "10:30"
  duration: number;     // 90 (minutes)
  description: string;  // "Task description"
  line: number;         // Line in file
}
```

### 2.3 Calendar API

**Server** (`/src/routes/calendarRoutes.js`):
- `GET /api/calendar/daily/:date` - Get or create daily note
- `GET /api/calendar/timeblocks/:date` - Extract all time blocks
- `GET /api/calendar/range` - Get dates in range

**Frontend Store** (`calendarStore.ts`):
- `loadDailyNote(date)` - Load calendar file
- `loadTimeBlocks(date)` - Parse time blocks
- `addTimeBlock(block)` - Insert new time block
- `updateTimeBlock(id, updates)` - Modify existing time block

---

## 3. Drag-and-Drop Implementation

### 3.1 Architecture

**File**: `/frontend/src/components/DragDropProvider.tsx`

Uses `@dnd-kit` library:
- `DndContext` wraps entire app
- `useDraggable()` on task items
- `useDroppable()` on timeline and date cells
- Mouse position tracked globally for accurate drop calculation

### 3.2 Drag Sources

**TaskTreeItem.tsx** - Root-level tasks draggable:

```typescript
useSortable({
  id: task.id,
  disabled: !isRootTask,
  data: {
    type: 'sortable-task',
    task: ParsedTask,
  },
})
```

### 3.3 Drop Targets

| Target | Type | Handler |
|--------|------|---------|
| Timeline | `'timeline'` | Create time block reference |
| Date Cell | `'date-cell'` | Create task reference (no time) |
| Kanban Column | `'kanban-column'` | Update task status tag |
| TimeBlock | `'timeblock'` | Reposition time block |

### 3.4 Drop Position Calculation

**File**: `/frontend/src/utils/timeBlockUtils.ts`

```typescript
export function calculateTimeFromPosition(
  mouseY: number,
  timelineRect: { top: number; height: number }
): string {
  const HOUR_HEIGHT = 60;
  const relativeY = mouseY - timelineRect.top;
  const totalMinutes = (relativeY / HOUR_HEIGHT) * 60;
  
  // Snap to 15-minute intervals
  const snappedMinutes = Math.round(totalMinutes / 15) * 15;
  
  // Constrain to valid 24-hour range
  const constrainedMinutes = Math.max(0, Math.min(1440 - 60, snappedMinutes));
  
  return minutesToTime(constrainedMinutes);
}
```

---

## 4. Task Drop to Time Slot Flow

### 4.1 Drop Handler

**File**: `/frontend/src/components/DragDropProvider.tsx`, lines 221-258

```typescript
if (task && targetData?.type === 'timeline') {
  const targetDate = targetData.date as Date;
  const dropTime = calculateTimeFromPosition(mouseY, over.rect);
  
  // Default 1-hour duration
  const endTime = addMinutesToTime(dropTime, 60);
  
  await createTaskReferenceInDailyNote(task.id, targetDate, {
    id: `${task.id}-timeblock-${Date.now()}`,
    start: dropTime,
    end: endTime,
    duration: 60,
    taskRef: task.id,
    description: task.text
  });
}
```

### 4.2 Create Reference Function

**File**: `/frontend/src/hooks/useTasks.ts`, lines 90-153

1. Find task (search locally, then globally)
2. Load or create daily note for target date
3. Generate reference line: `+ 09:15-10:15 [[Task Name]] #timeblock`
4. Append to `## Timeblocking` section
5. Save file and update link index

### 4.3 Result in Daily Note

**Before:**
```markdown
## Timeblocking
+ 08:00-09:00 Morning routine
```

**After dropping "Build feature X" at 09:15:**
```markdown
## Timeblocking
+ 08:00-09:00 Morning routine
+ 09:15-10:15 [[Build feature X]] #timeblock
```

**Original Task Unchanged:**
```markdown
# Project X
- [ ] Build feature X #p1
```

---

## 5. Daily Notes and Task Relationships

### 5.1 Separation of Concerns

| Aspect | Definition | Reference |
|--------|-----------|-----------|
| **Location** | `Notes/*.txt` | `Calendar/YYYYMMDD.txt` |
| **Format** | `- [ ] Task text` | `* [[Task text]]` or `+ HH:MM [[Task text]]` |
| **Purpose** | Project tracking | Day planning |
| **Editing** | Update source | Change when scheduled |
| **Count** | Once per task | Multiple dates allowed |

### 5.2 Section Organization

Daily notes use level 2 headers:

```markdown
## Routines      - Recurring items
## Timeblocking  - Time-scheduled activities
## Tasks         - Day's to-do items
## Notes         - Free-form content
```

Each section appended via `appendToSection()` function.

### 5.3 Wiki Links in Daily Notes

Tasks referenced using wiki syntax:

```markdown
* [[Check in with team]]        # Simple reference
+ 14:00-15:00 [[Meeting]]       # Time-blocked reference
```

**Resolution**: Task name → searches global task index → finds in Notes file

---

## 6. Task Referencing System

### 6.1 Wiki Link System

**File**: `/frontend/src/services/linkService.ts`

Supports:
```markdown
[[Note Name]]           - Link to file
[[Note|Label]]          - Link with display text
[[Task Name]]           - Link to task
[[Parent > Child]]      - Link to subtask
```

**Resolution Order:**
1. Exact match with `.txt` extension
2. Without extension
3. Case-insensitive match
4. Partial match

### 6.2 Task Reference Index

Built from all files:

```typescript
buildTaskReferenceIndex(files, allTasks)
// Returns: Map<taskId, TaskReference[]>

interface TaskReference {
  id: string;                    // "path:lineNumber"
  taskId: string;                // Original task ID
  sourceFile: string;            // Where defined
  date: Date;                    // When scheduled
  timeBlock?: TimeBlockRef;      // Time details
  type: 'reference' | 'timeblock';
}
```

Example: Task "Build feature X" can appear in:
- `Calendar/20251020.txt` at 09:15-10:15
- `Calendar/20251021.txt` at 10:00-11:30
- `Calendar/20251023.txt` unscheduled

### 6.3 Backlink Tracking

**Store**: `/frontend/src/store/linkStore.ts`

Maintains bidirectional references:
```typescript
findBacklinks(targetFile)  // All files linking here
getTaskReferences(taskId)  // All dates task scheduled
buildLinkGraph()           // Full connectivity
```

---

## 7. Task and TimeBlock Data Models

### 7.1 ParsedTask Structure

```typescript
interface ParsedTask {
  // Identity
  id: string;                    // "filePath-lineNumber"
  file: string;                  // Source file
  line: number;                  // Source line
  
  // Content
  text: string;                  // Task description
  details?: string;              // Multi-line details
  hasDetails?: boolean;
  
  // Status (from checkbox)
  completed: boolean;            // - [x]
  scheduled: boolean;            // - [>]
  cancelled: boolean;            // - [-]
  important: boolean;            // - [!]
  
  // Metadata (extracted from text)
  date?: Date;                   // >YYYY-MM-DD
  priority?: 1 | 2 | 3 | 4;    // #p1-#p4
  mentions: string[];            // @person
  tags: string[];                // #tag
  
  // Hierarchy
  depth: number;                 // Indentation level
  parentId?: string;             // Parent task
  children: ParsedTask[];        // Child tasks
  
  // Ordering
  rank?: number;                 // Custom sort
}
```

### 7.2 TimeBlock Structure

```typescript
interface TimeBlock {
  id: string;                    // Unique identifier
  start: string;                 // "HH:MM" 24-hour format
  end: string;                   // "HH:MM"
  duration: number;              // Minutes
  description: string;           // Display text
  line: number;                  // In daily note
}

interface TimeBlockRef {
  id: string;
  start: string;
  end: string;
  duration: number;
  taskRef?: string;              // Points to task
}
```

### 7.3 Global Store Structure

```typescript
interface GlobalTaskStore {
  tasksByFile: Map<filePath, ParsedTask[]>;
  allGlobalTasks: ParsedTask[];
  isIndexing: boolean;
  lastIndexTime: Date | null;
}

// Access methods:
indexFile(path, content)         // Parse and index
getTaskById(taskId)              // Find by ID
getTasksByFile(filePath)         // Get from file
getAllTasks()                    // Flat list
```

---

## 8. Key Files and Functions

### Frontend Core

| File | Key Functions |
|------|----------------|
| `services/taskService.ts` | `parseTask()`, `parseTasksFromContent()`, `buildTaskHierarchy()`, `toggleTaskInContent()`, `updateTaskDateInContent()`, `updateTaskDetails()` |
| `services/linkService.ts` | `createTaskReference()`, `findTaskByName()`, `buildTaskReferenceIndex()` |
| `store/taskStore.ts` | `setTasks()`, `updateTask()`, `toggleSubtasks()` |
| `store/globalTaskStore.ts` | `indexFile()`, `getTaskById()`, `getAllTasks()` |
| `store/calendarStore.ts` | `loadDailyNote()`, `loadTimeBlocks()`, `addTimeBlock()`, `updateTimeBlock()` |
| `hooks/useTasks.ts` | `useTasks()`, `createTaskReferenceInDailyNote()` |
| `components/DragDropProvider.tsx` | `handleDragEnd()` - Routes all drag operations |
| `components/calendar/Timeline.tsx` | Renders timeline, manages drops |
| `utils/timeBlockUtils.ts` | `calculateTimeFromPosition()`, `parseTimeBlocks()` |
| `utils/dateUtils.ts` | `toNotePlanDate()`, `isCalendarFile()` |

### Backend

| File | Key Functions |
|------|----------------|
| `routes/calendarRoutes.js` | Calendar API endpoints |
| `services/fileService.js` | `getFile()`, `saveFile()` |
| `utils/timeBlockUtils.js` | `parseTimeBlocks()`, `findConflicts()` |

---

## 9. Complete Data Flow Example: Drag Task to Timeline

```
1. User drags "Build feature X" from Notes tab
   TaskTreeItem uses useSortable()
   → active.data = { type: 'sortable-task', task: ParsedTask }

2. User drags over Timeline component
   Timeline uses useDroppable(id='timeline')
   → Shows drop indicator at mouse Y position
   → Calls getTimeFromPixelPosition(y, 60px/hour)
   → Snaps to 15-minute intervals

3. User drops at 09:15
   DragDropProvider.handleDragEnd() fires
   → Detects: sourceData.type='sortable-task', targetData.type='timeline'
   → Calculates drop time: 09:15

4. Call createTaskReferenceInDailyNote(taskId, date, timeBlock)
   → Search: Find task in Notes file
   → Load: Get Calendar/20251020.txt (create if missing)
   → Generate: "+ 09:15-10:15 [[Build feature X]] #timeblock"
   → Append: To ## Timeblocking section
   → Save: api.saveFile() writes to disk

5. Frontend updates
   → calendarStore.refreshTimeBlocks()
   → Re-parse timeblocks from updated daily note
   → New TimeBlock component renders on timeline

Result:
- Original task in Notes/ unchanged
- Daily note now contains time-blocked reference
- One task can appear on multiple days with different times
```

---

## 10. Key Architectural Insights

### 10.1 File-First, Not Database

- Source of truth is always the `.txt` files
- No separate database
- File path + line number = task identity
- Enables external editing, version control, backup

### 10.2 Two-Level Task System

**Level 1: Source Tasks**
- Defined once in `Notes/*.txt`
- Contains all metadata and details
- Project-scoped

**Level 2: Scheduled References**
- Daily note entries pointing to source
- Lightweight pointers with time
- Day-scoped
- One task → multiple scheduled dates

### 10.3 Global Indexing with Local Authority

- Global store indexes all files
- Each file remains authoritative for its tasks
- Changes to source automatically visible everywhere
- No sync conflicts

### 10.4 Hierarchical Task Support

- Indentation-based hierarchy
- Recursively parsed into tree
- Only root tasks draggable (prevents orphaning)
- Search includes all levels

### 10.5 Non-Destructive References

- References via wiki links, not copies
- Updating source updates all references
- References can be deleted without losing task
- Multiple scheduling doesn't create data duplication

---

## 11. Notable Implementation Details

### 11.1 Task Parsing

**File**: `services/taskService.ts`

- Regex-based line parsing
- Supports both GFM and legacy NotePlan formats
- Auto-migrates legacy on file open
- Extracts dates, tags, mentions, priorities
- Parses indented task details

### 11.2 Drag Position Calculation

**File**: `utils/timeBlockUtils.ts`

- Tracks mouse position globally during drag
- Calculates position relative to timeline bounding rect
- Snaps to 15-minute intervals
- Constrains to 24-hour day (0:00-23:00)

### 11.3 Section-Based Insertion

**File**: `hooks/useTasks.ts`

- Finds header by matching exact text: `## Timeblocking`
- Inserts before next `##` or at end
- Creates section if missing
- Preserves all other content

### 11.4 Time Block Repositioning

**File**: `DragDropProvider.tsx`

- Detects timeblock-on-timeline drag
- Calculates new start/end times
- Updates via `updateTimeBlockInContent()`
- Only updates if time actually changed

---

## 12. Current Capabilities vs. Limitations

### Supported

✓ Task creation, completion, cancellation
✓ Task scheduling with dates
✓ Task priority levels (#p1-#p4)
✓ Task details and multi-line descriptions
✓ Hierarchical tasks (parent-child)
✓ Task references in daily notes
✓ Time block scheduling (1-hour default)
✓ Time block repositioning on timeline
✓ Cross-file task linking via wiki syntax
✓ Kanban board status tracking
✓ Global task index and search
✓ Custom task ordering/ranking
✓ Multiple day scheduling of same task

### Not Yet Implemented

✗ Recurring/repeating tasks
✗ Task dependencies (task A blocks task B)
✗ Automatic completion propagation
✗ Task templates or cloning
✗ Sub-minute time resolution
✗ Conflict detection with warnings
✗ Task reminders or notifications
✗ Time estimates vs. actual tracking
✗ Multi-user collaboration
✗ Task delegation/assignment
