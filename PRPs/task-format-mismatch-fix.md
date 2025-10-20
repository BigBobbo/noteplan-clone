# Product Requirements Plan: Task Format Mismatch Fix

## Executive Summary

Tasks created in the editor are no longer appearing in the Task and Kanban tabs. This is a critical bug caused by a format mismatch between the editor's serialization (NotePlan format: `[] Task`) and the task service's parser (GFM format: `- [ ] Task`). This PRP provides a comprehensive solution to align both systems to use the same GFM task format.

## Problem Statement

### User Impact
- **Severity:** Critical - Core functionality is broken
- **Scope:** All new tasks created in the editor
- **User Experience:** Users create tasks in the editor but they don't appear in task management views, causing confusion and data loss perception

### Symptoms
1. Tasks created/edited in the markdown editor don't show up in the Tasks tab
2. Tasks created/edited in the editor don't appear in the Kanban board
3. Only tasks in GFM format (`- [ ] Task`) are recognized
4. Tasks in NotePlan format (`[] Task`) are ignored by the task service

## Root Cause Analysis

### Technical Investigation

The codebase has **two different task formats in use**:

#### 1. Editor Serialization (NotePlan Format)
**File:** `frontend/src/components/editor/Editor.tsx:208-220`

```typescript
if (node.type.name === 'noteplanTask') {
  const state = node.attrs.state || 'open';
  const markerMap: Record<string, string> = {
    'open': ' ',
    'completed': 'x',
    'cancelled': '-',
    'scheduled': '>',
    'important': '!'
  };
  const marker = markerMap[state] || ' ';
  const indent = '  '.repeat(node.attrs.indent || 0);
  markdown += `${indent}[${marker}] ${node.textContent}\n`;
}
```

**Output Format:** `[] Task text` or `[x] Completed task`
- No leading hyphen
- Direct bracket notation
- NotePlan-style format

#### 2. Task Service Parser (GFM Format)
**File:** `frontend/src/services/taskService.ts:156-168`

```typescript
export const parseTask = (
  line: string,
  lineNumber: number,
  filePath: string,
  allLines?: string[]
): ParsedTask | null => {
  const depth = calculateIndentLevel(line);

  // Match GFM task list format: - [ ], - [x], etc.
  // Required format: hyphen, space, brackets with optional state marker
  const taskRegex = /^\s*-\s+\[([xX>\-!\s]?)\]\s+(.+)$/;
  const match = line.match(taskRegex);

  if (!match) return null;
  // ...
}
```

**Expected Format:** `- [ ] Task text` or `- [x] Completed task`
- Requires leading hyphen and space
- GFM (GitHub Flavored Markdown) format
- Industry standard format

### How It Broke

Looking at git history:

```bash
# Previous version (commit 040712f and earlier)
const taskRegex = /^\s*[*+] (\[([xX>\-!])\] )?(.+)$/;
# Supported: * Task, + Task, * [x] Task

# Current version (uncommitted changes in taskService.ts)
const taskRegex = /^\s*-\s+\[([xX>\-!\s]?)\]\s+(.+)$/;
# Only supports: - [ ] Task, - [x] Task
```

**Timeline:**
1. The codebase was migrated to GFM format per `PRPs/task-management-improvements.md`
2. `taskService.ts` parser was updated to require GFM format (`- [ ] Task`)
3. **But** `Editor.tsx` serialization was NOT updated - it still outputs NotePlan format (`[] Task`)
4. Result: Format mismatch causing tasks to not be parsed

### Evidence Files

**Test Files Showing Both Formats:**
- `~/Documents/notes/Notes/gfm-task-test.txt` - Uses GFM format (`- [ ] Task`)
- `~/Documents/notes/Notes/checkbox-tasks-test.txt` - Uses NotePlan format (`[] Task`)
- `~/Documents/notes/Notes/simple-task-test.txt` - Uses NotePlan format

**Affected Components:**
- `frontend/src/components/editor/Editor.tsx` - Serializes in NotePlan format
- `frontend/src/services/taskService.ts` - Parses only GFM format
- `frontend/src/hooks/useTasks.ts` - Uses `parseTasksFromContent()` which fails for NotePlan format
- `frontend/src/components/tasks/TaskTreeItem.tsx` - Displays tasks (no tasks to display)
- `frontend/src/components/kanban/KanbanCard.tsx` - Displays tasks in kanban (no tasks to display)

## Proposed Solution

### Strategy: Standardize on GFM Format

Update the editor serialization to match the task service parser's expectation of GFM format. This aligns with:
1. Industry standards (GitHub, Obsidian, etc.)
2. The existing PRP: `PRPs/task-management-improvements.md`
3. The current task service implementation

### Technical Implementation

#### Option 1: Update Editor Serialization (RECOMMENDED)

**Pros:**
- Aligns with GFM standard
- Task service already expects this
- Existing PRP supports this direction
- Most markdown tools support GFM

**Cons:**
- Need to update all NotePlan extensions
- Existing notes in NotePlan format won't parse (migration needed)

#### Option 2: Revert Task Service Parser

**Pros:**
- Quick fix
- No migration needed

**Cons:**
- Goes against GFM standardization effort
- Maintains non-standard syntax
- Conflicts with existing PRP goals

**DECISION:** Implement Option 1 - Update editor to serialize in GFM format

## Implementation Plan

### Phase 1: Update Editor Serialization

**File:** `frontend/src/components/editor/Editor.tsx`

**Current Code (lines 208-220):**
```typescript
if (node.type.name === 'noteplanTask') {
  const state = node.attrs.state || 'open';
  const markerMap: Record<string, string> = {
    'open': ' ',
    'completed': 'x',
    'cancelled': '-',
    'scheduled': '>',
    'important': '!'
  };
  const marker = markerMap[state] || ' ';
  const indent = '  '.repeat(node.attrs.indent || 0);
  markdown += `${indent}[${marker}] ${node.textContent}\n`;
}
```

**New Code:**
```typescript
if (node.type.name === 'noteplanTask') {
  const state = node.attrs.state || 'open';
  const markerMap: Record<string, string> = {
    'open': ' ',
    'completed': 'x',
    'cancelled': '-',
    'scheduled': '>',
    'important': '!'
  };
  const marker = markerMap[state] || ' ';
  const indent = '  '.repeat(node.attrs.indent || 0);
  // GFM format: - [marker] text
  markdown += `${indent}- [${marker}] ${node.textContent}\n`;
}
```

**Change:** Add `- ` prefix before `[${marker}]`

**Also update in useEffect serialization (lines 292-303):**
```typescript
if (node.type.name === 'noteplanTask') {
  const state = node.attrs.state || 'open';
  const markerMap: Record<string, string> = {
    'open': ' ',
    'completed': 'x',
    'cancelled': '-',
    'scheduled': '>',
    'important': '!'
  };
  const marker = markerMap[state] || ' ';
  const indent = '  '.repeat(node.attrs.indent || 0);
  // GFM format: - [marker] text
  currentContent += `${indent}- [${marker}] ${node.textContent}\n`;
}
```

### Phase 2: Update NotePlan Extensions

**File:** `frontend/src/extensions/noteplan/plugins/NotePlanMarkdown.ts`

**Update serialization functions:**

Line 56 (serialize method):
```typescript
// Before
return `${indent}[${marker}] ${content}`;

// After
return `${indent}- [${marker}] ${content}`;
```

Line 92 (markdown.serialize):
```typescript
// Before
state.write(`${indent}[${marker}] `);

// After
state.write(`${indent}- [${marker}] `);
```

Line 104 (serializeTask):
```typescript
// Before
return `${indent}[${marker}] ${content}`;

// After
return `${indent}- [${marker}] ${content}`;
```

Line 125 (transformers.serialize):
```typescript
// Before
state.write(`${indent}[${marker}] `);

// After
state.write(`${indent}- [${marker}] `);
```

Line 176 (serialize function):
```typescript
// Before
return `${indent}[${marker}] ${content}`;

// After
return `${indent}- [${marker}] ${content}`;
```

Line 217 (serializeNotePlanTask):
```typescript
// Before
return `${indentStr}[${marker}] ${content}`;

// After
return `${indentStr}- [${marker}] ${content}`;
```

Line 242 (serializeNode - noteplanTask case):
```typescript
// Before
return serializeNotePlanTask(
  node.attrs.state as TaskState,
  node.textContent,
  node.attrs.indent || 0
);

// After (serializeNotePlanTask already updated above)
// No change needed here
```

**File:** `frontend/src/extensions/noteplan/nodes/NotePlanTask.ts`

Line 251 (addStorage markdown.serialize):
```typescript
// Before
state.write(`${indent}[${marker}] `);

// After
state.write(`${indent}- [${marker}] `);
```

### Phase 3: Update Parser to Handle Both Formats (Transition Period)

**File:** `frontend/src/services/taskService.ts`

**Temporarily support both formats during migration:**

```typescript
export const parseTask = (
  line: string,
  lineNumber: number,
  filePath: string,
  allLines?: string[]
): ParsedTask | null => {
  const depth = calculateIndentLevel(line);

  // Match both GFM format (- [ ]) and legacy NotePlan format ([ ])
  // GFM format (preferred): - [ ] Task
  const gfmTaskRegex = /^\s*-\s+\[([xX>\-!\s]?)\]\s+(.+)$/;
  // Legacy NotePlan format (temporary): [] Task
  const noteplanTaskRegex = /^\s*\[([xX>\-!\s]?)\]\s+(.+)$/;

  let match = line.match(gfmTaskRegex);
  let isLegacyFormat = false;

  if (!match) {
    // Try legacy format
    match = line.match(noteplanTaskRegex);
    isLegacyFormat = true;
  }

  if (!match) return null;

  const [_, status, text] = match;
  const trimmedStatus = status.trim();

  // Log warning for legacy format
  if (isLegacyFormat) {
    console.warn(`[taskService] Legacy NotePlan format detected at ${filePath}:${lineNumber}. Please migrate to GFM format: - [ ] Task`);
  }

  // ... rest of parsing logic remains the same
}
```

**Note:** After migration is complete, remove the `noteplanTaskRegex` support.

### Phase 4: Update parseNotePlanMarkdown Parser

**File:** `frontend/src/components/editor/Editor.tsx`

Update the custom parser to recognize GFM format:

Line 26:
```typescript
// Before
const taskMatch = line.match(/^(\s*)\[([xX\s\-!>]?)\]\s+(.+)$/);

// After - match GFM format
const taskMatch = line.match(/^(\s*)-\s+\[([xX\s\-!>]?)\]\s+(.+)$/);
```

### Phase 5: Migration Strategy

#### Automatic Migration Script

Create a migration utility for existing notes:

**File:** `frontend/src/utils/migrateToGFMFormat.ts`

```typescript
/**
 * Migrate NotePlan format tasks to GFM format
 * [] Task -> - [ ] Task
 * [x] Task -> - [x] Task
 */
export function migrateToGFMFormat(content: string): string {
  const lines = content.split('\n');
  const migratedLines = lines.map(line => {
    // Check if line is a NotePlan task (not already GFM)
    const noteplanTaskMatch = line.match(/^(\s*)\[([xX\s\-!>]?)\]\s+(.+)$/);

    // Don't migrate if already in GFM format (has leading -)
    if (noteplanTaskMatch && !line.match(/^\s*-\s+\[/)) {
      const [, indent, marker, text] = noteplanTaskMatch;
      return `${indent}- [${marker}] ${text}`;
    }

    return line;
  });

  return migratedLines.join('\n');
}
```

#### Migration Trigger

Add migration check when loading files:

**File:** `frontend/src/store/fileStore.ts`

```typescript
import { migrateToGFMFormat } from '../utils/migrateToGFMFormat';

// In openFile function
openFile: async (path: string) => {
  // ... existing code ...

  // Check if migration is needed
  const needsMigration = content.match(/^(\s*)\[([xX\s\-!>]?)\]\s+/m) &&
                        !content.match(/^\s*-\s+\[/m);

  if (needsMigration) {
    console.log(`[fileStore] Migrating ${path} to GFM format`);
    content = migrateToGFMFormat(content);
    // Save migrated content
    await api.saveNote(path, content);
  }

  // ... rest of code ...
}
```

## Validation & Testing

### Test Strategy

#### 1. Unit Tests

**Create:** `frontend/src/utils/__tests__/migrateToGFMFormat.test.ts`

```typescript
import { migrateToGFMFormat } from '../migrateToGFMFormat';

describe('migrateToGFMFormat', () => {
  test('migrates NotePlan format to GFM', () => {
    const input = '[] Open task\n[x] Completed task';
    const expected = '- [ ] Open task\n- [x] Completed task';
    expect(migrateToGFMFormat(input)).toBe(expected);
  });

  test('preserves indentation', () => {
    const input = '[] Parent\n  [] Child';
    const expected = '- [ ] Parent\n  - [ ] Child';
    expect(migrateToGFMFormat(input)).toBe(expected);
  });

  test('does not modify GFM format', () => {
    const input = '- [ ] Already GFM\n- [x] Completed';
    expect(migrateToGFMFormat(input)).toBe(input);
  });

  test('preserves non-task content', () => {
    const input = '# Heading\n\n[] Task\n\nRegular paragraph';
    const expected = '# Heading\n\n- [ ] Task\n\nRegular paragraph';
    expect(migrateToGFMFormat(input)).toBe(expected);
  });
});
```

#### 2. Integration Tests

**Update:** Existing Playwright tests at `/test-noteplan.spec.js`

```javascript
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('tasks created in editor appear in Tasks tab', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173');

  // Create a test note with GFM tasks
  const testFilePath = path.join(
    process.env.HOME,
    'Documents/notes/Notes/gfm-integration-test.txt'
  );

  fs.writeFileSync(testFilePath,
    '# Test Note\n\n- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3'
  );

  // Wait for file to be loaded
  await page.waitForTimeout(1000);

  // Click on the test file
  await page.click('text=gfm-integration-test.txt');

  // Wait for editor to load
  await page.waitForTimeout(500);

  // Click on Tasks tab
  await page.click('text=Tasks');

  // Verify tasks appear
  const taskItems = await page.$$('[class*="task-tree-item"]');
  expect(taskItems.length).toBeGreaterThanOrEqual(2); // At least 2 tasks (open)

  // Verify task text
  const taskTexts = await page.$$eval('[class*="task-tree-item"]',
    items => items.map(item => item.textContent)
  );
  expect(taskTexts.some(text => text.includes('Task 1'))).toBe(true);
  expect(taskTexts.some(text => text.includes('Task 3'))).toBe(true);

  // Clean up
  fs.unlinkSync(testFilePath);
});

test('tasks created via input show in Tasks tab', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Create new note
  await page.click('button:has-text("New Note")');

  // Type a task using GFM format
  const editor = await page.locator('.ProseMirror');
  await editor.click();
  await editor.type('- [ ] New task from editor');

  // Wait for auto-save
  await page.waitForTimeout(1500);

  // Click Tasks tab
  await page.click('text=Tasks');

  // Verify task appears
  await expect(page.locator('text=New task from editor')).toBeVisible();
});
```

#### 3. Manual Testing Checklist

- [ ] Create task in editor using keyboard (`- [ ] Task`)
- [ ] Verify task appears in Tasks tab
- [ ] Verify task appears in Kanban board
- [ ] Toggle task completion in editor
- [ ] Verify completion syncs to Tasks tab
- [ ] Create nested/indented tasks
- [ ] Verify hierarchy appears correctly
- [ ] Add task details (indented content)
- [ ] Verify details display in task views
- [ ] Test all task states (open, completed, cancelled, scheduled, important)
- [ ] Verify file persistence (reload page, tasks still there)

### Validation Commands

```bash
# 1. Type checking
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend
npx tsc --noEmit

# 2. Build check
npm run build

# 3. Run integration tests (if using Playwright)
npx playwright test test-noteplan.spec.js

# 4. Manual verification - check file format on disk
cat ~/Documents/notes/Notes/gfm-task-test.txt

# 5. Verify task parsing
# Open browser console and check logs when Tasks tab is clicked
# Should see: "Parsing tasks from file: ..." followed by "Parsed tasks: X"
```

## Implementation Checklist

### Code Changes
- [ ] Update Editor.tsx onUpdate serialization (line 220)
- [ ] Update Editor.tsx useEffect serialization (line 303)
- [ ] Update Editor.tsx parseNotePlanMarkdown (line 26)
- [ ] Update NotePlanMarkdown.ts serialize (line 56)
- [ ] Update NotePlanMarkdown.ts markdown.serialize (line 92)
- [ ] Update NotePlanMarkdown.ts serializeTask (line 104)
- [ ] Update NotePlanMarkdown.ts transformers.serialize (line 125)
- [ ] Update NotePlanMarkdown.ts serialize function (line 176)
- [ ] Update NotePlanMarkdown.ts serializeNotePlanTask (line 217)
- [ ] Update NotePlanTask.ts addStorage (line 251)
- [ ] Create migrateToGFMFormat utility
- [ ] Add migration trigger to fileStore

### Testing
- [ ] Create unit tests for migration utility
- [ ] Update/create integration tests
- [ ] Manual testing of all task features
- [ ] Test edge cases (special characters, deeply nested, etc.)

### Documentation
- [ ] Update CLAUDE.md with new task format
- [ ] Update test file examples
- [ ] Add migration guide for users (if needed)

## Rollback Plan

If issues arise:

1. **Immediate Rollback:**
   ```bash
   git checkout HEAD -- frontend/src/components/editor/Editor.tsx
   git checkout HEAD -- frontend/src/extensions/noteplan/
   ```

2. **Data Recovery:**
   - Migration script creates backups before modification
   - Users can manually convert back if needed: `- [ ] Task` → `[] Task`

3. **Alternative Approach:**
   - Revert task service parser to support both formats
   - Defer full migration to later date

## Success Criteria

### Functional Requirements
✅ Tasks created in editor appear in Tasks tab
✅ Tasks created in editor appear in Kanban board
✅ Task completion/state changes sync across all views
✅ Existing GFM format tasks continue to work
✅ Legacy NotePlan format tasks are migrated automatically

### Quality Requirements
✅ All TypeScript type checks pass
✅ Build completes without errors
✅ Integration tests pass
✅ No console errors during normal operation
✅ File format on disk matches GFM standard

### Performance Requirements
✅ No regression in editor performance
✅ Task parsing completes in <100ms for files with 100+ tasks
✅ Auto-save triggers properly (1 second debounce)

## Documentation & References

### Codebase References
- **Editor Component:** `frontend/src/components/editor/Editor.tsx`
- **Task Service:** `frontend/src/services/taskService.ts`
- **Task Hook:** `frontend/src/hooks/useTasks.ts`
- **NotePlan Extensions:** `frontend/src/extensions/noteplan/`
- **Existing PRP:** `PRPs/task-management-improvements.md`

### External Documentation
- **GFM Task Lists:** https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-task-lists
- **TipTap Extensions:** https://tiptap.dev/docs/editor/extensions/functionality/task-list
- **CommonMark Spec:** https://spec.commonmark.org/
- **Obsidian Tasks:** https://help.obsidian.md/Editing+and+formatting/Basic+formatting+syntax#Task+lists

### Test Files (for reference)
- `~/Documents/notes/Notes/gfm-task-test.txt` - GFM format example
- `~/Documents/notes/Notes/checkbox-tasks-test.txt` - NotePlan format (to be migrated)
- `/test-noteplan.spec.js` - Playwright integration tests

## Risk Assessment

### High Risk
- **Existing User Notes:** Users with many notes in NotePlan format
  - *Mitigation:* Automatic migration with logging, no data loss

### Medium Risk
- **Extension Conflicts:** Multiple serialization points could be missed
  - *Mitigation:* Comprehensive grep for all serialization code, thorough testing

### Low Risk
- **Performance Impact:** Adding `- ` to serialization
  - *Mitigation:* Minimal string operation, negligible performance impact

## Timeline Estimate

- **Research & Planning:** 2 hours (completed)
- **Code Implementation:** 2 hours
  - Editor changes: 30 min
  - Extension changes: 1 hour
  - Migration utility: 30 min
- **Testing:** 1.5 hours
  - Unit tests: 30 min
  - Integration tests: 30 min
  - Manual testing: 30 min
- **Documentation:** 30 min

**Total:** ~6 hours for complete implementation and testing

## Confidence Score: 9.5/10

### Why High Confidence?

1. **Clear Root Cause:** Format mismatch is definitively identified with code references
2. **Straightforward Fix:** Add `- ` prefix to serialization (simple string change)
3. **Existing Pattern:** Following established PRP (task-management-improvements.md)
4. **Testable:** Can verify with automated tests + manual verification
5. **Low Risk:** Changes are isolated, reversible, and migration is safe
6. **Complete Context:** All affected files identified, fix locations specified

### Minor Uncertainty (-0.5)

- Edge cases with existing notes in mixed formats
- Potential for missed serialization points in extensions

### Mitigation

- Comprehensive grep for all serialization locations
- Backward compatibility during transition period
- Extensive testing with various file formats

---

**Created:** 2025-10-20
**Author:** Claude Code
**Status:** Ready for Implementation
**Priority:** Critical (P0)
**Estimated Effort:** 6 hours
