# Product Requirements Plan: Task Drag-and-Drop Reordering

**Version:** 1.0
**Date:** October 9, 2025
**Status:** Ready for Implementation
**Author:** System Generated
**Project:** NotePlan Clone - Task Tab Custom Ordering

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background & Context](#2-background--context)
3. [Goals & Objectives](#3-goals--objectives)
4. [User Stories](#4-user-stories)
5. [Functional Requirements](#5-functional-requirements)
6. [Technical Requirements](#6-technical-requirements)
7. [Implementation Plan](#7-implementation-plan)
8. [Data Flow](#8-data-flow)
9. [Testing Strategy](#9-testing-strategy)
10. [Success Metrics](#10-success-metrics)
11. [Risks & Mitigation](#11-risks--mitigation)
12. [Appendix](#12-appendix)

---

## 1. Executive Summary

### Overview
This PRP defines the requirements for implementing drag-and-drop reordering functionality in the Task Tab. Users will be able to manually reorder tasks independently of their position in the base note, with the custom order persisting across sessions.

### Problem Statement
Currently, tasks in the Task Tab are displayed in the order they appear in the base note (by line number). Users cannot:
- Reorder tasks to match their workflow priorities
- Group related tasks visually without modifying the source note
- Maintain a custom task order that differs from the note structure
- Prioritize tasks visually through manual ordering

This limitation forces users to either:
1. Accept the note's natural order (which may not match task priority)
2. Manually reorder tasks in the base note (disrupting note organization)
3. Use workarounds like priority tags (less intuitive than visual ordering)

### Solution
Implement drag-and-drop task reordering using the existing `@dnd-kit/sortable` library with rank-based persistence. The solution will:
- Allow users to drag tasks to reorder them in the Task Tab
- Store custom ordering separately from note content (using localStorage)
- Preserve the base note structure (no changes to note content)
- Automatically assign ranks to maintain stable ordering
- Handle edge cases (new tasks, deleted tasks, filter changes)

### Success Criteria
- Users can drag any task to any position in the Task Tab
- Custom order persists across browser sessions
- Drag operations feel smooth and responsive (<100ms)
- No modifications to base note content
- Works seamlessly with existing task filters
- Handles hierarchical tasks (parent-child relationships)

---

## 2. Background & Context

### Current State

**Task Data Structure** (from `taskService.ts:3-22`):
```typescript
export interface ParsedTask extends Task {
  id: string;              // "{filePath}-{lineNumber}"
  text: string;
  completed: boolean;
  priority?: 1 | 2 | 3 | 4;
  date?: Date;
  tags: string[];
  mentions: string[];
  line: number;            // Line number in source file
  file: string;            // Source file path
  parentId?: string;       // For hierarchical tasks
  children: ParsedTask[];  // Nested subtasks
  depth: number;           // Indentation level (0-based)
}
```

**Current Ordering Logic**:
- Tasks parsed line-by-line from note content (taskService.ts:156-174)
- Displayed in order of line numbers
- Hierarchy built based on indentation depth (taskService.ts:50-87)
- No custom ordering capability

**Existing Drag-and-Drop Infrastructure**:
- `@dnd-kit/core` v6.3.1 already installed
- `@dnd-kit/sortable` v10.0.0 already installed
- `@dnd-kit/utilities` v3.2.2 already installed
- `DragDropProvider` component wraps app (DragDropProvider.tsx:21-162)
- Kanban board uses drag-and-drop for moving tasks between columns
- Pattern established in `KanbanCard.tsx:12-18` using `useDraggable`

**Storage Patterns**:
- `folderStore.ts:226-228` demonstrates localStorage usage for UI state
- Expansion states persisted: `localStorage.setItem('folderExpansion', ...)`
- Initialization pattern at bottom of store file (folderStore.ts:248-264)

### Why This Matters
1. **Workflow Optimization**: Users need to prioritize tasks differently than note organization
2. **Visual Clarity**: Manual ordering provides immediate visual feedback of priority
3. **Flexibility**: Separates task management from note structure
4. **User Expectation**: Drag-to-reorder is a standard pattern in task management apps

### Inspiration from Other Tools
- **Todoist**: Drag tasks to reorder within projects, custom order persists
- **Things 3**: Manual ordering with automatic rank assignment
- **NotePlan (macOS)**: Supports task reordering in Today view
- **Asana**: Drag-and-drop with visual feedback and smooth animations

---

## 3. Goals & Objectives

### Primary Goals
1. **Enable Manual Reordering**: Allow users to drag tasks to desired positions
2. **Persist Custom Order**: Maintain order across sessions independently of note content
3. **Maintain Data Integrity**: Never modify the base note content
4. **Leverage Existing Patterns**: Use established drag-and-drop infrastructure

### Secondary Goals
1. **Smooth UX**: Provide visual feedback during drag operations
2. **Handle Filters**: Maintain custom order when switching between filter views
3. **Support Hierarchy**: Handle parent-child task relationships correctly
4. **Performance**: Ensure responsive drag operations (<100ms response)

### Non-Goals (Out of Scope)
- Reordering tasks in the base note itself
- Multi-task selection and batch reordering
- Automatic sorting by priority/date/tags
- Drag-and-drop between different files
- Touch/mobile gesture support (desktop-first)
- Keyboard-based reordering (future enhancement)

---

## 4. User Stories

### Epic 1: Basic Drag-and-Drop Reordering

**US-1.1**: As a user, I want to drag a task to a new position in the Task Tab so I can prioritize it visually.
- **Acceptance Criteria:**
  - Hovering over task shows drag handle cursor
  - Dragging task shows visual preview
  - Dropping task updates position immediately
  - Other tasks shift to make space
  - Custom order persists after page refresh

**US-1.2**: As a user, I want visual feedback during drag operations so I know where the task will land.
- **Acceptance Criteria:**
  - Dragged task has semi-transparent appearance
  - Drop target shows visual indicator (border/highlight)
  - Smooth animation when other tasks shift position
  - Clear visual distinction between drag source and drop target

**US-1.3**: As a user, I want my custom task order to persist across sessions so I don't lose my organization.
- **Acceptance Criteria:**
  - Task order saved to localStorage after each reorder
  - Order restored on page load
  - Works across browser tabs (shared localStorage)
  - Gracefully handles localStorage quota limits

### Epic 2: Filter Integration

**US-2.1**: As a user, I want custom ordering to work with task filters so I can reorder within filtered views.
- **Acceptance Criteria:**
  - Can reorder tasks in "Active" filter view
  - Can reorder tasks in "Today" filter view
  - Can reorder tasks in "Completed" filter view
  - Switching filters preserves custom order
  - Tasks maintain relative order when filter changes

**US-2.2**: As a user, I want new tasks to appear in a sensible default position so my custom order isn't disrupted.
- **Acceptance Criteria:**
  - New tasks appear at bottom of list (lowest rank)
  - Can immediately drag new task to desired position
  - Existing tasks retain their relative order

### Epic 3: Hierarchy Support

**US-3.1**: As a user, I want to reorder parent tasks while preserving their subtasks so hierarchy is maintained.
- **Acceptance Criteria:**
  - Dragging parent task moves all children with it
  - Children maintain their relative order to parent
  - Cannot drag child out of parent's context
  - Visual indication of parent-child relationship during drag

### Epic 4: Edge Cases & Cleanup

**US-4.1**: As a user, I want deleted tasks to be removed from custom ordering so storage doesn't bloat.
- **Acceptance Criteria:**
  - Deleting task removes its rank from storage
  - Storage is periodically cleaned of orphaned ranks
  - No performance degradation over time

**US-4.2**: As a user, I want a way to reset to default order so I can start fresh if needed.
- **Acceptance Criteria:**
  - "Reset Order" option in Task tab menu
  - Confirmation dialog before reset
  - Tasks return to line-number order
  - Custom ranks cleared from storage

---

## 5. Functional Requirements

### FR-1: Drag-and-Drop Interaction
- **ID**: FR-1
- **Priority**: P0 (Critical)
- **Description**: Enable drag-and-drop reordering of tasks
- **Specifications**:
  - Tasks can be dragged via entire task row (not just drag handle)
  - Smooth drag preview with semi-transparent appearance
  - Drop zones indicated with visual feedback (border highlight)
  - Auto-scroll when dragging near top/bottom of scrollable area
  - Support for keyboard modifiers (Escape to cancel drag)
- **Acceptance Criteria**:
  - Drag initiates after 8px movement (prevents accidental drags)
  - Drop completes in <100ms
  - Visual feedback appears within 50ms of drag start
  - Works with mouse and trackpad

### FR-2: Rank-Based Ordering System
- **ID**: FR-2
- **Priority**: P0 (Critical)
- **Description**: Assign numeric ranks to tasks for stable ordering
- **Specifications**:
  - Each task assigned a floating-point rank value
  - Ranks stored in Map: `Map<taskId, rank>`
  - New tasks get rank = max(existing ranks) + 1000
  - Reordered tasks get rank = average of surrounding ranks
  - Re-ranking triggered when rank values get too close (<0.001)
- **Example**:
  ```
  Initial:  Task A (1000), Task B (2000), Task C (3000)
  Move B between A and C:
    Task A (1000), Task B (1500), Task C (3000)
  Move C to top:
    Task C (500), Task A (1000), Task B (1500)
  ```
- **Acceptance Criteria**:
  - Sorting by rank produces correct visual order
  - Ranks remain stable across reorders
  - Re-ranking triggered at appropriate threshold
  - No rank collisions

### FR-3: Persistence Layer
- **ID**: FR-3
- **Priority**: P0 (Critical)
- **Description**: Store and retrieve custom task ordering
- **Specifications**:
  - Storage key: `taskOrder:{currentFilePath}` (separate order per file)
  - Data format: `{ taskId: rank, ... }`
  - Save on every reorder operation
  - Load on component mount and file change
  - Cleanup orphaned entries periodically (every 100 operations)
- **Storage Schema**:
  ```typescript
  interface TaskOrderStorage {
    [filePath: string]: {
      [taskId: string]: number; // rank
      _lastUpdated: number;      // timestamp
    }
  }
  ```
- **Acceptance Criteria**:
  - Order persists across page refreshes
  - Order persists across browser tabs
  - Storage updates complete in <50ms
  - Graceful handling of storage quota exceeded

### FR-4: Filter Compatibility
- **ID**: FR-4
- **Priority**: P1 (High)
- **Description**: Maintain custom ordering across filter changes
- **Specifications**:
  - Apply custom ordering before filtering
  - Filtered tasks maintain relative order
  - Reordering within filtered view updates global ranks
  - Switching filters doesn't disrupt custom order
- **Behavior**:
  ```
  Global order: A(100), B(200), C(300), D(400)
  Active filter: [B, D]
  Display order: B, D (relative order preserved)
  Reorder to: D, B
  Global order: A(100), C(300), D(350), B(400)
  ```
- **Acceptance Criteria**:
  - All filters respect custom ordering
  - Reordering in filtered view affects global order correctly
  - No visual jumps when switching filters

### FR-5: Hierarchy Handling
- **ID**: FR-5
- **Priority**: P1 (High)
- **Description**: Handle parent-child task relationships
- **Specifications**:
  - Only root-level tasks can be reordered
  - Dragging parent moves all children as a group
  - Children cannot be dragged out of parent context
  - Children maintain their relative order
  - Subtask expansion state preserved during reorder
- **Acceptance Criteria**:
  - Parent-child relationship preserved
  - Children move with parent
  - No orphaned child tasks
  - Expansion state unchanged after reorder

### FR-6: Visual Feedback
- **ID**: FR-6
- **Priority**: P1 (High)
- **Description**: Provide clear visual feedback during drag operations
- **Specifications**:
  - **Drag Source**: 50% opacity, cursor: grabbing
  - **Drag Overlay**: Full opacity, slight shadow, follows cursor
  - **Drop Target**: Blue border (2px solid), light blue background
  - **Other Tasks**: Smooth transition (250ms) when shifting position
  - **Scroll**: Auto-scroll when dragging within 50px of edge
- **Acceptance Criteria**:
  - Feedback appears within 50ms
  - Animations smooth (no jank)
  - Clear visual distinction between states
  - Accessible (works with reduced motion preference)

### FR-7: Reset Functionality
- **ID**: FR-7
- **Priority**: P2 (Medium)
- **Description**: Allow users to reset to default ordering
- **Specifications**:
  - "Reset Task Order" button in task filters area
  - Confirmation dialog: "Reset task order to default? This cannot be undone."
  - Clears all custom ranks for current file
  - Tasks return to line-number order
  - Toast notification: "Task order reset to default"
- **Acceptance Criteria**:
  - Button clearly labeled and discoverable
  - Confirmation prevents accidental resets
  - Reset completes immediately
  - Visual update smooth

---

## 6. Technical Requirements

### TR-1: Data Model Extensions

**Extend ParsedTask Interface**:
```typescript
// frontend/src/services/taskService.ts
export interface ParsedTask extends Task {
  // ... existing fields ...
  rank?: number; // NEW: Custom ordering rank
}
```

**Add Task Ordering Store**:
```typescript
// frontend/src/store/taskOrderStore.ts
import { create } from 'zustand';

interface TaskOrderStore {
  // Map of file path -> task ranks
  taskRanks: Map<string, Map<string, number>>;

  // Actions
  setTaskRank: (filePath: string, taskId: string, rank: number) => void;
  getTaskRank: (filePath: string, taskId: string) => number | undefined;
  reorderTasks: (filePath: string, taskIds: string[]) => void;
  resetOrder: (filePath: string) => void;
  cleanupOrphans: (filePath: string, validTaskIds: string[]) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}
```

### TR-2: Drag-and-Drop Integration

**Wrap TaskList with SortableContext**:
```typescript
// frontend/src/components/tasks/TaskList.tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';

export const TaskList: React.FC = () => {
  const { tasks } = useTasks();
  const { reorderTasks } = useTaskOrderStore();
  const [sortedTasks, setSortedTasks] = useState(tasks);

  // Sort tasks by rank
  useEffect(() => {
    const sorted = [...tasks].sort((a, b) => {
      const rankA = a.rank ?? a.line;
      const rankB = b.rank ?? b.line;
      return rankA - rankB;
    });
    setSortedTasks(sorted);
  }, [tasks]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = sortedTasks.findIndex(t => t.id === active.id);
      const newIndex = sortedTasks.findIndex(t => t.id === over.id);
      const newOrder = arrayMove(sortedTasks, oldIndex, newIndex);
      reorderTasks(currentFile.path, newOrder.map(t => t.id));
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {sortedTasks.map(task => <SortableTaskItem key={task.id} task={task} />)}
      </SortableContext>
    </DndContext>
  );
};
```

**Convert TaskTreeItem to Sortable**:
```typescript
// frontend/src/components/tasks/TaskTreeItem.tsx (MODIFIED)
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const TaskTreeItem: React.FC<TaskTreeItemProps> = ({ task, ... }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* existing task content */}
    </div>
  );
};
```

### TR-3: Rank Calculation Algorithm

```typescript
// frontend/src/utils/rankCalculator.ts

/**
 * Calculate new rank for task being moved to specific position
 */
export const calculateNewRank = (
  targetIndex: number,
  tasks: ParsedTask[]
): number => {
  // Moving to top
  if (targetIndex === 0) {
    const firstRank = tasks[0]?.rank ?? 1000;
    return firstRank - 1000;
  }

  // Moving to bottom
  if (targetIndex >= tasks.length) {
    const lastRank = tasks[tasks.length - 1]?.rank ?? 0;
    return lastRank + 1000;
  }

  // Moving between two tasks
  const prevRank = tasks[targetIndex - 1]?.rank ?? 0;
  const nextRank = tasks[targetIndex]?.rank ?? prevRank + 2000;
  return (prevRank + nextRank) / 2;
};

/**
 * Re-rank all tasks with evenly distributed values
 * Called when ranks get too close together
 */
export const reRankTasks = (tasks: ParsedTask[]): Map<string, number> => {
  const ranks = new Map<string, number>();
  const step = 1000;

  tasks.forEach((task, index) => {
    ranks.set(task.id, (index + 1) * step);
  });

  return ranks;
};

/**
 * Check if re-ranking is needed
 */
export const needsReRanking = (tasks: ParsedTask[]): boolean => {
  for (let i = 0; i < tasks.length - 1; i++) {
    const diff = Math.abs((tasks[i].rank ?? 0) - (tasks[i + 1].rank ?? 0));
    if (diff < 0.001) return true;
  }
  return false;
};
```

### TR-4: localStorage Persistence Layer

```typescript
// frontend/src/utils/taskOrderStorage.ts

const STORAGE_KEY_PREFIX = 'taskOrder:';
const CLEANUP_INTERVAL = 100; // operations between cleanups
let operationCount = 0;

export interface TaskOrderData {
  [taskId: string]: number; // rank
  _lastUpdated: number;
}

export const saveTaskOrder = (filePath: string, ranks: Map<string, number>): void => {
  try {
    const data: TaskOrderData = {
      ...Object.fromEntries(ranks),
      _lastUpdated: Date.now(),
    };

    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${filePath}`,
      JSON.stringify(data)
    );

    operationCount++;
    if (operationCount >= CLEANUP_INTERVAL) {
      cleanupOldEntries();
      operationCount = 0;
    }
  } catch (error) {
    console.error('Failed to save task order:', error);
    // Handle quota exceeded
    if (error.name === 'QuotaExceededError') {
      cleanupOldEntries();
      // Retry save
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${filePath}`, JSON.stringify(data));
      } catch (retryError) {
        console.error('Failed to save after cleanup:', retryError);
      }
    }
  }
};

export const loadTaskOrder = (filePath: string): Map<string, number> => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${filePath}`);
    if (!stored) return new Map();

    const data: TaskOrderData = JSON.parse(stored);
    const { _lastUpdated, ...ranks } = data;

    return new Map(Object.entries(ranks).map(([k, v]) => [k, Number(v)]));
  } catch (error) {
    console.error('Failed to load task order:', error);
    return new Map();
  }
};

export const clearTaskOrder = (filePath: string): void => {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${filePath}`);
};

/**
 * Remove entries older than 30 days
 */
const cleanupOldEntries = (): void => {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  Object.keys(localStorage).forEach(key => {
    if (!key.startsWith(STORAGE_KEY_PREFIX)) return;

    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      if (data._lastUpdated && (now - data._lastUpdated > thirtyDaysMs)) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      // Remove corrupted entries
      localStorage.removeItem(key);
    }
  });
};
```

### TR-5: Integration with Existing DragDropProvider

**Update DragDropProvider** to handle task reordering:
```typescript
// frontend/src/components/DragDropProvider.tsx (MODIFIED)

const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  // ... existing kanban/calendar logic ...

  // NEW: Handle task reordering in Task Tab
  if (targetData?.type === 'task-reorder') {
    // Handled by TaskList's own DndContext
    return;
  }
};
```

### TR-6: File References

**Files to Create**:
1. `frontend/src/store/taskOrderStore.ts` - Zustand store for task ordering
2. `frontend/src/utils/rankCalculator.ts` - Rank calculation utilities
3. `frontend/src/utils/taskOrderStorage.ts` - localStorage persistence

**Files to Modify**:
1. `frontend/src/components/tasks/TaskList.tsx` - Add drag-and-drop context
2. `frontend/src/components/tasks/TaskTreeItem.tsx` - Make sortable
3. `frontend/src/services/taskService.ts` - Add rank field to interface
4. `frontend/src/hooks/useTasks.ts` - Apply ranks to tasks
5. `frontend/src/components/tasks/TaskFilters.tsx` - Add reset button

**Dependencies** (already installed):
- `@dnd-kit/core@6.3.1`
- `@dnd-kit/sortable@10.0.0`
- `@dnd-kit/utilities@3.2.2`

---

## 7. Implementation Plan

### Phase 1: Core Infrastructure (Days 1-2)

**Goal**: Set up rank-based ordering system

**Tasks**:
1. Create `taskOrderStore.ts`
   - Define store interface
   - Implement rank getters/setters
   - Add reorder logic
   - Add cleanup utilities

2. Create `rankCalculator.ts`
   - Implement `calculateNewRank()`
   - Implement `reRankTasks()`
   - Implement `needsReRanking()`
   - Add unit tests

3. Create `taskOrderStorage.ts`
   - Implement save/load functions
   - Add cleanup logic
   - Handle quota exceeded errors

4. Extend `ParsedTask` interface
   - Add optional `rank?: number` field
   - Update type exports

**Deliverable**: Backend rank system functional, no UI changes yet

**Validation**:
```bash
# Run type checking
cd frontend && npm run build

# Verify no TypeScript errors
```

### Phase 2: Basic Drag-and-Drop (Days 3-4)

**Goal**: Enable drag-and-drop in Task Tab

**Tasks**:
1. Modify `TaskList.tsx`
   - Add local DndContext (separate from global)
   - Wrap tasks in SortableContext
   - Implement handleDragEnd
   - Apply rank-based sorting

2. Convert `TaskTreeItem.tsx` to sortable
   - Add useSortable hook
   - Apply transform styles
   - Add drag listeners
   - Preserve existing functionality (checkbox, expand, etc.)

3. Test drag interaction
   - Verify smooth drag preview
   - Verify drop updates order
   - Verify visual feedback

**Deliverable**: Can drag tasks to reorder, order not yet persisted

**Validation**:
```bash
# Start dev server
cd frontend && npm run dev

# Manual testing:
# 1. Open Task Tab
# 2. Drag task to new position
# 3. Verify order updates
# 4. Verify visual feedback appears
```

### Phase 3: Persistence (Day 5)

**Goal**: Save and restore custom ordering

**Tasks**:
1. Integrate storage utilities
   - Call saveTaskOrder on reorder
   - Call loadTaskOrder on mount
   - Handle storage errors gracefully

2. Update useTasks hook
   - Load ranks from storage
   - Apply ranks to tasks before returning
   - Handle file changes (clear ranks when switching files)

3. Test persistence
   - Verify order saves to localStorage
   - Verify order restored on page refresh
   - Verify order isolated per file

**Deliverable**: Custom ordering persists across sessions

**Validation**:
```bash
# Manual testing:
# 1. Reorder tasks
# 2. Refresh page
# 3. Verify order preserved
# 4. Switch files
# 5. Verify each file has independent ordering
```

### Phase 4: Filter Integration (Day 6)

**Goal**: Make ordering work with filters

**Tasks**:
1. Update filter logic in useTasks
   - Apply ranks before filtering
   - Maintain sort order within filters
   - Update ranks when reordering in filtered view

2. Test all filter combinations
   - All, Active, Completed, Today, Scheduled
   - Verify order preserved when switching
   - Verify reordering works in each filter

**Deliverable**: Custom ordering compatible with all filters

**Validation**:
```bash
# Manual testing:
# 1. Reorder tasks in "All" view
# 2. Switch to "Active" filter
# 3. Verify relative order preserved
# 4. Reorder in "Active" view
# 5. Switch back to "All"
# 6. Verify global order updated correctly
```

### Phase 5: Visual Polish (Day 7)

**Goal**: Refine drag-and-drop UX

**Tasks**:
1. Add drag overlay with proper styling
   - Semi-transparent background
   - Shadow effect
   - Clear visual distinction

2. Add drop target indicators
   - Border highlight on hover
   - Background color change
   - Smooth transitions

3. Handle edge cases
   - Auto-scroll near edges
   - Cancel on Escape key
   - Prevent drag of completed tasks (optional)

4. Accessibility improvements
   - Respect prefers-reduced-motion
   - Add ARIA labels
   - Keyboard hints (future enhancement)

**Deliverable**: Polished, professional drag-and-drop experience

**Validation**:
```bash
# Manual testing with various scenarios:
# 1. Drag task to top
# 2. Drag task to bottom
# 3. Drag task between two tasks
# 4. Drag near edge to trigger auto-scroll
# 5. Press Escape during drag to cancel
# 6. Check with browser DevTools' reduced motion simulation
```

### Phase 6: Hierarchy & Reset (Day 8)

**Goal**: Handle parent-child tasks and add reset functionality

**Tasks**:
1. Restrict dragging to root-level tasks
   - Disable drag for child tasks
   - Move children with parent
   - Preserve expansion state

2. Add "Reset Order" button
   - Add to TaskFilters component
   - Implement confirmation dialog
   - Clear ranks from storage
   - Restore line-number order

3. Add orphan cleanup
   - Remove ranks for deleted tasks
   - Run periodically (every 100 operations)
   - Optimize storage usage

**Deliverable**: Complete feature with hierarchy support and reset option

**Validation**:
```bash
# Manual testing:
# 1. Drag parent task with children
# 2. Verify children move with parent
# 3. Try to drag child task (should not work)
# 4. Click "Reset Order"
# 5. Confirm in dialog
# 6. Verify order returns to default
```

### Phase 7: Testing & Documentation (Day 9)

**Goal**: Ensure quality and maintainability

**Tasks**:
1. Write unit tests
   - Test rank calculation logic
   - Test storage functions
   - Test reorder logic

2. Integration testing
   - Test with large task lists (100+ tasks)
   - Test with multiple files
   - Test localStorage quota handling

3. Performance testing
   - Measure drag operation time
   - Measure storage save/load time
   - Optimize if needed

4. Documentation
   - Add code comments
   - Update README
   - Create user guide section

**Deliverable**: Well-tested, documented feature

**Validation**:
```bash
# Run tests (when test suite exists)
cd frontend && npm test

# Performance testing:
# 1. Create note with 100+ tasks
# 2. Measure drag-to-drop time (should be <100ms)
# 3. Measure storage save time (should be <50ms)
# 4. Check localStorage size (should be reasonable)
```

---

## 8. Data Flow

### Drag-and-Drop Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User drags Task B from position 2 to position 0            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ TaskList.handleDragEnd                                      │
│  - event.active.id = "file.txt-5" (Task B)                 │
│  - event.over.id = "file.txt-1" (Task A)                   │
│  - oldIndex = 1, newIndex = 0                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ arrayMove(sortedTasks, 1, 0)                               │
│  Before: [A(1000), B(2000), C(3000)]                       │
│  After:  [B(2000), A(1000), C(3000)]                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ taskOrderStore.reorderTasks(filePath, [B.id, A.id, C.id]) │
│  1. Calculate new ranks:                                    │
│     - B: calculateNewRank(0, tasks) → 0 (before A's 1000)  │
│     - A: 1000 (unchanged)                                   │
│     - C: 3000 (unchanged)                                   │
│  2. Update store: taskRanks.set(filePath, newRanks)        │
│  3. Check if re-ranking needed                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ taskOrderStorage.saveTaskOrder(filePath, ranks)            │
│  1. Convert Map to object: { "file.txt-5": 0, ... }        │
│  2. Add metadata: { ..., _lastUpdated: Date.now() }        │
│  3. localStorage.setItem("taskOrder:file.txt", json)       │
│  4. Increment operation counter                            │
│  5. Cleanup if counter >= 100                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ useTasks hook recomputes sorted tasks                      │
│  1. Load tasks from file (by line number)                  │
│  2. Merge with ranks from storage                          │
│  3. Sort by rank (or line if no rank)                      │
│  4. Apply current filter                                   │
│  5. Return to TaskList component                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ TaskList re-renders with new order                         │
│  - SortableContext updates item positions                  │
│  - Smooth transition animation (250ms)                     │
│  - Visual update complete                                  │
└─────────────────────────────────────────────────────────────┘
```

### Page Load Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User opens app / navigates to Task Tab                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ taskOrderStore initializes                                  │
│  1. Loads all taskOrder:* entries from localStorage        │
│  2. Parses JSON into Map structure                         │
│  3. Stores in memory: taskRanks Map                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ useTasks hook runs                                          │
│  1. Parses tasks from current file                         │
│  2. Gets ranks for current file from taskOrderStore        │
│  3. Assigns rank to each task:                             │
│     task.rank = taskRanks.get(task.id) ?? task.line       │
│  4. Sorts tasks by rank                                    │
│  5. Returns sorted tasks                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ TaskList renders                                            │
│  - SortableContext with sorted task IDs                    │
│  - Each TaskTreeItem rendered in custom order              │
│  - User sees tasks in their saved order                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Testing Strategy

### Unit Tests

**rankCalculator.ts**:
```typescript
describe('calculateNewRank', () => {
  it('should place task before first when moving to index 0', () => {
    const tasks = [
      { id: 'a', rank: 1000 },
      { id: 'b', rank: 2000 },
    ];
    expect(calculateNewRank(0, tasks)).toBe(0);
  });

  it('should place task after last when moving to end', () => {
    const tasks = [{ id: 'a', rank: 1000 }];
    expect(calculateNewRank(1, tasks)).toBe(2000);
  });

  it('should place task between two tasks', () => {
    const tasks = [
      { id: 'a', rank: 1000 },
      { id: 'c', rank: 3000 },
    ];
    expect(calculateNewRank(1, tasks)).toBe(2000);
  });
});

describe('needsReRanking', () => {
  it('should return true when ranks are too close', () => {
    const tasks = [
      { id: 'a', rank: 1.0000 },
      { id: 'b', rank: 1.0001 },
    ];
    expect(needsReRanking(tasks)).toBe(true);
  });

  it('should return false when ranks have good spacing', () => {
    const tasks = [
      { id: 'a', rank: 1000 },
      { id: 'b', rank: 2000 },
    ];
    expect(needsReRanking(tasks)).toBe(false);
  });
});
```

**taskOrderStorage.ts**:
```typescript
describe('taskOrderStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load task order', () => {
    const ranks = new Map([
      ['task-1', 1000],
      ['task-2', 2000],
    ]);

    saveTaskOrder('test.txt', ranks);
    const loaded = loadTaskOrder('test.txt');

    expect(loaded.get('task-1')).toBe(1000);
    expect(loaded.get('task-2')).toBe(2000);
  });

  it('should handle missing storage gracefully', () => {
    const loaded = loadTaskOrder('nonexistent.txt');
    expect(loaded.size).toBe(0);
  });
});
```

### Integration Tests

**Drag-and-Drop Workflow**:
```typescript
describe('Task Reordering', () => {
  it('should reorder tasks via drag-and-drop', async () => {
    // Render TaskList with test data
    const tasks = [
      { id: 'a', text: 'Task A', line: 1 },
      { id: 'b', text: 'Task B', line: 2 },
      { id: 'c', text: 'Task C', line: 3 },
    ];

    const { getByText } = render(<TaskList tasks={tasks} />);

    // Simulate drag task B to position 0
    const taskB = getByText('Task B');
    fireEvent.dragStart(taskB);
    fireEvent.dragOver(getByText('Task A'));
    fireEvent.drop(getByText('Task A'));

    // Verify order changed
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Task B');
    expect(items[1]).toHaveTextContent('Task A');
    expect(items[2]).toHaveTextContent('Task C');

    // Verify localStorage updated
    const stored = localStorage.getItem('taskOrder:test.txt');
    expect(stored).toBeTruthy();
  });
});
```

### Performance Tests

**Benchmark Drag Operation**:
```typescript
it('should complete drag operation in <100ms', async () => {
  const tasks = Array.from({ length: 100 }, (_, i) => ({
    id: `task-${i}`,
    text: `Task ${i}`,
    line: i,
  }));

  const start = performance.now();

  // Perform drag operation
  handleDragEnd({
    active: { id: 'task-50' },
    over: { id: 'task-0' },
  });

  const duration = performance.now() - start;
  expect(duration).toBeLessThan(100);
});
```

**Benchmark Storage Save**:
```typescript
it('should save to localStorage in <50ms', () => {
  const ranks = new Map(
    Array.from({ length: 100 }, (_, i) => [`task-${i}`, i * 1000])
  );

  const start = performance.now();
  saveTaskOrder('test.txt', ranks);
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(50);
});
```

### Manual Testing Checklist

- [ ] **Basic Drag-and-Drop**
  - [ ] Can drag task up
  - [ ] Can drag task down
  - [ ] Can drag to top
  - [ ] Can drag to bottom
  - [ ] Visual feedback appears during drag
  - [ ] Smooth animation when dropping

- [ ] **Persistence**
  - [ ] Order saved after reorder
  - [ ] Order restored on page refresh
  - [ ] Order persists across browser tabs
  - [ ] Each file has independent ordering

- [ ] **Filters**
  - [ ] Reordering works in "All" filter
  - [ ] Reordering works in "Active" filter
  - [ ] Reordering works in "Today" filter
  - [ ] Order preserved when switching filters
  - [ ] New tasks appear at bottom

- [ ] **Hierarchy**
  - [ ] Parent task moves with children
  - [ ] Children maintain relative order
  - [ ] Cannot drag child independently
  - [ ] Expansion state preserved

- [ ] **Reset**
  - [ ] "Reset Order" button visible
  - [ ] Confirmation dialog appears
  - [ ] Order resets to line numbers
  - [ ] localStorage cleared

- [ ] **Edge Cases**
  - [ ] Auto-scroll near edges works
  - [ ] Escape cancels drag
  - [ ] Works with 100+ tasks
  - [ ] Handles storage quota exceeded
  - [ ] Cleanup removes old entries

---

## 10. Success Metrics

### Quantitative Metrics

**Performance**:
- Drag operation completes in <100ms (95th percentile)
- Storage save operation completes in <50ms (95th percentile)
- Page load time increase <50ms with ordering enabled
- localStorage size <100KB per file with 1000 tasks

**Reliability**:
- 0 data loss incidents (tasks disappearing or duplicating)
- 0 crashes related to drag-and-drop
- <1% localStorage save failures (with graceful fallback)
- 100% order restoration accuracy on page load

**Adoption**:
- 60% of active users try drag-and-drop within first week
- 40% of active users use custom ordering regularly (weekly)
- Average of 5 reorder operations per user per session

### Qualitative Metrics

**User Feedback**:
- Users report feature is "intuitive" and "easy to use"
- No negative feedback about performance or bugs
- Positive feedback about visual polish and smoothness

**UX Quality**:
- Smooth, professional drag animations
- Clear visual feedback at all stages
- No visual glitches or layout jumps
- Accessible (works with keyboard, reduced motion)

### Acceptance Criteria for Launch

**Must Have**:
- ✅ All P0 functional requirements implemented
- ✅ All unit tests passing
- ✅ Manual test checklist 100% complete
- ✅ Performance benchmarks met
- ✅ Works in Chrome, Firefox, Safari
- ✅ Zero known critical bugs

**Nice to Have**:
- ⚠️ P1 and P2 requirements (can be post-launch)
- ⚠️ Integration tests (can be added iteratively)
- ⚠️ Multi-browser testing (focus on Chrome first)

---

## 11. Risks & Mitigation

### Risk 1: Performance Degradation with Large Task Lists
**Risk**: Drag-and-drop may lag with 500+ tasks
**Impact**: High
**Likelihood**: Medium
**Mitigation**:
- Implement virtual scrolling for large lists (future enhancement)
- Optimize render cycle (React.memo for TaskTreeItem)
- Debounce rank updates during rapid drags
- Profile and optimize hot code paths
- Consider pagination for extremely large lists

### Risk 2: localStorage Quota Exceeded
**Risk**: Users with many files hit 5-10MB localStorage limit
**Impact**: Medium
**Likelihood**: Low
**Mitigation**:
- Implement automatic cleanup (remove entries >30 days old)
- Compress data before storing (if needed)
- Graceful degradation: show warning, disable ordering
- Consider IndexedDB for larger storage needs (future)
- Monitor storage usage, alert at 80% capacity

### Risk 3: Rank Collision / Precision Issues
**Risk**: Repeated reordering causes rank values to converge
**Impact**: Low
**Likelihood**: Medium
**Mitigation**:
- Detect when ranks get too close (<0.001 apart)
- Automatically trigger re-ranking with fresh values
- Use floating-point numbers (sufficient precision)
- Test with extreme scenarios (1000+ reorders)

### Risk 4: Hierarchy Complexity
**Risk**: Parent-child relationships complicate drag logic
**Impact**: Medium
**Likelihood**: Medium
**Mitigation**:
- Phase 1: Only allow root-level task reordering
- Document limitation clearly in UI
- Future enhancement: support dragging within subtask groups
- Extensive testing of hierarchy edge cases

### Risk 5: Filter State Confusion
**Risk**: Users confused why reordering in filtered view affects global order
**Impact**: Low
**Likelihood**: Low
**Mitigation**:
- Clear documentation/tooltips explaining behavior
- Visual indicator when in filtered view
- Consider filter-specific ordering (future enhancement)
- User testing to validate mental model

### Risk 6: Browser Compatibility
**Risk**: Drag-and-drop behaves differently across browsers
**Impact**: Medium
**Likelihood**: Low
**Mitigation**:
- @dnd-kit library handles cross-browser compatibility
- Test in Chrome, Firefox, Safari (minimum)
- Graceful degradation if drag-and-drop not supported
- Provide alternative reorder UI (up/down arrows) if needed

---

## 12. Appendix

### A. Existing Drag-and-Drop Patterns in Codebase

**DragDropProvider.tsx** (lines 21-162):
- Wraps entire app with DndContext
- Handles drag events for Kanban and Calendar
- Provides sensors configuration:
  ```typescript
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  })
  ```
- Shows drag overlay during drag operations

**KanbanCard.tsx** (lines 12-18):
- Uses `useDraggable` hook for draggable items
- Applies transform styles during drag
- Reduces opacity to 50% when dragging
- Example pattern to follow for TaskTreeItem

**KanbanColumn.tsx** (lines 20-26):
- Uses `useDroppable` hook for drop targets
- Shows visual feedback on hover (border, background)
- Data attached to droppable: `{ type: 'kanban-column', column }`

### B. localStorage Usage Patterns

**folderStore.ts** (lines 226-228, 248-264):
- Saves state on every change: `localStorage.setItem(key, JSON.stringify(value))`
- Initializes from localStorage on store creation
- Pattern to follow for task ordering persistence

**Storage Schema**:
```typescript
// Current pattern in folderStore
localStorage.setItem('folderExpansion', JSON.stringify(Array.from(expandedSet)));

// Pattern for task ordering
localStorage.setItem('taskOrder:Notes/Work.txt', JSON.stringify({
  'Notes/Work.txt-5': 1000,
  'Notes/Work.txt-12': 2000,
  'Notes/Work.txt-8': 3000,
  _lastUpdated: 1696867200000
}));
```

### C. Task Data Flow (Current)

```
Note File (*.txt)
  ↓ (read by fileStore)
File Content (string)
  ↓ (parsed by taskService.parseTasksFromContent)
ParsedTask[] (flat list with depth info)
  ↓ (buildTaskHierarchy)
ParsedTask[] (hierarchical, ordered by line number)
  ↓ (getFilteredTasks in taskStore)
ParsedTask[] (filtered by active filter)
  ↓ (rendered by TaskList)
UI (TaskTreeItem components)
```

**With Custom Ordering (New)**:
```
Note File (*.txt)
  ↓
File Content (string)
  ↓
ParsedTask[] (flat)
  ↓
ParsedTask[] (hierarchical, ordered by line)
  ↓ **NEW: Merge ranks from localStorage**
ParsedTask[] (with rank field)
  ↓ **NEW: Sort by rank (or line if no rank)**
ParsedTask[] (custom order)
  ↓
ParsedTask[] (filtered)
  ↓
UI (draggable TaskTreeItem)
```

### D. Code References

**Key Files**:
- Task List Component: `frontend/src/components/tasks/TaskList.tsx:6-91`
- Task Tree Item: `frontend/src/components/tasks/TaskTreeItem.tsx:1-166`
- Task Service: `frontend/src/services/taskService.ts:1-259`
- Task Store: `frontend/src/store/taskStore.ts:1-122`
- useTasks Hook: `frontend/src/hooks/useTasks.ts:1-159`
- Drag Drop Provider: `frontend/src/components/DragDropProvider.tsx:21-162`
- Kanban Card (drag example): `frontend/src/components/kanban/KanbanCard.tsx:12-18`
- Folder Store (localStorage example): `frontend/src/store/folderStore.ts:226-264`

**External Documentation**:
- @dnd-kit Sortable: https://docs.dndkit.com/presets/sortable
- @dnd-kit useSortable: https://docs.dndkit.com/presets/sortable/usesortable
- React DnD Guide: https://medium.com/@kurniawanc/create-sortable-drag-and-drop-in-react-js-using-dnd-kit-library-ba8b2917a6b5

### E. Alternatives Considered

**Alternative 1: Modify Base Note Content**
- **Pros**: True source-of-truth, no separate storage
- **Cons**: Violates requirement (don't modify note), complex, risky
- **Decision**: Rejected

**Alternative 2: Database Storage**
- **Pros**: Scalable, syncable across devices
- **Cons**: Requires backend changes, overkill for MVP
- **Decision**: Deferred to future (use localStorage for MVP)

**Alternative 3: Priority-Based Ordering**
- **Pros**: Simpler (just sort by priority tag)
- **Cons**: Less flexible, requires changing task content
- **Decision**: Complementary (can combine with manual ordering)

**Alternative 4: Keyboard-Based Reordering**
- **Pros**: Accessible, no drag-and-drop complexity
- **Cons**: Less intuitive, slower for bulk reordering
- **Decision**: Future enhancement (add keyboard shortcuts later)

### F. Future Enhancements

1. **Keyboard Shortcuts**
   - `Ctrl+Up/Down`: Move task up/down
   - `Ctrl+Shift+Up`: Move to top
   - `Ctrl+Shift+Down`: Move to bottom

2. **Multi-Task Selection**
   - `Shift+Click`: Select range
   - `Cmd/Ctrl+Click`: Toggle selection
   - Drag multiple tasks as group

3. **Auto-Sort Options**
   - Sort by priority (with custom overrides)
   - Sort by date (with custom overrides)
   - Hybrid: auto-sort + manual adjustments

4. **Filter-Specific Ordering**
   - Different order for "Today" vs "All"
   - Per-filter rank maps
   - More complex storage schema

5. **Sync Across Devices**
   - Store ranks in backend database
   - Sync via WebSocket or API
   - Conflict resolution (last-write-wins or CRDTs)

6. **Undo/Redo**
   - Track reorder history
   - `Ctrl+Z` to undo reorder
   - Time-based undo (undo within 10 seconds)

7. **Drag Handles**
   - Optional: dedicated drag handle icon
   - Prevents accidental drags
   - Useful on touch devices

8. **Nested Drag-and-Drop**
   - Drag child tasks within parent
   - Drag to change parent
   - More complex hierarchy management

---

## Conclusion

This PRP outlines a comprehensive solution for task drag-and-drop reordering in the Task Tab. By leveraging the existing `@dnd-kit` infrastructure and following established patterns from the Kanban board implementation, we can deliver a smooth, intuitive reordering experience with minimal risk.

The rank-based ordering system provides stable, persistent ordering without modifying source note content. localStorage persistence ensures custom ordering survives page refreshes while keeping implementation simple for MVP.

The phased implementation plan breaks down the work into manageable chunks, with clear deliverables and validation criteria for each phase. Risk mitigation strategies address potential issues proactively.

**Estimated Implementation Time**: 9 days (1 developer)

**Confidence Level for One-Pass Success**: 8.5/10

**Reasoning**:
- ✅ Existing infrastructure (drag-and-drop library, storage patterns) reduces unknowns
- ✅ Clear technical approach with proven patterns to follow
- ✅ Comprehensive requirements and test plan
- ✅ Well-scoped MVP (deferred complex features)
- ⚠️ Moderate complexity (rank calculation, hierarchy handling)
- ⚠️ Some edge cases need careful handling (storage quota, rank collisions)

**Next Steps**:
1. Review and approve PRP
2. Create GitHub issue/milestone for tracking
3. Begin Phase 1 implementation
4. Weekly check-ins to review progress and adjust as needed

---

**PRP Confidence Score: 8.5/10**

This PRP provides comprehensive context for one-pass implementation success, including:
- ✅ Detailed research of existing codebase patterns
- ✅ Clear technical specifications with code examples
- ✅ Step-by-step implementation plan with validation gates
- ✅ Thorough testing strategy
- ✅ Risk mitigation for known challenges
- ✅ Extensive references to existing code
- ✅ External documentation links
