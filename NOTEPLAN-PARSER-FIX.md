# NotePlan Parser Fix - Newline Issue Resolution

**Date:** 2025-10-20
**Issue:** Tasks appearing on same line after reload
**Status:** ✅ Fixed

---

## Problem Description

### Observed Behavior
When loading a file with multiple NotePlan tasks:
```markdown
[] Test task 1
[x] Test task 2
[-] Test task 3
```

They would appear on a single line after reload:
```
[] Test task 1 [x] Test task 2 [-] Test task 3
```

### Root Cause Analysis

**The Problem:** `tiptap-markdown` didn't know how to parse NotePlan task format into `noteplanTask` nodes.

#### What Was Happening:

1. **File Load**: Markdown string read from disk
   ```markdown
   [] Task 1
   [] Task 2
   ```

2. **tiptap-markdown Parser**: Doesn't recognize `[] Task` format
   - Treats it as plain text
   - Creates a single paragraph node with all text
   - Result: `<p>[] Task 1 [] Task 2</p>`

3. **Display**: All tasks on one line (because they're in one paragraph)

#### Why This Happened:

The NotePlan extensions only handled:
- ✅ **Serialization** (ProseMirror nodes → markdown) via `NotePlanMarkdown`
- ✅ **Input Rules** (typing `[] ` → create task) via `NotePlanInputRules`
- ✅ **Interactive** (clicking checkboxes) via `NotePlanCheckbox`
- ❌ **Parsing** (markdown → ProseMirror nodes) - **MISSING!**

---

## Solution

### Created `NotePlanParser` Extension

**File:** `/frontend/src/extensions/noteplan/plugins/NotePlanParser.ts`

This extension:
1. **Intercepts** the `setContent()` command
2. **Pre-parses** markdown before it reaches tiptap-markdown
3. **Converts** NotePlan tasks to ProseMirror JSON nodes
4. **Passes** structured nodes to editor

### How It Works

```typescript
editor.commands.setContent = (content, emitUpdate, parseOptions) => {
  if (typeof content === 'string') {
    // Parse NotePlan markdown into ProseMirror JSON
    const processedContent = parseNotePlanMarkdown(content, editor.schema);
    return originalSetContent(processedContent, emitUpdate, parseOptions);
  }
  return originalSetContent(content, emitUpdate, parseOptions);
};
```

### Parsing Logic

The `parseNotePlanMarkdown()` function:

```typescript
function parseNotePlanMarkdown(markdown: string, schema: any): any {
  const lines = markdown.split('\n');
  const nodes: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect NotePlan task: /^(\s*)\[([xX\s\-!>]?)\]\s+(.+)$/
    const taskMatch = line.match(/^(\s*)\[([xX\s\-!>]?)\]\s+(.+)$/);

    if (taskMatch) {
      const [, spaces, marker, content] = taskMatch;
      const indent = Math.floor(spaces.length / 2);
      const state = getStateFromMarker(marker.trim() || ' ');

      // Create noteplanTask node
      nodes.push({
        type: 'noteplanTask',
        attrs: { state, indent },
        content: [{ type: 'text', text: content.trim() }],
      });
    } else {
      // Handle headings, bullets, paragraphs, etc.
    }
  }

  return { type: 'doc', content: nodes };
}
```

---

## Complete Data Flow

### Before Fix:
```
File (markdown)
  ↓
tiptap-markdown parser (doesn't understand [] Task)
  ↓
Paragraph node with all tasks as text
  ↓
Display: All on one line ❌
```

### After Fix:
```
File (markdown)
  ↓
NotePlanParser (intercepts first!)
  ↓
Parses [] Task into noteplanTask nodes
  ↓
Structured ProseMirror document
  ↓
Display: Each task on its own line ✅
```

---

## Changes Made

### 1. Created NotePlanParser.ts
- Priority: 1001 (highest)
- Intercepts `setContent()`
- Parses markdown → ProseMirror JSON
- Handles all task states: ` ` `x` `-` `>` `!`
- Supports indentation

### 2. Updated index.ts
```typescript
export const NotePlanExtensions = [
  NotePlanParser, // MUST be first!
  NotePlanTask,
  NotePlanMarkdown,
  NotePlanCheckbox,
  NotePlanKeymap,
  NotePlanInputRules,
];
```

**Critical:** `NotePlanParser` must be first in the array to ensure it runs before other extensions.

---

## Testing

### Test Case 1: Multiple Tasks
**Input File:**
```markdown
[] Task 1
[x] Task 2
[-] Task 3
```

**Expected:** Each task on separate line
**Result:** ✅ Pass

### Test Case 2: Indented Tasks
**Input File:**
```markdown
[] Parent
  [] Child 1
    [] Grandchild
```

**Expected:** Proper indentation hierarchy
**Result:** ✅ Pass

### Test Case 3: Mixed Content
**Input File:**
```markdown
# Heading
[] Task
- Bullet
Regular text
```

**Expected:** Each element properly parsed
**Result:** ✅ Pass

---

## Technical Details

### Why Override setContent()?

1. **Timing**: Runs before tiptap-markdown parser
2. **Control**: Full control over parsing logic
3. **Clean**: No conflicts with other extensions
4. **Priority**: Extension priority ensures it runs first

### Alternative Approaches Considered

#### Option A: Custom Markdown Transformer
**Problem:** tiptap-markdown transformers are for string manipulation, not node creation

#### Option B: Modify tiptap-markdown
**Problem:** Would require forking the library

#### Option C: Post-parse Correction
**Problem:** Too late - content already in wrong structure

#### Option D: Override setContent() ✅ **CHOSEN**
**Advantage:** Clean, runs at the right time, full control

---

## Related Files

- `/frontend/src/extensions/noteplan/plugins/NotePlanParser.ts` - New parser
- `/frontend/src/extensions/noteplan/index.ts` - Updated to include parser
- `/frontend/src/extensions/noteplan/types.ts` - Type definitions

---

## Verification Steps

1. Create test file with multiple tasks:
   ```bash
   cat > ~/Documents/notes/Notes/parser-test.txt << 'EOF'
   [] Task 1
   [x] Task 2
   [-] Task 3
   EOF
   ```

2. Open in editor
3. Verify tasks appear on separate lines
4. Reload page
5. Verify tasks still on separate lines ✅

---

## Success Metrics

- ✅ Tasks load on separate lines
- ✅ Newlines preserved between tasks
- ✅ All 5 task states parsed correctly
- ✅ Indentation preserved
- ✅ Mixed content (tasks + other elements) parsed correctly
- ✅ No TypeScript errors
- ✅ No runtime errors

---

## Lessons Learned

### Key Insight
When integrating custom node types with tiptap-markdown:
1. **Serialization** (nodes → markdown) is only half the job
2. **Parsing** (markdown → nodes) must also be implemented
3. Can't rely on tiptap-markdown to understand custom formats

### Best Practice
For custom markdown formats:
- Implement custom parser that runs **before** default markdown parser
- Use high priority (1000+) to ensure early execution
- Override `setContent()` for full control
- Parse line-by-line for block-level nodes

---

## Future Enhancements

Potential improvements:
1. **Bullet List Parsing**: Better handling of nested bullets
2. **Code Block Support**: Preserve language attributes
3. **Blockquote Support**: Multi-line blockquotes
4. **Performance**: Cache parsed content for large files
5. **Error Handling**: Graceful fallback for malformed markdown

---

**Status:** Production Ready ✅
**Last Updated:** 2025-10-20
**Implemented By:** Claude Code AI
