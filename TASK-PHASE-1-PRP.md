# PHASE 1 PRP: Enhanced Task Management Foundation

## Overview
Build the foundation for advanced task management: nested subtasks, priority tags, enhanced parsing, and drag-drop infrastructure.

## Goals
- ✅ Parse nested subtasks from indented markdown
- ✅ Support priority tags (#p1, #p2, #p3, #p4)
- ✅ Install and configure @dnd-kit for drag-drop
- ✅ Enhanced task data model with parent-child relationships
- ✅ Update UI to show nested structure

## Markdown Syntax Specification

```markdown
* [x] Parent task #p1 #status-doing >2025-10-10
    * Child subtask #p2
        * Nested child subtask
    * Another child
* [!] Important task #p1 @john #project-alpha
```

### Task States
- `* ` - Open task
- `* [x]` - Completed
- `* [>]` - Scheduled/forwarded
- `* [-]` - Cancelled
- `* [!]` - Important (already supported)

### Priority Tags
- `#p1` - Highest priority
- `#p2` - High priority
- `#p3` - Medium priority
- `#p4` - Low priority

### Nesting Rules
- Use 4 spaces or 1 tab per level
- Parent-child relationships maintained
- Children inherit context from parent (but not status)

## Data Model Updates

```typescript
interface ParsedTask {
  id: string;
  text: string;
  completed: boolean;
  scheduled: boolean;
  cancelled: boolean;
  important: boolean;
  priority?: 1 | 2 | 3 | 4;  // NEW
  date?: Date;
  mentions: string[];
  tags: string[];
  line: number;
  file: string;

  // NEW: Nesting support
  parentId?: string;
  children: ParsedTask[];
  depth: number;

  // NEW: Time management
  timeBlocks?: TimeBlock[];
}

interface TimeBlock {
  id: string;
  start: string;  // "09:00"
  end: string;    // "11:00"
  date: Date;
  duration?: number;  // minutes
}
```

## Implementation Steps

### Step 1: Install Dependencies
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Location:** `frontend/`

**Files to create:** None

**Expected output:** Dependencies added to package.json

---

### Step 2: Update Task Parser (taskService.ts)

**Location:** `frontend/src/services/taskService.ts`

**Changes needed:**
1. Add priority extraction from `#p1-#p4` tags
2. Add indentation-based nesting parser
3. Build parent-child relationships
4. Calculate depth levels

**New functions to add:**
```typescript
export const extractPriority = (tags: string[]): 1 | 2 | 3 | 4 | undefined => {
  const priorityTag = tags.find(tag => /^p[1-4]$/.test(tag));
  if (priorityTag) {
    return parseInt(priorityTag[1]) as 1 | 2 | 3 | 4;
  }
  return undefined;
};

export const calculateIndentLevel = (line: string): number => {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  const spaces = match[1];
  // Count tabs as 4 spaces
  const normalizedSpaces = spaces.replace(/\t/g, '    ');
  return normalizedSpaces.length / 4;
};

export const buildTaskHierarchy = (tasks: ParsedTask[]): ParsedTask[] => {
  // Build tree structure from flat list with depth info
  // Return root-level tasks with children nested
};
```

**Update existing `parseTask` function:**
- Add depth calculation
- Extract priority from tags
- Keep track of parent task

**Update existing `parseTasksFromContent` function:**
- Parse all tasks with depth info
- Call `buildTaskHierarchy` to build tree
- Return hierarchical structure

---

### Step 3: Update Task Store (taskStore.ts)

**Location:** `frontend/src/store/taskStore.ts`

**New methods to add:**
```typescript
interface TaskStore {
  // ... existing fields

  // NEW methods
  updateTaskPriority: (taskId: string, priority: 1 | 2 | 3 | 4) => void;
  moveTask: (taskId: string, newParentId: string | null) => void;
  getTaskHierarchy: () => ParsedTask[];
  toggleSubtasks: (taskId: string) => void; // Expand/collapse
  expandedTasks: Set<string>; // Track which parents are expanded
}
```

**Implementation notes:**
- Store hierarchical structure
- Support filtering that respects hierarchy
- Handle expand/collapse state

---

### Step 4: Create New Components

#### 4a. TaskTreeItem.tsx

**Location:** `frontend/src/components/tasks/TaskTreeItem.tsx`

**Purpose:** Recursive component for nested task display

**Props:**
```typescript
interface TaskTreeItemProps {
  task: ParsedTask;
  depth: number;
  onToggle: (taskId: string) => void;
  onExpand?: (taskId: string) => void;
  isExpanded?: boolean;
}
```

**Features:**
- Indentation based on depth (use padding-left)
- Expand/collapse button for parents
- Recursively render children
- Show priority badge
- Drag handle for reordering

---

#### 4b. PriorityBadge.tsx

**Location:** `frontend/src/components/tasks/PriorityBadge.tsx`

**Purpose:** Visual indicator for P1-P4

**Props:**
```typescript
interface PriorityBadgeProps {
  priority: 1 | 2 | 3 | 4;
  size?: 'sm' | 'md';
}
```

**Design:**
- P1: Red badge (bg-red-100, text-red-800)
- P2: Orange badge (bg-orange-100, text-orange-800)
- P3: Yellow badge (bg-yellow-100, text-yellow-800)
- P4: Blue badge (bg-blue-100, text-blue-800)

---

#### 4c. TaskActions.tsx

**Location:** `frontend/src/components/tasks/TaskActions.tsx`

**Purpose:** Context menu for task operations

**Features:**
- Change priority (P1-P4)
- Move to date
- Convert to subtask
- Promote to parent
- Delete task

---

### Step 5: Update Existing Components

#### 5a. Update TaskList.tsx

**Location:** `frontend/src/components/tasks/TaskList.tsx`

**Changes:**
- Replace `TaskItem` with `TaskTreeItem`
- Pass hierarchical tasks instead of flat list
- Handle expand/collapse state
- Update filters to work with hierarchy

---

#### 5b. Update TaskFilters.tsx

**Location:** `frontend/src/components/tasks/TaskFilters.tsx`

**Changes:**
- Add priority filter buttons (All, P1, P2, P3, P4)
- Show count per priority level
- Visual styling for priority filters

---

### Step 6: Update useTasks Hook

**Location:** `frontend/src/hooks/useTasks.ts`

**Changes:**
- Return hierarchical tasks
- Add methods for priority operations
- Handle nested task updates in markdown

**New methods:**
```typescript
const updateTaskPriority = async (taskId: string, priority: 1 | 2 | 3 | 4) => {
  // Find task, update tags in markdown, save file
};

const promoteTask = async (taskId: string) => {
  // Reduce indentation in markdown
};

const demoteTask = async (taskId: string) => {
  // Increase indentation in markdown
};
```

---

## Technical Requirements

1. **TypeScript strict mode** - All types properly defined
2. **File structure preservation** - Indentation must be exact when saving
3. **Performance** - Handle 1000+ nested tasks without lag
4. **Accessibility** - Keyboard navigation for expand/collapse
5. **Visual feedback** - Clear indication of parent/child relationships

## Testing Plan

### Manual Tests
1. Create nested task (3+ levels) → parses correctly
2. Add #p1 tag → priority badge appears
3. Toggle parent task → children don't change state
4. Filter by P1 → only P1 tasks show (including children)
5. Expand/collapse parent → children show/hide
6. Save file → indentation preserved exactly

### Edge Cases
- Task with no priority tag
- Task at max nesting (5+ levels)
- Mix of spaces and tabs
- Task with multiple priority tags (should take first)
- Empty parent task

## Success Criteria

- ✅ Can create nested tasks in markdown (4 spaces = 1 level)
- ✅ Tasks display in tree structure with expand/collapse
- ✅ Priority badges visible (P1-P4 with colors)
- ✅ @dnd-kit installed and ready (no drag functionality yet)
- ✅ All existing features still work (dates, tags, mentions)
- ✅ File saves preserve exact indentation
- ✅ Performance: 1000 tasks render in <100ms

## Timeline

**Estimated Time:** 2-3 weeks

**Breakdown:**
- Step 1 (Dependencies): 10 minutes
- Step 2 (Parser): 2-3 days
- Step 3 (Store): 1 day
- Step 4 (New components): 3-4 days
- Step 5 (Update components): 2 days
- Step 6 (Hook updates): 1-2 days
- Testing & Polish: 2-3 days

## Dependencies

**Required before starting:**
- Current task system working
- File save/load working
- Markdown editor functional

**Blocks:**
- Phase 2 (Kanban) - needs this foundation
- Phase 3 (Calendar drag-drop) - needs drag-drop setup

## Notes

- Keep backward compatibility with flat task lists
- Consider adding setting to toggle tree view vs flat view
- Priority system is extensible (could add P0 or P5 later)
- Nesting depth could be configurable (default 10 levels max)

---

**Status:** 🔴 Not Started

**Last Updated:** 2025-10-08

**Next Step:** Install @dnd-kit dependencies
