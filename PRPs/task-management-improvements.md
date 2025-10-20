# Product Requirements Plan: Task Management Improvements

## Executive Summary

The current NotePlan clone implementation has significant issues with its task management system that need to be addressed:
- Non-standard markdown syntax using `[]` for tasks
- Complex and hacky detection logic spread across multiple extensions
- Confusing distinction between tasks and bullets
- Poor user experience with indented content and task details

This PRP proposes a complete overhaul to use standard GitHub Flavored Markdown (GFM) task list syntax, simplifying the codebase and improving usability.

## Current Problems

### 1. Non-Standard Task Syntax
- Currently uses `[]` directly for tasks (e.g., `[] Task name`)
- This conflicts with markdown link syntax and requires escaping
- Not compatible with standard markdown processors

### 2. Complex Detection Logic
- TaskListItemDetector.ts - Detects if list item is a task
- TaskStateDetector.ts - Detects task states
- InteractiveCheckbox.ts - Makes checkboxes clickable
- Multiple utilities for escaping/unescaping brackets
- Workarounds to disable TipTap features that conflict

### 3. Confusing Task Details Format
- Current format requires `*` or `+` for tasks but `-` for bullets in details
- Users get confused about when to use which marker
- Parser fails when wrong markers are used

### 4. Poor Separation of Concerns
- Task logic spread across frontend extensions, services, and utilities
- Backend and frontend have different parsing logic
- Difficult to maintain and debug

## Proposed Solution

### 1. Adopt Standard GFM Task List Syntax

**Standard Format:**
```markdown
- [ ] Open task
- [x] Completed task
- [-] Cancelled task
- [>] Scheduled task
- [!] Important task
```

**Benefits:**
- Industry standard used by GitHub, Obsidian, and others
- No escaping needed
- Works with standard markdown parsers
- Clear visual distinction from regular content

### 2. Unified Task Details Format

**Proposed Format:**
```markdown
- [ ] Main task
  Task description/details here (2-space indent)

  Additional paragraphs of details

  Nested bullets for lists within details:
  - Bullet point 1
  - Bullet point 2
  - Bullet point 3

  - [ ] Subtask 1 (child task)
  - [ ] Subtask 2 (child task)
```

**Key Rules:**
- Tasks always use `- [ ]` format (hyphen, space, brackets)
- Details are indented with 2 spaces
- Bullets within details can use `-`, `*`, or `+`
- Child tasks are indented tasks with checkbox format
- Clear visual hierarchy

### 3. Simplified Architecture

**Frontend:**
- Single TipTap extension for task handling
- Use built-in TaskList and TaskItem extensions
- Custom extension only for NotePlan-specific states (cancelled, scheduled, important)

**Backend:**
- Single unified parser in taskService.ts
- Consistent with frontend parsing
- Clear separation between tasks, details, and bullets

## Implementation Plan

### Phase 1: Backend Parser Update
1. Update taskService.ts to parse GFM task syntax
2. Modify parseTask() to recognize `- [ ]` format
3. Update parseTaskDetails() for 2-space indentation
4. Add migration utility for existing notes

### Phase 2: Frontend Editor Update
1. Enable TipTap's built-in TaskList and TaskItem extensions
2. Create single NotePlanTaskExtension for custom states
3. Remove TaskListItemDetector, TaskStateDetector, InteractiveCheckbox
4. Remove bracket escaping utilities

### Phase 3: Migration & Testing
1. Create migration script for existing notes
2. Update all test files to new format
3. Comprehensive testing of all task features
4. Update documentation

## Technical Implementation Details

### Task Parser (taskService.ts)
```typescript
// New task regex pattern
const TASK_PATTERN = /^(\s*)- \[([xX\s\-\>!]?)\]\s+(.+)$/;

// Parse indentation level (2 spaces = 1 level)
const getIndentLevel = (line: string): number => {
  const match = line.match(/^(\s*)/);
  return match ? Math.floor(match[1].length / 2) : 0;
};

// Determine if line is task, bullet, or detail
const classifyLine = (line: string, indent: number) => {
  if (TASK_PATTERN.test(line)) return 'task';
  if (/^\s*[-*+]\s+/.test(line)) return 'bullet';
  if (indent > 0 && line.trim()) return 'detail';
  return 'other';
};
```

### TipTap Configuration
```typescript
// Use built-in extensions with custom configuration
StarterKit.configure({
  // Enable task lists
  taskList: true,
  taskItem: {
    nested: true,
    HTMLAttributes: {
      class: 'task-item',
    },
  },
});

// Custom extension for NotePlan states
const NotePlanTasks = Extension.create({
  name: 'noteplanTasks',

  addInputRules() {
    // Rules for [>], [-], [!] states
  },

  addKeyboardShortcuts() {
    // Cycle through states on click/keyboard
  },
});
```

### CSS Updates
```css
/* Standard task checkbox styling */
.ProseMirror ul[data-type="taskList"] {
  list-style: none;
  padding-left: 0;
}

.ProseMirror li[data-type="taskItem"] {
  display: flex;
  align-items: flex-start;
}

.ProseMirror li[data-type="taskItem"] > label {
  margin-right: 0.5rem;
}

/* NotePlan state styling */
.task-item[data-state="cancelled"] {
  text-decoration: line-through;
  opacity: 0.6;
}

.task-item[data-state="scheduled"] {
  background: rgba(59, 130, 246, 0.1);
}

.task-item[data-state="important"] {
  font-weight: 600;
  border-left: 3px solid #dc2626;
}
```

## Migration Strategy

### Automatic Migration Script
```javascript
// Convert old format to new format
const migrateContent = (content) => {
  return content
    // Convert `[] Task` to `- [ ] Task`
    .replace(/^(\s*)\[\]\s+/gm, '$1- [ ] ')
    // Convert `[x] Task` to `- [x] Task`
    .replace(/^(\s*)\[([xX\-\>!])\]\s+/gm, '$1- [$2] ')
    // Adjust indentation (4 spaces to 2)
    .replace(/^(  +)/gm, (match) => ' '.repeat(match.length / 2));
};
```

### User Communication
- Show migration notice on first load
- Offer to backup notes before migration
- Provide manual migration option

## Validation & Testing

### Test Cases
1. **Basic Tasks**
   - Create, complete, cancel tasks
   - Task states (important, scheduled)

2. **Task Details**
   - Single line details
   - Multi-paragraph details
   - Bullets within details

3. **Nested Tasks**
   - Parent-child relationships
   - Proper indentation handling
   - Collapse/expand functionality

4. **Edge Cases**
   - Mixed task and bullet lists
   - Code blocks in details
   - Special characters in task text

### Validation Commands
```bash
# Type checking
cd frontend && npx tsc --noEmit

# Test task parsing
node test/taskParser.test.js

# E2E testing
npm run test:e2e
```

## Success Metrics

1. **Code Quality**
   - Reduce task-related code by 50%
   - Remove all bracket escaping logic
   - Single source of truth for task parsing

2. **User Experience**
   - No more confusion about task vs bullet syntax
   - Consistent behavior across editor and rendered view
   - Compatible with external markdown tools

3. **Performance**
   - Faster task detection (single regex vs multiple plugins)
   - Reduced editor re-renders
   - Smaller bundle size

## Risks & Mitigations

### Risk 1: Breaking Existing Notes
**Mitigation:** Comprehensive migration script with backup option

### Risk 2: User Resistance to Change
**Mitigation:** Clear communication about benefits, migration guide

### Risk 3: TipTap Compatibility Issues
**Mitigation:** Use stable TipTap extensions, extensive testing

## Documentation URLs

- GitHub Task Lists: https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-tasklists
- TipTap Task Extensions: https://tiptap.dev/docs/editor/extensions/functionality/task-list
- CommonMark Spec: https://spec.commonmark.org/
- Obsidian Tasks: https://help.obsidian.md/syntax

## Implementation Checklist

- [ ] Update backend task parser
- [ ] Implement TipTap task extensions
- [ ] Create migration script
- [ ] Update CSS styling
- [ ] Convert test files
- [ ] Update documentation
- [ ] Test all task features
- [ ] Deploy with migration notice

## Confidence Score: 9/10

This PRP provides a comprehensive solution to the current task management issues. The proposed approach uses industry-standard markdown syntax, simplifies the codebase significantly, and improves user experience. The implementation is well-researched with clear technical details and migration strategy.

---
**Created:** 2025-10-11
**Author:** Claude Code
**Status:** Ready for Implementation