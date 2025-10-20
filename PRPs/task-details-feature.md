# Product Requirements Plan: Task Details with Free Text Notes

**Version:** 1.0
**Date:** October 9, 2025
**Status:** Ready for Implementation
**Author:** System Generated
**Project:** NotePlan Clone - Task Details Feature

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
This PRP defines the requirements for implementing a task details feature that allows users to add free-text descriptions, notes, and additional context to tasks. Details will be stored inline in markdown files using backslash line continuation with indented lines, displayed in the Tasks tab with expand/collapse functionality, and controlled by a global master toggle.

### Problem Statement
Currently, tasks in the application only support a single line of text. Users cannot:
- Add detailed descriptions or context to tasks
- Store checklists, notes, or sub-information within a task
- Maintain rich task documentation without cluttering the main task list
- Reference important details when reviewing tasks

This limitation forces users to either:
1. Cram all information into the task title (reducing readability)
2. Create separate notes for task details (breaking context)
3. Use tags/mentions as workarounds (less intuitive than dedicated details)

### Solution
Implement task details using markdown backslash line continuation syntax with indented detail lines. The solution will:
- Store details directly in markdown files (preserving data in plain text)
- Parse details from lines following `task\` with 2-space indentation
- Display details in Tasks tab with inline expand/collapse
- Provide global toggle to show/hide all details at once
- Preserve formatting in the Editor tab (no stripping of indentation)
- Support editing details in both Editor and Tasks tabs

**Example Format:**
```markdown
+ Shopping task\
  Remember to bring reusable bags.\
  Budget is $100 for the week.

+ Review pull request\
  Check for:
  + Code quality
  + Test coverage
  + Documentation updates
```

### Success Criteria
- Users can add multi-line details to any task
- Details are stored in markdown files with backslash continuation
- Editor preserves indentation (doesn't strip detail formatting)
- Details display inline in Tasks tab with expand/collapse
- Global toggle controls visibility of all details
- Toggle state persists across sessions
- Works seamlessly with existing task features (priority, dates, subtasks)

---

## 2. Background & Context

### Current State

**Task Data Structure** (from `taskService.ts:3-25`):
```typescript
export interface ParsedTask extends Task {
  id: string;
  text: string;
  completed: boolean;
  scheduled: boolean;
  cancelled: boolean;
  important: boolean;
  priority?: 1 | 2 | 3 | 4;
  date?: Date;
  mentions: string[];
  tags: string[];
  line: number;
  file: string;
  parentId?: string;
  children: ParsedTask[];
  depth: number;
  rank?: number;
}
```

**Current Task Parsing** (taskService.ts:104-156):
- Parses single-line tasks with format: `* [status] task text`
- Extracts dates, mentions, tags, priority
- Supports nesting via indentation (4 spaces = 1 level)
- Builds hierarchical structure for parent-child tasks
- Does NOT currently extract or store task details

**Editor Configuration** (Editor.tsx:58-66):
```typescript
Markdown.configure({
  html: true,
  tightLists: true,  // <-- PROBLEM: Normalizes list formatting
  bulletListMarker: '+',
  breaks: true,
  transformPastedText: true,
  transformCopiedText: true,
  linkify: false,
})
```

**Issue**: `tightLists: true` causes TipTap to normalize list formatting and strip indentation from detail lines.

### User-Provided Demo File

The user created `/Users/robertocallaghan/Documents/notes/Notes/Task-Details-Demo.txt` showing desired format:

```markdown
+ Shopping task\
  Remember to bring reusable bags.\
  Budget is $100 for the week.

+ Call the doctor\
  Phone number: 555-1234\
  Ask about test results.

+ Deploy to production\
  **Pre-deployment checklist:**
  + Run all tests
  + Check staging environment
  + Notify team on Slack

  Deployment window: 2pm-4pm EST\
  Rollback plan: Use previous Docker image
```

**Key Observations:**
1. Backslash (`\`) at end of task line indicates continuation
2. Detail lines are indented with 2 spaces
3. Details can contain markdown formatting (bold, lists, etc.)
4. Detail lines can also end with `\` for multi-paragraph details
5. Tasks can have both details AND subtasks

### Inspiration from Other Tools

**Todoist** (Research findings):
- Task details stored in a dedicated sidebar panel
- "New task view" has collapsible sections for attributes
- Each task attribute has its own row for clarity
- Buttons to collapse sub-tasks and comments

**Obsidian Tasks** (Research findings):
- Tasks can live next to notes with contextual proximity
- Details are part of the markdown structure
- Clear relationship between tasks and their context

**Best Practices 2025** (Research findings):
- Contextual intelligence personalizes interfaces based on user behavior
- Collapsed headings remain collapsed in published notes
- Clear visual hierarchy with expandable/collapsible elements
- Task body text should be descriptive enough for any user to interpret

### Why This Matters
1. **Context Preservation**: Keep all task-related information together
2. **Markdown Compatibility**: Plain text storage ensures data portability
3. **Flexibility**: Support rich formatting in task details
4. **User Expectation**: Expandable task details is a standard pattern in modern task management

---

## 3. Goals & Objectives

### Primary Goals
1. **Enable Task Details**: Allow users to add free-text notes to tasks
2. **Preserve Format in Editor**: Fix TipTap to not strip indentation
3. **Inline Display**: Show/hide details directly in Tasks tab
4. **Global Control**: Provide master toggle for all details visibility
5. **Bidirectional Editing**: Edit details in both Editor and Tasks tabs

### Secondary Goals
1. **Markdown Support in Details**: Allow formatting (bold, lists, etc.)
2. **Visual Clarity**: Clear expand/collapse affordances
3. **Performance**: Fast parsing and rendering even with many tasks
4. **Accessibility**: Proper ARIA labels and keyboard support

### Non-Goals (Out of Scope)
- Dedicated details editor/modal (inline editing only)
- Syntax highlighting for code blocks in details
- Per-task toggle persistence (only global toggle)
- Details in Kanban Board view (focus on Tasks tab first)
- AI-generated task details
- Collaborative editing of details

---

## 4. User Stories

### Epic 1: Basic Task Details

**US-1.1**: As a user, I want to add multi-line details to a task so I can store context and notes.
- **Acceptance Criteria:**
  - Can add details by typing backslash at end of task line
  - Indented lines (2 spaces) are recognized as details
  - Details appear in Tasks tab below the task
  - Details are preserved in markdown file

**US-1.2**: As a user, I want to expand/collapse task details so I can focus on what's relevant.
- **Acceptance Criteria:**
  - Click task to expand/collapse details
  - Chevron icon indicates expansion state
  - Smooth animation when expanding/collapsing
  - Details show full markdown formatting

**US-1.3**: As a user, I want a master toggle to show/hide all details so I can declutter the task list.
- **Acceptance Criteria:**
  - Toggle button in TaskFilters bar
  - Shows eye icon or similar
  - Clicking toggles visibility of ALL task details
  - State persists across page refreshes

### Epic 2: Editor Integration

**US-2.1**: As a user, I want the editor to preserve my task detail formatting so my data isn't lost.
- **Acceptance Criteria:**
  - Backslash line continuation preserved
  - Indentation of detail lines maintained
  - No automatic reformatting of detail lines
  - Can edit details directly in Editor tab

**US-2.2**: As a user, I want to edit task details in the Tasks tab so I don't have to switch to Editor.
- **Acceptance Criteria:**
  - Click detail line to edit inline
  - Changes save to markdown file
  - Markdown formatting rendered correctly
  - Can add/remove detail lines

### Epic 3: Advanced Features

**US-3.1**: As a user, I want task details to work with nested tasks so I can organize complex projects.
- **Acceptance Criteria:**
  - Parent tasks can have details
  - Subtasks can have details
  - Details don't interfere with task hierarchy
  - Indentation levels are preserved correctly

**US-3.2**: As a user, I want to use markdown formatting in details so I can emphasize important information.
- **Acceptance Criteria:**
  - Bold, italic, code formatting works
  - Nested lists render correctly
  - Links are clickable
  - Line breaks preserved

---

## 5. Functional Requirements

### FR-1: Markdown Format for Task Details
- **ID**: FR-1
- **Priority**: P0 (Critical)
- **Description**: Define and parse task details from markdown
- **Specifications**:
  - Task line ending with `\` indicates details follow
  - Detail lines are indented with 2 spaces
  - Multiple detail lines continue until non-indented line or next task
  - Detail lines can contain any markdown syntax
  - Empty lines within details are preserved
- **Format Example**:
  ```markdown
  + Task title\
    Detail line 1\
    Detail line 2 with **bold**
    Detail line 3
  ```
- **Acceptance Criteria**:
  - Parser correctly identifies task vs detail lines
  - Indentation level distinguishes details from subtasks
  - Backslash continuation recognized

### FR-2: TipTap Editor Configuration
- **ID**: FR-2
- **Priority**: P0 (Critical)
- **Description**: Fix TipTap to preserve indentation and backslash continuation
- **Specifications**:
  - Disable `tightLists` or configure to preserve indentation
  - Ensure backslash at end of line is not stripped
  - Preserve 2-space indentation in detail lines
  - Maintain cursor position when editing details
- **Acceptance Criteria**:
  - Editing task in Editor doesn't strip detail formatting
  - Saving and reopening preserves exact format
  - No unwanted normalization of whitespace

### FR-3: Task Details Display
- **ID**: FR-3
- **Priority**: P0 (Critical)
- **Description**: Show task details inline in Tasks tab
- **Specifications**:
  - **Collapsed State**: Only task title visible, chevron right icon
  - **Expanded State**: Details shown below task, chevron down icon
  - **Rendering**: Details rendered as markdown (bold, lists, etc.)
  - **Animation**: Smooth 200ms expand/collapse transition
  - **Styling**: Details have subtle background color, indented 24px
- **UI Mock**:
  ```
  ▶ [x] Shopping task  📅 Oct 9  #personal

  ▼ [ ] Deploy to production  📅 Oct 10  #p1
      Pre-deployment checklist:
      • Run all tests
      • Check staging environment
      Deployment window: 2pm-4pm EST
  ```
- **Acceptance Criteria**:
  - Click anywhere on task row to toggle expansion
  - Chevron indicates current state
  - Details render markdown formatting
  - No layout shift when toggling

### FR-4: Global Details Toggle
- **ID**: FR-4
- **Priority**: P0 (Critical)
- **Description**: Master toggle to show/hide all task details
- **Specifications**:
  - **Location**: TaskFilters bar (right side, next to Reset Order button)
  - **Icon**: Eye icon (open when showing, closed when hidden)
  - **Behavior**: Clicking toggles visibility of ALL details globally
  - **State**: Stored in localStorage as `showTaskDetails: boolean`
  - **Scope**: Affects all files, all filters
  - **Interaction**: When hidden globally, individual expand buttons disabled
- **Acceptance Criteria**:
  - Toggle persists across page refreshes
  - Toggle persists across browser tabs (shared localStorage)
  - Visual feedback when toggling
  - Works across all task filters

### FR-5: Inline Detail Editing (Tasks Tab)
- **ID**: FR-5
- **Priority**: P1 (High)
- **Description**: Edit task details directly in Tasks tab
- **Specifications**:
  - **Trigger**: Double-click on detail line to edit
  - **Editor**: Textarea appears with current detail text
  - **Saving**: Blur or Cmd/Ctrl+Enter to save
  - **Cancel**: Escape key to cancel
  - **Format**: Preserve markdown syntax while editing
- **Acceptance Criteria**:
  - Can edit existing detail lines
  - Can add new detail lines
  - Can delete detail lines (delete all text)
  - Changes save to markdown file immediately
  - Markdown re-renders after save

### FR-6: Task Details Parsing
- **ID**: FR-6
- **Priority**: P0 (Critical)
- **Description**: Extract details from markdown during task parsing
- **Specifications**:
  - Detect backslash at end of task line: `/\\$/`
  - Collect following lines that start with 2 spaces
  - Stop at: non-indented line, next task marker, EOF
  - Remove backslash from task text
  - Store details as array of strings (one per line)
  - Strip leading 2 spaces from each detail line
  - Preserve trailing backslashes in detail lines
- **Algorithm**:
  ```typescript
  if (taskLine.endsWith('\\')) {
    task.text = taskLine.slice(0, -1).trim();
    task.details = [];

    let i = currentLineIndex + 1;
    while (i < lines.length) {
      const line = lines[i];

      // Check if line is a detail line (starts with 2 spaces)
      if (line.match(/^  \S/)) {
        // Remove 2-space indent, keep rest
        task.details.push(line.slice(2));
        i++;
      } else if (line.trim() === '') {
        // Empty line within details
        task.details.push('');
        i++;
      } else {
        // Non-detail line, stop
        break;
      }
    }
  }
  ```
- **Acceptance Criteria**:
  - All detail lines extracted correctly
  - Indentation preserved within details (beyond first 2 spaces)
  - Empty lines in details preserved
  - Detail parsing doesn't interfere with subtask parsing

### FR-7: Visual Feedback
- **ID**: FR-7
- **Priority**: P1 (High)
- **Description**: Clear visual indicators for task details
- **Specifications**:
  - **Has Details**: Tasks with details show small document icon
  - **Expandable**: Chevron right (▶) when collapsed
  - **Expanded**: Chevron down (▼) when expanded
  - **Details Background**: Light gray in light mode, dark gray in dark mode
  - **Details Border**: Left border with accent color
  - **Hover State**: Details area highlights on hover
- **Acceptance Criteria**:
  - Clear visual distinction between task and details
  - Consistent with app's design system
  - Accessible contrast ratios
  - Works in dark mode

---

## 6. Technical Requirements

### TR-1: Data Model Extensions

**Extend ParsedTask Interface**:
```typescript
// frontend/src/services/taskService.ts
export interface ParsedTask extends Task {
  // ... existing fields ...

  // NEW: Task details
  details?: string[];  // Array of detail lines
  hasDetails: boolean; // Convenience flag
}
```

### TR-2: TipTap Configuration Fix

**Update Editor Configuration**:
```typescript
// frontend/src/components/editor/Editor.tsx
Markdown.configure({
  html: true,
  tightLists: false,  // CHANGED: Allow loose list formatting
  bulletListMarker: '+',
  breaks: true,
  transformPastedText: true,
  transformCopiedText: true,
  linkify: false,
  // NEW: Preserve whitespace
  preserveWhitespace: 'full',
})
```

**Alternative Approach** (if preserveWhitespace doesn't exist):
- Create custom TipTap extension to handle task detail blocks
- Override default list normalization behavior
- Add custom parser/serializer for backslash continuation

### TR-3: Enhanced Task Parser

**Update parseTask Function**:
```typescript
// frontend/src/services/taskService.ts

export const parseTask = (
  lines: string[],
  startLineIndex: number,
  filePath: string
): { task: ParsedTask | null; linesConsumed: number } => {
  const line = lines[startLineIndex];
  const depth = calculateIndentLevel(line);

  // Match task line
  const taskRegex = /^\s*[*+] (\[([xX>\-!])\] )?(.+)$/;
  const match = line.match(taskRegex);

  if (!match) return { task: null, linesConsumed: 0 };

  const [_, __, status, text] = match;

  // Check for backslash continuation
  const hasDetails = text.endsWith('\\');
  const cleanText = hasDetails ? text.slice(0, -1).trim() : text.trim();

  // Extract details if present
  let details: string[] = [];
  let linesConsumed = 1;

  if (hasDetails) {
    let i = startLineIndex + 1;
    while (i < lines.length) {
      const detailLine = lines[i];

      // Empty line
      if (detailLine.trim() === '') {
        details.push('');
        i++;
        linesConsumed++;
        continue;
      }

      // Check if it's a detail line (2-space indent beyond task depth)
      const detailIndent = calculateIndentLevel(detailLine);
      const expectedDetailIndent = depth + 1;

      if (detailIndent >= expectedDetailIndent && !detailLine.trim().match(/^[*+] /)) {
        // It's a detail line
        const strippedLine = detailLine.slice((depth + 1) * 4); // Remove base indent
        details.push(strippedLine);
        i++;
        linesConsumed++;
      } else {
        // Not a detail line, stop
        break;
      }
    }
  }

  // ... rest of task parsing (dates, tags, etc.) ...

  const task: ParsedTask = {
    id: `${filePath}-${startLineIndex}`,
    text: cleanText,
    completed: status === 'x' || status === 'X',
    scheduled: status === '>',
    cancelled: status === '-',
    canceled: status === '-',
    important: status === '!',
    priority: extractPriority(tags),
    date: scheduledDate,
    mentions,
    tags,
    line: startLineIndex,
    file: filePath,
    depth,
    children: [],
    parentId: undefined,
    details: details.length > 0 ? details : undefined,
    hasDetails: details.length > 0,
  };

  return { task, linesConsumed };
};
```

**Update parseTasksFromContent**:
```typescript
export const parseTasksFromContent = (
  content: string,
  filePath: string
): ParsedTask[] => {
  const lines = content.split('\n');
  const tasks: ParsedTask[] = [];

  let i = 0;
  while (i < lines.length) {
    const { task, linesConsumed } = parseTask(lines, i, filePath);

    if (task) {
      tasks.push(task);
      i += linesConsumed; // Skip detail lines
    } else {
      i++;
    }
  }

  // Build hierarchical structure
  return buildTaskHierarchy(tasks);
};
```

### TR-4: Task Details Store

**Create Task Details Store**:
```typescript
// frontend/src/store/taskDetailsStore.ts
import { create } from 'zustand';

interface TaskDetailsStore {
  // Global toggle state
  showDetails: boolean;

  // Per-task expansion state (Map of taskId -> expanded)
  expandedTasks: Set<string>;

  // Actions
  toggleShowDetails: () => void;
  setShowDetails: (show: boolean) => void;
  toggleTaskExpansion: (taskId: string) => void;
  setTaskExpanded: (taskId: string, expanded: boolean) => void;
  isTaskExpanded: (taskId: string) => boolean;

  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const useTaskDetailsStore = create<TaskDetailsStore>((set, get) => ({
  showDetails: true,
  expandedTasks: new Set(),

  toggleShowDetails: () => {
    set((state) => {
      const newShowDetails = !state.showDetails;
      localStorage.setItem('showTaskDetails', JSON.stringify(newShowDetails));
      return { showDetails: newShowDetails };
    });
  },

  setShowDetails: (show: boolean) => {
    set({ showDetails: show });
    localStorage.setItem('showTaskDetails', JSON.stringify(show));
  },

  toggleTaskExpansion: (taskId: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedTasks);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      return { expandedTasks: newExpanded };
    });
  },

  setTaskExpanded: (taskId: string, expanded: boolean) => {
    set((state) => {
      const newExpanded = new Set(state.expandedTasks);
      if (expanded) {
        newExpanded.add(taskId);
      } else {
        newExpanded.delete(taskId);
      }
      return { expandedTasks: newExpanded };
    });
  },

  isTaskExpanded: (taskId: string) => {
    return get().expandedTasks.has(taskId);
  },

  loadFromStorage: () => {
    const stored = localStorage.getItem('showTaskDetails');
    if (stored) {
      set({ showDetails: JSON.parse(stored) });
    }
  },

  saveToStorage: () => {
    const { showDetails } = get();
    localStorage.setItem('showTaskDetails', JSON.stringify(showDetails));
  },
}));

// Initialize from localStorage on import
useTaskDetailsStore.getState().loadFromStorage();
```

### TR-5: Task Details UI Component

**Update TaskTreeItem Component**:
```typescript
// frontend/src/components/tasks/TaskTreeItem.tsx (MODIFIED)

import { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useTaskDetailsStore } from '../../store/taskDetailsStore';
import ReactMarkdown from 'react-markdown';

export const TaskTreeItem: React.FC<TaskTreeItemProps> = ({
  task,
  onToggle,
  onReschedule,
}) => {
  const { showDetails, isTaskExpanded, toggleTaskExpansion } = useTaskDetailsStore();
  const hasDetails = task.hasDetails && task.details && task.details.length > 0;
  const isExpanded = isTaskExpanded(task.id);
  const shouldShowDetails = showDetails && hasDetails && isExpanded;

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDetails && showDetails) {
      toggleTaskExpansion(task.id);
    }
  };

  // ... existing drag-and-drop setup ...

  return (
    <div ref={setNodeRef} style={style} className="task-tree-item">
      {/* Main task row */}
      <div
        {...(isRootTask ? attributes : {})}
        {...(isRootTask ? listeners : {})}
        className={clsx(
          'flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer',
          task.depth > 0 && 'ml-6',
          isDragging && 'bg-blue-50 dark:bg-blue-900/20'
        )}
        style={{ paddingLeft: `${task.depth * 24}px` }}
        onClick={handleToggleDetails}
      >
        {/* Details expansion chevron */}
        {hasDetails && showDetails ? (
          <button
            onClick={handleToggleDetails}
            className="flex-shrink-0 mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        ) : hasDetails ? (
          <DocumentTextIcon className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
        ) : hasChildren ? (
          // Existing subtask chevron
          <button onClick={handleExpandSubtasks}>
            {isSubtasksExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={clsx(
              'text-sm',
              task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100',
              task.important && !task.completed && 'font-semibold'
            )}>
              {task.text}
            </span>

            {task.priority && <PriorityBadge priority={task.priority} size="sm" />}
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-2 mt-1">
            {/* ... existing metadata (date, tags, mentions) ... */}
          </div>
        </div>

        {/* Reschedule button */}
        {onReschedule && (
          <button
            onClick={(e) => { e.stopPropagation(); onReschedule(task.id); }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ⏰
          </button>
        )}
      </div>

      {/* Task Details Section */}
      {shouldShowDetails && (
        <div className="ml-10 mt-1 mb-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border-l-2 border-blue-400 dark:border-blue-600">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {task.details.map((line, index) => (
              <div key={index}>
                <ReactMarkdown>{line}</ReactMarkdown>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recursively render children (subtasks) */}
      {hasChildren && isSubtasksExpanded && (
        <div className="task-children">
          {task.children.map((child) => (
            <TaskTreeItem
              key={child.id}
              task={child}
              onToggle={onToggle}
              onReschedule={onReschedule}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### TR-6: Global Toggle in TaskFilters

**Update TaskFilters Component**:
```typescript
// frontend/src/components/tasks/TaskFilters.tsx (MODIFIED)

import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useTaskDetailsStore } from '../../store/taskDetailsStore';

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  currentFilter,
  onFilterChange,
  onResetOrder,
  taskCounts,
}) => {
  const { showDetails, toggleShowDetails } = useTaskDetailsStore();
  // ... existing reset order state ...

  return (
    <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto justify-between">
      <div className="flex gap-1">
        {/* ... existing filter buttons ... */}
      </div>

      <div className="flex gap-2">
        {/* NEW: Details Toggle */}
        <button
          onClick={toggleShowDetails}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title={showDetails ? 'Hide task details' : 'Show task details'}
        >
          {showDetails ? (
            <EyeIcon className="h-4 w-4" />
          ) : (
            <EyeSlashIcon className="h-4 w-4" />
          )}
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>

        {/* Existing Reset Order button */}
        {onResetOrder && (
          <button onClick={handleResetOrder}>
            {/* ... existing reset button ... */}
          </button>
        )}
      </div>
    </div>
  );
};
```

### TR-7: File References

**Files to Create**:
1. `frontend/src/store/taskDetailsStore.ts` - Zustand store for details state
2. `frontend/src/utils/taskDetailsParser.ts` - Helper functions for parsing details

**Files to Modify**:
1. `frontend/src/services/taskService.ts` - Add details parsing
2. `frontend/src/components/tasks/TaskTreeItem.tsx` - Add details display
3. `frontend/src/components/tasks/TaskFilters.tsx` - Add global toggle
4. `frontend/src/components/editor/Editor.tsx` - Fix TipTap config
5. `frontend/src/components/editor/MarkdownEditor.tsx` - Fix TipTap config

**Dependencies** (to install):
```bash
npm install react-markdown@^9.0.0
```

---

## 7. Implementation Plan

### Phase 1: Parser & Data Model (Day 1)

**Goal**: Extract task details from markdown

**Tasks**:
1. Extend `ParsedTask` interface
   - Add `details?: string[]` field
   - Add `hasDetails: boolean` field

2. Create `taskDetailsParser.ts`
   - Helper function to detect backslash continuation
   - Helper function to extract detail lines
   - Helper function to determine detail indent level

3. Update `parseTask` function
   - Check for backslash at end of task line
   - Extract detail lines following task
   - Return both task and linesConsumed

4. Update `parseTasksFromContent`
   - Use linesConsumed to skip detail lines
   - Ensure detail lines don't become separate tasks

**Deliverable**: Task details parsed from markdown, stored in ParsedTask

**Validation**:
```bash
# Manual testing with Task-Details-Demo.txt
# 1. Open demo file
# 2. Check browser console for parsed tasks
# 3. Verify details array populated correctly
```

### Phase 2: TipTap Configuration Fix (Day 2)

**Goal**: Preserve indentation and backslash in Editor

**Tasks**:
1. Research TipTap markdown extension options
   - Check documentation for whitespace preservation
   - Test `preserveWhitespace` option
   - Investigate custom serializer if needed

2. Update `Editor.tsx` configuration
   - Set `tightLists: false`
   - Add whitespace preservation config
   - Test with demo file

3. Update `MarkdownEditor.tsx` configuration
   - Apply same fixes
   - Ensure consistency

4. Test round-trip editing
   - Open demo file in Editor
   - Edit task details
   - Save and reopen
   - Verify no formatting loss

**Deliverable**: Editor preserves task detail formatting

**Validation**:
```bash
# Manual testing:
# 1. Open Task-Details-Demo.txt in Editor
# 2. Edit a detail line
# 3. Save (Cmd/Ctrl+S)
# 4. Close and reopen file
# 5. Verify indentation and backslash preserved
```

### Phase 3: Details Display UI (Day 3)

**Goal**: Show task details in Tasks tab

**Tasks**:
1. Install react-markdown
   ```bash
   cd frontend && npm install react-markdown
   ```

2. Create `taskDetailsStore.ts`
   - Implement Zustand store
   - Add global toggle state
   - Add per-task expansion state
   - Add localStorage persistence

3. Update `TaskTreeItem.tsx`
   - Add details section below task
   - Add chevron for expand/collapse
   - Render details with ReactMarkdown
   - Add click handler to toggle expansion

4. Style details section
   - Gray background
   - Left border accent
   - Proper spacing and padding
   - Dark mode support

**Deliverable**: Task details visible and collapsible in Tasks tab

**Validation**:
```bash
# Manual testing:
# 1. Open Task-Details-Demo.txt
# 2. Go to Tasks tab
# 3. See tasks with document icon
# 4. Click task to expand details
# 5. Verify markdown rendering (bold, lists)
```

### Phase 4: Global Toggle (Day 4)

**Goal**: Add master show/hide button

**Tasks**:
1. Update `TaskFilters.tsx`
   - Add toggle button with eye icon
   - Connect to taskDetailsStore
   - Position next to Reset Order button

2. Wire up toggle behavior
   - Clicking toggles showDetails state
   - When hidden, all details collapse
   - Individual chevrons disabled when hidden

3. Test persistence
   - Toggle on/off
   - Refresh page
   - Verify state restored
   - Test across browser tabs

**Deliverable**: Global toggle controls all task details

**Validation**:
```bash
# Manual testing:
# 1. Expand several task details
# 2. Click "Hide Details" toggle
# 3. Verify all details hidden
# 4. Click "Show Details"
# 5. Verify details reappear (in collapsed state)
# 6. Refresh page
# 7. Verify toggle state persisted
```

### Phase 5: Edge Cases & Polish (Day 5)

**Goal**: Handle edge cases and improve UX

**Tasks**:
1. Handle tasks with both details AND subtasks
   - Two separate chevrons (details + subtasks)
   - Independent expansion states
   - Clear visual separation

2. Handle empty detail lines
   - Preserve blank lines in rendering
   - Don't show empty ReactMarkdown blocks

3. Improve visual feedback
   - Hover states on expandable tasks
   - Smooth expand/collapse animations
   - Loading states if needed

4. Accessibility
   - ARIA labels for chevron buttons
   - Keyboard navigation (Tab, Enter)
   - Screen reader support

5. Dark mode testing
   - Verify colors work in dark mode
   - Check contrast ratios
   - Test border and background colors

**Deliverable**: Polished, accessible feature

**Validation**:
```bash
# Manual testing:
# 1. Test complex tasks (details + subtasks)
# 2. Test with long detail text
# 3. Test with markdown in details (lists, bold, etc.)
# 4. Test keyboard navigation
# 5. Test in dark mode
# 6. Test with screen reader (if available)
```

### Phase 6: Inline Editing (Day 6) - Optional

**Goal**: Edit details in Tasks tab

**Tasks**:
1. Add edit mode to detail lines
   - Double-click to enter edit mode
   - Textarea with current text
   - Save on blur or Cmd/Ctrl+Enter

2. Update markdown file
   - Convert details back to markdown format
   - Preserve backslash continuation
   - Maintain indentation
   - Call saveFile with updated content

3. Handle add/delete operations
   - Add new detail line button
   - Delete detail line button
   - Update task structure

4. Test synchronization
   - Edit in Tasks tab
   - Verify Editor shows changes
   - Edit in Editor
   - Verify Tasks tab updates

**Deliverable**: Bidirectional editing of task details

**Validation**:
```bash
# Manual testing:
# 1. Double-click detail line in Tasks tab
# 2. Edit text
# 3. Press Enter to save
# 4. Switch to Editor tab
# 5. Verify changes reflected
# 6. Edit in Editor
# 7. Switch back to Tasks tab
# 8. Verify changes reflected
```

### Phase 7: Testing & Documentation (Day 7)

**Goal**: Ensure quality and maintainability

**Tasks**:
1. Unit tests
   - Test taskDetailsParser functions
   - Test parseTask with details
   - Test taskDetailsStore actions

2. Integration tests
   - Test end-to-end detail creation
   - Test toggle persistence
   - Test markdown rendering

3. Performance testing
   - Test with 100+ tasks with details
   - Measure parse time
   - Measure render time
   - Optimize if needed

4. Documentation
   - Update README with details feature
   - Document markdown format
   - Add code comments
   - Create user guide

**Deliverable**: Well-tested, documented feature

**Validation**:
```bash
# Run tests (when test suite exists)
cd frontend && npm test

# Performance testing:
# 1. Create file with 100+ tasks with details
# 2. Open in Tasks tab
# 3. Measure render time (should be <500ms)
# 4. Toggle all details
# 5. Measure toggle time (should be <100ms)
```

---

## 8. Data Flow

### Parsing Flow

```
Markdown File
  ↓
Read File Content
  ↓
parseTasksFromContent(content, filePath)
  ↓
For each line:
  ↓
parseTask(lines, lineIndex, filePath)
  ↓
  • Check if line matches task regex
  • Check if task ends with \
  • If yes, extract detail lines:
    - Find lines starting with 2+ spaces
    - Stop at non-detail line
    - Store in details[] array
  • Return { task, linesConsumed }
  ↓
Skip linesConsumed lines (detail lines)
  ↓
ParsedTask[] with details field populated
  ↓
buildTaskHierarchy(tasks)
  ↓
Hierarchical task structure
  ↓
TaskList component renders tasks
```

### Display Flow

```
User opens Tasks tab
  ↓
TaskList renders
  ↓
For each task:
  ↓
TaskTreeItem renders
  ↓
Check task.hasDetails
  ↓
If true, show chevron/document icon
  ↓
User clicks task row
  ↓
toggleTaskExpansion(task.id)
  ↓
Update expandedTasks Set
  ↓
TaskTreeItem re-renders
  ↓
shouldShowDetails = showDetails && isExpanded
  ↓
If true, render details section
  ↓
ReactMarkdown renders each detail line
  ↓
Formatted details displayed
```

### Toggle Flow

```
User clicks "Hide Details" toggle
  ↓
toggleShowDetails() in taskDetailsStore
  ↓
Set showDetails = !showDetails
  ↓
Save to localStorage
  ↓
All TaskTreeItem components re-render
  ↓
shouldShowDetails = false
  ↓
Details sections hidden
  ↓
Chevrons disabled/grayed out
```

### Editor Preservation Flow

```
User edits task in Editor
  ↓
TipTap onChange handler fires
  ↓
Markdown extension serializes content
  ↓
WITH FIX: preserveWhitespace, tightLists: false
  ↓
Backslash and indentation preserved
  ↓
Content saved to file
  ↓
File watcher detects change
  ↓
Re-parse tasks
  ↓
Details still present in ParsedTask
  ↓
Tasks tab updates (no data loss)
```

---

## 9. Testing Strategy

### Unit Tests

**taskDetailsParser.ts**:
```typescript
describe('taskDetailsParser', () => {
  it('should detect backslash continuation', () => {
    expect(hasDetailsContinuation('+ Task\\')).toBe(true);
    expect(hasDetailsContinuation('+ Task')).toBe(false);
  });

  it('should extract detail lines', () => {
    const lines = [
      '+ Task\\',
      '  Detail 1',
      '  Detail 2',
      '+ Next Task'
    ];
    const details = extractDetailLines(lines, 1);
    expect(details).toEqual(['Detail 1', 'Detail 2']);
  });

  it('should handle empty lines in details', () => {
    const lines = [
      '+ Task\\',
      '  Detail 1',
      '',
      '  Detail 2'
    ];
    const details = extractDetailLines(lines, 1);
    expect(details).toEqual(['Detail 1', '', 'Detail 2']);
  });
});
```

**parseTask function**:
```typescript
describe('parseTask', () => {
  it('should parse task with details', () => {
    const lines = [
      '+ Shopping\\',
      '  Remember bags',
      '  Budget $100'
    ];
    const { task, linesConsumed } = parseTask(lines, 0, 'test.txt');

    expect(task.text).toBe('Shopping');
    expect(task.details).toEqual(['Remember bags', 'Budget $100']);
    expect(task.hasDetails).toBe(true);
    expect(linesConsumed).toBe(3);
  });

  it('should handle task without details', () => {
    const lines = ['+ Regular task'];
    const { task, linesConsumed } = parseTask(lines, 0, 'test.txt');

    expect(task.text).toBe('Regular task');
    expect(task.details).toBeUndefined();
    expect(task.hasDetails).toBe(false);
    expect(linesConsumed).toBe(1);
  });
});
```

### Integration Tests

**End-to-End Detail Creation**:
```typescript
describe('Task Details Feature', () => {
  it('should create and display task with details', async () => {
    // Create file with task details
    const content = `+ Test task\\
  Detail line 1\\
  Detail line 2`;

    await fileService.saveFile('Notes/test.txt', content);
    await openFile('Notes/test.txt');

    // Go to Tasks tab
    const tasksTab = screen.getByText('Tasks');
    fireEvent.click(tasksTab);

    // Find task
    const taskItem = await screen.findByText('Test task');
    expect(taskItem).toBeInTheDocument();

    // Expand details
    fireEvent.click(taskItem);

    // Verify details shown
    expect(screen.getByText('Detail line 1')).toBeInTheDocument();
    expect(screen.getByText('Detail line 2')).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

- [ ] **Parsing**
  - [ ] Task with backslash parsed correctly
  - [ ] Detail lines extracted
  - [ ] Empty lines in details preserved
  - [ ] Tasks without details unaffected
  - [ ] Nested tasks with details work

- [ ] **Editor Preservation**
  - [ ] Backslash preserved after edit
  - [ ] Indentation preserved after edit
  - [ ] Round-trip editing doesn't lose data
  - [ ] Works in both Editor.tsx and MarkdownEditor.tsx

- [ ] **Display**
  - [ ] Details show/hide on click
  - [ ] Chevron indicates state correctly
  - [ ] Markdown formatting renders (bold, lists, etc.)
  - [ ] Empty detail lines handled gracefully
  - [ ] Tasks with both details and subtasks work

- [ ] **Global Toggle**
  - [ ] Toggle button in TaskFilters
  - [ ] Clicking hides all details
  - [ ] Clicking again shows details (collapsed)
  - [ ] State persists across refreshes
  - [ ] State persists across browser tabs

- [ ] **Visual**
  - [ ] Details have clear visual style
  - [ ] Hover states work
  - [ ] Animations smooth
  - [ ] Dark mode looks good
  - [ ] Contrast ratios accessible

- [ ] **Edge Cases**
  - [ ] Very long detail text
  - [ ] Many detail lines (50+)
  - [ ] Special characters in details
  - [ ] Markdown edge cases (nested lists, code blocks)
  - [ ] Tasks at different indent levels with details

---

## 10. Success Metrics

### Quantitative Metrics

**Performance**:
- Task parsing with details <50ms for 100 tasks
- Detail expansion animation <200ms
- Global toggle <100ms
- No memory leaks with 500+ tasks with details

**Reliability**:
- 0 data loss incidents (details preserved)
- 0 crashes related to detail parsing/rendering
- 100% accuracy in round-trip editing
- <1% parse failures

**Adoption**:
- 40% of users add details to tasks within first week
- Average 2-3 detail lines per task
- 60% of tasks with details use markdown formatting

### Qualitative Metrics

**User Feedback**:
- Users report feature is "useful" and "intuitive"
- No confusion about backslash syntax
- Positive feedback about markdown support
- Appreciation for global toggle

**UX Quality**:
- Smooth, professional animations
- Clear visual hierarchy
- No layout jumps or glitches
- Accessible keyboard navigation

### Acceptance Criteria for Launch

**Must Have**:
- ✅ All P0 functional requirements implemented
- ✅ TipTap preserves formatting (no data loss)
- ✅ Details display correctly in Tasks tab
- ✅ Global toggle works and persists
- ✅ Manual test checklist 100% complete
- ✅ Works in Chrome, Firefox, Safari
- ✅ Zero known critical bugs

**Nice to Have**:
- ⚠️ Inline editing in Tasks tab (can be post-launch)
- ⚠️ Unit tests (can be added iteratively)
- ⚠️ Details in Board view (future phase)

---

## 11. Risks & Mitigation

### Risk 1: TipTap Cannot Preserve Indentation
**Risk**: TipTap's markdown extension may not support preserving arbitrary whitespace
**Impact**: High
**Likelihood**: Medium
**Mitigation**:
- Research TipTap documentation thoroughly
- Test `preserveWhitespace` and other config options
- If built-in options fail, create custom TipTap extension
- Worst case: Use plain textarea for editing tasks with details
- Consider switching to alternative markdown editor (CodeMirror, Monaco)

### Risk 2: Performance with Many Details
**Risk**: Rendering many expanded task details may lag
**Impact**: Medium
**Likelihood**: Low
**Mitigation**:
- Use React.memo for TaskTreeItem
- Implement virtual scrolling if needed
- Lazy-load details (only render when expanded)
- Profile and optimize ReactMarkdown usage
- Consider pagination for large task lists

### Risk 3: Markdown Rendering Edge Cases
**Risk**: ReactMarkdown may not handle all edge cases correctly
**Impact**: Low
**Likelihood**: Medium
**Mitigation**:
- Test with variety of markdown syntax
- Configure ReactMarkdown with proper options
- Sanitize input to prevent XSS
- Document known limitations
- Provide escape hatch (show raw markdown)

### Risk 4: Indentation Ambiguity
**Risk**: 2-space indent for details may conflict with subtask indentation
**Impact**: Medium
**Likelihood**: Medium
**Mitigation**:
- Use depth calculation to distinguish details from subtasks
- Details require backslash continuation (explicit marker)
- Subtasks use task markers (`*` or `+`)
- Clear documentation of format
- Validate parser with complex examples

### Risk 5: User Confusion About Format
**Risk**: Users may not understand backslash syntax
**Impact**: Low
**Likelihood**: Medium
**Mitigation**:
- Add tooltip/hint when hovering over task input
- Provide examples in documentation
- Show template with example in help menu
- Auto-insert backslash when pressing Enter in task
- Visual indicator in Editor (syntax highlighting)

### Risk 6: Browser Compatibility
**Risk**: ReactMarkdown or other features may not work in all browsers
**Impact**: Medium
**Likelihood**: Low
**Mitigation**:
- Test in Chrome, Firefox, Safari (minimum)
- Use polyfills if needed
- Graceful degradation (show raw text if markdown fails)
- Check browser support for CSS features used
- Provide feedback if browser unsupported

---

## 12. Appendix

### A. Markdown Format Reference

**Basic Task with Details**:
```markdown
+ Task title\
  Detail line 1\
  Detail line 2
```

**Task with Formatted Details**:
```markdown
+ Deploy to production\
  **Pre-deployment checklist:**\
  - Run all tests\
  - Check staging environment\
  - Notify team

  Deployment window: 2pm-4pm EST
```

**Task with Both Details and Subtasks**:
```markdown
+ Parent task\
  This is the parent description\
  It has multiple lines
  + Subtask 1
  + Subtask 2\
    This subtask has details too
```

**Indentation Rules**:
- Task at depth 0: No indent
- Task at depth 1: 4-space indent
- Task at depth 2: 8-space indent
- Details: Task indent + 2 spaces
- Example:
  ```markdown
  + Root task\
    Root task detail (2 spaces)
    + Nested task (4 spaces)\
      Nested task detail (6 spaces)
  ```

### B. TipTap Configuration Research

**Option 1: preserveWhitespace**:
```typescript
Markdown.configure({
  preserveWhitespace: 'full',  // or true
  tightLists: false,
})
```

**Option 2: Custom Extension**:
```typescript
import { Extension } from '@tiptap/core';

const TaskDetailsPreserver = Extension.create({
  name: 'taskDetailsPreserver',

  addGlobalAttributes() {
    return [
      {
        types: ['listItem'],
        attributes: {
          preserveWhitespace: {
            default: null,
            parseHTML: element => element.getAttribute('data-preserve'),
            renderHTML: attributes => {
              if (!attributes.preserveWhitespace) return {};
              return { 'data-preserve': attributes.preserveWhitespace };
            },
          },
        },
      },
    ];
  },
});
```

**Option 3: CodeMirror Integration** (if TipTap fails):
```typescript
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

// Use CodeMirror instead of TipTap for raw markdown editing
```

### C. React-Markdown Configuration

```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    // Custom renderers if needed
    p: ({ children }) => <div className="mb-2">{children}</div>,
    ul: ({ children }) => <ul className="list-disc ml-4">{children}</ul>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  }}
>
  {detailLine}
</ReactMarkdown>
```

### D. localStorage Schema

**Task Details Toggle State**:
```typescript
// Key: 'showTaskDetails'
// Value: boolean (JSON-stringified)
localStorage.setItem('showTaskDetails', 'true');
localStorage.getItem('showTaskDetails'); // "true"
```

**Per-Task Expansion State** (not persisted):
```typescript
// Stored in memory only (taskDetailsStore)
expandedTasks: Set<string> = new Set(['file.txt-5', 'file.txt-12']);
```

### E. Code References

**Key Files**:
- Task Service: `frontend/src/services/taskService.ts:3-262`
- Task Tree Item: `frontend/src/components/tasks/TaskTreeItem.tsx:1-197`
- Task Filters: `frontend/src/components/tasks/TaskFilters.tsx:1-95`
- Editor: `frontend/src/components/editor/Editor.tsx:39-89`
- Markdown Editor: `frontend/src/components/editor/MarkdownEditor.tsx:35-127`
- Demo File: `/Users/robertocallaghan/Documents/notes/Notes/Task-Details-Demo.txt`

**External Documentation**:
- TipTap Markdown: https://tiptap.dev/api/extensions/markdown
- TipTap Configuration: https://tiptap.dev/api/extensions/starter-kit#configure-included-extensions
- React-Markdown: https://github.com/remarkjs/react-markdown
- Zustand: https://docs.pmnd.rs/zustand/getting-started/introduction

### F. Alternative Approaches Considered

**Alternative 1: Dedicated Details Field in Frontmatter**
- **Pros**: Structured, easy to parse
- **Cons**: Breaks from inline markdown, not visible in plain text
- **Decision**: Rejected (breaks plain text usability)

**Alternative 2: Use Task List Extension**
- **Pros**: TipTap has built-in task list support
- **Cons**: Conflicts with NotePlan-style tasks, limited customization
- **Decision**: Rejected (already disabled TaskList extension)

**Alternative 3: Collapsible Markdown Sections**
- **Pros**: Standard markdown extension
- **Cons**: Not task-specific, harder to parse
- **Decision**: Rejected (too complex for simple task details)

**Alternative 4: Modal/Sidebar for Details**
- **Pros**: More space for rich editing
- **Cons**: Extra clicks, breaks inline workflow
- **Decision**: Rejected for MVP (maybe future enhancement)

### G. Future Enhancements

1. **Rich Text Editor for Details**
   - WYSIWYG editor for details
   - Toolbar for formatting
   - Image/file attachments

2. **Details in Board View**
   - Show details in Kanban cards
   - Hover preview
   - Inline editing in cards

3. **Search in Details**
   - Full-text search includes details
   - Highlight matching details
   - Filter by details content

4. **Templates for Details**
   - Pre-defined detail structures
   - Quick insert (e.g., "Meeting notes", "Checklist")
   - Custom templates

5. **Collaboration**
   - Comments on details
   - @mentions in details trigger notifications
   - Detail edit history

6. **Export/Import**
   - Export tasks with details to PDF
   - Import from other tools (Todoist, etc.)
   - Preserve details in export

---

## Conclusion

This PRP outlines a comprehensive solution for adding free-text task details to the NotePlan clone application. By using markdown backslash line continuation syntax with indented detail lines, we maintain plain-text compatibility while enabling rich task documentation.

The key technical challenges are:
1. **Parser Enhancement**: Extending task parser to extract detail lines
2. **TipTap Configuration**: Preserving indentation and backslash syntax
3. **UI Design**: Inline display with expand/collapse functionality
4. **State Management**: Global toggle with localStorage persistence

The phased implementation plan breaks down the work into manageable chunks, with clear deliverables and validation criteria for each phase.

**Estimated Implementation Time**: 5-7 days (1 developer)

**Confidence Level for One-Pass Success**: 8.0/10

**Reasoning**:
- ✅ Clear user-provided example format
- ✅ Well-understood parsing approach
- ✅ Existing UI patterns to follow (expand/collapse from subtasks)
- ✅ Simple data model extension
- ⚠️ TipTap configuration may require research/experimentation
- ⚠️ Edge cases with indentation need careful handling

**Next Steps**:
1. Review and approve PRP
2. Begin Phase 1 implementation (parser)
3. Test TipTap configuration options
4. Implement UI components
5. Validate with demo file

---

**PRP Confidence Score: 8.0/10**

This PRP provides comprehensive context for one-pass implementation success, including:
- ✅ User-provided demo file showing exact desired format
- ✅ Clear technical specifications with code examples
- ✅ Step-by-step implementation plan with validation gates
- ✅ Thorough edge case analysis
- ✅ Multiple mitigation strategies for risks
- ✅ Extensive references to existing code
- ✅ External documentation links
- ⚠️ Some uncertainty around TipTap configuration (requires testing)
