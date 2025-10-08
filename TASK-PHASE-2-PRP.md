# PHASE 2 PRP: Kanban Board System

## Overview
Implement customizable Kanban boards with drag-drop, flexible status tags, and multiple board layouts.

## Goals
- ✅ Kanban board view showing ALL tasks
- ✅ Drag-drop tasks between custom columns
- ✅ Multiple saved board configurations
- ✅ Flexible status tag system (any tag can be a column)
- ✅ Board persistence in local config

## Board Configuration Model

```typescript
interface KanbanBoard {
  id: string;
  name: string;
  columns: KanbanColumn[];
  filterTags?: string[];  // Show only tasks with these tags
  sortBy?: 'priority' | 'date' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

interface KanbanColumn {
  id: string;
  name: string;
  tagFilter: string;  // e.g., "status-todo", "waiting", "review"
  color?: string;
  limit?: number;     // WIP limit (optional)
  order: number;
}

// Example boards
const exampleBoards: KanbanBoard[] = [
  {
    id: 'default',
    name: 'Default Flow',
    columns: [
      { id: '1', name: 'To Do', tagFilter: 'status-todo', order: 0 },
      { id: '2', name: 'In Progress', tagFilter: 'status-doing', order: 1 },
      { id: '3', name: 'Done', tagFilter: 'status-done', order: 2 }
    ],
    sortBy: 'priority'
  },
  {
    id: 'work',
    name: 'Work Projects',
    columns: [
      { id: '1', name: 'Backlog', tagFilter: 'work-backlog', order: 0 },
      { id: '2', name: 'Active', tagFilter: 'work-active', order: 1 },
      { id: '3', name: 'Review', tagFilter: 'work-review', order: 2 },
      { id: '4', name: 'Complete', tagFilter: 'work-done', order: 3 }
    ],
    filterTags: ['work'],  // Only show tasks with #work tag
    sortBy: 'date'
  }
];
```

## Board Storage

**Location:** `data/.kanban-boards.json` (hidden file)

**Format:**
```json
{
  "boards": [
    {
      "id": "default",
      "name": "Default Flow",
      "columns": [...],
      "sortBy": "priority",
      "createdAt": "2025-10-08T00:00:00Z",
      "updatedAt": "2025-10-08T00:00:00Z"
    }
  ],
  "activeBoard": "default",
  "version": 1
}
```

## Implementation Steps

### Step 1: Board Management System

#### 1a. Create boardService.ts

**Location:** `frontend/src/services/boardService.ts`

**Functions:**
```typescript
export const loadBoards = async (): Promise<KanbanBoard[]> => {
  // Load from backend API
};

export const saveBoard = async (board: KanbanBoard): Promise<void> => {
  // Save to backend
};

export const deleteBoard = async (boardId: string): Promise<void> => {
  // Delete from backend
};

export const getTasksForColumn = (
  tasks: ParsedTask[],
  column: KanbanColumn,
  boardFilters?: string[]
): ParsedTask[] => {
  // Filter tasks by column tag and board filters
};

export const updateTaskTags = (
  task: ParsedTask,
  oldTag: string,
  newTag: string
): ParsedTask => {
  // Replace tag in task's tag array
};
```

---

#### 1b. Create boardStore.ts

**Location:** `frontend/src/store/boardStore.ts`

**State:**
```typescript
interface BoardStore {
  boards: KanbanBoard[];
  activeBoard: KanbanBoard | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadBoards: () => Promise<void>;
  setActiveBoard: (boardId: string) => void;
  createBoard: (board: Omit<KanbanBoard, 'id'>) => Promise<void>;
  updateBoard: (boardId: string, updates: Partial<KanbanBoard>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  addColumn: (boardId: string, column: Omit<KanbanColumn, 'id'>) => void;
  removeColumn: (boardId: string, columnId: string) => void;
  reorderColumns: (boardId: string, columnIds: string[]) => void;
}
```

---

#### 1c. Backend API Endpoints

**Location:** `backend/routes/boardRoutes.js` (new file)

**Endpoints:**
- `GET /api/boards` - Get all boards
- `POST /api/boards` - Create new board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `GET /api/boards/active` - Get active board ID
- `PUT /api/boards/active` - Set active board

**Storage:** Read/write `data/.kanban-boards.json`

---

### Step 2: Core Components

#### 2a. KanbanBoard.tsx

**Location:** `frontend/src/components/kanban/KanbanBoard.tsx`

**Purpose:** Main board container with DnD context

**Structure:**
```tsx
export const KanbanBoard: React.FC = () => {
  const { activeBoard } = useBoardStore();
  const { tasks } = useTasks();
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    // Update task tags when dropped in new column
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4 overflow-x-auto">
        {activeBoard?.columns.map(column => (
          <KanbanColumn key={column.id} column={column} tasks={...} />
        ))}
      </div>
    </DndContext>
  );
};
```

**Features:**
- Horizontal scrolling for many columns
- Drag-drop context
- Loading state
- Empty state if no board selected

---

#### 2b. KanbanColumn.tsx

**Location:** `frontend/src/components/kanban/KanbanColumn.tsx`

**Purpose:** Individual column with drop zone

**Props:**
```typescript
interface KanbanColumnProps {
  column: KanbanColumn;
  tasks: ParsedTask[];
  boardFilters?: string[];
}
```

**Structure:**
```tsx
export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  boardFilters
}) => {
  const { setNodeRef } = useDroppable({ id: column.id });
  const columnTasks = getTasksForColumn(tasks, column, boardFilters);

  return (
    <div ref={setNodeRef} className="bg-gray-100 rounded-lg p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{column.name}</h3>
        <span className="text-sm text-gray-500">{columnTasks.length}</span>
      </div>

      <div className="space-y-2">
        {columnTasks.map(task => (
          <KanbanCard key={task.id} task={task} />
        ))}
      </div>

      {column.limit && columnTasks.length >= column.limit && (
        <div className="mt-2 text-xs text-red-600">
          WIP limit reached ({column.limit})
        </div>
      )}
    </div>
  );
};
```

**Features:**
- Drop zone highlighting
- Task count badge
- WIP limit warning
- Column color customization

---

#### 2c. KanbanCard.tsx

**Location:** `frontend/src/components/kanban/KanbanCard.tsx`

**Purpose:** Task card in board (different from list view)

**Props:**
```typescript
interface KanbanCardProps {
  task: ParsedTask;
}
```

**Structure:**
```tsx
export const KanbanCard: React.FC<KanbanCardProps> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded shadow-sm hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        {task.priority && <PriorityBadge priority={task.priority} size="sm" />}
        <p className="text-sm flex-1">{task.text}</p>
      </div>

      {task.children.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {task.children.length} subtask{task.children.length > 1 ? 's' : ''}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        {task.date && (
          <span className="text-xs text-gray-500">
            {format(task.date, 'MMM d')}
          </span>
        )}
        {task.tags.filter(t => !t.startsWith('status-')).map(tag => (
          <span key={tag} className="text-xs text-blue-600">#{tag}</span>
        ))}
      </div>
    </div>
  );
};
```

**Features:**
- Draggable handle
- Priority badge
- Subtask count
- Tags (excluding status tags)
- Due date
- Compact design

---

#### 2d. BoardSelector.tsx

**Location:** `frontend/src/components/kanban/BoardSelector.tsx`

**Purpose:** Dropdown to switch boards

**Structure:**
```tsx
export const BoardSelector: React.FC = () => {
  const { boards, activeBoard, setActiveBoard } = useBoardStore();

  return (
    <select
      value={activeBoard?.id}
      onChange={(e) => setActiveBoard(e.target.value)}
      className="px-3 py-2 border rounded"
    >
      {boards.map(board => (
        <option key={board.id} value={board.id}>
          {board.name}
        </option>
      ))}
    </select>
  );
};
```

---

### Step 3: Board Configuration UI

#### 3a. BoardEditor.tsx

**Location:** `frontend/src/components/kanban/BoardEditor.tsx`

**Purpose:** Create/edit board modal

**Features:**
- Board name input
- Filter tags selection
- Sort by dropdown
- Column management (add/remove/reorder)
- Save/Cancel buttons

---

#### 3b. ColumnEditor.tsx

**Location:** `frontend/src/components/kanban/ColumnEditor.tsx`

**Purpose:** Edit individual column settings

**Features:**
- Column name input
- Tag filter input (autocomplete from existing tags)
- Color picker
- WIP limit input (optional)
- Delete column button

---

### Step 4: Integration with Existing Views

#### 4a. Update Sidebar.tsx

**Location:** `frontend/src/components/layout/Sidebar.tsx`

**Changes:**
- Add "View" section with toggle buttons
- Options: List | Board | Calendar
- Active view highlighted
- Store view preference in localStorage

---

#### 4b. Update App.tsx

**Location:** `frontend/src/App.tsx`

**Changes:**
- Load boards on app init
- Route between views based on active view
- Sync view state across components

---

### Step 5: Drag-Drop Logic

**Key behaviors:**

1. **Drag Start:**
   - Visual feedback (card lifting, shadow)
   - Highlight valid drop zones

2. **Drag Over:**
   - Column highlights when card hovers
   - Show drop indicator

3. **Drop:**
   - Remove old status tag from task
   - Add new status tag
   - Update markdown file immediately
   - Animate card to new position

4. **File Update:**
```typescript
const handleDrop = async (taskId: string, newColumnTag: string) => {
  const task = tasks.find(t => t.id === taskId);
  const oldStatusTag = task.tags.find(t => t.startsWith('status-'));

  // Update markdown file
  const newContent = updateTaskTagInContent(
    currentFile.content,
    task.line,
    oldStatusTag,
    newColumnTag
  );

  await saveFile(currentFile.metadata.path, newContent);
};
```

---

## Technical Requirements

1. **Immediate file updates** - Drag-drop writes to markdown instantly
2. **Undo/redo support** - Can revert tag changes (future enhancement)
3. **Multi-tag handling** - Tasks can have multiple tags, only status changes
4. **Responsive design** - Minimum 1200px width for board view
5. **Performance** - Smooth drag with 100+ cards
6. **Persistence** - Board config survives app restart
7. **Conflict handling** - What if task already has target tag?

## Testing Plan

### Manual Tests
1. Create new board with custom name
2. Add 4 columns with different tag filters
3. Drag task from column A to B → tag updates in markdown
4. Check markdown file → old tag removed, new tag added
5. Reload app → board config persists
6. Delete board → files unchanged, config removed
7. Switch between boards → different columns appear
8. WIP limit: Add 6th task to column with limit 5 → warning appears

### Edge Cases
- Task with no status tag → appears in which column?
- Task with multiple status tags → appears in multiple columns?
- Drag task already in target column → no-op
- Delete column with tasks in it → tasks keep tag, just hidden
- Export board config to share with others

## Success Criteria

- ✅ Can define custom boards with 2-10 columns
- ✅ Drag-drop updates tags in markdown files
- ✅ Multiple boards saved and switchable via dropdown
- ✅ Kanban shows ALL tasks (not just scheduled)
- ✅ Smooth 60fps drag animations
- ✅ Board config persists across sessions
- ✅ Can create "Work", "Personal", "Projects" boards independently
- ✅ Tasks with #work tag only appear in "Work" board

## Timeline

**Estimated Time:** 2-3 weeks

**Breakdown:**
- Step 1 (Services & stores): 2-3 days
- Step 2 (Core components): 4-5 days
- Step 3 (Board editor UI): 2-3 days
- Step 4 (View integration): 1-2 days
- Step 5 (Drag-drop logic): 2-3 days
- Testing & Polish: 2-3 days

## Dependencies

**Required before starting:**
- Phase 1 complete (nested tasks, @dnd-kit installed)
- Task filtering working
- File save/load working

**Blocks:**
- Phase 3 (Calendar drag-drop) - needs kanban cards to be draggable to calendar

## Notes

- Consider adding "Untagged Tasks" column to catch tasks without status
- WIP limits are optional, could be Phase 4 feature
- Board templates (presets) could speed up setup
- Export/import board configs for sharing
- Consider swimlanes (horizontal grouping) in future

---

**Status:** 🔴 Not Started

**Last Updated:** 2025-10-08

**Next Step:** Create boardService.ts and data model
