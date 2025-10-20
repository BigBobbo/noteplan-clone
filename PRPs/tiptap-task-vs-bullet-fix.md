# PRP: Fix Tiptap Editor - Distinguish Tasks from Bullets

**Status:** Open
**Priority:** High
**Complexity:** Medium

---

## Problem Statement

The Tiptap editor is currently **converting all list items to tasks with checkboxes**, regardless of how they're created. This is causing major usability issues because users cannot create regular bullet points.

### Current Broken Behavior
- Typing `-` → Creates a checkbox task (WRONG)
- Typing `*` → Creates a checkbox task (WRONG)
- Typing `[]` → Creates a checkbox task (Correct, but indistinguishable from above)

### Expected Behavior (NotePlan-style markdown)
- Typing `[]` at start of line → Creates a **task** with checkbox
- Typing `-` at start of line → Creates a **bullet point** (no checkbox)
- Typing `*` at start of line → Creates a **bullet point** (no checkbox)
- Indentation: 4 spaces OR tab

### Example from User
```markdown
[] Task with details
    Here are some bullets:
    - Bullet 1
    - Bullet 2
```

### Root Cause
1. The CSS in `index.css:246-268` adds checkboxes to **ALL** bullet list items:
   ```css
   .ProseMirror ul:not([data-type="taskList"]) > li::before {
     content: "☐";  /* Checkbox icon for ALL list items */
   }
   ```
2. No mechanism exists to distinguish between tasks (`[]`) and bullets (`-`, `*`)
3. The `AutoTaskConverter` extension (lines 11-66) is incomplete and doesn't work
4. The Tiptap TaskList/TaskItem extensions are installed but not used (commented out due to "conflicts")

---

## Current Architecture Analysis

### Existing Files & Patterns

#### 1. **Editor Configuration**
**Files:**
- `frontend/src/components/editor/Editor.tsx:45-84`
- `frontend/src/components/editor/MarkdownEditor.tsx:42-84`

**Current Setup:**
```typescript
extensions: [
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: { class: 'list-disc ml-4' },
    },
  }),
  TaskStateDetector,      // Detects [x], [-], [>], [!] states
  InteractiveCheckbox,    // Makes checkboxes clickable
  Markdown.configure({
    bulletListMarker: '-',  // Comment says "Use - for bullet points"
  }),
]
```

**Issue:** No distinction between task lists and bullet lists.

#### 2. **TaskStateDetector Extension**
**File:** `frontend/src/extensions/TaskStateDetector.ts:1-90`

**What it does:**
- Detects NotePlan task states: `[x]`, `[-]`, `[>]`, `[!]`
- Adds `data-task-state` attributes for CSS styling
- Works on ALL list items (can't distinguish tasks from bullets)

**Key function:**
```typescript
function detectTaskState(text: string): TaskState {
  if (/^\[x\]/i.test(trimmed)) return { type: 'completed', marker: '[x]' };
  if (/^\[-\]/.test(trimmed)) return { type: 'cancelled', marker: '[-]' };
  // etc...
  return { type: 'open' }; // Default assumes it's a task
}
```

#### 3. **InteractiveCheckbox Extension**
**File:** `frontend/src/extensions/InteractiveCheckbox.ts:47-133`

**What it does:**
- Makes checkboxes clickable in the first 50px of a list item
- Cycles through states: open → [x] → [-] → open
- Works on ALL bullet list items (adds interactivity to non-tasks)

#### 4. **AutoTaskConverter Extension**
**File:** `frontend/src/extensions/AutoTaskConverter.ts:11-66`

**What it does:**
- **Nothing useful currently** - commented-out logic, returns `null`
- Original intent was to convert bullet lists to tasks
- Needs to be repurposed or removed

#### 5. **CSS Styling**
**File:** `frontend/src/index.css:246-428`

**Current approach:**
```css
/* Base task item styling - target non-taskList bullets */
.ProseMirror ul:not([data-type="taskList"]) > li::before {
  content: "☐";  /* Checkbox for EVERY list item */
  color: #f59e0b;
  /* ... */
}

/* Task state-specific styling */
.ProseMirror ul:not([data-type="taskList"]) > li[data-task-state="completed"]::before {
  content: "☑";  /* Only shows if task has [x] */
}
```

**Issue:** The selector `ul:not([data-type="taskList"]) > li` matches ALL list items.

---

## Technical Research & Best Practices

### Tiptap List Handling

#### Official TaskList Extension
**Source:** https://tiptap.dev/docs/editor/extensions/nodes/task-list

**Key Points:**
- Creates `<ul data-type="taskList">` in HTML
- Uses TaskItem node (distinct from ListItem)
- Auto-converts `[ ]` and `[x]` when typed
- **Already installed** in package.json (lines 21-22)

**Why it was removed:**
Comment in Editor.tsx:5 says: `// Removed TaskList and TaskItem - they conflict with our NotePlan-style tasks`

**Actual conflict:**
The official TaskList doesn't support NotePlan states `[>]`, `[!]`, `[-]`

#### BulletList Extension
**Source:** https://tiptap.dev/docs/editor/extensions/nodes/bullet-list

**Key Points:**
- Creates regular `<ul>` tags
- Auto-converts `-`, `*`, or `+` when typed
- Uses standard ListItem node
- Currently used for EVERYTHING in this app

### tiptap-markdown Package
**Version:** 0.9.0
**Source:** https://www.npmjs.com/package/tiptap-markdown

**Capabilities:**
- Serializes Tiptap content to/from Markdown
- Supports custom node serialization
- Uses `bulletListMarker` config (currently set to `-`)
- Can distinguish node types during serialization

### Proposed Solutions

#### Option 1: Use Built-in TaskList Extension (Rejected)
**Pros:**
- Native Tiptap support
- Automatic `[ ]` to checkbox conversion

**Cons:**
- Doesn't support NotePlan states `[>]`, `[!]`, `[-]`
- Would require extending the TaskItem node
- Breaks existing CSS styling approach

#### Option 2: Custom List Item Attribute (Recommended)
**Pros:**
- Minimal code changes
- Keeps existing CSS approach
- Preserves NotePlan state support
- Works with existing extensions

**Cons:**
- Requires custom extension logic
- Need to handle markdown serialization

**Implementation:**
Extend the ListItem node to add a `isTask` attribute that gets set based on content.

#### Option 3: Separate Task and Bullet Node Types (Overkill)
**Pros:**
- Complete separation
- Type-safe

**Cons:**
- Major refactor
- Breaks existing markdown files
- Overly complex for the use case

**Decision:** **Option 2** - Custom attribute approach

---

## Implementation Plan

### Phase 1: Create TaskListItem Detector Extension

**New File:** `frontend/src/extensions/TaskListItemDetector.ts`

**Purpose:** Detect if a list item is a task (starts with `[]`) or a bullet (starts with content)

**Strategy:**
- Hook into ProseMirror's `appendTransaction`
- Inspect text content of list items
- Add `data-is-task` attribute to task items
- Let bullet items remain unmarked

**Implementation:**
```typescript
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

/**
 * Detects whether a list item is a task (starts with []) or a regular bullet.
 * Adds data-is-task="true" attribute to task items for CSS targeting.
 */
export const TaskListItemDetector = Extension.create({
  name: 'taskListItemDetector',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('taskListItemDetector'),

        appendTransaction(transactions, oldState, newState) {
          let modified = false;
          const tr = newState.tr;

          // Only process if document changed
          if (!transactions.some(t => t.docChanged)) {
            return null;
          }

          newState.doc.descendants((node, pos) => {
            // Only process list items
            if (node.type.name === 'listItem') {
              // Get text content of first child (paragraph)
              let textContent = '';
              const firstChild = node.firstChild;
              if (firstChild && firstChild.isTextblock) {
                firstChild.content.forEach((child) => {
                  if (child.isText) {
                    textContent += child.text;
                  }
                });
              }

              const trimmed = textContent.trim();

              // Check if this is a task (starts with checkbox marker)
              const isTask = /^\[[x\s\-!>]\]/i.test(trimmed);

              // Get current attrs
              const currentAttrs = node.attrs || {};
              const currentIsTask = currentAttrs.isTask;

              // Only update if changed
              if (isTask !== currentIsTask) {
                tr.setNodeMarkup(pos, null, {
                  ...currentAttrs,
                  isTask: isTask
                });
                modified = true;
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});
```

**Why this works:**
- Runs after every document change
- Detects task patterns: `[ ]`, `[x]`, `[-]`, `[>]`, `[!]`
- Sets `isTask` attribute on ListItem nodes
- ProseMirror renders this as `<li data-is-task="true">` in HTML

### Phase 2: Extend ListItem Node

**File to modify:** `frontend/src/components/editor/Editor.tsx` and `MarkdownEditor.tsx`

**Add ListItem extension:**
```typescript
import ListItem from '@tiptap/extension-list-item';

// Inside extensions array:
ListItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      isTask: {
        default: false,
        parseHTML: element => element.getAttribute('data-is-task') === 'true',
        renderHTML: attributes => {
          if (attributes.isTask) {
            return { 'data-is-task': 'true' };
          }
          return {};
        },
      },
    };
  },
}),
```

**Why this is needed:**
- Allows ListItem to have an `isTask` attribute
- Persists attribute to/from HTML
- Enables CSS targeting with `li[data-is-task="true"]`

### Phase 3: Update CSS Selectors

**File:** `frontend/src/index.css`

**Changes:**

```css
/* ========================================
   TASK vs BULLET DISTINCTION
   ======================================== */

/* Task items - ONLY items with [data-is-task] get checkboxes */
.ProseMirror ul:not([data-type="taskList"]) > li[data-is-task="true"] {
  position: relative;
  padding-left: 2em;
  list-style: none;
  margin: 0.5rem 0;
  min-height: 1.5em;
  transition: background-color 0.15s ease;
}

/* Checkbox icon ONLY for tasks */
.ProseMirror ul:not([data-type="taskList"]) > li[data-is-task="true"]::before {
  content: "☐";
  position: absolute;
  left: 0.25em;
  top: 0.1em;
  font-size: 1.2em;
  color: #f59e0b;
  font-weight: bold;
  line-height: 1;
  transition: all 0.15s ease;
  user-select: none;
  cursor: pointer;
}

/* Regular bullet items - NO checkbox, use standard bullets */
.ProseMirror ul:not([data-type="taskList"]) > li:not([data-is-task]) {
  position: relative;
  padding-left: 1.5em;
  list-style: disc;  /* Standard bullet point */
  margin: 0.5rem 0;
}

/* Remove custom bullet styling for non-tasks */
.ProseMirror ul:not([data-type="taskList"]) > li:not([data-is-task])::before {
  display: none;  /* No checkbox icon */
}

/* Hover effect ONLY on tasks */
.ProseMirror ul:not([data-type="taskList"]) > li[data-is-task="true"]:hover {
  background-color: rgba(249, 250, 251, 0.5);
  border-radius: 0.25rem;
  padding-right: 0.5rem;
}

[data-theme='dark'] .ProseMirror ul:not([data-type="taskList"]) > li[data-is-task="true"]:hover {
  background-color: rgba(55, 65, 81, 0.3);
}

.ProseMirror ul:not([data-type="taskList"]) > li[data-is-task="true"]:hover::before {
  color: #d97706;
  transform: scale(1.15);
}

/* Task state-specific styling - UPDATE selectors to include [data-is-task] */
.ProseMirror ul:not([data-type="taskList"]) > li[data-is-task="true"][data-task-state="completed"]::before {
  content: "☑";
  color: #9ca3af;
  opacity: 0.8;
}

/* ... (update all other task state styles to include [data-is-task="true"]) ... */
```

**Why this works:**
- `li[data-is-task="true"]` = Tasks get checkboxes
- `li:not([data-is-task])` = Bullets get standard disc bullets
- Preserves all existing task state styling
- No visual changes to actual tasks

### Phase 4: Update InteractiveCheckbox Extension

**File:** `frontend/src/extensions/InteractiveCheckbox.ts`

**Change line 66:**
```typescript
// OLD:
const bulletList = listItem.closest('ul:not([data-type="taskList"])');

// NEW:
const isTask = listItem.getAttribute('data-is-task') === 'true';
if (!isTask) return false;  // Ignore clicks on non-task bullets
```

**Why:**
- Prevents bullet points from being clickable
- Only tasks should cycle states when clicked

### Phase 5: Remove/Update AutoTaskConverter

**File:** `frontend/src/extensions/AutoTaskConverter.ts`

**Options:**
1. **Delete the file** (recommended - it's not being used)
2. **Repurpose it** to auto-detect tasks on paste

**Recommendation:** Delete it. The TaskListItemDetector handles this better.

**Actions:**
1. Delete `AutoTaskConverter.ts`
2. Remove import from `Editor.tsx` and `MarkdownEditor.tsx`

### Phase 6: Update TaskStateDetector

**File:** `frontend/src/extensions/TaskStateDetector.ts`

**Change at line 54:**
```typescript
// Only process list items that are tasks
if (node.type.name === 'listItem') {
  // Check if this is a task item
  const isTask = node.attrs?.isTask === true;
  if (!isTask) return;  // Skip bullet items

  // ... rest of the logic
}
```

**Why:**
- Prevents adding task state decorations to non-task bullets
- Performance improvement (fewer decorations)

### Phase 7: Update Markdown Serialization (if needed)

**File:** May need to check `preserveTaskDetailsIndentation.ts`

**Consideration:**
- Ensure tasks serialize as `[ ] Task text`
- Ensure bullets serialize as `- Bullet text` or `* Bullet text`

**Current state:** The markdown extension already handles this via `bulletListMarker` config.

**Action:** Test serialization - likely no changes needed.

---

## Validation & Testing Strategy

### Automated Validation Commands

```bash
# Start dev servers
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend && npm run dev
cd /Users/robertocallaghan/Documents/claude/noteapp && node src/server.js

# Check for TypeScript errors
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend && npx tsc --noEmit

# Build to ensure no compilation errors
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend && npm run build
```

### Manual Testing Checklist

#### Test 1: Create Tasks
- [ ] Type `[]` at start of line
- [ ] Verify checkbox appears
- [ ] Verify it's clickable
- [ ] Verify it cycles: open → [x] → [-] → open

#### Test 2: Create Bullets
- [ ] Type `-` at start of line
- [ ] Verify standard bullet (disc) appears
- [ ] Verify NO checkbox appears
- [ ] Verify it's NOT clickable
- [ ] Type `*` at start of line
- [ ] Verify same behavior as `-`

#### Test 3: Task States
- [ ] Type `[x] Completed task`
- [ ] Verify completed checkbox (☑) appears
- [ ] Type `[-] Cancelled task`
- [ ] Verify cancelled checkbox (☒) appears
- [ ] Type `[>] Scheduled task`
- [ ] Verify scheduled icon (◷) appears
- [ ] Type `[!] Important task`
- [ ] Verify important styling appears

#### Test 4: Mixed Lists
- [ ] Create a task: `[] Task one`
- [ ] Press Enter, type `-` for bullet
- [ ] Verify task has checkbox, bullet has disc
- [ ] Test indentation with tab/4 spaces
- [ ] Verify nested items work correctly

#### Test 5: Existing Files
- [ ] Open `/data/Notes/checkbox-tasks-test.md`
- [ ] Verify all `[]` items show checkboxes
- [ ] Verify all `-` items show bullets
- [ ] Open `/data/Notes/bullet-test.md`
- [ ] Verify all `*` items show bullets
- [ ] Verify no checkboxes appear

#### Test 6: Task Details (Indentation)
- [ ] Create task: `[] Task with details`
- [ ] Press Enter, indent 4 spaces
- [ ] Type `- Bullet detail`
- [ ] Verify the bullet detail shows as regular bullet (not task)
- [ ] Save file
- [ ] Reload file
- [ ] Verify indentation and formatting preserved

#### Test 7: Interactive Behavior
- [ ] Click checkbox on a task
- [ ] Verify state cycles correctly
- [ ] Try clicking a bullet point
- [ ] Verify nothing happens (no state change)

#### Test 8: Markdown Round-trip
- [ ] Create mixed task/bullet list
- [ ] Save file
- [ ] Open file in external text editor
- [ ] Verify markdown is correct: `[]` for tasks, `-` for bullets
- [ ] Edit in external editor
- [ ] Reload in app
- [ ] Verify renders correctly

#### Test 9: Edge Cases
- [ ] Empty task: `[]` with nothing after
- [ ] Task with only spaces: `[]   `
- [ ] Bullet with brackets in text: `- This [is] text`
- [ ] Verify it shows as bullet, not task

---

## Implementation Order

Follow this sequence to minimize errors:

1. ✅ **Create TaskListItemDetector extension** - Core logic
2. ✅ **Extend ListItem node** - Add `isTask` attribute support
3. ✅ **Update Editor.tsx** - Add new extension and ListItem extension
4. ✅ **Update MarkdownEditor.tsx** - Same changes as Editor.tsx
5. ✅ **Update CSS** - Change selectors to target `[data-is-task]`
6. ✅ **Update InteractiveCheckbox** - Only handle clicks on tasks
7. ✅ **Update TaskStateDetector** - Only decorate tasks
8. ✅ **Remove AutoTaskConverter** - Delete file and imports
9. ✅ **Test basic functionality** - Create tasks and bullets
10. ✅ **Test existing files** - Open checkbox-tasks-test.md and bullet-test.md
11. ✅ **Test markdown serialization** - Save and reload
12. ✅ **Full regression testing** - All checklist items above

---

## Edge Cases & Considerations

### 1. **Backwards Compatibility**
**Issue:** Existing markdown files have both `*` and `-` for bullets
**Solution:** Both will render as bullets (controlled by `bulletListMarker` config)
**Action:** Set `bulletListMarker: '-'` (already configured)

### 2. **Task Pattern Ambiguity**
**Edge case:** What if text contains `[x]` but isn't at start?
```markdown
- This is a bullet [x] with brackets
```
**Solution:** Regex `/^\[[x\s\-!>]\]/i` only matches at start of trimmed text
**Result:** Renders as bullet (correct)

### 3. **Nested Lists**
**Issue:** Can tasks contain bullet sub-items?
**Example:**
```markdown
[] Parent task
    - Child bullet
    - Child bullet
    [] Child task
```
**Solution:** Each list item is evaluated independently
**Result:** Parent gets checkbox, child bullets get discs, child task gets checkbox

### 4. **Copy/Paste**
**Issue:** Pasting markdown from external source
**Solution:** TaskListItemDetector runs on paste (appendTransaction)
**Result:** Auto-detects tasks vs bullets on paste

### 5. **Undo/Redo**
**Issue:** Does attribute update break undo stack?
**Solution:** `appendTransaction` properly integrates with undo/redo
**Result:** Undo/redo works correctly

### 6. **Performance**
**Issue:** Running detector on every keystroke
**Solution:** Only runs when `docChanged` is true, and only on list items
**Impact:** Minimal - typically <10 list items visible at once

---

## Dependencies

**None required** - All functionality uses existing dependencies:
- ✅ @tiptap/react v3.6.5 (already installed)
- ✅ @tiptap/starter-kit v3.6.5 (already installed)
- ✅ @tiptap/extension-list-item v3.6.5 (already installed - part of StarterKit)
- ✅ tiptap-markdown v0.9.0 (already installed)

---

## Rollback Plan

If the implementation causes issues:

1. **Revert New Extension**
   - Delete `TaskListItemDetector.ts`
   - Remove import from Editor.tsx and MarkdownEditor.tsx

2. **Revert ListItem Extension**
   - Remove `ListItem.extend()` from editor configs

3. **Revert CSS**
   - Change `li[data-is-task="true"]` back to `li`
   - Remove `li:not([data-is-task])` rules

4. **Restore AutoTaskConverter**
   - Restore from git: `git checkout HEAD -- frontend/src/extensions/AutoTaskConverter.ts`
   - Restore imports

**Expected rollback time:** ~5 minutes

---

## Success Metrics

### Functional Requirements ✅
- [ ] Typing `[]` creates task with checkbox
- [ ] Typing `-` creates bullet with disc
- [ ] Typing `*` creates bullet with disc
- [ ] Checkboxes only appear on tasks
- [ ] Bullets are NOT clickable
- [ ] Tasks cycle through states correctly
- [ ] Existing files render correctly

### Non-Functional Requirements ✅
- [ ] No performance degradation
- [ ] No console errors
- [ ] Markdown serialization works correctly
- [ ] Undo/redo works
- [ ] Copy/paste works

### User Experience ✅
- [ ] Clear visual distinction between tasks and bullets
- [ ] Intuitive keyboard shortcuts ([], -, *)
- [ ] Smooth transitions and interactions
- [ ] No breaking changes to existing notes

---

## References & Resources

### Documentation
- [Tiptap TaskList Extension](https://tiptap.dev/docs/editor/extensions/nodes/task-list)
- [Tiptap BulletList Extension](https://tiptap.dev/docs/editor/extensions/nodes/bullet-list)
- [Tiptap Custom Extensions](https://tiptap.dev/docs/editor/extensions/custom-extensions)
- [Tiptap Node API](https://tiptap.dev/docs/editor/extensions/custom-extensions/create-new/node)
- [ProseMirror appendTransaction](https://prosemirror.net/docs/ref/#state.PluginSpec.appendTransaction)

### Examples
- [Tiptap Tasks Example](https://tiptap.dev/docs/examples/basics/tasks)
- [Extending ListItem](https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing)

### Codebase References
- Existing TaskStateDetector: `frontend/src/extensions/TaskStateDetector.ts`
- Existing InteractiveCheckbox: `frontend/src/extensions/InteractiveCheckbox.ts`
- CSS styling: `frontend/src/index.css:246-428`
- Example files:
  - `/data/Notes/checkbox-tasks-test.md` - Shows correct task format
  - `/data/Notes/bullet-test.md` - Shows correct bullet format

---

## PRP Confidence Score

**8.5/10** - High confidence for one-pass implementation

**Reasoning:**
- ✅ Clear problem definition with examples
- ✅ Root cause identified (CSS selector issue)
- ✅ Solution follows Tiptap best practices
- ✅ No new dependencies needed
- ✅ All existing components continue working
- ✅ Comprehensive edge cases covered
- ✅ Clear rollback plan
- ⚠️ Minor risk: Markdown serialization may need tweaking
- ⚠️ Minor risk: Performance impact of appendTransaction (unlikely but possible)

**Why not 10/10?**
- Need to verify markdown serialization doesn't break with custom attribute
- Need to test performance with very large documents (100+ list items)
- May need to adjust CSS styling based on visual inspection

---

## Post-Implementation Tasks

1. [ ] Test with large documents (100+ list items)
2. [ ] Verify markdown round-trip with external editors
3. [ ] Test copy/paste from external sources
4. [ ] Consider adding keyboard shortcut to toggle task/bullet
5. [ ] Update any documentation mentioning list behavior
6. [ ] Consider adding visual indicator during creation (optional UX enhancement)

---

**Created:** 2025-10-10
**Author:** Claude Code AI
**Implementation Time:** 2-3 hours
**Risk Level:** Low-Medium
