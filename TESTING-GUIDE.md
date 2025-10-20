# Testing Guide for NotePlan Clone

## ⚠️ CRITICAL: Always Test Before Claiming Success

**DO NOT** claim a fix works without running automated tests. Visual appearance in the browser is **NOT** sufficient validation.

## Quick Test Commands

```bash
# Run all tests
npx playwright test

# Run specific test
npx playwright test test-noteplan.spec.js

# Run with visible browser (to see what's happening)
npx playwright test --headed

# Run with debugging
npx playwright test --debug
```

## What Gets Tested

### 1. **Task Parsing Test**
- Creates a test file with tasks on separate lines
- Opens file in the app
- Verifies tasks are parsed as `noteplanTask` nodes (NOT paragraphs)
- Checks that checkboxes are rendered
- **PASS:** 4 task nodes found, file has 4 lines with newlines

### 2. **Task Serialization Test**
- Opens test file
- Types a new task
- Waits for auto-save
- Checks file content on disk
- Verifies newlines are preserved
- **PASS:** Each task on its own line in the saved file

## Common Pitfalls

### ❌ False Positive: Editor Display
```
WRONG: "Tasks look correct in the editor, so it's fixed!"
```
**Why it fails:** Editor might display tasks correctly but save them incorrectly.

### ✅ True Validation: File Content
```
RIGHT: Check the actual file content:
cat ~/Documents/notes/Notes/test-file.txt
```

### ❌ False Positive: Browser Console
```
WRONG: "No errors in console, so parsing works!"
```
**Why it fails:** Parser might not be running at all (no errors, but no parsing either).

### ✅ True Validation: Console Logs + Node Types
```
RIGHT: Look for specific logs:
[parseNotePlanMarkdown] Found task: ...
[Editor.onUpdate] Node 0: type="noteplanTask"
```

## Test Workflow

### For Parser Changes
1. Modify parser code
2. Run: `npx playwright test`
3. Check console output for:
   - `[parseNotePlanMarkdown] Found task:` logs
   - `Node type="noteplanTask"` confirmations
4. Verify file has newlines: `wc -l ~/Documents/notes/Notes/automated-test.txt`

### For Serialization Changes
1. Modify serialization code
2. Run: `npx playwright test`
3. Check test output for:
   - `[Editor] Serialized markdown:` logs
   - File content with newlines preserved
4. Manual check: `cat ~/Documents/notes/Notes/automated-test.txt | od -c`

### For Editor Behavior Changes
1. Modify editor code
2. Run: `npx playwright test --headed` (watch browser)
3. Observe typing, Enter key, cursor behavior
4. Verify test passes

## Creating New Tests

Use the existing test as a template:

```javascript
test('should [describe behavior]', async ({ page }) => {
  // Capture console logs
  const consoleLogs = [];
  page.on('console', (msg) => {
    consoleLogs.push(msg.text());
    console.log(`[BROWSER] ${msg.text()}`);
  });

  // Navigate and interact
  await page.goto('http://localhost:5173');
  await page.click('text=test-file.txt');

  // Make assertions
  expect(someValue).toBe(expectedValue);

  // Check file content on disk
  const fileContent = fs.readFileSync(testFilePath, 'utf-8');
  expect(fileContent).toMatch(/expected pattern/);
});
```

## Debugging Failed Tests

### 1. Check Browser Logs
```javascript
consoleLogs.forEach(log => console.log(log));
```

### 2. Take Screenshots
```javascript
await page.screenshot({ path: 'test-failure.png' });
```

### 3. Inspect Element
```javascript
const html = await page.$eval('.ProseMirror', el => el.innerHTML);
console.log('Editor HTML:', html);
```

### 4. Check File System
```bash
# View file with visible newlines
cat test-file.txt | od -c

# Count lines
wc -l test-file.txt

# View with line numbers
cat -n test-file.txt
```

## Case Study: Task Newline Bug

### The Problem
- Tasks appeared correctly in editor
- But saved as single line: `[] Task 1 [] Task 2 [] Task 3`

### What Manual Testing Missed
- ✅ Editor displayed tasks with checkboxes (looked correct)
- ✅ No console errors (seemed fine)
- ❌ File content had no newlines (actual bug)
- ❌ Tasks were paragraph nodes, not noteplanTask nodes (root cause)

### What Automated Testing Caught
```javascript
// This assertion FAILED, revealing the bug
expect(taskNodes.length).toBe(4);  // Was 0 (paragraphs, not tasks!)

// This assertion FAILED, revealing serialization bug
expect(lines.length).toBe(4);  // Was 1 (all on one line!)
```

### The Fix (Verified by Tests)
After implementing manual parsing:
```
✓ 2 passed (16.7s)
[TEST] NotePlan task nodes found: 4
[TEST] File lines on disk: 4
[TEST] File content: "[ ] Task 1\n[ ] Task 2\n[ ] Task 3\n[ ] Task 4\n"
```

## Key Takeaway

> **Visual appearance ≠ Correct implementation**
>
> Always verify with automated tests that check:
> 1. DOM structure (node types)
> 2. File content (serialization)
> 3. Round-trip (load → save → reload)

---

**Last Updated:** 2025-10-20
