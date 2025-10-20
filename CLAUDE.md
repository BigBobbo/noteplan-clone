# Claude Code Reference - NotePlan Clone

## ⚠️ IMPORTANT: File Storage Information

### Notes File Location and Format
**CRITICAL:** All notes are stored as **`.txt` files**, NOT `.md` files!

- **Location:** `~/Documents/notes/Notes/` (expands to `/Users/robertocallaghan/Documents/notes/Notes/`)
- **File Extension:** `.txt` (NOT `.md`)
- **Format:** Markdown syntax, but saved with `.txt` extension

**When creating test files or new notes:**
```bash
# CORRECT
~/Documents/notes/Notes/my-note.txt
# OR
/Users/robertocallaghan/Documents/notes/Notes/my-note.txt

# WRONG
~/Documents/notes/Notes/my-note.md
```

---

## Project Architecture

### Frontend
- **Framework:** React 19.1.1 with TypeScript
- **Build Tool:** Vite 7.1.9
- **Editor:** Tiptap (ProseMirror-based WYSIWYG editor)
- **State Management:** Zustand 5.0.8
- **Styling:** Tailwind CSS 4.1.14
- **Location:** `/frontend/`
- **Dev Server:** http://localhost:5173/

### Backend
- **Runtime:** Node.js
- **Server:** Express.js
- **File System:** Watches `~/Documents/notes/Notes/` directory
- **Location:** `/src/server.js`
- **API Endpoints:** See `API_DOCUMENTATION.md`

---

## Markdown & Task Syntax

### Task Syntax (GFM Format)
**IMPORTANT:** As of 2025-10-20, the app uses GitHub Flavored Markdown (GFM) task format.

```markdown
- [ ] Open task
- [x] Completed task
- [-] Cancelled task
- [>] Scheduled task
- [!] Important task
```

**Legacy NotePlan Format (Deprecated):**
The old format (`[] Task` without leading `-`) is still supported for backward compatibility but will be automatically migrated to GFM format when files are opened.

```markdown
[] Open task          # Automatically migrated to: - [ ] Open task
[x] Completed task    # Automatically migrated to: - [x] Completed task
```

### Bullet Points
```markdown
- Regular bullet point
* Also a bullet point
```

### Task with Details and Bullets
```markdown
- [ ] Main task title
    Task description here (indent with 4 spaces or 1 tab)

    Requirements:
    - Bullet point 1
    - Bullet point 2
    - Bullet point 3

    More details here.
```

**Key Rule:** Tasks use `- [ ]` (GFM format), bullets use `-` or `*`. The Tiptap editor distinguishes between them using the `data-noteplan-task` attribute.

---

## Development Servers

### Start Both Servers
```bash
# Terminal 1 - Frontend
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend
npm run dev

# Terminal 2 - Backend
cd /Users/robertocallaghan/Documents/claude/noteapp
node src/server.js
```

### Current Running Sessions
- Frontend Dev: Usually on Bash session 1419c2
- Backend: Usually on Bash sessions 147c2e, 61e7ac, or 5a35a9

---

## Key Features

### Implemented Features
1. **Markdown Editor** - Tiptap-based WYSIWYG editor
2. **Task Management** - NotePlan-style task syntax with states
3. **Kanban Board** - Visual task organization
4. **Calendar View** - Date-based task organization
5. **Wiki Links** - `[[note-name]]` linking between notes
6. **Tag System** - `#tag` support with references
7. **Folder Organization** - Hierarchical note organization
8. **Drag-and-Drop** - Task reordering
9. **Command Palette** - Quick access to features
10. **Theme System** - Light, Dark, and Ocean themes
11. **Tag References** - Comprehensive tag tracking and navigation

### Recent Implementations
- **Task vs Bullet Distinction** (2025-10-10)
  - Tasks (`[]`) show checkboxes
  - Bullets (`-`, `*`) show standard disc bullets
  - Extension: `TaskListItemDetector.ts`

---

## Important File Locations

### Configuration
- **Package.json:** `/frontend/package.json`
- **TypeScript Config:** `/frontend/tsconfig.json`
- **Vite Config:** `/frontend/vite.config.ts`
- **Tailwind Config:** `/frontend/tailwind.config.js`

### Source Code
- **Components:** `/frontend/src/components/`
- **Tiptap Extensions:** `/frontend/src/extensions/`
- **Stores (Zustand):** `/frontend/src/store/`
- **Services:** `/frontend/src/services/`
- **Styles:** `/frontend/src/index.css`

### Data
- **Notes:** `~/Documents/notes/Notes/` (**.txt files!**)
- **Server:** `/src/server.js`

### Documentation
- **README:** `/README.md`
- **Getting Started:** `/GETTING-STARTED.md`
- **PRPs:** `/PRPs/` (Product Requirement Plans)
- **API Docs:** `/API_DOCUMENTATION.md`

---

## Testing

### Test Files
Located in `~/Documents/notes/Notes/`:
- `gfm-format-test.txt` - GFM format tasks (current standard)
- `legacy-format-test.txt` - Legacy NotePlan format (auto-migration test)
- `task-vs-bullet-test.txt` - Task vs bullet distinction
- `checkbox-tasks-test.txt` - Task states
- `bullet-test.txt` - Bullet points
- `task-details-examples.txt` - Task details formatting

### Running Tests
```bash
# TypeScript type checking
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend
npx tsc --noEmit

# Build test
npm run build
```

---

## Common Commands

### Development
```bash
# Install dependencies
cd frontend && npm install

# Start dev server
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

### File Management
```bash
# Create a new note (REMEMBER: .txt extension!)
touch ~/Documents/notes/Notes/my-new-note.txt

# List all notes
ls -la ~/Documents/notes/Notes/*.txt

# Convert .md files to .txt (if needed)
cd ~/Documents/notes/Notes && for file in *.md; do [ -f "$file" ] && mv "$file" "${file%.md}.txt"; done
```

---

## Dependencies

### Key Frontend Libraries
- `@tiptap/react` ^3.6.5
- `@tiptap/starter-kit` ^3.6.5
- `@tiptap/extension-link` ^3.6.5
- `@tiptap/extension-list-item` ^3.6.5
- `tiptap-markdown` ^0.9.0
- `react` ^19.1.1
- `zustand` ^5.0.8
- `tailwindcss` ^4.1.14
- `axios` ^1.12.2
- `date-fns` ^4.1.0

### Key Backend Libraries
- `express`
- `socket.io`
- `chokidar` (file watching)
- `gray-matter` (frontmatter parsing)

---

## Automated Testing

### **⚠️ CRITICAL: ALWAYS Use Automated Tests - NO EXCEPTIONS**

**MANDATORY RULE**: Before claiming ANY fix works, you **MUST** run comprehensive automated tests to verify the behavior end-to-end.

**❌ NEVER rely on**:
- Manual browser testing
- User reports
- Visual inspection
- "It looks like it works"

**✅ ALWAYS verify with**:
- Automated Playwright tests
- Console log validation
- File content verification
- Round-trip testing (load → edit → save → reload)

### Why Manual Testing is Insufficient

Manual testing in the browser is **NOT ACCEPTABLE** because:
- Browser state can be cached
- Race conditions may not be visible
- File persistence issues may not be caught
- Visual appearance doesn't guarantee correct serialization
- Event handlers may not fire (e.g., drag-and-drop)
- User interaction can't reproduce exact conditions

**Example Failure**: TimeBlock drag-to-reposition (2025-10-20)
- **User report**: "I can drag it but it doesn't save"
- **Manual attempt**: "Looks like it works visually"
- **Automated test revealed**: `handleDragEnd` NEVER called - handler completely non-functional
- **Lesson**: Visual feedback ≠ Working functionality

### Playwright Test Setup

**Installation:**
```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

**Running Tests:**
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test test-noteplan.spec.js

# Run with visible browser (headed mode)
npx playwright test --headed

# Run with debugging
npx playwright test --debug

# Run specific test by name
npx playwright test --grep "Edit existing timeblock"
```

### Test File Organization

**Location**: `/test-*.spec.js` (root directory)

**Current Test Suites**:
1. `/test-noteplan.spec.js` - NotePlan task format parsing
2. `/test-bullets.spec.js` - Bullet vs task distinction
3. `/test-typing.spec.js` - Editor behavior
4. `/test-timeblock.spec.js` - TimeBlock full functionality
5. `/test-timeblock-simple.spec.js` - TimeBlock rendering only
6. `/test-drag-debug.spec.js` - Debug drag-and-drop handlers

### Comprehensive Test Pattern

**REQUIRED Test Structure** for any feature:

```javascript
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Setup test data on filesystem
    fs.writeFileSync(TEST_FILE_PATH, testContent, 'utf-8');

    // 2. Capture ALL console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // 3. Navigate to app
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
  });

  test('1. Feature renders correctly', async ({ page }) => {
    // Test visual rendering
    const element = await page.locator('selector').first();
    expect(await element.isVisible()).toBeTruthy();
  });

  test('2. User interaction works', async ({ page }) => {
    // Test clicks, drags, inputs, etc.
    await page.click('selector');

    // VERIFY handler was called via console logs
    const logs = consoleMessages.filter(m => m.includes('handlerName'));
    expect(logs.length).toBeGreaterThan(0);
  });

  test('3. Data persists to file', async ({ page }) => {
    // Make change
    await page.fill('input', 'new value');
    await page.click('button:has-text("Save")');

    // Wait for file system
    await new Promise(resolve => setTimeout(resolve, 2000));

    // VERIFY file content changed
    const fileContent = fs.readFileSync(TEST_FILE_PATH, 'utf-8');
    expect(fileContent).toContain('new value');
  });

  test('4. Changes survive reload', async ({ page }) => {
    // Make change and reload
    await page.click('selector');
    await page.reload();

    // VERIFY change is still visible
    expect(await page.locator('selector').isVisible()).toBeTruthy();
  });
});
```

### Test Validation Requirements

**EVERY feature implementation MUST include tests for**:

| Aspect | What to Test | How to Verify |
|--------|--------------|---------------|
| **Rendering** | Element appears | `locator.isVisible()` |
| **Interaction** | Click/drag/type works | Event handler console logs |
| **State Change** | UI updates | Element text/class changes |
| **File Persistence** | Data saves to disk | `fs.readFileSync()` content |
| **Round-Trip** | Load → Edit → Save → Reload | File content + UI state |
| **Console Logs** | No errors, expected logs | `page.on('console')` capture |
| **Handler Calls** | Functions execute | Console.log in handler code |

### Console Log Validation

**ALWAYS add debug logging** to handlers you're testing:

```typescript
// In your handler
const handleDragEnd = (event) => {
  console.log('handleDragEnd called:', {
    sourceType: event.active.data.current?.type,
    targetType: event.over?.data.current?.type,
  });
  // ... rest of handler
};
```

**In your test**:
```javascript
const logs = [];
page.on('console', msg => logs.push(msg.text()));

// After interaction
const handlerLogs = logs.filter(l => l.includes('handleDragEnd called'));
if (handlerLogs.length === 0) {
  throw new Error('Handler was never called - feature is broken!');
}
```

### Example Test Patterns

**Located at**: Various `/test-*.spec.js` files

**Pattern 1: File Parsing Test**
```javascript
// Creates file, opens in app, verifies parsing
const fileContent = fs.readFileSync(TEST_FILE_PATH, 'utf-8');
expect(fileContent).toMatch(/expected pattern/);
```

**Pattern 2: Event Handler Test**
```javascript
// Captures console to verify handler execution
const logs = [];
page.on('console', msg => logs.push(msg.text()));
await page.click('button');
expect(logs.some(l => l.includes('handler called'))).toBeTruthy();
```

**Pattern 3: Round-Trip Test**
```javascript
// Load → Edit → Save → Reload → Verify
fs.writeFileSync(path, 'original content');
await page.goto(url);
await page.fill('input', 'new content');
await page.click('save');
await page.reload();
const newContent = fs.readFileSync(path, 'utf-8');
expect(newContent).toContain('new content');
```

### Testing Workflow (MANDATORY)

**For EVERY code change**:

1. **Write test FIRST** (or use existing test)
2. **Run test - should FAIL** (proves test works)
3. **Implement fix**
4. **Run test - should PASS** (proves fix works)
5. **Check console logs** (proves handlers execute)
6. **Verify file content** (proves persistence)
7. **Run ALL tests** (proves no regressions)

**NEVER skip steps 4-7!**

### Common Testing Mistakes to Avoid

❌ **Assuming visual = working**
```javascript
// BAD: Only checks if element exists
expect(await page.locator('button').isVisible()).toBeTruthy();
```

✅ **Verify actual functionality**
```javascript
// GOOD: Checks element AND handler execution
await page.click('button');
expect(consoleLogs).toContain('handleClick called');
expect(fileContent).toContain('expected change');
```

❌ **Not capturing console logs**
```javascript
// BAD: No way to know if handlers fired
await page.click('button');
```

✅ **Always capture console**
```javascript
// GOOD: Can verify handler execution
const logs = [];
page.on('console', msg => logs.push(msg.text()));
await page.click('button');
expect(logs.some(l => l.includes('handler'))).toBeTruthy();
```

❌ **Not checking file persistence**
```javascript
// BAD: Only checks UI state
expect(await page.locator('text=saved').isVisible()).toBeTruthy();
```

✅ **Verify file on disk**
```javascript
// GOOD: Checks actual file content
await page.waitForTimeout(2000); // Wait for file write
const content = fs.readFileSync(path, 'utf-8');
expect(content).toContain('saved data');
```

### Case Studies: Why Automated Testing is Required

#### Case Study 1: Task Newline Issue (2025-10-20)
- **Manual testing**: Tasks appeared to work in editor ✓
- **Automated test revealed**: Tasks were paragraphs, newlines removed ✗
- **Root cause**: Content bypassed custom parser
- **Fix verified**: Automated test proved round-trip works correctly ✓

#### Case Study 2: TimeBlock Drag-and-Drop (2025-10-20)
- **User report**: "I can drag it but it doesn't save" ✗
- **Manual attempt**: "Visual feedback works" ✓ (MISLEADING)
- **Automated test revealed**: `handleDragEnd` NEVER called ✗
- **Console logs**: Zero handler execution logs ✗
- **Root cause**: Wrong dnd-kit pattern used
- **Lesson**: Visual ≠ Functional

#### Case Study 3: Edit Dialog Save (2025-10-20)
- **Manual test**: "Dialog appears and I can click save" ✓
- **Automated test**: Dialog appears ✓, but file unchanged ✗
- **File check**: Content not updated on disk ✗
- **Fix required**: Trace save flow with console logs

### Summary: The Testing Mandate

**🚨 ABSOLUTE RULE 🚨**

Before claiming **ANY** fix is complete:

1. ✅ **Write automated test** (or run existing test)
2. ✅ **Capture console logs** (verify handlers execute)
3. ✅ **Check file content** (verify persistence)
4. ✅ **Test round-trip** (verify reload works)
5. ✅ **Run full test suite** (verify no regressions)

**If you cannot prove it works with automated tests, IT DOES NOT WORK.**

**NO EXCEPTIONS. NO MANUAL TESTING. NO USER VERIFICATION.**

**AUTOMATED TESTS ARE THE ONLY ACCEPTABLE PROOF.**

---

## Troubleshooting

### Common Issues

1. **Files not showing in app**
   - Check file extension is `.txt`, not `.md`
   - Verify file is in `~/Documents/notes/Notes/` directory
   - Restart backend server if needed

2. **Hot reload not working**
   - Check Vite dev server is running
   - Clear browser cache
   - Check console for errors

3. **Tasks showing checkboxes when they shouldn't**
   - Verify `TaskListItemDetector` extension is loaded
   - Check CSS selectors in `index.css`
   - Ensure `data-is-task` attribute is set correctly

4. **Changes appear to work but fail after reload**
   - **DO NOT** trust visual appearance alone
   - **RUN** automated Playwright tests to verify
   - **CHECK** file content on disk with `cat` or `od -c`
   - **VERIFY** console logs show correct parsing/serialization

---

## Git Workflow

### Current Branch
- Main branch: `main`

### Recent Changes
- Task vs bullet distinction implementation
- Tag references feature
- Folder organization system
- Drag-and-drop reordering

---

## Project Goals

This is a **NotePlan clone** - a markdown-based note-taking and task management application that combines:
- Plain text note storage
- WYSIWYG markdown editing
- Task management with custom states
- Calendar and Kanban views
- Wiki-style linking
- Tag-based organization

---

**Last Updated:** 2025-10-20
**Created By:** Claude Code AI

## Updates Log

### 2025-10-20

#### GFM Task Format Migration (Latest)
- ✅ **CRITICAL FIX:** Task format mismatch causing tasks to not appear in Tasks/Kanban tabs
  - **Problem:** Editor serialized tasks in NotePlan format (`[] Task`), but task service expected GFM format (`- [ ] Task`)
  - **Solution:** Standardized on GitHub Flavored Markdown (GFM) format throughout the app
  - **Changes:**
    - Updated Editor.tsx serialization (onUpdate and useEffect) to output GFM format
    - Updated all NotePlan extension serialization points (7 locations total)
    - Added backward compatibility: taskService.ts now parses both formats
    - Created automatic migration utility: `migrateToGFMFormat.ts`
    - Added auto-migration trigger in fileStore.ts when opening legacy files
  - **Migration:** Legacy NotePlan format files are automatically converted to GFM when opened
  - **Test Files:** Created `gfm-format-test.txt` and `legacy-format-test.txt`
  - **See PRP:** `PRPs/task-format-mismatch-fix.md` for full details

#### Task Newline Preservation
- ✅ **CRITICAL FIX:** Task newline preservation
  - Fixed tasks being saved on single line instead of separate lines
  - Root cause: Content was bypassing NotePlanParser, tasks created as paragraphs
  - Solution: Manual parsing in Editor.tsx before passing to useEditor
  - **Verified with automated Playwright tests** (2 tests passing)
- ✅ Added automated testing infrastructure
  - Installed Playwright for end-to-end testing
  - Created `test-noteplan.spec.js` with comprehensive task tests
  - Added testing guidelines to CLAUDE.md
- ✅ Removed tiptap-markdown extension (conflicted with custom parser)
- ✅ Implemented custom serialization in Editor.tsx onUpdate

### 2025-10-11
- ✅ Updated notes storage location to correct path: `~/Documents/notes/Notes/`
- ✅ Implemented Task vs Bullet Distinction feature
- ✅ Created test files: `task-vs-bullet-test.txt`, `checkbox-tasks-test.txt`, `bullet-test.txt`

### 2025-10-10
- ✅ Initial documentation created
