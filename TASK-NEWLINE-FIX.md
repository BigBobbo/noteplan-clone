# Task Newline Preservation Fix - Complete Report

**Date:** 2025-10-20  
**Issue:** Tasks were being saved on a single line instead of preserving newlines  
**Status:** ✅ FIXED and VERIFIED with automated tests

---

## Problem Description

### User-Reported Behavior
When creating tasks in the NotePlan editor:
1. User types tasks on separate lines:
   ```
   [] Task 1
   [] Task 2
   [] Task 3
   ```
2. Tasks appear correctly in the editor with checkboxes
3. After auto-save (1 second), content reloads
4. **BUG:** All tasks collapse to a single line:
   ```
   [] Task 1 [] Task 2 [] Task 3
   ```

### Root Cause Analysis

**Three interconnected issues:**

1. **Parser Bypass**
   - The `content:` property in `useEditor()` bypassed the NotePlanParser
   - StarterKit's default paragraph parser handled the content instead
   - Tasks were created as `paragraph` nodes instead of `noteplanTask` nodes

2. **Incorrect Node Types**
   - Text like `[] Task 1` was treated as plain text in paragraphs
   - No task nodes were created, so no checkboxes rendered
   - Content: `paragraph { text: "[] Task 1" }`

3. **Serialization Failure**
   - Custom serializer iterated over nodes
   - For paragraphs, it did: `markdown += node.textContent + '\n'`
   - But consecutive paragraphs on the same "logical line" were concatenated
   - Newlines between tasks were lost

---

## Investigation Process

### Phase 1: Manual Inspection (Failed)
❌ Checked browser console - no errors  
❌ Looked at editor display - tasks appeared correct  
❌ Made multiple "fixes" that didn't actually work  

**Lesson:** Visual appearance is NOT validation.

### Phase 2: Automated Testing (Success)
✅ Created Playwright test that:
- Creates a test file with tasks on separate lines
- Opens file in browser
- Checks DOM for task nodes
- Verifies file content on disk
- Types new tasks and validates serialization

**Key Discovery:**
```javascript
[BROWSER] [Editor.onUpdate] Node 0: type="paragraph"  // ❌ Should be "noteplanTask"
[TEST] NotePlan task nodes found: 0  // ❌ Should be 4
[TEST] File lines on disk: 1  // ❌ Should be 4
```

---

## The Fix

### File: `/frontend/src/components/editor/Editor.tsx`

**Added manual parsing function:**
```typescript
function parseNotePlanMarkdown(markdown: string): any {
  const lines = markdown.split('\n');
  const nodes: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const taskMatch = line.match(/^(\s*)\[([xX\s\-!>]?)\]\s+(.+)$/);

    if (taskMatch) {
      // Create noteplanTask node
      nodes.push({
        type: 'noteplanTask',
        attrs: { state, indent },
        content: [{ type: 'text', text: content }],
      });
    }
    // ... handle other node types
  }

  return { type: 'doc', content: nodes };
}
```

**Used parsed content in editor:**
```typescript
const parsedContent = useMemo(() => {
  if (currentFile?.content) {
    return parseNotePlanMarkdown(currentFile.content);
  }
  return '';
}, [currentFile?.content]);

const editor = useEditor({
  extensions: [...],
  content: parsedContent,  // ← Now uses parsed structure!
  ...
});
```

**Also updated useEffect:**
```typescript
useEffect(() => {
  if (editor && currentFile) {
    const parsed = parseNotePlanMarkdown(currentFile.content);
    editor.commands.setContent(parsed, false);
  }
}, [currentFile, editor]);
```

---

## Verification

### Automated Test Results

```bash
$ npx playwright test test-noteplan.spec.js

✓ NotePlan Task Newline Preservation › should preserve newlines between tasks after load
✓ NotePlan Task Newline Preservation › should preserve newlines after typing and saving

2 passed (16.7s)
```

### Detailed Test Output

**Test 1: File Loading**
```
[TEST] NotePlan task nodes found: 4  ✅
[TEST] File lines on disk: 4  ✅
[TEST] File content: "[ ] Test task 1\n[ ] Test task 2\n[ ] Test task 3\n[ ] Test task 4\n"  ✅
[BROWSER] [Editor.onUpdate] Node 0: type="noteplanTask"  ✅
```

**Test 2: Typing and Saving**
```
[TEST] Final file lines: 5  ✅ (4 original + 1 new)
[TEST] Lines: [
  '[ ] Test task 1',
  '[ ] Test task 2',
  '[ ] Test task 3',
  '[ ] Test task 4',
  '[ ] Test task 5'
]  ✅
```

---

## Files Modified

1. **`/frontend/src/components/editor/Editor.tsx`**
   - Added `parseNotePlanMarkdown()` function
   - Added `parsedContent` useMemo hook
   - Updated `useEditor({ content: parsedContent })`
   - Updated useEffect to parse before setContent

2. **`/frontend/src/extensions/noteplan/plugins/NotePlanParser.ts`**
   - Enhanced logging for debugging
   - Increased priority to 10000
   - Added onBeforeCreate hook

3. **`/test-noteplan.spec.js`** (NEW)
   - Comprehensive automated tests
   - Tests parsing, serialization, and round-trip

4. **`/CLAUDE.md`** (UPDATED)
   - Added automated testing section
   - Added case study of this bug
   - Added testing checklist

5. **`/TESTING-GUIDE.md`** (NEW)
   - Detailed testing guidelines
   - Common pitfalls
   - Debugging strategies

---

## Key Learnings

### What Worked
✅ Automated end-to-end testing with Playwright  
✅ Checking actual file content on disk  
✅ Logging node types in browser console  
✅ Testing round-trip (load → edit → save → reload)  

### What Didn't Work
❌ Trusting visual appearance in browser  
❌ Assuming no console errors means no bugs  
❌ Manual testing without verification  
❌ Claiming fixes work without automated validation  

### For Future Development

**ALWAYS:**
1. Write automated tests FIRST
2. Verify file content on disk
3. Check node types in DOM
4. Test round-trip behavior
5. Run tests before claiming success

**NEVER:**
1. Trust visual appearance alone
2. Skip automated testing
3. Assume hot reload means it works
4. Claim "verified" without test output

---

## Test Maintenance

### Running Tests
```bash
# Before any commit
npx playwright test

# When editing parser
npx playwright test --headed  # Watch browser behavior

# When debugging
npx playwright test --debug
```

### Adding New Tests
Use `test-noteplan.spec.js` as template:
1. Create test file
2. Open in app
3. Verify DOM structure
4. Check file content on disk
5. Assert expected behavior

---

## Success Metrics

- ✅ Tasks load as `noteplanTask` nodes
- ✅ Tasks display with interactive checkboxes
- ✅ Each task stays on its own line
- ✅ Newlines preserved when saving
- ✅ Files reload correctly
- ✅ Typing new tasks works
- ✅ 100% automated test pass rate (2/2)

---

**Status:** COMPLETE  
**Verified:** YES (automated tests passing)  
**Confidence:** HIGH (reproducible test coverage)

