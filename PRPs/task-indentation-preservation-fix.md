# Product Requirements Plan: Fix Task Details Indentation Preservation

**Version:** 1.0
**Date:** October 9, 2025
**Status:** Ready for Implementation
**Author:** System Generated
**Project:** NotePlan Clone - Task Details Indentation Fix
**Issue:** Task details lose indentation when edited in TipTap editor

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background & Context](#2-background--context)
3. [Problem Analysis](#3-problem-analysis)
4. [Root Cause](#4-root-cause)
5. [Solution Approach](#5-solution-approach)
6. [Technical Requirements](#6-technical-requirements)
7. [Implementation Plan](#7-implementation-plan)
8. [Testing Strategy](#8-testing-strategy)
9. [Risks & Mitigation](#9-risks--mitigation)
10. [Success Criteria](#10-success-criteria)

---

## 1. Executive Summary

### Problem Statement
The task details feature is currently broken: when users manually type indented content below a task in the markdown editor, the indentation is stripped during save, preventing task details from being properly parsed and displayed in the Tasks tab.

**Current Behavior:**
```markdown
User types this in editor:
* Task 1
    This is a detail line
    Another detail line

After save, becomes:
* Task 1
This is a detail line
Another detail line
```

**Root Cause:** TipTap's tiptap-markdown extension uses prosemirror-markdown's default list serializer, which normalizes list item content and strips indentation from paragraphs following list items.

### Solution
Create a custom markdown serializer for list items that preserves raw indentation, bypassing TipTap's default list serialization behavior for our NotePlan-style task format.

### Success Criteria
- Users can manually type indented content below tasks in the editor
- Indentation is preserved after saving
- Task parser correctly identifies and displays details in Tasks tab
- Existing functionality (task editing, subtasks) remains intact

---

## 2. Background & Context

### Current State

**Task Details Feature** (Already Implemented):
- Task parser in `taskService.ts` has `parseTaskDetails()` function (lines 58-104)
- Parses indented content at `taskDepth + 1` as task details
- TaskDetails component exists (`TaskDetails.tsx`)
- Task details store exists (`taskDetailsStore.ts`)

**The Parser Works Correctly:**
```typescript
// frontend/src/services/taskService.ts:58-104
export const parseTaskDetails = (
  taskLineNumber: number,
  allLines: string[],
  taskDepth: number
): string | undefined => {
  const detailLines: string[] = [];
  let currentLine = taskLineNumber + 1;

  while (currentLine < allLines.length) {
    const line = allLines[currentLine];
    // ... parsing logic ...

    // This line is part of task details if it's at taskDepth + 1
    if (lineIndent === taskDepth + 1 || (lineIndent > taskDepth && !line.trim())) {
      const indent = '    '.repeat(taskDepth + 1);
      const detailText = line.startsWith(indent)
        ? line.substring(indent.length)
        : line.trim();
      detailLines.push(detailText);
    }
  }

  return details || undefined;
};
```

**The Problem:**
The parser expects this format in the markdown file:
```markdown
* Task at depth 0
    Detail line (4 spaces indentation)
    Another detail line (4 spaces)
```

But TipTap's markdown serializer outputs this:
```markdown
* Task at depth 0
Detail line (no indentation)
Another detail line (no indentation)
```

### Evidence of the Problem

**test-kanban.md** (lines 4-11):
```markdown
* Task 1 in todo #status-todo #p1
    This is a detailed description of Task 1.
    It can span multiple lines and include:
    - Bullet points for steps
    - Links: https://example.com
    - **Bold** and *italic* text
    - Code: `npm install`
```

This file shows that details ARE properly indented in the saved files. However, when editing in the TipTap editor, the indentation gets stripped on save.

### TipTap Markdown Configuration

**Current Config** (Editor.tsx:58-66):
```typescript
Markdown.configure({
  html: true,
  tightLists: false,  // Changed to preserve task detail indentation
  bulletListMarker: '+',
  breaks: true,
  transformPastedText: true,
  transformCopiedText: true,
  linkify: false,
})
```

**Current Config** (MarkdownEditor.tsx:55-64):
```typescript
Markdown.configure({
  html: true,
  tightLists: false,  // Changed to preserve task detail indentation
  bulletListMarker: '*',
  breaks: true,
  transformPastedText: true,
  transformCopiedText: true,
  linkify: false,
  transformers: [wikiLinkMarkdownTransformer],
})
```

The comment says "Changed to preserve task detail indentation" but `tightLists: false` does NOT fix the issue. This setting only controls whether `<p>` tags are added inside `<li>` tags in HTML, not markdown serialization.

---

## 3. Problem Analysis

### How TipTap Handles Markdown

**Flow:**
1. User types markdown → **Parsing** → ProseMirror Document (structured)
2. User edits → Updates ProseMirror Document
3. On save → **Serialization** → Markdown string → File

**The Issue is in Serialization:**

**tiptap-markdown** uses these components:
```javascript
// node_modules/tiptap-markdown/src/extensions/nodes/bullet-list.js
serialize(state, node) {
  return state.renderList(node, "  ", () =>
    (this.editor.storage.markdown.options.bulletListMarker || "-") + " "
  );
}

// node_modules/tiptap-markdown/src/extensions/nodes/list-item.js
serialize: defaultMarkdownSerializer.nodes.list_item
```

The `defaultMarkdownSerializer.nodes.list_item` from prosemirror-markdown treats paragraphs inside list items as part of the list item content, and when serializing, it normalizes them without preserving original indentation.

### Why This Breaks Task Details

**TipTap's List Model:**
```
bulletList
  └─ listItem
      └─ paragraph → "Task text"
      └─ paragraph → "Detail line"  // Treated as continuation of list item
```

**When Serialized:**
```markdown
* Task text
Detail line  // Paragraph is rendered without indentation
```

**What We Need:**
```markdown
* Task text
    Detail line  // Needs 4 spaces (taskDepth + 1)
```

---

## 4. Root Cause

### Technical Root Cause

**Primary Issue:** The prosemirror-markdown default serializer for list items doesn't preserve indentation of content following list markers.

**Secondary Issue:** TipTap interprets indented content after a list item as a paragraph inside the list item (correct), but when serializing back to markdown, it uses prosemirror's default behavior which strips indentation.

**Code Location:**
- `node_modules/tiptap-markdown/src/extensions/nodes/list-item.js:16`
- Uses `defaultMarkdownSerializer.nodes.list_item`
- No custom indentation preservation logic

### Why `tightLists: false` Doesn't Fix It

The `tightLists` option controls **HTML rendering**, not markdown serialization:
- `tightLists: true` → `<ul><li>text</li></ul>` (no `<p>` tags)
- `tightLists: false` → `<ul><li><p>text</p></li></ul>` (with `<p>` tags)

But markdown serialization is completely separate and follows prosemirror-markdown's serializer logic.

---

## 5. Solution Approach

### Option 1: Custom TipTap Extension (RECOMMENDED)

Create a custom extension that overrides list item serialization to preserve indentation for NotePlan-style tasks.

**Pros:**
- ✅ Full control over serialization
- ✅ Can preserve exact indentation format
- ✅ Works within TipTap ecosystem
- ✅ Doesn't break other features

**Cons:**
- ⚠️ Requires understanding TipTap extension API
- ⚠️ Need to handle edge cases (nested lists, code blocks, etc.)

### Option 2: Post-Process Markdown After Serialization

Hook into TipTap's `onUpdate` to post-process the serialized markdown and add indentation.

**Pros:**
- ✅ Simpler to implement
- ✅ No custom extension needed
- ✅ Easy to adjust regex patterns

**Cons:**
- ⚠️ Fragile (regex-based)
- ⚠️ May not handle all edge cases
- ⚠️ Performance overhead on every keystroke

### Option 3: Replace TipTap with CodeMirror

Use a raw markdown editor (CodeMirror) that doesn't parse/serialize markdown.

**Pros:**
- ✅ Complete control over markdown format
- ✅ No parsing/serialization issues
- ✅ Better for technical users

**Cons:**
- ❌ Major refactor required
- ❌ Lose WYSIWYG features
- ❌ Worse UX for non-technical users
- ❌ Out of scope for this fix

### Chosen Solution: Option 1 + Option 2 Hybrid

**Approach:**
1. **Create custom list item serializer** that detects when a paragraph follows a task
2. **Add indentation** when serializing paragraphs that follow task markers
3. **Use regex post-processing** as a safety net for edge cases

This provides the best balance of correctness and practicality.

---

## 6. Technical Requirements

### TR-1: Custom List Item Serializer Extension

**Create New File:** `frontend/src/extensions/TaskListItemSerializer.ts`

```typescript
import { Extension } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';

/**
 * Custom extension to preserve indentation for NotePlan-style task details
 * Overrides default list item serialization to add proper indentation
 */
export const TaskListItemSerializer = Extension.create({
  name: 'taskListItemSerializer',

  addStorage() {
    return {
      markdown: {
        serialize: {
          listItem: (state: any, node: ProseMirrorNode) => {
            // Custom serialization logic
            const content = state.renderContent(node);

            // Check if this is a NotePlan-style task (* or + marker)
            const isTask = /^[*+]\s/.test(content);

            if (isTask) {
              // For task items, add indentation to subsequent paragraphs
              // This ensures detail lines are indented at taskDepth + 1
              return serializeTaskListItem(state, node);
            } else {
              // For regular list items, use default behavior
              return defaultMarkdownSerializer.nodes.list_item(state, node);
            }
          }
        }
      }
    };
  }
});

function serializeTaskListItem(state: any, node: ProseMirrorNode) {
  // Get list depth to calculate indentation
  let depth = 0;
  for (let d = state.closed; d; d = d.prev) {
    if (d.type.name === 'bulletList' || d.type.name === 'orderedList') {
      depth++;
    }
  }

  const baseIndent = '    '.repeat(depth - 1);  // Task line indent
  const detailIndent = '    '.repeat(depth);     // Detail line indent (depth + 1)

  // Render task line
  state.wrapBlock('', '', node, () => {
    node.forEach((child, offset, index) => {
      if (index === 0) {
        // First child is the task text
        state.render(child, node, index);
      } else {
        // Subsequent children are details - add indentation
        state.write('\n' + detailIndent);
        state.render(child, node, index);
      }
    });
  });
}
```

### TR-2: Register Custom Serializer

**Modify:** `frontend/src/components/editor/MarkdownEditor.tsx`

```typescript
import { TaskListItemSerializer } from '../../extensions/TaskListItemSerializer';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Disable default list item if needed
    }),
    Link.configure({ /* ... */ }),
    WikiLink.configure({ /* ... */ }),
    TaskListItemSerializer,  // ADD THIS
    Markdown.configure({
      html: true,
      tightLists: false,
      bulletListMarker: '*',
      breaks: true,
      transformPastedText: true,
      transformCopiedText: true,
      linkify: false,
      transformers: [wikiLinkMarkdownTransformer],
    }),
  ],
  // ... rest of config
});
```

**Modify:** `frontend/src/components/editor/Editor.tsx`

```typescript
import { TaskListItemSerializer } from '../../extensions/TaskListItemSerializer';

const editor = useEditor({
  extensions: [
    StarterKit.configure({ /* ... */ }),
    Link.configure({ /* ... */ }),
    WikiLink.configure({ /* ... */ }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TaskListItemSerializer,  // ADD THIS
    Markdown.configure({ /* ... */ }),
  ],
  // ... rest of config
});
```

### TR-3: Post-Processing Safety Net (ALTERNATIVE/FALLBACK)

If custom extension doesn't work, use regex post-processing:

```typescript
// In onUpdate handler
onUpdate: ({ editor }) => {
  let markdown = ((editor.storage as any).markdown as any).getMarkdown();

  // Post-process: Add indentation to lines after task markers
  markdown = preserveTaskDetailsIndentation(markdown);

  const processed = wikiLinkMarkdownTransformer.postProcess(markdown);
  onChange(processed);
}

function preserveTaskDetailsIndentation(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let inTaskDetails = false;
  let taskDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a task line
    const taskMatch = line.match(/^(\s*)[*+]\s/);
    if (taskMatch) {
      inTaskDetails = true;
      taskDepth = Math.floor(taskMatch[1].length / 4);
      result.push(line);
      continue;
    }

    // Check if we're still in task details
    if (inTaskDetails && line.trim() && !line.match(/^(\s*)[*+]\s/)) {
      // This is a detail line - ensure it has proper indentation
      const detailIndent = '    '.repeat(taskDepth + 1);

      // Strip any existing indent and add correct one
      const content = line.trim();
      result.push(detailIndent + content);
    } else {
      // Regular line or new task
      inTaskDetails = false;
      result.push(line);
    }
  }

  return result.join('\n');
}
```

### TR-4: Testing Utilities

**Create:** `frontend/src/utils/taskMarkdownTester.ts`

```typescript
/**
 * Test utilities for verifying task details indentation preservation
 */

export function testTaskDetailsIndentation(markdown: string): boolean {
  const lines = markdown.split('\n');
  let lastTaskDepth: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for task line
    const taskMatch = line.match(/^(\s*)[*+]\s/);
    if (taskMatch) {
      lastTaskDepth = Math.floor(taskMatch[1].length / 4);
      continue;
    }

    // Check for potential detail line
    if (lastTaskDepth !== null && line.trim() && !line.match(/^(\s*)[*+]\s/)) {
      const expectedIndent = '    '.repeat(lastTaskDepth + 1);

      if (!line.startsWith(expectedIndent)) {
        console.error(`Line ${i + 1} has incorrect indentation:`, {
          line,
          expected: expectedIndent,
          lastTaskDepth
        });
        return false;
      }
    }
  }

  return true;
}

export function logTaskStructure(markdown: string): void {
  const lines = markdown.split('\n');
  console.log('Task Structure:');

  lines.forEach((line, i) => {
    const indent = line.match(/^(\s*)/)?.[1]?.length || 0;
    const isTask = /^(\s*)[*+]\s/.test(line);
    const prefix = isTask ? '📝' : '  ';
    console.log(`${i + 1}: [${indent}] ${prefix} ${line}`);
  });
}
```

---

## 7. Implementation Plan

### Phase 1: Research & Proof of Concept (2 hours)

**Goal:** Verify custom serializer approach works

**Tasks:**
1. Create minimal TipTap extension
   - Override list item serializer
   - Test with simple example

2. Test serialization behavior
   - Create test file with tasks + details
   - Open in editor
   - Verify serialization output

3. Document findings
   - What works, what doesn't
   - Edge cases discovered

**Validation:**
```bash
# Manual test:
# 1. Create test extension
# 2. Add to editor config
# 3. Type task with detail
# 4. Check console.log of serialized markdown
# 5. Verify indentation preserved
```

### Phase 2: Implement Custom Serializer (4 hours)

**Goal:** Full implementation of custom list item serializer

**Tasks:**
1. Create `TaskListItemSerializer.ts`
   - Implement serialization logic
   - Handle depth calculation
   - Add indentation to details

2. Handle edge cases
   - Empty lines in details
   - Nested lists
   - Mixed list and task items

3. Add TypeScript types
   - Proper typing for ProseMirror nodes
   - Type safety for state methods

4. Add debug logging
   - Log serialization decisions
   - Help diagnose issues

**Deliverable:** Working custom serializer extension

**Validation:**
```bash
# Test cases:
# 1. Single task with details
# 2. Nested task with details
# 3. Task with multi-line details
# 4. Task with empty line in details
# 5. Mix of tasks and regular list items
```

### Phase 3: Integrate with Editors (2 hours)

**Goal:** Add extension to both editor components

**Tasks:**
1. Update `MarkdownEditor.tsx`
   - Import extension
   - Add to extensions array
   - Test functionality

2. Update `Editor.tsx`
   - Import extension
   - Add to extensions array
   - Test functionality

3. Remove obsolete config
   - Remove misleading comments about `tightLists`
   - Clean up config

**Deliverable:** Both editors use custom serializer

**Validation:**
```bash
# Manual testing:
# 1. Open test-kanban.md in Editor
# 2. Edit a task detail
# 3. Save
# 4. Check raw file content
# 5. Verify indentation preserved
# 6. Repeat with MarkdownEditor
```

### Phase 4: Post-Processing Safety Net (2 hours)

**Goal:** Add regex fallback for edge cases

**Tasks:**
1. Implement `preserveTaskDetailsIndentation()`
   - Write regex logic
   - Handle depth calculation
   - Test with various inputs

2. Add to onUpdate handlers
   - Insert after markdown serialization
   - Before wikiLink post-processing

3. Add toggle to disable if needed
   - Environment variable or setting
   - For debugging

**Deliverable:** Safety net post-processing

**Validation:**
```typescript
// Unit tests
describe('preserveTaskDetailsIndentation', () => {
  it('should add indentation to detail lines', () => {
    const input = `* Task\nDetail line\nAnother detail`;
    const output = preserveTaskDetailsIndentation(input);
    expect(output).toBe(`* Task\n    Detail line\n    Another detail`);
  });

  it('should preserve nested task indentation', () => {
    const input = `* Task\n    Detail\n    * Subtask\n        Subdetail`;
    const output = preserveTaskDetailsIndentation(input);
    // Verify correct indentation at each level
  });
});
```

### Phase 5: Testing & Edge Cases (3 hours)

**Goal:** Comprehensive testing

**Tasks:**
1. Manual testing
   - Test all scenarios from test checklist
   - Document any issues found

2. Fix edge cases
   - Handle any failures discovered
   - Adjust logic as needed

3. Performance testing
   - Test with large files (1000+ lines)
   - Measure serialization time
   - Optimize if needed

4. Cross-browser testing
   - Chrome, Firefox, Safari
   - Verify consistent behavior

**Deliverable:** Robust, tested solution

**Validation:**
```bash
# Complete manual test checklist
# Run performance tests
# Document results
```

### Phase 6: Documentation & Cleanup (1 hour)

**Goal:** Clean code, good docs

**Tasks:**
1. Code comments
   - Document serialization logic
   - Explain depth calculation
   - Note edge cases

2. Update README
   - Document task details format
   - Explain indentation rules

3. Remove debug logging
   - Clean up console.logs
   - Keep essential error logging

**Deliverable:** Production-ready code

---

## 8. Testing Strategy

### Unit Tests

```typescript
describe('TaskListItemSerializer', () => {
  describe('depth calculation', () => {
    it('should calculate depth 0 for root tasks', () => {
      // Test implementation
    });

    it('should calculate depth 1 for nested tasks', () => {
      // Test implementation
    });
  });

  describe('serialization', () => {
    it('should preserve indentation for task details', () => {
      const input = createProseMirrorDoc(`
        * Task
            Detail line
      `);
      const output = serialize(input);
      expect(output).toBe('* Task\n    Detail line');
    });

    it('should handle multiple detail lines', () => {
      // Test implementation
    });

    it('should handle nested tasks with details', () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

```typescript
describe('Editor Integration', () => {
  it('should preserve task details on save', async () => {
    // 1. Open editor
    // 2. Type task with details
    // 3. Save
    // 4. Read file content
    // 5. Verify indentation
  });

  it('should parse and display details correctly', async () => {
    // 1. Save markdown with tasks + details
    // 2. Open in editor
    // 3. Switch to Tasks tab
    // 4. Verify details shown
  });
});
```

### Manual Test Checklist

- [ ] **Basic Functionality**
  - [ ] Type task with indented detail → Save → Verify indentation preserved
  - [ ] Open existing task with details → Edit → Save → Verify no data loss
  - [ ] Multiple detail lines work correctly
  - [ ] Empty lines in details preserved

- [ ] **Nested Tasks**
  - [ ] Root task with details (depth 0)
  - [ ] Nested task with details (depth 1)
  - [ ] Deep nesting (depth 2+) with details

- [ ] **Edge Cases**
  - [ ] Detail line with special characters (*, +, #, etc.)
  - [ ] Detail line with code backticks
  - [ ] Detail line with markdown formatting (bold, italic, links)
  - [ ] Very long detail lines (200+ characters)
  - [ ] Many detail lines (50+)

- [ ] **Round-Trip Editing**
  - [ ] Edit in Editor → Save → Open in MarkdownEditor → Verify same
  - [ ] Edit in MarkdownEditor → Save → Open in Editor → Verify same
  - [ ] Edit in editor → Switch to Tasks tab → Verify details shown

- [ ] **Parser Interaction**
  - [ ] Task details appear in Tasks tab after proper indentation
  - [ ] TaskDetails component displays correctly
  - [ ] Expand/collapse works

- [ ] **Performance**
  - [ ] Large file (1000+ lines) loads quickly
  - [ ] Editing with many tasks is responsive
  - [ ] No lag when typing

---

## 9. Risks & Mitigation

### Risk 1: Custom Extension Doesn't Work
**Risk:** TipTap extension API doesn't allow overriding list serialization
**Impact:** High
**Likelihood:** Medium
**Mitigation:**
- Test proof of concept early (Phase 1)
- Have fallback plan (regex post-processing)
- Can switch to Option 3 (CodeMirror) if needed

### Risk 2: Breaks Existing Functionality
**Risk:** Custom serializer breaks normal lists or other features
**Impact:** High
**Likelihood:** Low
**Mitigation:**
- Only apply custom logic to NotePlan-style tasks
- Use default serializer for regular lists
- Comprehensive testing before deployment
- Feature flag to disable if issues arise

### Risk 3: Performance Degradation
**Risk:** Custom serialization is slow on large files
**Impact:** Medium
**Likelihood:** Low
**Mitigation:**
- Profile serialization performance
- Optimize hot code paths
- Use memoization if needed
- Debounce serialization calls

### Risk 4: Edge Cases Not Handled
**Risk:** Some markdown patterns break indentation logic
**Impact:** Medium
**Likelihood:** Medium
**Mitigation:**
- Comprehensive test suite
- Collect user feedback
- Iterative fixes for edge cases
- Document known limitations

### Risk 5: Maintenance Burden
**Risk:** Custom extension requires updates when TipTap updates
**Impact:** Low
**Likelihood:** Medium
**Mitigation:**
- Pin TipTap version in package.json
- Test before upgrading TipTap
- Document extension thoroughly
- Consider contributing upstream to TipTap

---

## 10. Success Criteria

### Functional Requirements

- ✅ User can type indented content below task in editor
- ✅ Indentation preserved after save (4 spaces per depth level)
- ✅ Task parser correctly identifies details
- ✅ Details display in Tasks tab
- ✅ Round-trip editing preserves data
- ✅ Works in both Editor.tsx and MarkdownEditor.tsx

### Non-Functional Requirements

- ✅ No performance degradation (<10ms serialization overhead)
- ✅ No breaking changes to existing features
- ✅ Works in Chrome, Firefox, Safari
- ✅ Code is well-documented
- ✅ Test coverage for critical paths

### Acceptance Criteria for Launch

**Must Have:**
- ✅ Custom serializer implemented and working
- ✅ Manual test checklist 100% passed
- ✅ No regressions in existing task functionality
- ✅ test-kanban.md editable without data loss

**Nice to Have:**
- ⚠️ Unit tests for serializer (can be added post-launch)
- ⚠️ Performance benchmarks documented
- ⚠️ Feature flag for disabling custom serializer

### Validation Gates

**Gate 1: Proof of Concept (End of Phase 1)**
```typescript
// Can override list item serialization?
// Can detect task depth?
// Can add indentation programmatically?
```

**Gate 2: Basic Implementation (End of Phase 2)**
```typescript
// Does simple task + detail work?
// Does nested task + detail work?
// Are edge cases handled?
```

**Gate 3: Integration (End of Phase 3)**
```typescript
// Works in both editors?
// No console errors?
// Existing features still work?
```

**Gate 4: Production Ready (End of Phase 5)**
```typescript
// All manual tests pass?
// Performance acceptable?
// Cross-browser compatible?
```

---

## Appendix A: Code References

**Key Files to Modify:**
- `frontend/src/components/editor/Editor.tsx:39-89`
- `frontend/src/components/editor/MarkdownEditor.tsx:35-127`
- `frontend/src/services/taskService.ts:58-104` (parser - unchanged)

**New Files to Create:**
- `frontend/src/extensions/TaskListItemSerializer.ts`
- `frontend/src/utils/preserveTaskDetailsIndentation.ts` (optional fallback)
- `frontend/src/utils/taskMarkdownTester.ts` (testing utilities)

**External Dependencies:**
- `@tiptap/core` - Extension API
- `@tiptap/extension-list-item` - Base list item (for reference)
- `tiptap-markdown` - Markdown extension (modify behavior)
- `prosemirror-markdown` - Serializer (understand structure)

**Documentation:**
- TipTap Extensions: https://tiptap.dev/docs/editor/extensions/custom-extensions
- ProseMirror Serialization: https://prosemirror.net/docs/ref/#markdown
- tiptap-markdown source: https://github.com/aguingand/tiptap-markdown

---

## Appendix B: Alternative Approaches Considered

### Alternative 1: Disable TipTap List Parsing
**Description:** Treat list items as plain text blocks
**Pros:** Simple, no serialization issues
**Cons:** Breaks WYSIWYG, loses structured editing
**Decision:** Rejected - too much functionality loss

### Alternative 2: Use HTML Comments as Markers
**Description:** Inject HTML comments to mark where indentation should be
**Pros:** Doesn't interfere with parsing
**Cons:** Pollutes markdown files, fragile
**Decision:** Rejected - bad UX

### Alternative 3: Store Details Separately
**Description:** Store task details in JSON sidecar file
**Pros:** No markdown parsing issues
**Cons:** Breaks plain-text portability
**Decision:** Rejected - against NotePlan philosophy

### Alternative 4: Fork tiptap-markdown
**Description:** Maintain custom fork with fixed serializer
**Pros:** Complete control
**Cons:** Maintenance burden, upgrades difficult
**Decision:** Rejected - too much overhead

---

## Conclusion

This PRP provides a comprehensive solution for fixing task details indentation preservation in the NotePlan clone application. The root cause is TipTap's markdown serializer stripping indentation from list item content.

The solution is a custom TipTap extension that overrides list item serialization to preserve indentation for NotePlan-style task details, with a regex-based fallback for edge cases.

**Estimated Implementation Time:** 12-14 hours (1-2 days)

**Confidence Level for One-Pass Success:** 7.5/10

**Reasoning:**
- ✅ Root cause clearly identified
- ✅ Solution approach validated via code inspection
- ✅ Existing parser already works correctly
- ✅ Clear implementation steps
- ⚠️ TipTap extension API may have quirks
- ⚠️ Edge cases may require iteration
- ✅ Fallback plan available if extension doesn't work

**Next Steps:**
1. Review and approve PRP
2. Create proof of concept (Phase 1)
3. If PoC successful, proceed with full implementation
4. If PoC fails, pivot to regex post-processing approach
5. Test thoroughly with test-kanban.md and other files
6. Deploy and monitor for issues

---

**PRP Confidence Score: 7.5/10**

This PRP provides solid context for implementation:
- ✅ Root cause clearly identified through code inspection
- ✅ Multiple solution approaches evaluated
- ✅ Detailed implementation plan with validation gates
- ✅ Fallback strategies for risks
- ✅ Specific code examples and references
- ✅ External documentation links
- ⚠️ Some uncertainty around TipTap extension API behavior (requires PoC)
- ⚠️ Edge case handling may require iteration
