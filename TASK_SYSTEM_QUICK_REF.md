# NotePlan Task System - Quick Reference

## Quick Links to Key Files

### Task Management
- **Parse tasks**: `/frontend/src/services/taskService.ts` - Line 156: `parseTask()`
- **Global index**: `/frontend/src/store/globalTaskStore.ts` - Line 31: `indexFile()`
- **Create reference**: `/frontend/src/services/linkService.ts` - Line 270: `createTaskReference()`

### Drag and Drop
- **Main handler**: `/frontend/src/components/DragDropProvider.tsx` - Line 67: `handleDragEnd()`
- **Position calc**: `/frontend/src/utils/timeBlockUtils.ts` - Line 314: `calculateTimeFromPosition()`
- **Timeline drop**: `/frontend/src/components/DragDropProvider.tsx` - Line 221: TYPE 4 handler

### Calendar/Timeline
- **Timeline render**: `/frontend/src/components/calendar/Timeline.tsx`
- **Calendar store**: `/frontend/src/store/calendarStore.ts` - Line 156: `loadTimeBlocks()`
- **API endpoints**: `/src/routes/calendarRoutes.js` - Line 19: `GET /daily/:date`

### Task References
- **Create in daily**: `/frontend/src/hooks/useTasks.ts` - Line 90: `createTaskReferenceInDailyNote()`
- **Add to section**: `/frontend/src/hooks/useTasks.ts` - Line 170: `appendToSection()`

---

## Task Storage Format (GFM)

```markdown
- [ ] Open task
- [x] Completed task
- [>] Scheduled task
- [-] Cancelled task
- [!] Important task
- [ ] Task >2025-10-20 #p1 #project @person
      Task description here (indented)
      More details...
```

---

## Time Block Format

```markdown
## Timeblocking
+ 09:00-10:30 Task description
- 10:30-11:00 Another task
+ 14:00-14:30 [[Reference to task]] #timeblock
```

---

## Key Data Structures

### Task ID
```
"{filePath}-{lineNumber}"
Example: "Notes/project.txt-42"
```

### ParsedTask
```typescript
{
  id: string,
  text: string,
  completed: boolean,
  date?: Date,
  priority?: 1|2|3|4,
  tags: string[],
  line: number,
  file: string,
  depth: number,
  children: ParsedTask[],
  details?: string
}
```

### TimeBlock
```typescript
{
  id: string,
  start: "09:00",
  end: "10:30",
  duration: 90,
  description: string,
  line: number
}
```

---

## Drop Zones and Handlers

| Zone | Type | Handler Location |
|------|------|------------------|
| Timeline | `'timeline'` | DragDropProvider.tsx:221 |
| Date Cell | `'date-cell'` | DragDropProvider.tsx:213 |
| Kanban Col | `'kanban-column'` | DragDropProvider.tsx:172 |
| TimeBlock | `'timeblock'` | DragDropProvider.tsx:123 |

---

## Drag Flow Summary

1. **Drag starts**: `TaskTreeItem` with `useSortable()`
2. **Over timeline**: `calculateTimeFromPosition()` snaps to 15-min
3. **Drop fires**: `DragDropProvider.handleDragEnd()`
4. **Create reference**: `createTaskReferenceInDailyNote()`
5. **Write to file**: Append to `## Timeblocking` section
6. **UI updates**: `calendarStore.refreshTimeBlocks()`

---

## File Organization

```
Notes/
  ├── project-x.txt        (source tasks)
  └── weekly-goals.txt

Calendar/
  ├── 20251020.txt         (daily note with references)
  ├── 20251021.txt
  └── 20251022.txt
```

---

## Two-Level Task System

### Level 1: Source Task (in Notes/)
```markdown
- [ ] Build feature X #p1 @alice
  Requirements:
  - Requirement 1
  - Requirement 2
```

### Level 2: Scheduled Reference (in Calendar/)
```markdown
+ 09:15-10:15 [[Build feature X]] #timeblock
```

- Source unchanged
- Reference points to source
- One task on multiple days allowed
- Updating source updates all references

---

## Critical Functions

### Parse
```typescript
parseTasksFromContent(content, filePath) → ParsedTask[]
parseTimeBlocks(content) → TimeBlock[]
```

### Create Reference
```typescript
createTaskReferenceInDailyNote(taskId, date, timeBlock?) → Promise
```

### Update
```typescript
toggleTaskInContent(content, lineNumber) → string
updateTimeBlockInContent(content, oldBlock, newBlock) → string
updateTaskDateInContent(content, lineNumber, date) → string
```

### Search
```typescript
useGlobalTaskStore().getTaskById(taskId) → ParsedTask
useGlobalTaskStore().getTasksByFile(filePath) → ParsedTask[]
```

---

## Drop Position Calculation

```typescript
// 1. Get mouse Y position
const mouseY = mousePositionRef.current.y

// 2. Get timeline bounds
const timelineRect = over.rect

// 3. Calculate relative position
const relativeY = mouseY - timelineRect.top

// 4. Convert to minutes
const totalMinutes = (relativeY / 60) * 60

// 5. Snap to 15-minute intervals
const snappedMinutes = Math.round(totalMinutes / 15) * 15

// 6. Convert to time string
return minutesToTime(snappedMinutes)  // Returns "09:15"
```

---

## Common Operations

### Toggle task completion
```typescript
const newContent = toggleTaskInContent(content, task.line)
await saveFile(filePath, newContent)
```

### Reschedule task
```typescript
const newContent = updateTaskDateInContent(content, task.line, newDate)
await saveFile(filePath, newContent)
```

### Create time block reference
```typescript
await createTaskReferenceInDailyNote(taskId, targetDate, {
  start: "09:15",
  end: "10:15",
  duration: 60,
  description: taskText
})
```

### Get all tasks across files
```typescript
const allTasks = useGlobalTaskStore().getAllTasks()
```

### Find specific task
```typescript
const task = useGlobalTaskStore().getTaskById(taskId)
```

---

## API Endpoints

```
GET /api/calendar/daily/:date
  Returns: FileData with auto-created template

GET /api/calendar/timeblocks/:date
  Returns: { timeBlocks, conflicts, totalDuration }

GET /api/calendar/range?start=20251020&end=20251031
  Returns: Array of date metadata
```

---

## Debugging Tips

### Check task parsing
```typescript
const tasks = parseTasksFromContent(content, filePath)
console.log('Parsed tasks:', tasks.map(t => t.text))
```

### Monitor drag operations
```typescript
// Already logged in DragDropProvider.handleDragEnd()
console.log('=== DRAG END ===', { activeType, overType, delta })
```

### Verify file saved
```typescript
const content = fs.readFileSync(path, 'utf-8')
expect(content).toContain('[[Task Name]]')
```

### Global task search
```typescript
const tasksByFile = useGlobalTaskStore().tasksByFile
tasksByFile.forEach((tasks, file) => {
  console.log(`${file}: ${tasks.length} tasks`)
})
```

---

## Testing Checklist

- [ ] Task parses from markdown correctly
- [ ] Hierarchy builds (parent-child relationships)
- [ ] Details extracted from indented lines
- [ ] Global index includes all files
- [ ] Drag drop calculates position correctly
- [ ] Reference created in daily note
- [ ] Original task unchanged after drag
- [ ] Multiple scheduling of same task works
- [ ] Time block repositioning updates file
- [ ] Section header created if missing

