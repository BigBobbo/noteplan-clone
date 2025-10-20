# Product Requirements Plan: Fix Task Details Display

**Version:** 1.0
**Date:** October 10, 2025
**Status:** Ready for Implementation
**Author:** System Generated
**Project:** NotePlan Clone - Task Details Display Fix

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background & Current State](#2-background--current-state)
3. [Problem Analysis](#3-problem-analysis)
4. [Goals & Objectives](#4-goals--objectives)
5. [User Stories](#5-user-stories)
6. [Technical Requirements](#6-technical-requirements)
7. [Implementation Plan](#7-implementation-plan)
8. [Testing Strategy](#8-testing-strategy)
9. [Success Metrics](#9-success-metrics)
10. [References](#10-references)

---

## 1. Executive Summary

### Overview
This PRP addresses the broken task details display functionality in both the Tasks tab and Kanban board. While the system successfully parses task details from markdown files, the user interface doesn't show them correctly when the "Show Details" toggle is enabled.

### Problem Statement
Users have added task details to their tasks using the proper markdown format (indented lines under tasks), and the system correctly parses and stores these details. However:

1. **Tasks Tab**: Details require both the master toggle AND individual per-task expansion, which is confusing UX
2. **Kanban Board**: Details are completely missing - cards don't show details at all

### Solution
1. **Fix Tasks Tab**: When master toggle is ON, show all details by default (auto-expand)
2. **Add to Kanban Board**: Display task details in Kanban cards with proper formatting
3. **Maintain Control**: Keep individual expansion control for fine-tuning visibility

### Success Criteria
- ✅ Master toggle controls default visibility of all details
- ✅ When toggle is ON, all task details show automatically
- ✅ Users can still collapse/expand individual task details
- ✅ Kanban cards display task details when toggle is ON
- ✅ Details formatting matches the Tasks tab style
- ✅ Toggle state persists across sessions

---

## 2. Background & Current State

### Existing Implementation

The task details feature was previously implemented (see PRPs/task-details-feature.md), including:

**Task Parsing** (taskService.ts:58-104):
- ✅ Parses task details from indented lines following tasks
- ✅ Stores details in `ParsedTask.details` field
- ✅ Sets `hasDetails` boolean flag
- ✅ Correctly identifies detail lines vs child tasks

**Task Details Store** (taskDetailsStore.ts):
```typescript
interface TaskDetailsStore {
  masterToggleVisible: boolean;     // Global toggle
  expandedTasks: Set<string>;       // Per-task expansion
  toggleMasterVisibility: () => void;
  toggleExpansion: (taskId: string) => void;
  isExpanded: (taskId: string) => boolean;
}
```

**Tasks Tab UI** (TaskTreeItem.tsx:250-257):
```typescript
{task.details && (
  <TaskDetails
    details={task.details}
    onSave={handleSaveDetails}
    onDelete={handleDeleteDetails}
    isExpanded={!!showDetails}  // <-- PROBLEM: Uses complex logic
  />
)}
```

**Current Logic** (TaskTreeItem.tsx:35):
```typescript
const showDetails = masterToggleVisible && isDetailsExpanded(task.id) && task.details;
```

**Problem**: Requires THREE conditions to show details:
1. Master toggle must be ON
2. Task must be individually expanded (user clicks document icon)
3. Task must have details

This means users turn on "Show Details" but nothing shows until they click each task's document icon separately.

### What Works
- ✅ Task parsing correctly extracts details from markdown
- ✅ Details stored in data model
- ✅ TaskDetails component renders markdown beautifully
- ✅ Edit and delete functionality works
- ✅ Master toggle button exists in UI
- ✅ Individual expansion state tracking works

### What's Broken
- ❌ **UX Confusion**: Users expect master toggle to show all details immediately
- ❌ **Tasks Tab**: Requires two separate actions (master toggle + per-task click)
- ❌ **Kanban Board**: No details display at all - completely missing feature

### User Expectation vs Reality

**User Mental Model:**
```
Master Toggle OFF → All details hidden
Master Toggle ON  → All details visible (can individually collapse)
```

**Current Behavior:**
```
Master Toggle OFF → All details hidden
Master Toggle ON  → All details still hidden (must click each task)
```

---

## 3. Problem Analysis

### Root Causes

#### Issue 1: Confusing Visibility Logic

**File**: `TaskTreeItem.tsx:35`

```typescript
const showDetails = masterToggleVisible && isDetailsExpanded(task.id) && task.details;
```

**Problem**: The logic treats `masterToggleVisible` and `isDetailsExpanded(task.id)` as equal requirements, when they should have different semantics:

- `masterToggleVisible` = "Allow details to be visible"
- `isDetailsExpanded(task.id)` = "This specific task is expanded"

**Better Logic:**
```typescript
// When master toggle is ON, show details unless explicitly collapsed
// When master toggle is OFF, hide all details regardless of expansion state
const isExplicitlyCollapsed = !isDetailsExpanded(task.id);
const showDetails = masterToggleVisible && !isExplicitlyCollapsed && task.details;

// OR simpler: When master toggle is ON, default to expanded
const showDetails = masterToggleVisible && task.details && (
  isDetailsExpanded(task.id) ?? true  // Default to expanded
);
```

#### Issue 2: No Default Expansion State

**File**: `taskDetailsStore.ts`

The store tracks which tasks are expanded in a `Set<string>`, but:
- Empty set means nothing is expanded
- No concept of "default state when master toggle is ON"
- When master toggle turns ON, nothing happens to expansion states

**Solution**: Add default expansion logic based on master toggle state.

#### Issue 3: Kanban Board Missing Details

**File**: `KanbanCard.tsx:26-78`

The component renders:
- ✅ Task text
- ✅ Priority badge
- ✅ Subtask count
- ✅ Date and tags
- ❌ **Details are completely missing**

**Code Analysis:**
- No import of TaskDetails component
- No check for `task.details`
- No rendering of details content
- No connection to taskDetailsStore

**Solution**: Add details rendering to KanbanCard similar to TaskTreeItem.

### Research: Best Practices for Task Detail Display

From web research on task management UIs (2024/2025):

**Key Findings:**

1. **Default Visibility** (from Eleken.co list UI design):
   - Show critical information by default
   - Allow users to expand for more details
   - Use color-coding or icons to indicate additional content availability

2. **Accordion UI Patterns** (from LogRocket, Smashing Magazine):
   - Use chevron icons (▼ expanded, ▶ collapsed)
   - Smooth animations (~300ms ease-in-out)
   - "Expand All/Collapse All" master control
   - Individual expansion persists when master control is used

3. **Kanban Card Details** (from Asana, Trello patterns):
   - Show preview of description/details on cards
   - Compact view with truncation for long text
   - Expandable for full details view
   - Consistent with list view styling

4. **Master Toggle Behavior** (from Notion, ClickUp):
   - Master "Show Details" ON → All details visible by default
   - Master "Hide Details" OFF → All details hidden
   - Individual controls still work when master is ON
   - State should be intuitive without documentation

---

## 4. Goals & Objectives

### Primary Goals

1. **Fix Master Toggle Behavior**
   - Master toggle ON → All details visible by default
   - Master toggle OFF → All details hidden
   - Clear, predictable behavior

2. **Add Details to Kanban Board**
   - Display task details in Kanban cards
   - Respect master toggle setting
   - Maintain visual consistency with Tasks tab

3. **Preserve Individual Control**
   - Users can still collapse individual task details when master is ON
   - Expansion state should be intuitive
   - No breaking changes to existing functionality

### Secondary Goals

1. **Consistent UX**: Same detail display behavior across Tasks tab and Kanban board
2. **Performance**: No lag when toggling details for 100+ tasks
3. **Accessibility**: Proper ARIA labels and keyboard navigation
4. **Visual Polish**: Smooth animations and clear visual hierarchy

### Non-Goals

- ❌ Redesigning the TaskDetails component (already works well)
- ❌ Adding new detail editing features
- ❌ Changing the markdown format for details
- ❌ Adding per-board detail visibility settings
- ❌ Syntax highlighting for code in details

---

## 5. User Stories

### Epic 1: Master Toggle Fixes

**US-1.1**: As a user, when I turn on "Show Details", I expect to see all task details immediately without additional clicks.

**Acceptance Criteria:**
- Click "Show Details" toggle
- All tasks with details show their details automatically
- No need to click individual task document icons
- Details appear with smooth animation

**US-1.2**: As a user, I want to collapse individual task details even when the master toggle is on, so I can focus on specific tasks.

**Acceptance Criteria:**
- Master toggle is ON (showing all details)
- Click a task's chevron to collapse just that task's details
- Other tasks' details remain visible
- Clicking again re-expands that task's details

**US-1.3**: As a user, when I turn off "Show Details", I expect all task details to hide immediately.

**Acceptance Criteria:**
- Click "Hide Details" toggle
- All task details hide immediately
- Individual expansion states are cleared/reset
- UI is clean and uncluttered

### Epic 2: Kanban Board Details

**US-2.1**: As a user, I want to see task details on Kanban cards so I have context about each task.

**Acceptance Criteria:**
- Tasks with details show a document icon or details indicator
- When master toggle is ON, details appear on cards
- Details are formatted with proper markdown rendering
- Cards remain compact and scannable

**US-2.2**: As a user, I want details on Kanban cards to match the Tasks tab styling so the experience is consistent.

**Acceptance Criteria:**
- Same background color and border style
- Same markdown formatting
- Same typography and spacing
- Same expand/collapse behavior

**US-2.3**: As a user, I want to expand/collapse details on individual Kanban cards without affecting other cards.

**Acceptance Criteria:**
- Click card or chevron to toggle details
- Only that card's details expand/collapse
- Other cards maintain their state
- Smooth animation on expand/collapse

---

## 6. Technical Requirements

### TR-1: Fix Master Toggle Default Behavior

**File**: `frontend/src/store/taskDetailsStore.ts`

**Current State:**
```typescript
expandedTasks: Set<string>  // Empty by default
```

**Problem**: When master toggle is ON and expandedTasks is empty, nothing shows.

**Solution**: Change the logic so:
- Empty set = "use default behavior"
- Default behavior when master toggle is ON = expanded
- Users explicitly collapse to add to expandedTasks

**New Logic:**
```typescript
interface TaskDetailsStore {
  masterToggleVisible: boolean;
  collapsedTasks: Set<string>;  // CHANGED: Track collapsed, not expanded
  // ... actions
}
```

**Why this works:**
- Master ON + task NOT in collapsedTasks → Show details (default behavior)
- Master ON + task IN collapsedTasks → Hide details (user collapsed)
- Master OFF → Hide all details regardless

### TR-2: Update TaskTreeItem Logic

**File**: `frontend/src/components/tasks/TaskTreeItem.tsx`

**Current Code** (line 35):
```typescript
const showDetails = masterToggleVisible && isDetailsExpanded(task.id) && task.details;
```

**New Code**:
```typescript
// Show details if: master toggle is ON AND task is not explicitly collapsed AND has details
const isCollapsed = collapsedTasks.has(task.id);
const showDetails = masterToggleVisible && !isCollapsed && !!task.details;
```

**Visual Indicator** (lines 161-176):
```typescript
{/* Details indicator */}
{task.hasDetails && (
  <button
    onClick={handleToggleDetails}
    className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
    title={showDetails ? 'Hide details' : 'Show details'}
  >
    {masterToggleVisible && showDetails ? (
      <ChevronDownIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    ) : (
      <DocumentTextIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
    )}
  </button>
)}
```

### TR-3: Update TaskDetailsStore

**File**: `frontend/src/store/taskDetailsStore.ts`

**Changes Needed:**

1. **Rename State Variable**:
```typescript
// BEFORE
expandedTasks: Set<string>;

// AFTER
collapsedTasks: Set<string>;
```

2. **Update Toggle Logic**:
```typescript
toggleExpansion: (taskId: string) => {
  set((state) => {
    const newCollapsed = new Set(state.collapsedTasks);

    if (newCollapsed.has(taskId)) {
      // Task is collapsed, expand it (remove from set)
      newCollapsed.delete(taskId);
    } else {
      // Task is expanded, collapse it (add to set)
      newCollapsed.add(taskId);
    }

    return { collapsedTasks: newCollapsed };
  });
},
```

3. **Add isCollapsed Helper**:
```typescript
isCollapsed: (taskId: string) => {
  return get().collapsedTasks.has(taskId);
},
```

4. **Clear Collapsed State When Master Toggle Changes**:
```typescript
toggleMasterVisibility: () => {
  set((state) => {
    const newVisibility = !state.masterToggleVisible;

    // When turning master toggle ON, clear all collapsed states
    // (start fresh with all expanded)
    const newCollapsed = newVisibility ? new Set<string>() : state.collapsedTasks;

    localStorage.setItem('showTaskDetails', JSON.stringify(newVisibility));
    return {
      masterToggleVisible: newVisibility,
      collapsedTasks: newCollapsed
    };
  });
},
```

### TR-4: Add Details to KanbanCard

**File**: `frontend/src/components/kanban/KanbanCard.tsx`

**New Imports**:
```typescript
import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import { useTaskDetailsStore } from '../../store/taskDetailsStore';
```

**New Component Structure**:
```typescript
export const KanbanCard: React.FC<KanbanCardProps> = ({ task }) => {
  const { masterToggleVisible, collapsedTasks, toggleExpansion } = useTaskDetailsStore();
  const hasDetails = task.hasDetails && task.details;
  const isCollapsed = collapsedTasks.has(task.id);
  const showDetails = masterToggleVisible && !isCollapsed && hasDetails;

  // ... existing drag-and-drop setup ...

  const handleToggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDetails && masterToggleVisible) {
      toggleExpansion(task.id);
    }
  };

  return (
    <div className={/* ... existing classes ... */}>
      {/* Header: Priority, Text, Expand Button */}
      <div className="flex items-start gap-2 mb-2">
        {task.priority && <PriorityBadge priority={task.priority} size="sm" />}

        <p className="text-sm text-gray-900 dark:text-gray-100 flex-1 leading-snug">
          {task.text}
        </p>

        {/* Details toggle button */}
        {hasDetails && masterToggleVisible && (
          <button
            onClick={handleToggleDetails}
            className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={showDetails ? 'Hide details' : 'Show details'}
          >
            {showDetails ? (
              <ChevronDownIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            )}
          </button>
        )}
      </div>

      {/* Task Details */}
      {showDetails && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded border-l-2 border-blue-400 dark:border-blue-600">
          <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
            <ReactMarkdown>{task.details}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Subtask count */}
      {task.children.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {task.children.length} subtask{task.children.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Footer: Date and Tags */}
      {/* ... existing footer ... */}
    </div>
  );
};
```

**Styling Considerations:**
- Use `text-xs` for details text (smaller than task text)
- Compact padding (`p-2` instead of `p-3`)
- Same visual style as TaskTreeItem details
- Maintain card height constraints

### TR-5: Update TaskDetails Component (Minor)

**File**: `frontend/src/components/tasks/TaskDetails.tsx`

**Current Issue**: `isExpanded` prop controls rendering, but now we want it always rendered and use CSS for show/hide.

**Solution**: Make isExpanded control CSS class instead of conditional rendering.

**Changes**:
```typescript
export const TaskDetails: React.FC<TaskDetailsProps> = ({
  details,
  onSave,
  onDelete,
  isExpanded,
}) => {
  // ... existing state ...

  return (
    <div
      className={clsx(
        'ml-10 mt-1 mb-2 p-3 rounded-md border-l-2 transition-all duration-200',
        'bg-gray-50 dark:bg-gray-800/50',
        'border-blue-400 dark:border-blue-600',
        isExpanded ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0 overflow-hidden'
      )}
    >
      {/* ... rest of component ... */}
    </div>
  );
};
```

**Why**: Smoother animations with CSS transitions instead of mount/unmount.

---

## 7. Implementation Plan

### Phase 1: Update Store Logic (30 minutes)

**File**: `frontend/src/store/taskDetailsStore.ts`

**Steps**:
1. Rename `expandedTasks` → `collapsedTasks`
2. Update `toggleExpansion` logic to add/remove from collapsed set
3. Add `isCollapsed` helper method
4. Update `toggleMasterVisibility` to clear collapsed state
5. Update type definitions and comments

**Validation**:
```typescript
// Test in browser console
const store = useTaskDetailsStore.getState();
console.log('Master visible:', store.masterToggleVisible);
console.log('Collapsed tasks:', Array.from(store.collapsedTasks));

// Toggle a task
store.toggleExpansion('task-id-1');
console.log('After toggle:', Array.from(store.collapsedTasks));
```

### Phase 2: Update TaskTreeItem (20 minutes)

**File**: `frontend/src/components/tasks/TaskTreeItem.tsx`

**Steps**:
1. Change `isDetailsExpanded` → `isCollapsed` (negate logic)
2. Update `showDetails` calculation (line 35)
3. Update chevron icon logic (lines 161-176)
4. Update toggle handler

**Validation**:
- Open Tasks tab
- Turn on "Show Details"
- Verify all task details appear automatically
- Click a task's chevron
- Verify only that task collapses

### Phase 3: Add Details to Kanban Cards (45 minutes)

**File**: `frontend/src/components/kanban/KanbanCard.tsx`

**Steps**:
1. Import necessary dependencies (ReactMarkdown, icons, store)
2. Add state management for details visibility
3. Add details toggle button to card header
4. Add details rendering section
5. Style details section to fit card layout
6. Test with sample tasks

**Validation**:
- Open Kanban board
- Turn on "Show Details" toggle
- Verify tasks with details show them on cards
- Verify markdown renders correctly
- Verify toggle works per-card

### Phase 4: Styling & Polish (20 minutes)

**Files**: Various component files

**Steps**:
1. Ensure consistent styling between Tasks tab and Kanban board
2. Add smooth animations for expand/collapse
3. Test dark mode appearance
4. Adjust spacing and padding for readability
5. Test with long detail text
6. Test with empty details

**Validation**:
- Visual inspection in both light and dark modes
- Test with varying detail lengths
- Verify no layout shifts or jumps

### Phase 5: Edge Cases & Testing (25 minutes)

**Steps**:
1. Test with tasks that have both details AND subtasks
2. Test master toggle ON → OFF → ON cycle
3. Test individual collapse → master toggle OFF → master toggle ON
4. Test with 100+ tasks with details (performance)
5. Test keyboard navigation
6. Test accessibility with screen reader
7. Test browser refresh (persistence)

**Validation**:
- Run through manual test checklist (see Testing Strategy)
- Document any issues found
- Fix critical bugs
- Create tickets for non-critical issues

---

## 8. Testing Strategy

### Manual Testing Checklist

#### Master Toggle Behavior

- [ ] **Default State**
  - [ ] Open app with tasks that have details
  - [ ] Master toggle should default to ON
  - [ ] All task details should be visible

- [ ] **Toggle OFF**
  - [ ] Click "Hide Details" button
  - [ ] Verify all details hide immediately
  - [ ] Verify document icons still visible
  - [ ] Verify chevrons hidden

- [ ] **Toggle ON**
  - [ ] Click "Show Details" button
  - [ ] Verify all details appear immediately
  - [ ] Verify smooth animation
  - [ ] Verify no layout shift

- [ ] **Persistence**
  - [ ] Toggle OFF, refresh page
  - [ ] Verify details remain hidden
  - [ ] Toggle ON, refresh page
  - [ ] Verify details are shown

#### Individual Task Collapse

- [ ] **Collapse Single Task**
  - [ ] Master toggle ON
  - [ ] Click one task's chevron
  - [ ] Verify only that task's details collapse
  - [ ] Verify other tasks unchanged

- [ ] **Expand Collapsed Task**
  - [ ] Click collapsed task's chevron
  - [ ] Verify details reappear
  - [ ] Verify smooth animation

- [ ] **Multiple Collapsed Tasks**
  - [ ] Collapse 3 different tasks
  - [ ] Verify each collapses independently
  - [ ] Toggle master OFF then ON
  - [ ] Verify previously collapsed tasks are now expanded (fresh start)

#### Kanban Board Details

- [ ] **Basic Display**
  - [ ] Open Kanban board with tasks that have details
  - [ ] Master toggle ON
  - [ ] Verify details show on cards
  - [ ] Verify markdown formatting renders

- [ ] **Toggle Per Card**
  - [ ] Click chevron on one card
  - [ ] Verify that card's details collapse
  - [ ] Verify other cards unchanged
  - [ ] Click chevron again
  - [ ] Verify details expand

- [ ] **Visual Consistency**
  - [ ] Compare Tasks tab and Kanban board
  - [ ] Verify similar styling (colors, spacing, borders)
  - [ ] Verify markdown renders the same way
  - [ ] Test in dark mode

#### Edge Cases

- [ ] **Tasks with Details AND Subtasks**
  - [ ] Create task with both details and subtasks
  - [ ] Verify details and subtasks both show
  - [ ] Verify separate expand/collapse for each
  - [ ] Verify no visual confusion

- [ ] **Very Long Details**
  - [ ] Create task with 20+ lines of details
  - [ ] Verify renders without breaking layout
  - [ ] Verify scrolling works if needed
  - [ ] Test on Kanban card (may need max-height)

- [ ] **Details with Complex Markdown**
  - [ ] Test bold, italic, code
  - [ ] Test nested lists
  - [ ] Test links
  - [ ] Test line breaks
  - [ ] Verify all render correctly

- [ ] **Performance**
  - [ ] Create 100 tasks with details
  - [ ] Toggle master toggle ON
  - [ ] Measure render time (should be <500ms)
  - [ ] Scroll through list
  - [ ] Verify no lag

- [ ] **Accessibility**
  - [ ] Test keyboard navigation (Tab key)
  - [ ] Test screen reader announcements
  - [ ] Verify ARIA labels present
  - [ ] Test focus indicators visible

#### Browser Compatibility

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Test on mobile (responsive design)

### Automated Testing (Future)

```typescript
describe('Task Details Display', () => {
  it('should show all details when master toggle is ON', () => {
    // Setup: Create tasks with details
    const tasks = [
      { id: '1', text: 'Task 1', details: 'Details 1', hasDetails: true },
      { id: '2', text: 'Task 2', details: 'Details 2', hasDetails: true },
    ];

    // Render TaskList with master toggle ON
    const { container } = render(<TaskList tasks={tasks} />);

    // Assert: Both details should be visible
    expect(screen.getByText('Details 1')).toBeVisible();
    expect(screen.getByText('Details 2')).toBeVisible();
  });

  it('should hide all details when master toggle is OFF', () => {
    // Setup and toggle OFF
    const { container } = render(<TaskList tasks={tasks} />);
    const toggleButton = screen.getByLabelText('Hide all task details');
    fireEvent.click(toggleButton);

    // Assert: No details should be visible
    expect(screen.queryByText('Details 1')).not.toBeVisible();
    expect(screen.queryByText('Details 2')).not.toBeVisible();
  });

  it('should allow individual task collapse when master is ON', () => {
    // Setup
    const { container } = render(<TaskList tasks={tasks} />);

    // Collapse first task
    const chevron = screen.getAllByLabelText('Collapse details')[0];
    fireEvent.click(chevron);

    // Assert: First task hidden, second still visible
    expect(screen.queryByText('Details 1')).not.toBeVisible();
    expect(screen.getByText('Details 2')).toBeVisible();
  });
});
```

---

## 9. Success Metrics

### Functional Metrics

**Must Pass:**
- ✅ Master toggle ON shows all details automatically (0 clicks needed)
- ✅ Master toggle OFF hides all details
- ✅ Individual collapse/expand works when master is ON
- ✅ Kanban cards show details when master toggle is ON
- ✅ Details formatting matches between Tasks tab and Kanban board
- ✅ Toggle state persists across page refreshes
- ✅ No console errors when toggling
- ✅ Works with tasks that have both details and subtasks

### Performance Metrics

- Details render time with 100 tasks: < 500ms
- Toggle animation: 200-300ms (smooth)
- No memory leaks after 10+ toggle cycles
- No layout shift when expanding/collapsing

### User Experience Metrics

**Qualitative:**
- Users report feature is "intuitive"
- No confusion about how to show details
- Details are readable and well-formatted
- Consistent experience across views

**Quantitative:**
- Time to first detail view: < 5 seconds (was: >20 seconds with old flow)
- Support tickets about details: 0
- Clicks to see all details: 1 (was: 1 + N tasks)

### Accessibility Metrics

- WCAG 2.1 AA compliance for color contrast
- All interactive elements keyboard-accessible
- Screen reader can announce detail states
- Focus indicators clearly visible

---

## 10. References

### Documentation

**Internal PRPs:**
- [Original Task Details Implementation](PRPs/task-details-feature.md) - Original design doc
- [Task Indentation Fix](PRPs/task-indentation-preservation-fix.md) - Related indentation work

**External Resources:**
- [Eleken List UI Design](https://www.eleken.co/blog-posts/list-ui-design) - Best practices for showing details
- [LogRocket Accordion UI](https://blog.logrocket.com/ux-design/accordion-ui-design/) - Expand/collapse patterns
- [Smashing Magazine Accordions](https://www.smashingmagazine.com/2017/06/designing-perfect-accordion-checklist/) - Checklist for accordions
- [Mobbin Accordion Patterns](https://mobbin.com/glossary/accordion) - Real-world examples

### Code References

**Key Files:**
- Task Service: `frontend/src/services/taskService.ts:58-217`
- Task Details Store: `frontend/src/store/taskDetailsStore.ts:1-86`
- TaskTreeItem Component: `frontend/src/components/tasks/TaskTreeItem.tsx:1-275`
- TaskDetails Component: `frontend/src/components/tasks/TaskDetails.tsx:1-115`
- KanbanCard Component: `frontend/src/components/kanban/KanbanCard.tsx:1-79`
- Task Filters: `frontend/src/components/tasks/TaskFilters.tsx:1-119`

**Demo File:**
- Test data: `data/Notes/task-states-demo.md` - Contains tasks with details

### Design Patterns

**Accordion UI Best Practices:**
1. Use chevron icons for expand/collapse indication
2. Smooth animations (200-300ms, ease-in-out)
3. Master "Expand All" / "Collapse All" control
4. Individual item controls remain functional
5. Clear visual hierarchy

**Task Management UI Patterns:**
1. Show critical info by default
2. Details on demand (but easy to access)
3. Consistent styling across views
4. Markdown support for formatting
5. Compact but readable

---

## Conclusion

This PRP provides a comprehensive plan to fix the broken task details display functionality. The key insight is that the current logic treats the master toggle and individual expansion as equal requirements, when they should work together:

**Correct Mental Model:**
- Master toggle controls "allow details to be shown"
- Individual collapse controls "hide this specific detail"
- Default state when master is ON: show everything
- Users can fine-tune by collapsing specific tasks

### Key Changes

1. **Store Logic**: Track `collapsedTasks` instead of `expandedTasks`
2. **Default Behavior**: When master is ON, show all details unless explicitly collapsed
3. **Kanban Integration**: Add details rendering to cards with same styling
4. **Clear Collapsed State**: When master toggles ON, reset collapsed state for fresh start

### Implementation Time

- **Phase 1**: 30 minutes (Store logic)
- **Phase 2**: 20 minutes (TaskTreeItem)
- **Phase 3**: 45 minutes (Kanban cards)
- **Phase 4**: 20 minutes (Styling)
- **Phase 5**: 25 minutes (Testing)

**Total**: ~2.5 hours

### Confidence Score: 9/10

**Why High Confidence:**
- ✅ Root cause clearly identified (inverted logic)
- ✅ Solution is straightforward (rename + logic flip)
- ✅ Existing components work well (just need wiring)
- ✅ Clear test cases defined
- ✅ No new dependencies required
- ✅ Minimal code changes (<150 lines)

**Why Not 10/10:**
- ⚠️ Need to verify performance with 100+ tasks
- ⚠️ Kanban card layout might need iteration for very long details
- ⚠️ Edge case: tasks with both details and subtasks may need UX refinement

### Next Steps

1. ✅ Review and approve this PRP
2. ➡️ Execute Phase 1: Update store logic
3. ➡️ Execute Phase 2: Update TaskTreeItem
4. ➡️ Execute Phase 3: Add Kanban details
5. ➡️ Execute Phase 4: Polish styling
6. ➡️ Execute Phase 5: Test thoroughly

---

**Created**: 2025-10-10
**Author**: Claude Code AI
**Estimated Implementation Time**: 2.5 hours
**Risk Level**: Low
**Breaking Changes**: None (backwards compatible)

**PRP Confidence Score: 9/10**
