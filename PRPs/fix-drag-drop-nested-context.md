# Product Requirements Plan: Fix Drag-and-Drop Nested Context Conflict

**Version:** 1.0
**Date:** 2025-10-20
**Status:** Ready for Implementation
**Author:** System Generated
**Project:** NotePlan Clone - Fix Drag-and-Drop Functionality

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Analysis](#2-problem-analysis)
3. [Root Cause](#3-root-cause)
4. [Solution Architecture](#4-solution-architecture)
5. [Implementation Plan](#5-implementation-plan)
6. [Technical Requirements](#6-technical-requirements)
7. [Testing Strategy](#7-testing-strategy)
8. [Validation Gates](#8-validation-gates)
9. [References](#9-references)

---

## 1. Executive Summary

### Problem Statement

The drag-and-drop functionality has stopped working across the application:
- ❌ Tasks cannot be reordered in the Tasks tab
- ❌ Tasks cannot be dragged to kanban columns
- ❌ Tasks cannot be dragged to calendar timeline
- ❌ Tasks cannot be scheduled via drag-and-drop

### Root Cause

**Nested `DndContext` conflict**: The application has two DndContext providers - a global one in `DragDropProvider.tsx` and a local one in `TaskList.tsx`. According to @dnd-kit documentation and best practices, nested DndContext providers cause conflicts where:

1. Draggable and droppable elements only work within their own context
2. Events are captured by the innermost context and never reach parent contexts
3. Cross-context drag operations fail silently

### Solution

**Consolidate to a single DndContext**: Remove the nested context from `TaskList.tsx` and integrate task reordering functionality into the global `DragDropProvider.tsx`. Use `useDndMonitor()` for local state management and handle multiple drag types (kanban, calendar, task reordering) in one unified handler.

### Success Criteria

- ✅ Tasks can be reordered via drag-and-drop in Tasks tab
- ✅ Tasks can be dragged to kanban columns
- ✅ Tasks can be dragged to calendar timeline
- ✅ All drag operations work smoothly without conflicts
- ✅ No regression in existing functionality

---

## 2. Problem Analysis

### Current Architecture (Broken)

```
App
└── DragDropProvider (Global DndContext)
    ├── children
    │   ├── Kanban Board
    │   │   └── KanbanCard (useDraggable)
    │   ├── Calendar
    │   │   └── Timeline (useDroppable)
    │   └── Tasks Tab
    │       └── TaskList (Local DndContext) ⚠️ CONFLICT
    │           └── TaskTreeItem (useSortable)
```

**Issues:**
1. TaskList creates a nested DndContext
2. TaskTreeItem's useSortable only works within the local context
3. KanbanCard's drag events can't reach TaskList's drop zone
4. TaskTreeItem can't be dragged to Timeline or KanbanColumn

### Evidence of the Problem

**From codebase analysis:**

**DragDropProvider.tsx (lines 140-144)**:
```typescript
<DndContext
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
```

**TaskList.tsx (lines 123-142)** - THE PROBLEM:
```typescript
<DndContext
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={sortedTasks.map((t) => t.id)}
    strategy={verticalListSortingStrategy}
  >
```

**From @dnd-kit documentation research:**
> "When nesting DndContext providers, useDroppable and useDraggable hooks will only have access to other draggable and droppable nodes within that same context, and events will be captured by the first DndContext that contains a Sensor activated by that event."

Source: https://github.com/clauderic/dnd-kit/discussions/766

### What Was Working Before

The drag-and-drop task reordering was implemented in commit `040712f` and initially appeared to work, but:
1. It only worked in isolation (tasks within tasks tab)
2. It broke cross-context operations (tasks → kanban, tasks → calendar)
3. The nested context was an architectural issue from the start

---

## 3. Root Cause

### Technical Explanation

**@dnd-kit Architecture Constraint:**
- Each draggable/droppable element must belong to exactly ONE DndContext
- Nested contexts create isolated drag-and-drop zones
- Events don't propagate across context boundaries

**Current Implementation Violates This:**
```typescript
// Global context
<DndContext onDragEnd={globalHandler}>
  <App>
    {/* ... */}
    {/* Local context - NESTED! */}
    <DndContext onDragEnd={localHandler}>
      <TaskList />
    </DndContext>
  </App>
</DndContext>
```

**Result:**
- When dragging TaskTreeItem, only the local context sees it
- When dragging KanbanCard, only the global context sees it
- Cross-context drops fail silently

### Why This Happened

The original PRP (PRPs/task-drag-drop-reordering.md) suggested creating a local DndContext without realizing:
1. A global DragDropProvider already existed
2. Nested contexts are incompatible with @dnd-kit
3. The solution should have been integration, not isolation

---

## 4. Solution Architecture

### Unified Single-Context Pattern

**Strategy**: Use ONE DndContext in DragDropProvider and handle multiple drag types:

```typescript
// DragDropProvider.tsx
<DndContext
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  {children}

  <DragOverlay>
    {activeTask && <TaskDragOverlay task={activeTask} />}
  </DragOverlay>
</DndContext>
```

**TaskList.tsx** - NO nested DndContext:
```typescript
// Just SortableContext, no DndContext
<SortableContext
  items={sortedTasks.map((t) => t.id)}
  strategy={verticalListSortingStrategy}
>
  {sortedTasks.map((task) => (
    <TaskTreeItem key={task.id} task={task} />
  ))}
</SortableContext>
```

### Drag Type Detection

**In handleDragEnd:**
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  const sourceData = active.data.current;
  const targetData = over?.data.current;

  // Detect drag type from data
  if (sourceData?.type === 'sortable-task' && targetData?.type === 'sortable-task') {
    // Task reordering
    handleTaskReorder(active, over);
  } else if (sourceData?.task && targetData?.type === 'kanban-column') {
    // Task → Kanban
    handleKanbanDrop(active, over);
  } else if (sourceData?.task && targetData?.type === 'timeline') {
    // Task → Calendar
    handleTimelineDrop(active, over);
  }
};
```

### State Management

**Use useDndMonitor for local state:**
```typescript
// In TaskList.tsx
const TaskList = () => {
  const [localDragState, setLocalDragState] = useState(null);

  useDndMonitor({
    onDragStart(event) {
      if (event.active.data.current?.type === 'sortable-task') {
        setLocalDragState(event);
      }
    },
    onDragEnd() {
      setLocalDragState(null);
    },
  });

  // ...rest of component
};
```

---

## 5. Implementation Plan

### Phase 1: Remove Nested Context (Priority 1)

**Files to modify:**
1. `frontend/src/components/tasks/TaskList.tsx`
2. `frontend/src/components/DragDropProvider.tsx`

**Tasks:**

1. **Remove local DndContext from TaskList** (TaskList.tsx)
   - Remove DndContext import from @dnd-kit/core
   - Remove DndContext wrapper (lines 123-142)
   - Keep SortableContext (it works within parent context)
   - Keep handleDragEnd logic but move it to DragDropProvider

2. **Update TaskTreeItem data for type detection** (TaskTreeItem.tsx)
   - Add type field to useSortable data:
   ```typescript
   useSortable({
     id: task.id,
     disabled: !isRootTask,
     data: {
       type: 'sortable-task',  // NEW
       task,                    // Keep existing
     },
   });
   ```

3. **Integrate task reordering into DragDropProvider** (DragDropProvider.tsx)
   - Import useTaskOrderStore
   - Import arrayMove from @dnd-kit/sortable
   - Add task reordering handler to handleDragEnd
   - Handle SortableContext operations

### Phase 2: Unified Drag Handling (Priority 1)

**Update handleDragEnd in DragDropProvider.tsx:**

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveTask(null);

  if (!over) return;

  const sourceData = active.data.current;
  const targetData = over.data.current;

  // TYPE 1: Task reordering (sortable within TaskList)
  if (sourceData?.type === 'sortable-task' && targetData?.type === 'sortable-task') {
    handleTaskReorder(active.id, over.id);
    return;
  }

  // TYPE 2: Task → Kanban column
  if (sourceData?.task && targetData?.type === 'kanban-column') {
    handleKanbanDrop(sourceData.task, targetData.column);
    return;
  }

  // TYPE 3: Task → Calendar date cell
  if (sourceData?.task && targetData?.type === 'date-cell') {
    handleDateCellDrop(sourceData.task, targetData.date);
    return;
  }

  // TYPE 4: Task → Timeline
  if (sourceData?.task && targetData?.type === 'timeline') {
    handleTimelineDrop(sourceData.task, targetData.date);
    return;
  }
};

// Helper: Task reordering
const handleTaskReorder = (activeId: string, overId: string) => {
  const { reorderTasks } = useTaskOrderStore.getState();
  const { currentFile } = useFileStore.getState();
  const { allTasks } = useTasks();  // Get from context

  if (!currentFile) return;

  const rootTasks = allTasks.filter(t => t.depth === 0);
  const sortedTasks = [...rootTasks].sort((a, b) =>
    (a.rank ?? a.line) - (b.rank ?? b.line)
  );

  const oldIndex = sortedTasks.findIndex(t => t.id === activeId);
  const newIndex = sortedTasks.findIndex(t => t.id === overId);

  if (oldIndex === -1 || newIndex === -1) return;

  const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);
  reorderTasks(currentFile.metadata.path, newOrder);
};
```

### Phase 3: Visual Feedback (Priority 2)

**Update DragOverlay:**
```typescript
<DragOverlay>
  {activeTask && (
    <div className="opacity-80 rotate-2 shadow-lg">
      <KanbanCard task={activeTask} />
    </div>
  )}
</DragOverlay>
```

### Phase 4: Testing & Validation (Priority 1)

**Manual Testing Checklist:**
- [ ] Task reordering in Tasks tab works
- [ ] Task → Kanban column works
- [ ] Task → Calendar date cell works
- [ ] Task → Timeline works
- [ ] Visual feedback during all drag operations
- [ ] No console errors
- [ ] Works across all filters (All, Active, Today, etc.)

---

## 6. Technical Requirements

### TR-1: Remove Nested DndContext

**File: `frontend/src/components/tasks/TaskList.tsx`**

**Before (lines 123-142):**
```typescript
<DndContext
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={sortedTasks.map((t) => t.id)}
    strategy={verticalListSortingStrategy}
  >
    <div className="space-y-1">
      {sortedTasks.map((task) => (
        <TaskTreeItem
          key={task.id}
          task={task}
          onToggle={toggleTask}
          onReschedule={handleReschedule}
        />
      ))}
    </div>
  </SortableContext>
</DndContext>
```

**After:**
```typescript
<SortableContext
  items={sortedTasks.map((t) => t.id)}
  strategy={verticalListSortingStrategy}
>
  <div className="space-y-1">
    {sortedTasks.map((task) => (
      <TaskTreeItem
        key={task.id}
        task={task}
        onToggle={toggleTask}
        onReschedule={handleReschedule}
      />
    ))}
  </div>
</SortableContext>
```

**Remove these imports:**
```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
```

**Remove handleDragEnd function** (lines 76-90) - move logic to DragDropProvider

**Remove useTaskOrderStore import** (line 8) - no longer used locally

### TR-2: Update TaskTreeItem Data

**File: `frontend/src/components/tasks/TaskTreeItem.tsx`**

**Before (lines 48-51):**
```typescript
useSortable({
  id: task.id,
  disabled: !isRootTask,
});
```

**After:**
```typescript
useSortable({
  id: task.id,
  disabled: !isRootTask,
  data: {
    type: 'sortable-task',
    task,
  },
});
```

### TR-3: Integrate Task Reordering into DragDropProvider

**File: `frontend/src/components/DragDropProvider.tsx`**

**Add imports:**
```typescript
import { arrayMove } from '@dnd-kit/sortable';
import { useTaskOrderStore } from '../store/taskOrderStore';
import { useTasks } from '../hooks/useTasks';
```

**Update handleDragEnd (lines 47-120):**

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  setActiveTask(null);

  if (!over) return;

  const sourceData = active.data.current;
  const targetData = over.data.current;

  // TYPE 1: Task reordering within TaskList (SortableContext)
  if (sourceData?.type === 'sortable-task' && targetData?.type === 'sortable-task') {
    await handleTaskReorder(active.id, over.id);
    return;
  }

  // TYPE 2: Task → Kanban column (existing logic)
  if (sourceData?.task && targetData?.type === 'kanban-column') {
    const task = sourceData.task as ParsedTask;
    const targetColumn = targetData.column as KanbanColumn;

    const isNoStatusColumn = targetColumn.tagFilter === '__no_status__';
    const taskHasNoStatus = !task.tags.some((tag) => tag.startsWith('status-'));

    if (isNoStatusColumn && taskHasNoStatus) return;
    if (!isNoStatusColumn && task.tags.includes(targetColumn.tagFilter)) return;

    const oldStatusTag = task.tags.find((tag) => tag.startsWith('status-'));
    const lines = currentFile.content.split('\n');
    const line = lines[task.line];

    if (!line) return;

    let newLine = line;
    if (oldStatusTag) {
      newLine = newLine.replace(`#${oldStatusTag}`, '').trim();
    }
    if (!isNoStatusColumn) {
      newLine = `${newLine} #${targetColumn.tagFilter}`;
    }

    lines[task.line] = newLine;
    await saveFile(currentFile.metadata.path, lines.join('\n'));
    return;
  }

  // TYPE 3: Task → Calendar date cell (existing logic)
  if (sourceData?.task && targetData?.type === 'date-cell') {
    const task = sourceData.task as ParsedTask;
    const targetDate = targetData.date as Date;
    await createTaskReferenceInDailyNote(task.id, targetDate);
    return;
  }

  // TYPE 4: Task → Timeline (existing logic)
  if (sourceData?.task && targetData?.type === 'timeline') {
    const task = sourceData.task as ParsedTask;
    const targetDate = targetData.date as Date;
    setTimeBlockDialog({
      task,
      date: targetDate,
      initialTime: '09:00',
    });
  }
};

// Helper function: Handle task reordering
const handleTaskReorder = async (activeId: string, overId: string) => {
  const { reorderTasks } = useTaskOrderStore.getState();

  if (!currentFile) return;

  // Get all tasks from the store
  const { allTasks } = useTasks();

  // Filter to root-level tasks only
  const rootTasks = allTasks.filter((t) => t.depth === 0);

  // Sort by rank
  const sortedTasks = [...rootTasks].sort((a, b) => {
    const rankA = a.rank ?? a.line;
    const rankB = b.rank ?? b.line;
    return rankA - rankB;
  });

  // Find indices
  const oldIndex = sortedTasks.findIndex((t) => t.id === activeId);
  const newIndex = sortedTasks.findIndex((t) => t.id === overId);

  if (oldIndex === -1 || newIndex === -1) return;

  // Reorder
  const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);

  // Update store
  reorderTasks(currentFile.metadata.path, newOrder);
};
```

**Problem with above approach**: Can't use `useTasks()` hook inside handleDragEnd. Need alternative.

**Better approach**: Pass allTasks via context or get from taskStore directly:

```typescript
const handleTaskReorder = async (activeId: string, overId: string) => {
  const { reorderTasks } = useTaskOrderStore.getState();
  const { tasks } = useTaskStore.getState();  // Get from store, not hook

  if (!currentFile) return;

  const rootTasks = tasks.filter((t) => t.depth === 0);
  const sortedTasks = [...rootTasks].sort((a, b) =>
    (a.rank ?? a.line) - (b.rank ?? b.line)
  );

  const oldIndex = sortedTasks.findIndex((t) => t.id === activeId);
  const newIndex = sortedTasks.findIndex((t) => t.id === overId);

  if (oldIndex === -1 || newIndex === -1) return;

  const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);
  reorderTasks(currentFile.metadata.path, newOrder);
};
```

### TR-4: Update KanbanCard to Include Task Data

**File: `frontend/src/components/kanban/KanbanCard.tsx`**

**Ensure data includes task** (should already be there, verify):
```typescript
const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
  id: task.id,
  data: {
    task,  // Make sure this is present
  },
});
```

---

## 7. Testing Strategy

### Unit Tests (Future Enhancement)

**Test DragDropProvider handlers:**
```typescript
describe('DragDropProvider', () => {
  it('should handle task reordering', () => {
    const event = {
      active: { id: 'task-2', data: { current: { type: 'sortable-task' } } },
      over: { id: 'task-1', data: { current: { type: 'sortable-task' } } },
    };

    handleDragEnd(event);

    // Verify reorderTasks was called
    expect(mockReorderTasks).toHaveBeenCalled();
  });

  it('should handle kanban column drop', () => {
    const event = {
      active: { id: 'task-1', data: { current: { task: mockTask } } },
      over: { id: 'column-1', data: { current: { type: 'kanban-column', column: mockColumn } } },
    };

    handleDragEnd(event);

    // Verify file was updated
    expect(mockSaveFile).toHaveBeenCalled();
  });
});
```

### Integration Tests

**Test drag-and-drop workflows:**
1. Create test note with tasks
2. Simulate drag events
3. Verify state changes
4. Verify file persistence

### Manual Testing Checklist

**Task Reordering:**
- [ ] Drag task to top of list
- [ ] Drag task to bottom of list
- [ ] Drag task between two tasks
- [ ] Verify visual feedback during drag
- [ ] Verify order persists after refresh
- [ ] Test with filters (All, Active, Today)

**Task → Kanban:**
- [ ] Drag task to "Backlog" column
- [ ] Drag task to "In Progress" column
- [ ] Drag task to "Done" column
- [ ] Verify status tag updates in file
- [ ] Verify task moves to correct column

**Task → Calendar:**
- [ ] Drag task to date cell
- [ ] Verify task reference created in daily note
- [ ] Drag task to timeline
- [ ] Verify time block dialog appears
- [ ] Complete time block creation

**Edge Cases:**
- [ ] Drag child task (should be disabled)
- [ ] Drag task outside all drop zones (should cancel)
- [ ] Drag during rapid file switches
- [ ] Drag with 100+ tasks

**Visual Feedback:**
- [ ] DragOverlay shows during drag
- [ ] Cursor changes appropriately
- [ ] Drop zones highlight on hover
- [ ] Smooth transitions

---

## 8. Validation Gates

### Gate 1: Type Checking

```bash
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend
npm run build
```

**Expected**: No TypeScript errors

### Gate 2: Development Server

```bash
# Terminal 1 - Backend
cd /Users/robertocallaghan/Documents/claude/noteapp
node src/server.js

# Terminal 2 - Frontend
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend
npm run dev
```

**Expected**: Both servers start without errors

### Gate 3: Manual Testing

**Open app in browser**: http://localhost:5173/

**Test sequence:**
1. Open Tasks tab
2. Drag task to new position → ✅ Should reorder
3. Open Kanban tab
4. Drag task to different column → ✅ Should move
5. Open Calendar tab
6. Drag task to timeline → ✅ Should show time block dialog
7. Drag task to date cell → ✅ Should create reference

**Expected**: All 4 drag operations work smoothly

### Gate 4: Persistence Check

```bash
# After reordering tasks, check localStorage
localStorage.getItem('taskOrder:Notes/test.txt')
```

**Expected**: JSON object with task ranks

**Refresh browser and verify:**
- [ ] Task order preserved
- [ ] No console errors
- [ ] All drag operations still work

### Gate 5: No Regressions

**Test existing features:**
- [ ] Task checkbox toggle works
- [ ] Task filters work (All, Active, Completed, etc.)
- [ ] Task details expand/collapse
- [ ] Reset Order button works
- [ ] Kanban columns filter correctly
- [ ] Calendar views render correctly

---

## 9. References

### Codebase Files

**Current Implementation (Before Fix):**
- `frontend/src/components/DragDropProvider.tsx` - Global DndContext (lines 21-162)
- `frontend/src/components/tasks/TaskList.tsx` - Local DndContext (PROBLEM: lines 123-142)
- `frontend/src/components/tasks/TaskTreeItem.tsx` - useSortable (lines 48-51)
- `frontend/src/components/kanban/KanbanCard.tsx` - useDraggable (lines 21-26)
- `frontend/src/components/calendar/Timeline.tsx` - useDroppable (lines 17-23)
- `frontend/src/store/taskOrderStore.ts` - Rank management (lines 1-114)
- `frontend/src/hooks/useTasks.ts` - Apply ranks (lines 190-201)

**Original PRP:**
- `PRPs/task-drag-drop-reordering.md` - Task reordering feature spec

### External Documentation

**@dnd-kit Documentation:**
- DndContext: https://docs.dndkit.com/api-documentation/context-provider
- Sortable: https://docs.dndkit.com/presets/sortable
- useSortable: https://docs.dndkit.com/presets/sortable/usesortable
- useDraggable: https://docs.dndkit.com/api-documentation/draggable/usedraggable
- useDroppable: https://docs.dndkit.com/api-documentation/droppable/usedroppable

**GitHub Discussions:**
- Nested DndContext issues: https://github.com/clauderic/dnd-kit/discussions/766
- Cross-context drag operations: https://github.com/clauderic/dnd-kit/issues/1570
- Single context pattern: https://github.com/clauderic/dnd-kit/issues/58

**Best Practices:**
- Use single DndContext at app root
- Use useDndMonitor for local state management
- Detect drag type via data.current.type
- Handle multiple drag types in one handleDragEnd

### Git Commits

- `040712f` - Add drag-and-drop task reordering (introduced the problem)
- `fa378b1` - Add command palette (no impact on drag-and-drop)

---

## Implementation Order

1. ✅ **Update TaskTreeItem.tsx** - Add type and task to data (SAFE, no breaking changes)
2. ✅ **Update DragDropProvider.tsx** - Add task reordering handler (adds new functionality)
3. ✅ **Remove nested DndContext from TaskList.tsx** - Remove conflict (FIX)
4. ✅ **Test all drag operations** - Validate fix works
5. ✅ **Verify persistence** - Ensure ranks still save/load
6. ✅ **Check for regressions** - All features still work

---

## Confidence Score: 9/10

**Reasoning:**
- ✅ Clear root cause identified (nested DndContext)
- ✅ Well-documented solution pattern (single context)
- ✅ Existing infrastructure can be reused (DragDropProvider)
- ✅ Comprehensive understanding of all drag types
- ✅ Clear implementation steps with validation gates
- ⚠️ Minor complexity in accessing task state in handler (solvable via taskStore.getState())

**Risks:**
- Low: TypeScript errors if data types not correctly updated
- Low: State synchronization if taskStore doesn't have latest tasks
- Medium: Edge cases with rapid drag operations

**Mitigation:**
- Thorough TypeScript checking at each step
- Use Zustand's getState() for synchronous access
- Extensive manual testing of all scenarios

---

## Next Steps

1. Review and approve this PRP
2. Create backup branch before changes
3. Implement Phase 1 (remove nested context)
4. Run validation gates after each phase
5. Test all drag-and-drop scenarios
6. Verify no regressions in existing features
7. Commit with descriptive message

---

**PRP Generated:** 2025-10-20
**Confidence Level:** 9/10
**Estimated Implementation Time:** 2-3 hours (single developer)

This PRP provides comprehensive context for one-pass implementation success, including:
- ✅ Detailed problem analysis with evidence
- ✅ Clear root cause explanation
- ✅ Specific code changes with before/after examples
- ✅ Step-by-step implementation plan
- ✅ Executable validation gates
- ✅ Comprehensive testing strategy
- ✅ References to @dnd-kit documentation and best practices
- ✅ Risk mitigation strategies
