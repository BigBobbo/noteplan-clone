# Phase 3: Calendar & Daily Notes - Product Requirements & Planning

## Overview

Phase 3 adds NotePlan's signature calendar functionality, including daily notes, date navigation, and timeline views for time blocking. This transforms the app from a general note-taker into a calendar-integrated productivity system.

**Goal:** Implement calendar views, automatic daily note creation, and timeline visualization for time blocks.

---

## Success Criteria

- ✅ Calendar picker for date navigation
- ✅ Daily notes auto-create on date selection
- ✅ Today/Yesterday/Tomorrow quick navigation
- ✅ Timeline view showing time blocks visually
- ✅ Drag-and-drop time block creation
- ✅ Separate Calendar folder from Notes folder
- ✅ Date-based file naming (YYYYMMDD.txt)
- ✅ Month/week view calendars

---

## Technical Specifications

### New Dependencies

```json
{
  "dependencies": {
    "react-calendar": "^4.6.0",
    "react-big-calendar": "^1.8.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "date-fns": "^2.30.0"
  }
}
```

Alternative: Build custom calendar (lighter weight)

---

## Architecture Updates

### New Components

```
src/
├── components/
│   ├── calendar/
│   │   ├── CalendarView.tsx       # Month/week calendar grid
│   │   ├── DatePicker.tsx         # Date selector
│   │   ├── DailyNote.tsx          # Daily note wrapper
│   │   ├── Timeline.tsx           # Time block timeline
│   │   ├── TimeBlock.tsx          # Individual time block
│   │   └── DateNavigator.tsx     # Today/Prev/Next buttons
│   ├── layout/
│   │   └── CalendarLayout.tsx    # Layout with timeline
├── hooks/
│   ├── useDailyNote.ts           # Daily note operations
│   ├── useTimeBlocks.ts          # Time block parsing
│   └── useCalendar.ts            # Calendar state
├── store/
│   └── calendarStore.ts          # Calendar-specific state
└── utils/
    ├── dateUtils.ts              # Date formatting/parsing
    └── timeBlockUtils.ts         # Time block utilities
```

---

## Detailed Requirements

### 1. Daily Note System

**Auto-creation Logic:**
```typescript
const getDailyNote = async (date: Date): Promise<File> => {
  const fileName = format(date, 'yyyyMMdd') + '.txt'
  const path = `Calendar/${fileName}`

  try {
    // Try to load existing
    const file = await api.get(`/api/files/${path}`)
    return file.data
  } catch (error) {
    // Create new daily note from template
    const template = await loadDailyTemplate()
    const content = renderTemplate(template, date)
    await api.post(`/api/files/${path}`, { content })
    return { path, content }
  }
}
```

**Daily Note Template:**
```markdown
---
title: ⏱️ Time Blocking Template
type: empty-note
date: {{date}}
---

## Routines
* Check [[Monthly Goals]]
* Check [[Weekly Calendar]]
* Check [[Waiting For]]

## Timeblocking
+ 08:00-09:00 Morning routine
+ 09:00-11:00 Deep work
+ 11:00-12:00 ...

## To Do
* Task 1
* Task 2

## Notes
```

### 2. Calendar View Component

**Month View:**
```tsx
<CalendarView mode="month">
  {/* Grid of days */}
  <div className="calendar-grid grid grid-cols-7">
    {days.map(day => (
      <CalendarDay
        key={day}
        date={day}
        hasNote={hasNoteForDate(day)}
        isToday={isToday(day)}
        onClick={() => openDailyNote(day)}
      />
    ))}
  </div>
</CalendarView>
```

**Features:**
- Visual indicator for days with notes (dot/badge)
- Highlight today's date
- Click day to open daily note
- Navigate months with arrows
- Quick jump to today

**Week View:**
```tsx
<CalendarView mode="week">
  {/* Vertical timeline with 7 columns */}
  <WeekTimeline
    startDate={startOfWeek}
    onTimeBlockClick={openDailyNote}
  />
</CalendarView>
```

### 3. Date Navigator

**Quick Navigation:**
```tsx
<DateNavigator>
  <button onClick={goToPrevDay}>← Previous</button>
  <DateDisplay date={currentDate} onClick={openDatePicker} />
  <button onClick={goToNextDay}>Next →</button>
  <button onClick={goToToday}>Today</button>
</DateNavigator>
```

**Keyboard Shortcuts:**
- `Cmd+T` - Go to today
- `Cmd+[` - Previous day
- `Cmd+]` - Next day
- `Cmd+Shift+D` - Open date picker

### 4. Timeline View

**Time Block Visualization:**
```
┌─────────────────────────────────────┐
│  Timeline - October 7, 2025         │
├─────┬───────────────────────────────┤
│ 8AM │ ████████ Morning Routine      │
│ 9AM │ ████████████████ Deep Work    │
│10AM │                                │
│11AM │ ████████ Planning              │
│12PM │                                │
│ 1PM │ ████████ Lunch                │
│ 2PM │ ████████████████ Meetings     │
│ 3PM │                                │
│ 4PM │ ████████ Review                │
│ 5PM │                                │
└─────┴───────────────────────────────┘
```

**Implementation:**
```tsx
const Timeline: React.FC = () => {
  const timeBlocks = useTimeBlocks(currentDate)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="timeline">
      {hours.map(hour => (
        <TimeSlot key={hour} hour={hour}>
          {timeBlocks
            .filter(block => block.startHour === hour)
            .map(block => (
              <TimeBlock
                key={block.id}
                block={block}
                onEdit={editBlock}
                onDelete={deleteBlock}
              />
            ))
          }
        </TimeSlot>
      ))}
    </div>
  )
}
```

**Time Block Parsing:**
```typescript
interface TimeBlock {
  id: string
  start: string      // "09:00"
  end: string        // "11:00"
  duration: number   // minutes
  description: string
  line: number       // line number in markdown
}

const parseTimeBlocks = (content: string): TimeBlock[] => {
  const regex = /^\+ (\d{2}:\d{2})-(\d{2}:\d{2}) (.+)$/gm
  const blocks: TimeBlock[] = []
  let match

  while ((match = regex.exec(content)) !== null) {
    const [_, start, end, description] = match
    blocks.push({
      id: nanoid(),
      start,
      end,
      duration: calculateDuration(start, end),
      description,
      line: content.substring(0, match.index).split('\n').length
    })
  }

  return blocks
}
```

### 5. Time Block Creation

**Drag-and-Drop:**
```tsx
const Timeline: React.FC = () => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: 'new-block',
  })

  const handleDrop = (hour: number) => {
    const newBlock = {
      start: `${hour.toString().padStart(2, '0')}:00`,
      end: `${(hour + 1).toString().padStart(2, '0')}:00`,
      description: 'New task'
    }
    addTimeBlock(newBlock)
  }

  return (
    <div>
      {/* Draggable "+" button or task */}
      {/* Drop zones on each hour slot */}
    </div>
  )
}
```

**Manual Entry:**
- Click empty time slot → Opens modal
- Enter start/end time + description
- Auto-format as `+ HH:MM-HH:MM Description`

### 6. Calendar Layout

**Layout Options:**

**Option A: Timeline as right pane**
```
┌──────────┬─────────────┬──────────────┐
│ Sidebar  │   Editor    │   Timeline   │
│ (Folders)│  (Content)  │ (Time blocks)│
└──────────┴─────────────┴──────────────┘
```

**Option B: Timeline above editor**
```
┌──────────┬────────────────────────────┐
│          │  Timeline (Horizontal)     │
│ Sidebar  ├────────────────────────────┤
│          │  Editor                    │
└──────────┴────────────────────────────┘
```

**Recommended: Option A** (matches NotePlan)

### 7. Calendar Store

**State Management:**
```typescript
interface CalendarStore {
  currentDate: Date
  view: 'day' | 'week' | 'month'
  timeBlocks: TimeBlock[]
  dailyNotes: Map<string, File>

  setDate: (date: Date) => void
  goToToday: () => void
  goToPrevious: () => void
  goToNext: () => void
  setView: (view: CalendarView) => void

  loadDailyNote: (date: Date) => Promise<void>
  addTimeBlock: (block: Omit<TimeBlock, 'id'>) => void
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void
  deleteTimeBlock: (id: string) => void
  syncTimeBlocksToNote: () => void
}
```

### 8. Backend API Extensions

**New Endpoints:**

```
GET /api/calendar/daily/:date
  - Get or create daily note
  - Params: date (YYYY-MM-DD or YYYYMMDD)
  - Returns: { path, content, created: boolean }

POST /api/calendar/daily
  - Create today's daily note
  - Returns: { path, content }

GET /api/calendar/range
  - Get all daily notes in date range
  - Query: ?start=2025-10-01&end=2025-10-31
  - Returns: [{ date, path, hasContent }]

GET /api/calendar/timeblocks/:date
  - Extract time blocks from daily note
  - Returns: [{ start, end, description }]
```

**Backend Implementation:**
```javascript
// calendarRoutes.js
router.get('/calendar/daily/:date', async (req, res) => {
  const { date } = req.params
  const fileName = formatDate(date, 'yyyyMMdd') + '.txt'
  const path = `Calendar/${fileName}`

  try {
    const file = await fileService.getFile(path)
    res.json({ ...file, created: false })
  } catch (error) {
    // Create new daily note
    const template = await loadTemplate('daily-note.md')
    const content = renderTemplate(template, { date })
    await fileService.saveFile(path, content)
    res.json({ path, content, created: true })
  }
})
```

---

## Implementation Steps

### Step 1: Backend Calendar API (6 hours)
1. Create calendar routes
2. Implement daily note creation
3. Add date range queries
4. Create default daily template
5. Test with Postman

### Step 2: Date Utilities (3 hours)
1. Create date formatting functions
2. Build date range generators
3. Add date validation
4. Test edge cases

### Step 3: Calendar Store (4 hours)
1. Set up Zustand store
2. Implement date navigation
3. Add daily note caching
4. Connect to API

### Step 4: Date Navigator Component (4 hours)
1. Build DateNavigator UI
2. Add keyboard shortcuts
3. Implement date picker
4. Style component

### Step 5: Calendar View (8 hours)
1. Build month grid
2. Add day indicators
3. Implement navigation
4. Build week view
5. Style both views

### Step 6: Timeline Component (10 hours)
1. Build timeline layout
2. Implement time slots
3. Parse time blocks
4. Render time blocks visually
5. Add hover effects
6. Style timeline

### Step 7: Time Block Management (8 hours)
1. Implement time block CRUD
2. Add drag-and-drop
3. Build creation modal
4. Sync to markdown
5. Handle conflicts

### Step 8: Calendar Layout (5 hours)
1. Update Layout component
2. Add timeline pane
3. Make resizable
4. Add show/hide toggle
5. Responsive design

### Step 9: Integration & Polish (6 hours)
1. Connect all components
2. Test date navigation
3. Test time block sync
4. Fix bugs
5. Add animations

**Total Estimated Time: 54 hours (~2-3 weeks part-time)**

---

## Data Flow

### Opening a Daily Note
```
User clicks date
  → calendarStore.setDate(date)
  → calendarStore.loadDailyNote(date)
    → api.get('/calendar/daily/20251007')
      → Backend checks if file exists
      → If not, creates from template
      → Returns file content
    → Parse time blocks
    → Update timeBlocks state
  → fileStore.setCurrentFile(dailyNote)
  → Editor displays content
  → Timeline displays time blocks
```

### Adding a Time Block
```
User drags task to 9 AM slot
  → Timeline.handleDrop(9)
  → calendarStore.addTimeBlock({ start: "09:00", end: "10:00", desc: "Task" })
  → Format as markdown: "+ 09:00-10:00 Task"
  → Insert into editor content
  → Auto-save triggers
  → Backend saves file
  → WebSocket broadcasts change
```

---

## UI Mockup Updates

### Calendar View
```
┌─────────────────────────────────────────────────────────────────┐
│  ← October 2025 →  [Today] [Week] [Month]          🔍 ⚙️ 🌙    │
├─────────────┬──────────────────────┬───────────────────────────┤
│             │                      │ ⏰ Timeline               │
│  📁 Notes   │ ## Today's Plan      │ ┌─────┬─────────────────┐ │
│  📁 Calendar│                      │ │ 8AM │                 │ │
│    • Oct 5  │ ## Routines          │ │ 9AM │ ████ Deep work  │ │
│    • Oct 6  │ * Check goals        │ │10AM │                 │ │
│    ● Oct 7  │                      │ │11AM │ ████ Planning   │ │
│    ○ Oct 8  │ ## Timeblocking      │ │12PM │                 │ │
│             │ + 09:00-11:00 Deep   │ │ 1PM │ ████ Lunch      │ │
│  [Calendar] │ + 11:00-12:00 Plan   │ │ 2PM │                 │ │
│  ┌───────┐  │                      │ │ 3PM │ ████████ Meet   │ │
│  │S M T W │  │ ## To Do             │ │ 4PM │                 │ │
│  │1 2 3 4│  │ * Task 1             │ │ 5PM │ ████ Review     │ │
│  │5 6 ●8│  │ * Task 2             │ └─────┴─────────────────┘ │
│  └───────┘  │                      │   [+ Add time block]      │
└─────────────┴──────────────────────┴───────────────────────────┘

Legend:
● = Today (filled circle)
• = Has notes (dot)
○ = Future/empty (empty circle)
```

---

## Special Features

### 1. Natural Language Time Entry
Future enhancement: Parse natural language
- "meeting at 2pm for 1 hour" → `+ 14:00-15:00 Meeting`
- "lunch 12-1" → `+ 12:00-13:00 Lunch`

### 2. Time Block Conflicts
Detect overlapping time blocks:
```typescript
const hasConflict = (newBlock: TimeBlock, existing: TimeBlock[]): boolean => {
  return existing.some(block =>
    (newBlock.start >= block.start && newBlock.start < block.end) ||
    (newBlock.end > block.start && newBlock.end <= block.end)
  )
}
```

Show warning icon on conflicts.

### 3. Weekly Review
Generate weekly summary:
- List all completed tasks
- Show time block totals
- Calculate productivity metrics

---

## Testing Strategy

### Unit Tests
- Date formatting/parsing
- Time block parsing
- Conflict detection
- Duration calculations

### Integration Tests
- Daily note creation flow
- Time block CRUD
- Calendar navigation
- Timeline rendering

### E2E Tests
- Navigate to date → Opens daily note
- Add time block → Saves to markdown
- Switch views → Maintains state

---

## Performance Considerations

1. **Cache daily notes** for current month
2. **Lazy load** past/future months
3. **Debounce** time block updates
4. **Virtual scrolling** for timeline (24 hours = many slots)
5. **Memoize** time block calculations

---

## Accessibility

- [ ] Keyboard navigation for calendar
- [ ] Arrow keys to change dates
- [ ] Screen reader support for timeline
- [ ] ARIA labels for time slots
- [ ] Focus management in date picker

---

## Phase 3 Deliverables

### Code
- [x] Calendar views (month, week)
- [x] Timeline component
- [x] Daily note automation
- [x] Time block management
- [x] Backend calendar API

### Documentation
- [x] Calendar user guide
- [x] Time blocking tutorial
- [x] API documentation updates

### Demo
- [x] Video showing date navigation
- [x] Video showing time block creation
- [x] Sample daily notes

---

## Transition to Phase 4

With Phase 3 complete, you have a calendar-integrated note app. Phase 4 adds:
- Advanced task management
- Bi-directional linking
- Full-text search
- Templates

---

*Phase 3 PRP Version: 1.0*
*Estimated Completion: 2-3 weeks*
*Dependencies: Phase 1, Phase 2*
