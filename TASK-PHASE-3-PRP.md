# PHASE 3 PRP: Calendar Integration & Advanced Drag-Drop

## Overview
Enable dragging tasks from kanban/list views to calendar dates and timeline slots, with reference-based linking that keeps original task in place.

## Goals
- ✅ Drag tasks from kanban/list to calendar dates
- ✅ Drag tasks to timeline slots (time blocking)
- ✅ Create task references in daily notes
- ✅ Multiple duration input methods (preset, range, text, drag)
- ✅ Bi-directional linking (task ↔ daily note)
- ✅ Link navigation system

## Reference System Design

### Original Task (in project note: `data/Notes/Projects/Q4 Planning.txt`)
```markdown
* [x] Write Q4 report #p1 #status-doing
    * Research data sources
    * Create outline
    * Write first draft
    * Review and edit
```

### Daily Note Reference (`data/Calendar/20251010.txt`)
```markdown
# 2025-10-10

## Time Blocks
+ 09:00-11:00 [[Write Q4 report]] #timeblock
+ 14:00-15:30 [[Write Q4 report > Create outline]] #timeblock

## Scheduled Tasks
* [[Write Q4 report]]
* [[Team meeting preparation]]

## Notes
Started the Q4 report today. Made good progress on research phase.
```

### Link Syntax
- `[[Task Name]]` - Links to original task (full match)
- `[[Parent Task > Child Task]]` - Links to specific subtask
- `+ HH:MM-HH:MM [[Task]] #timeblock` - Time blocked task reference
- Clicking link navigates to source file and scrolls to task

## Data Model Updates

```typescript
interface TaskReference {
  id: string;
  taskId: string;        // Original task ID (file:line)
  sourceFile: string;    // Where original task lives
  date: Date;            // Date referenced in
  timeBlock?: TimeBlock; // If time-blocked
  type: 'reference' | 'timeblock';
  createdAt: Date;
}

interface TimeBlock {
  id: string;
  start: string;    // "09:00" (24-hour format)
  end: string;      // "11:00"
  duration: number; // minutes (auto-calculated)
  taskRef?: string; // Reference to task
}

interface LinkedTask extends ParsedTask {
  references: TaskReference[];  // Which daily notes reference this
  isReference: boolean;          // Is this a reference link itself?
  originalTaskId?: string;       // If reference, points to original
}
```

## Implementation Steps

### Step 1: Link Service

#### 1a. Create linkService.ts

**Location:** `frontend/src/services/linkService.ts`

**Functions:**
```typescript
export const parseLinkFromText = (text: string): {
  taskName: string;
  subtaskName?: string;
} | null => {
  // Parse [[Task Name]] or [[Parent > Child]]
  const match = text.match(/\[\[([^\]]+)\]\]/);
  if (!match) return null;

  const [taskName, subtaskName] = match[1].split('>').map(s => s.trim());
  return { taskName, subtaskName: subtaskName || undefined };
};

export const findTaskByName = (
  tasks: ParsedTask[],
  taskName: string,
  subtaskName?: string
): ParsedTask | null => {
  // Search all tasks for matching name
  // If subtaskName provided, search within parent's children
};

export const createTaskReference = (
  task: ParsedTask,
  date: Date,
  timeBlock?: TimeBlock
): string => {
  // Generate markdown line for daily note
  if (timeBlock) {
    return `+ ${timeBlock.start}-${timeBlock.end} [[${task.text}]] #timeblock`;
  } else {
    return `* [[${task.text}]]`;
  }
};

export const buildLinkIndex = (files: FileMetadata[]): Map<string, TaskReference[]> => {
  // Scan all files for [[links]]
  // Build index: taskId -> [references]
  // Return bi-directional link map
};

export const getBacklinks = (taskId: string, linkIndex: Map): TaskReference[] => {
  // Get all daily notes that reference this task
};
```

---

#### 1b. Create linkStore.ts

**Location:** `frontend/src/store/linkStore.ts`

**State:**
```typescript
interface LinkStore {
  linkIndex: Map<string, TaskReference[]>;
  loading: boolean;

  // Actions
  buildIndex: () => Promise<void>;
  getBacklinks: (taskId: string) => TaskReference[];
  addReference: (taskId: string, reference: TaskReference) => void;
  navigateToTask: (taskId: string) => void;
}
```

---

### Step 2: Reference Creation

#### 2a. Update useTasks Hook

**Location:** `frontend/src/hooks/useTasks.ts`

**New methods:**
```typescript
const createTaskReference = async (
  taskId: string,
  targetDate: Date,
  timeBlock?: TimeBlock
) => {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  // Get or create daily note for targetDate
  const dailyNotePath = getDailyNotePath(targetDate);
  const dailyNote = await loadOrCreateDailyNote(dailyNotePath);

  // Add reference line to daily note
  const referenceLine = createTaskReference(task, targetDate, timeBlock);
  const updatedContent = appendToSection(
    dailyNote.content,
    timeBlock ? '## Time Blocks' : '## Scheduled Tasks',
    referenceLine
  );

  // Save daily note
  await saveFile(dailyNotePath, updatedContent);

  // Update link index
  linkStore.addReference(taskId, {
    id: generateId(),
    taskId,
    sourceFile: task.file,
    date: targetDate,
    timeBlock,
    type: timeBlock ? 'timeblock' : 'reference',
    createdAt: new Date()
  });
};
```

---

### Step 3: Duration Input Methods

#### 3a. Create TimeBlockDialog.tsx

**Location:** `frontend/src/components/calendar/TimeBlockDialog.tsx`

**Purpose:** Modal for creating time blocks with multiple input methods

**Structure:**
```tsx
export const TimeBlockDialog: React.FC<TimeBlockDialogProps> = ({
  task,
  date,
  onSave,
  onCancel
}) => {
  const [method, setMethod] = useState<'preset' | 'range' | 'duration'>('preset');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [duration, setDuration] = useState(60);

  return (
    <Modal>
      <h3>Time Block: {task.text}</h3>

      {/* Method selector */}
      <div className="tabs">
        <button onClick={() => setMethod('preset')}>Preset</button>
        <button onClick={() => setMethod('range')}>Time Range</button>
        <button onClick={() => setMethod('duration')}>Duration</button>
      </div>

      {/* Method A: Preset buttons */}
      {method === 'preset' && (
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => setDuration(30)}>30 min</button>
          <button onClick={() => setDuration(60)}>1 hour</button>
          <button onClick={() => setDuration(120)}>2 hours</button>
          <button onClick={() => setDuration(240)}>4 hours</button>
        </div>
      )}

      {/* Method B: Time range inputs */}
      {method === 'range' && (
        <div>
          <input type="time" value={start} onChange={e => setStart(e.target.value)} />
          <span>to</span>
          <input type="time" value={end} onChange={e => setEnd(e.target.value)} />
        </div>
      )}

      {/* Method C: Duration input */}
      {method === 'duration' && (
        <div>
          <input
            type="text"
            placeholder="e.g., 2h 30m or 150m"
            onChange={e => setDuration(parseDuration(e.target.value))}
          />
        </div>
      )}

      <div className="actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={() => onSave({ start, end, duration })}>Save</button>
      </div>
    </Modal>
  );
};
```

**Helper functions:**
```typescript
const parseDuration = (input: string): number => {
  // Parse "2h 30m" → 150 minutes
  // Parse "90m" → 90 minutes
  // Parse "1.5h" → 90 minutes
};

const calculateEndTime = (start: string, durationMinutes: number): string => {
  // "09:00" + 90 minutes → "10:30"
};
```

---

### Step 4: Timeline Enhancements

#### 4a. Update Timeline.tsx

**Location:** `frontend/src/components/calendar/Timeline.tsx`

**Changes needed:**

1. **Accept drops from external sources:**
```typescript
const { setNodeRef } = useDroppable({
  id: 'timeline',
  data: { type: 'timeline', date: currentDate }
});
```

2. **Add visual drop zones:**
```tsx
<div ref={setNodeRef} className="timeline">
  {hours.map(hour => (
    <div key={hour} className="hour-slot" data-hour={hour}>
      {/* Render existing time blocks */}
      {timeBlocks
        .filter(tb => tb.start.startsWith(hour))
        .map(tb => <TimeBlock block={tb} />)}

      {/* Drop zone indicator */}
      {isDraggingOver && <div className="drop-indicator" />}
    </div>
  ))}
</div>
```

3. **Snap to 15-minute increments:**
```typescript
const snapToInterval = (mouseY: number): string => {
  const hour = Math.floor(mouseY / hourHeight);
  const minutesInHour = (mouseY % hourHeight) / hourHeight * 60;
  const snappedMinutes = Math.round(minutesInHour / 15) * 15;
  return `${String(hour).padStart(2, '0')}:${String(snappedMinutes).padStart(2, '0')}`;
};
```

4. **Conflict detection:**
```typescript
const hasConflict = (newBlock: TimeBlock, existingBlocks: TimeBlock[]): boolean => {
  return existingBlocks.some(block => {
    const newStart = parseTime(newBlock.start);
    const newEnd = parseTime(newBlock.end);
    const blockStart = parseTime(block.start);
    const blockEnd = parseTime(block.end);

    return (newStart < blockEnd && newEnd > blockStart);
  });
};
```

---

#### 4b. Update TimeBlock.tsx

**Location:** `frontend/src/components/calendar/TimeBlock.tsx`

**Add resize handles:**
```tsx
export const TimeBlock: React.FC<TimeBlockProps> = ({ block, onUpdate }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: block.id
  });

  const handleResizeTop = (e: MouseEvent) => {
    // Adjust start time while keeping end fixed
  };

  const handleResizeBottom = (e: MouseEvent) => {
    // Adjust end time while keeping start fixed
  };

  return (
    <div
      ref={setNodeRef}
      className="time-block"
      style={{ top: calculateTop(block.start), height: calculateHeight(block.duration) }}
      {...attributes}
      {...listeners}
    >
      {/* Resize handle - top */}
      <div
        className="resize-handle-top"
        onMouseDown={handleResizeTop}
      />

      {/* Content */}
      <div className="time-block-content">
        <span className="time">{block.start} - {block.end}</span>
        {block.taskRef && (
          <span className="task-name">[[{getTaskName(block.taskRef)}]]</span>
        )}
      </div>

      {/* Resize handle - bottom */}
      <div
        className="resize-handle-bottom"
        onMouseDown={handleResizeBottom}
      />
    </div>
  );
};
```

---

### Step 5: Calendar Drag-Drop

#### 5a. Update CalendarView.tsx

**Location:** `frontend/src/components/calendar/CalendarView.tsx`

**Make date cells droppable:**
```tsx
const DateCell: React.FC<{ date: Date }> = ({ date }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `date-${format(date, 'yyyy-MM-dd')}`,
    data: { type: 'date', date }
  });

  return (
    <div
      ref={setNodeRef}
      className={`date-cell ${isOver ? 'drop-target' : ''}`}
    >
      <span className="date-number">{format(date, 'd')}</span>
      {/* Show mini indicators for tasks on this date */}
    </div>
  );
};
```

**Handle drops on calendar:**
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over) return;

  const taskId = active.id as string;
  const dropData = over.data.current;

  if (dropData?.type === 'date') {
    // Dropped on date cell - create reference
    await createTaskReference(taskId, dropData.date);
  } else if (dropData?.type === 'timeline') {
    // Dropped on timeline - show time block dialog
    setTimeBlockDialog({
      taskId,
      date: dropData.date,
      initialTime: dropData.time
    });
  }
};
```

---

### Step 6: Link Navigation

#### 6a. Create LinkRenderer Component

**Location:** `frontend/src/components/editor/LinkRenderer.tsx`

**Purpose:** Custom renderer for [[links]] in TipTap editor

**Implementation:**
```typescript
const LinkRenderer = Node.create({
  name: 'wikiLink',

  parseHTML() {
    return [{ tag: 'a.wiki-link' }];
  },

  renderHTML({ node }) {
    return ['a', {
      class: 'wiki-link',
      'data-task-id': node.attrs.taskId,
      href: '#'
    }, node.attrs.label];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('a');
      dom.classList.add('wiki-link');
      dom.textContent = node.attrs.label;
      dom.onclick = (e) => {
        e.preventDefault();
        linkStore.navigateToTask(node.attrs.taskId);
      };
      return { dom };
    };
  }
});
```

---

#### 6b. Link Navigation Logic

**Location:** `frontend/src/services/linkService.ts`

**Add navigation function:**
```typescript
export const navigateToTask = async (
  taskId: string,
  fileStore: FileStore,
  uiStore: UIStore
) => {
  // Parse taskId (format: "filepath:lineNumber")
  const [filePath, lineNumber] = taskId.split(':');

  // Load file
  await fileStore.loadFile(filePath);

  // Scroll to line in editor
  uiStore.scrollToLine(parseInt(lineNumber));

  // Highlight task temporarily
  uiStore.highlightLine(parseInt(lineNumber), 2000);
};
```

---

#### 6c. Backlinks Panel

**Location:** `frontend/src/components/sidebar/BacklinksPanel.tsx`

**Purpose:** Show which daily notes reference the current task

**Structure:**
```tsx
export const BacklinksPanel: React.FC<{ taskId: string }> = ({ taskId }) => {
  const { getBacklinks } = useLinkStore();
  const backlinks = getBacklinks(taskId);

  if (backlinks.length === 0) {
    return <div className="text-gray-500">No references</div>;
  }

  return (
    <div className="backlinks-panel">
      <h4 className="font-semibold mb-2">Referenced in:</h4>
      <ul className="space-y-1">
        {backlinks.map(ref => (
          <li key={ref.id}>
            <a
              href="#"
              onClick={() => navigateToFile(getDailyNotePath(ref.date))}
              className="text-blue-600 hover:underline"
            >
              {format(ref.date, 'MMM d, yyyy')}
            </a>
            {ref.timeBlock && (
              <span className="text-gray-500 text-sm ml-2">
                {ref.timeBlock.start}-{ref.timeBlock.end}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

## Technical Requirements

1. **Fast link parsing** - Index 1000+ files in <100ms
2. **Preserve formatting** - References maintain markdown structure
3. **Handle renames** - Update all references when task text changes
4. **Fuzzy matching** - Handle slight differences in task names
5. **Conflict detection** - Warn about overlapping time blocks
6. **Performance** - Smooth drag from kanban to calendar (60fps)
7. **Data integrity** - Never lose original task when creating reference

## Testing Plan

### Manual Tests
1. Drag task from kanban to calendar date → reference appears in daily note
2. Drag task to timeline → time block dialog opens
3. Select "2 hours" preset → time block created
4. Type "1h 30m" in duration input → 90-minute block created
5. Drag time block handles → duration updates
6. Click [[link]] in daily note → navigates to original task
7. Check backlinks panel → shows all references
8. Overlapping blocks → warning appears
9. Rename task → all references update

### Edge Cases
- Task with special characters in name (`[`, `]`, `>`)
- Task moved to different file (references break?)
- Daily note doesn't exist yet (auto-create)
- Multiple tasks with same name (disambiguation)
- Delete original task (references become broken links)
- Time block spans midnight (00:00 rollover)

## Success Criteria

- ✅ Drag from board to calendar creates `[[reference]]` in daily note
- ✅ Original task stays in source file untouched
- ✅ Links are clickable and navigate to source
- ✅ All 4 duration input methods work (preset, range, text, drag)
- ✅ Time blocks render correctly on timeline
- ✅ Resize handles adjust duration
- ✅ Backlinks panel shows all references
- ✅ No data loss or file corruption during reference creation
- ✅ Performance: 1000 files indexed in <100ms

## Timeline

**Estimated Time:** 3-4 weeks

**Breakdown:**
- Step 1 (Link service): 3-4 days
- Step 2 (Reference creation): 2-3 days
- Step 3 (Duration inputs): 2-3 days
- Step 4 (Timeline enhancements): 3-4 days
- Step 5 (Calendar drag-drop): 2-3 days
- Step 6 (Link navigation): 2-3 days
- Testing & Polish: 3-4 days

## Dependencies

**Required before starting:**
- Phase 1 complete (nested tasks, drag-drop)
- Phase 2 complete (kanban boards)
- Calendar view working
- Timeline view working

**Blocks:**
- Nothing (Phase 4 is independent)

## Notes

- Consider link validation on file load (warn about broken links)
- Future: Graph view showing task relationships
- Future: Smart suggestions when creating time blocks
- Future: Recurring time blocks (e.g., "Daily standup" every weekday 9am)
- Future: Time block templates ("Morning routine" = multiple blocks)

---

**Status:** 🔴 Not Started

**Last Updated:** 2025-10-08

**Next Step:** Create linkService.ts and define link parsing logic
