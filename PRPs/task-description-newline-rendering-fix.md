# PRP: Task Description Newline Rendering Fix

**Created:** 2025-10-21
**Confidence Score:** 9/10
**Estimated Implementation Time:** 1-2 hours

## 📋 Executive Summary

Task descriptions with multiple lines are being collapsed into a single line in the Tasks tab and Kanban board views. Newlines are present in the parsed data but are not being rendered correctly by ReactMarkdown. This PRP fixes the issue by implementing the `remark-breaks` plugin to preserve single newlines in task descriptions.

## 🎯 Problem Statement

### Current Bug

**User Report:**
```
Task description input:
"""
this is the task description
Line A
Line B
    •    Line C
Line D
    •    Line E
Line F
"""

Actual rendering in Tasks tab:
"""
this is the task description Line A Line B
    •    Line C Line D
    •    Line E Line F
"""
```

**Root Cause:**
ReactMarkdown follows standard Markdown spec where single newlines are treated as soft breaks and are collapsed into spaces. To render newlines as line breaks, Markdown requires either:
1. Two spaces at the end of a line + newline (`line  \n`)
2. Double newlines for paragraph breaks (`\n\n`)
3. The `remark-breaks` plugin to override this behavior

### Expected Behavior

Newlines in task descriptions should be preserved and rendered as line breaks in all views (Tasks tab, Kanban board, Calendar view, etc.).

### Affected Components

1. **Tasks Tab:** `/frontend/src/components/tasks/TaskDetails.tsx` (lines 95-109)
2. **Kanban Board:** `/frontend/src/components/kanban/KanbanCard.tsx` (lines 76-82)
3. Any other components using ReactMarkdown to render task.details

## 🔍 Research Summary

### Codebase Analysis

**Task Parsing (Working Correctly):**
- File: `/frontend/src/services/taskService.ts`
- Function: `parseTaskDetails()` (lines 58-109)
- ✅ **Status:** Newlines ARE being preserved in the parsed string
- Debug logs confirm: `details.includes('\n')` returns `true`
- Data structure: `ParsedTask.details: string` contains multiline text

**Rendering Issue:**
- Files using ReactMarkdown:
  - `/frontend/src/components/tasks/TaskDetails.tsx` (line 95-109)
  - `/frontend/src/components/kanban/KanbanCard.tsx` (line 79)
- ❌ **Problem:** ReactMarkdown is collapsing single newlines per Markdown spec
- Current: Just passing raw text `<ReactMarkdown>{task.details}</ReactMarkdown>`
- Missing: `remark-breaks` plugin to preserve newlines

### External Research

**React-Markdown Documentation:**
- URL: https://github.com/remarkjs/react-markdown
- Current version installed: `react-markdown@9.1.0`
- Plugin system: Accepts `remarkPlugins` prop for extending behavior

**remark-breaks Plugin:**
- URL: https://github.com/remarkjs/remark-breaks
- Purpose: Converts single newlines (`\n`) to hard breaks (`<br>`)
- Usage:
  ```tsx
  import remarkBreaks from 'remark-breaks';
  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{content}</ReactMarkdown>
  ```

**Stack Overflow Solutions:**
- https://stackoverflow.com/questions/60332183/new-line-with-react-markdown
- Consensus: `remark-breaks` is the standard solution for this issue

## 💡 Solution Design

### Implementation Approach

**Option 1: Use remark-breaks Plugin** ⭐ **RECOMMENDED**
- ✅ Clean, industry-standard solution
- ✅ Maintains Markdown parsing for other features
- ✅ Minimal code changes
- ✅ Well-maintained package

**Option 2: Pre-process text to add double spaces**
- ❌ Brittle, regex-heavy approach
- ❌ May break other Markdown features
- ❌ Harder to maintain

**Option 3: Replace ReactMarkdown with custom component**
- ❌ Overkill for this issue
- ❌ Loses Markdown parsing benefits (lists, code blocks, etc.)
- ❌ More code to maintain

### Architecture Changes

**Before:**
```
task.details (with \n) → ReactMarkdown → HTML (newlines collapsed)
```

**After:**
```
task.details (with \n) → ReactMarkdown + remarkBreaks → HTML (newlines preserved as <br>)
```

## 🛠️ Implementation Plan

### Step 1: Install remark-breaks

```bash
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend
npm install remark-breaks
```

### Step 2: Update TaskDetails.tsx

**File:** `/frontend/src/components/tasks/TaskDetails.tsx`

**Changes:**
```typescript
// Add import at top (after line 2)
import remarkBreaks from 'remark-breaks';

// Update ReactMarkdown usage (lines 95-109)
<ReactMarkdown
  remarkPlugins={[remarkBreaks]}  // ← ADD THIS LINE
  components={{
    // Ensure paragraphs render with proper spacing
    p: ({children}) => <p className="mb-2">{children}</p>,
    // Ensure lists render properly
    ul: ({children}) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
    ol: ({children}) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
    li: ({children}) => <li className="mb-1">{children}</li>,
    // Code blocks
    pre: ({children}) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-2 overflow-x-auto">{children}</pre>,
    code: ({children}) => <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{children}</code>,
  }}
>
  {details}
</ReactMarkdown>
```

### Step 3: Update KanbanCard.tsx

**File:** `/frontend/src/components/kanban/KanbanCard.tsx`

**Changes:**
```typescript
// Add import at top (after line 5)
import remarkBreaks from 'remark-breaks';

// Update ReactMarkdown usage (line 79)
<ReactMarkdown remarkPlugins={[remarkBreaks]}>{task.details}</ReactMarkdown>
```

### Step 4: Check for other ReactMarkdown usages

Search codebase for any other components rendering task.details with ReactMarkdown and apply the same fix.

```bash
grep -r "ReactMarkdown.*task.details" frontend/src/
```

### Step 5: Remove debug logging (optional cleanup)

**File:** `/frontend/src/services/taskService.ts`
- Remove lines 100-106 (debug logging in parseTaskDetails)

**File:** `/frontend/src/components/tasks/TaskDetails.tsx`
- Remove lines 22-27 (debug logging in useEffect)

## ✅ Validation & Testing

### Test File Location

**File:** `~/Documents/notes/Notes/task-description-newlines-test.txt`

Already created with test cases:
- Task with multiline description
- Task with bullets in description
- Task with blank lines in description

### Manual Testing Steps

1. **Start dev servers**
   ```bash
   # Terminal 1 - Backend
   cd /Users/robertocallaghan/Documents/claude/noteapp
   node src/server.js

   # Terminal 2 - Frontend
   cd /Users/robertocallaghan/Documents/claude/noteapp/frontend
   npm run dev
   ```

2. **Open test file**
   - Navigate to `task-description-newlines-test.txt` in the app

3. **Verify Tasks Tab**
   - Switch to Tasks tab
   - Expand first task description
   - ✅ Verify: Each line appears on a separate line
   - ✅ Verify: "Line A", "Line B", etc. are on different lines
   - ✅ Verify: Bullets render properly

4. **Verify Kanban Board**
   - Switch to Kanban tab
   - Find the same tasks
   - Expand task descriptions
   - ✅ Verify: Same multiline rendering

5. **Verify persistence**
   - Edit a task description in Tasks tab
   - Add new lines
   - Save
   - Reload the file
   - ✅ Verify: Newlines are preserved

### Automated Testing Plan

**Test File:** `/test-task-description-newlines.spec.js`

```javascript
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const TEST_FILE = '/Users/robertocallaghan/Documents/notes/Notes/task-description-newlines-test.txt';
const APP_URL = 'http://localhost:5173';

test.describe('Task Description Newline Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure test file exists
    const testContent = `# Task Description Newlines Test

- [ ] Task with multiline description
    this is the task description
    Line A
    Line B
    - Line C (bullet)
    Line D
    - Line E (bullet)
    Line F
`;
    fs.writeFileSync(TEST_FILE, testContent, 'utf-8');

    // Navigate to app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Open test file
    await page.click('text=task-description-newlines-test.txt');
    await page.waitForTimeout(500);
  });

  test('Task descriptions render with preserved newlines in Tasks tab', async ({ page }) => {
    // Switch to Tasks tab
    await page.click('[role="tab"]:has-text("Tasks")');
    await page.waitForTimeout(500);

    // Find the first task
    const taskText = await page.locator('text=Task with multiline description').first();
    expect(await taskText.isVisible()).toBeTruthy();

    // Click to expand details
    const expandButton = await page.locator('[title*="Expand details"]').first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(300);
    }

    // Check that the task details are visible and contain multiple lines
    const taskDetails = await page.locator('[class*="task-details"]').first();
    const detailsText = await taskDetails.textContent();

    // Verify each line is present
    expect(detailsText).toContain('Line A');
    expect(detailsText).toContain('Line B');
    expect(detailsText).toContain('Line C');
    expect(detailsText).toContain('Line D');
    expect(detailsText).toContain('Line E');
    expect(detailsText).toContain('Line F');

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-newlines-tasks-tab.png' });
  });

  test('Task descriptions render with preserved newlines in Kanban board', async ({ page }) => {
    // Switch to Kanban tab
    await page.click('[role="tab"]:has-text("Kanban")');
    await page.waitForTimeout(500);

    // Find the task card
    const taskCard = await page.locator('text=Task with multiline description').first();
    expect(await taskCard.isVisible()).toBeTruthy();

    // Expand details if collapsed
    const expandButton = await page.locator('[title*="Show details"]').first();
    if (await expandButton.count() > 0 && await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(300);
    }

    // Check for multiline rendering
    const cardDetails = await page.locator('.prose').first();
    const detailsHTML = await cardDetails.innerHTML();

    // With remark-breaks, each line should have a <br> tag or be in separate <p> tags
    const hasBrTags = detailsHTML.includes('<br>');
    const hasMultipleP = (detailsHTML.match(/<p>/g) || []).length > 1;

    expect(hasBrTags || hasMultipleP).toBeTruthy();

    // Take screenshot
    await page.screenshot({ path: 'test-newlines-kanban.png' });
  });

  test('Console shows newlines are preserved in parsed data', async ({ page }) => {
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    // Switch to Tasks tab to trigger parsing
    await page.click('[role="tab"]:has-text("Tasks")');
    await page.waitForTimeout(1000);

    // Check debug logs from parseTaskDetails
    const parseLog = logs.find(l => l.includes('[parseTaskDetails]') && l.includes('Has newlines'));
    expect(parseLog).toBeTruthy();
    expect(parseLog).toContain('true');
  });
});
```

**Run Test:**
```bash
cd /Users/robertocallaghan/Documents/claude/noteapp
npx playwright test test-task-description-newlines.spec.js --headed
```

### Validation Gates

**MUST PASS before marking complete:**

1. ✅ TypeScript compilation passes
   ```bash
   cd /Users/robertocallaghan/Documents/claude/noteapp/frontend
   npx tsc --noEmit
   ```

2. ✅ Manual verification: Each test case in test file shows newlines correctly

3. ✅ Automated Playwright tests pass (all 3 tests)

4. ✅ No console errors when rendering task descriptions

5. ✅ Newlines persist after editing and reloading

## 🚨 Potential Issues & Gotchas

### Issue 1: Double-spacing between lines

**Symptom:** Lines might have too much space between them

**Cause:** Both `<br>` from remark-breaks AND `<p>` margins from Markdown paragraphs

**Fix:** Adjust CSS for `.prose` components or use only `<br>` rendering:
```typescript
components={{
  p: ({children}) => <>{children}<br /></>  // Remove <p> wrapper, use <br> only
}}
```

### Issue 2: Existing double-newlines create too much space

**Symptom:** Tasks with intentional paragraph breaks show excessive spacing

**Expected:** This is correct Markdown behavior - single newline = line break, double newline = paragraph break

### Issue 3: Bullet points might not render as expected

**Solution:** The custom components already handle `<ul>` and `<li>` - should work fine

## 📚 References

1. **remark-breaks GitHub:** https://github.com/remarkjs/remark-breaks
2. **react-markdown Plugin Docs:** https://github.com/remarkjs/react-markdown#plugins
3. **Stack Overflow - Newlines in ReactMarkdown:** https://stackoverflow.com/questions/60332183/new-line-with-react-markdown
4. **CommonMark Spec (Hard Line Breaks):** https://spec.commonmark.org/0.30/#hard-line-breaks
5. **Related PRP:** `/PRPs/task-description-visibility.md` (Phase 1 mentions this issue)

## 🎯 Success Criteria

**Definition of Done:**

1. ✅ `remark-breaks` package installed
2. ✅ TaskDetails.tsx updated with `remarkPlugins={[remarkBreaks]}`
3. ✅ KanbanCard.tsx updated with `remarkPlugins={[remarkBreaks]}`
4. ✅ Any other ReactMarkdown usages for task.details updated
5. ✅ TypeScript compilation passes with no errors
6. ✅ Test file shows correct multiline rendering in:
   - Tasks tab
   - Kanban board
7. ✅ Automated Playwright tests pass
8. ✅ No regressions in other Markdown features (lists, code blocks, links)
9. ✅ Debug logs removed (optional cleanup)

## 📝 Implementation Checklist

- [ ] Install `remark-breaks` package
- [ ] Update TaskDetails.tsx component
- [ ] Update KanbanCard.tsx component
- [ ] Search for and update any other ReactMarkdown usages
- [ ] Run TypeScript type check
- [ ] Test manually with test file in Tasks tab
- [ ] Test manually in Kanban board
- [ ] Write automated Playwright test
- [ ] Run automated tests
- [ ] Verify no console errors
- [ ] Clean up debug logging
- [ ] Document any edge cases discovered

---

**Confidence Score Justification: 9/10**

This is a well-understood issue with a proven, standard solution. The `remark-breaks` plugin is widely used and maintained. The only reason it's not 10/10 is potential edge cases around how it interacts with our custom ReactMarkdown components, but these are easily addressed if they occur.

**Estimated Time: 1-2 hours**
- 15 min: Install package and update components
- 15 min: Manual testing
- 30 min: Write automated tests
- 15 min: Run tests and fix any issues
- 15 min: Cleanup and documentation
