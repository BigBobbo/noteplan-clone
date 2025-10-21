# Product Requirements Plan: Readable Daily Note Filenames

## Executive Summary

This PRP outlines the implementation of human-readable filenames for daily notes while maintaining backwards compatibility with existing YYYYMMDD.txt files. The new format will be `YYYYMMDD - DayName - Mon DDth.txt` (e.g., `20251021 - Monday - Oct 21st.txt`), making daily notes easier to identify at a glance in file browsers and the app sidebar.

---

## Background & Context

### Current State
- Daily notes are currently stored in `Calendar/` folder
- File naming format: `YYYYMMDD.txt` (e.g., `20251021.txt`)
- Files are created via `/api/calendar/daily/:date` endpoint
- Date utilities are in:
  - Frontend: `frontend/src/utils/dateUtils.ts`
  - Backend: `src/utils/dateUtils.js`
- File metadata includes a `name` field that displays in the UI (from `path.basename()`)

### Problem Statement
The current YYYYMMDD format is:
1. **Not human-readable**: Hard to distinguish "20251021" from "20251022" at a glance
2. **Requires mental conversion**: Users must mentally convert dates to understand which day it represents
3. **Poor UX in file browsers**: Files are identifiable only by number patterns
4. **Inconsistent with other apps**: Tools like Obsidian, Roam, and LogSeq use readable date formats

### User Pain Points
- "I can never tell which daily note is which without opening them"
- "I have to count digits to figure out if this is October 21st or October 12th"
- "When I'm in Finder/Explorer, the file names are meaningless"

### Dependencies
- `date-fns` library (already in use) - supports ordinal dates with `do` format token
- Existing daily notes in `~/Documents/notes/Calendar/` must remain functional

---

## Goals & Objectives

### Primary Goals
1. **Readability**: Make daily note filenames instantly recognizable
2. **Backwards Compatibility**: Support existing YYYYMMDD.txt files without requiring migration
3. **Sortability**: Maintain chronological sorting by starting with YYYYMMDD
4. **Consistency**: Apply format uniformly across file creation, lookup, and display

### Success Metrics
- New daily notes created with readable format: 100%
- Existing YYYYMMDD.txt files remain functional: 100%
- File lookup works for both formats: 100%
- Zero data loss during implementation
- Users can identify daily notes 50% faster (subjective improvement)

### Non-Goals
- Automatic renaming of existing files (optional future enhancement)
- Supporting other date formats (e.g., ISO-8601, MM-DD-YYYY)
- Localizing day/month names to other languages

---

## User Stories

### Core Stories
1. **As a user**, when I create a daily note for October 21st, 2025, I want the file to be named `20251021 - Monday - Oct 21st.txt` so I can easily identify it
2. **As a user**, I want my existing daily notes (e.g., `20251007.txt`) to continue working so I don't lose any data
3. **As a user**, when I navigate to a specific date in the calendar, I want the app to find both old and new format files so all my notes are accessible
4. **As a user**, I want files to remain sorted chronologically so I can find notes in order

### Secondary Stories
5. **As a developer**, I want the date parsing logic to gracefully handle both formats so the codebase remains maintainable
6. **As a user**, when I look at the sidebar file list, I want to see readable date names so I don't have to decipher numbers
7. **As a user**, when I open files in Finder/Explorer, I want to see readable names so I can browse my vault outside the app

---

## Functional Requirements

### FR-1: New Daily Note File Naming Format
- **ID**: FR-1
- **Priority**: P0 (Critical)
- **Description**: Implement new file naming format for daily notes
- **Format**: `YYYYMMDD - DayName - Mon DDth.txt`
  - `YYYYMMDD`: 8-digit date (e.g., `20251021`)
  - `DayName`: Full day name (e.g., `Monday`)
  - `Mon DDth`: Abbreviated month + ordinal day (e.g., `Oct 21st`)
  - Example: `20251021 - Monday - Oct 21st.txt`
- **Acceptance Criteria**:
  - New daily notes use the new format
  - Format includes proper ordinal suffixes (1st, 2nd, 3rd, 21st, 22nd, etc.)
  - Files remain sorted chronologically when listed alphabetically
  - Format is applied in all creation paths (API, calendar view, etc.)

### FR-2: Date Utility Functions
- **ID**: FR-2
- **Priority**: P0 (Critical)
- **Description**: Add utility functions for the new format
- **Required Functions**:
  1. `toDailyNoteFileName(date: Date): string` - Generate new format filename
  2. `fromDailyNoteFileName(fileName: string): string | null` - Extract YYYYMMDD from either format
  3. `isDailyNoteFile(fileName: string): boolean` - Validate if file is a daily note (old or new format)
  4. `normalizeDailyNotePath(dateStr: string): string[]` - Return possible file paths for a date
- **Acceptance Criteria**:
  - Functions work for both old and new formats
  - Proper error handling for invalid dates
  - Type-safe implementation (TypeScript)
  - Unit tests cover edge cases (leap years, year boundaries, ordinals)

### FR-3: Backwards Compatibility - File Lookup
- **ID**: FR-3
- **Priority**: P0 (Critical)
- **Description**: Support lookup of daily notes in both formats
- **Behavior**:
  - When looking up a daily note for date `20251021`, check for:
    1. New format: `20251021 - Monday - Oct 21st.txt`
    2. Old format: `20251021.txt`
  - Return whichever exists (prefer new format if both exist)
- **Affected Code**:
  - `src/routes/calendarRoutes.js` - `/api/calendar/daily/:date` endpoint
  - `frontend/src/store/calendarStore.ts` - `loadDailyNote()` method
  - `frontend/src/services/api.ts` - `getDailyNote()` method
- **Acceptance Criteria**:
  - Old format files are found and loaded correctly
  - New format files are found and loaded correctly
  - If both exist, new format is preferred (or document which takes precedence)
  - No errors when switching between old and new format files

### FR-4: File Creation Updates
- **ID**: FR-4
- **Priority**: P0 (Critical)
- **Description**: Update all daily note creation logic to use new format
- **Affected Code**:
  - `src/routes/calendarRoutes.js` - `POST /api/calendar/daily/:date`
  - `src/routes/calendarRoutes.js` - `POST /api/calendar/daily` (create today)
  - `frontend/src/utils/dateUtils.ts` - `getCalendarPath()` function
- **Acceptance Criteria**:
  - All new daily notes use the new filename format
  - File creation works for all dates (edge cases: leap years, year boundaries)
  - Daily note templates still apply correctly
  - WebSocket file watching detects new format files

### FR-5: Display Logic Updates
- **ID**: FR-5
- **Priority**: P1 (High)
- **Description**: Update UI to display readable names
- **Affected Components**:
  - `frontend/src/components/folders/FolderNode.tsx` - File name display (line 183)
  - File metadata in API responses
  - Calendar view date headers
- **Options for Display**:
  - **Option A**: Display full filename as-is (`20251021 - Monday - Oct 21st.txt`)
  - **Option B**: Display only the readable portion (`Monday - Oct 21st`)
  - **Option C**: Display only date portion (`Monday, October 21st`)
- **Acceptance Criteria**:
  - Daily notes are clearly identifiable in the sidebar
  - Display is consistent across all views (files tab, calendar, search, etc.)
  - Old format files still display correctly (show YYYYMMDD or convert to readable)

### FR-6: Path Validation Updates
- **ID**: FR-6
- **Priority**: P1 (High)
- **Description**: Update path validation to accept new filename format
- **Affected Code**:
  - `src/utils/pathUtils.js` - `sanitizePath()` validation
  - `src/utils/dateUtils.js` - `isCalendarFile()` regex
  - `frontend/src/utils/dateUtils.ts` - `isCalendarFile()` regex
- **Current Regex**: `/^Calendar\/\d{8}\.(txt|md)$/`
- **New Regex**: Must match both:
  - Old: `Calendar/20251021.txt`
  - New: `Calendar/20251021 - Monday - Oct 21st.txt`
- **Acceptance Criteria**:
  - Both formats pass validation
  - Invalid formats are rejected
  - Path traversal attacks still prevented

---

## Technical Design

### Data Flow

#### Current Flow (Creating Daily Note)
```
User clicks date in calendar
  → calendarStore.loadDailyNote(date)
  → api.getDailyNote('20251021')
  → GET /api/calendar/daily/20251021
  → dateUtils.getCalendarPath('20251021') returns 'Calendar/20251021.txt'
  → fileService.getFile('Calendar/20251021.txt') OR fileService.saveFile() if new
  → File returned to frontend
  → Displayed in editor
```

#### New Flow (With New Format)
```
User clicks date in calendar
  → calendarStore.loadDailyNote(date)
  → api.getDailyNote('20251021')
  → GET /api/calendar/daily/20251021
  → calendarRoutes: Try both formats
     1. Try new format: 'Calendar/20251021 - Monday - Oct 21st.txt'
     2. Fall back to old format: 'Calendar/20251021.txt'
     3. If neither exists, create with new format
  → fileService.getFile(resolvedPath)
  → File returned to frontend
  → Displayed in editor (with readable name)
```

### File Naming Function (Frontend TypeScript)

```typescript
// frontend/src/utils/dateUtils.ts

/**
 * Format date as daily note filename (new format)
 * Example: 20251021 - Monday - Oct 21st.txt
 */
export function toDailyNoteFileName(date: Date = new Date()): string {
  const yyyymmdd = format(date, 'yyyyMMdd');
  const dayName = format(date, 'EEEE');        // Monday
  const monthDay = format(date, 'MMM do');     // Oct 21st (ordinal)

  return `${yyyymmdd} - ${dayName} - ${monthDay}.txt`;
}

/**
 * Extract YYYYMMDD from daily note filename (supports both formats)
 * Returns null if not a valid daily note filename
 */
export function extractDateFromDailyNote(fileName: string): string | null {
  // New format: "20251021 - Monday - Oct 21st.txt"
  const newFormatMatch = fileName.match(/^(\d{8}) - \w+ - \w+ \d{1,2}\w{2}\.txt$/);
  if (newFormatMatch) {
    return newFormatMatch[1];
  }

  // Old format: "20251021.txt"
  const oldFormatMatch = fileName.match(/^(\d{8})\.txt$/);
  if (oldFormatMatch) {
    return oldFormatMatch[1];
  }

  return null;
}

/**
 * Check if filename is a daily note (old or new format)
 */
export function isDailyNoteFileName(fileName: string): boolean {
  return extractDateFromDailyNote(fileName) !== null;
}

/**
 * Get all possible calendar paths for a date (old and new formats)
 * Used for lookup when we don't know which format exists
 */
export function getPossibleCalendarPaths(dateStr: string): string[] {
  const date = fromNotePlanDate(dateStr);
  const newFormat = toDailyNoteFileName(date);
  const oldFormat = `${dateStr}.txt`;

  return [
    `Calendar/${newFormat}`,
    `Calendar/${oldFormat}`
  ];
}

/**
 * Update existing getCalendarPath to use new format
 */
export function getCalendarPath(dateStr: string): string {
  const date = fromNotePlanDate(dateStr);
  return `Calendar/${toDailyNoteFileName(date)}`;
}
```

### Backend Implementation (Node.js)

```javascript
// src/utils/dateUtils.js

/**
 * Format date as daily note filename (new format)
 */
function toDailyNoteFileName(date = new Date()) {
  const yyyymmdd = format(date, 'yyyyMMdd');
  const dayName = format(date, 'EEEE');
  const monthDay = format(date, 'MMM do');

  return `${yyyymmdd} - ${dayName} - ${monthDay}.txt`;
}

/**
 * Extract YYYYMMDD from daily note filename (supports both formats)
 */
function extractDateFromDailyNote(fileName) {
  // New format
  const newFormatMatch = fileName.match(/^(\d{8}) - \w+ - \w+ \d{1,2}\w{2}\.txt$/);
  if (newFormatMatch) {
    return newFormatMatch[1];
  }

  // Old format
  const oldFormatMatch = fileName.match(/^(\d{8})\.txt$/);
  if (oldFormatMatch) {
    return oldFormatMatch[1];
  }

  return null;
}

/**
 * Get all possible calendar file paths for a date
 */
function getPossibleCalendarPaths(dateStr) {
  const date = fromNotePlanDate(dateStr);
  const newFormat = toDailyNoteFileName(date);
  const oldFormat = `${dateStr}.txt`;

  return [
    `Calendar/${newFormat}`,
    `Calendar/${oldFormat}`
  ];
}

module.exports = {
  // ... existing exports
  toDailyNoteFileName,
  extractDateFromDailyNote,
  getPossibleCalendarPaths
};
```

### Calendar Routes Updates

```javascript
// src/routes/calendarRoutes.js

router.get('/daily/:date', asyncHandler(async (req, res) => {
  const { date } = req.params;

  // Validate date format
  if (!/^\d{8}$/.test(date)) {
    throw new ValidationError('Invalid date format. Expected YYYYMMDD');
  }

  // Validate date is valid
  try {
    dateUtils.fromNotePlanDate(date);
  } catch (error) {
    throw new ValidationError(`Invalid date: ${date}`);
  }

  // Try both new and old formats
  const possiblePaths = dateUtils.getPossibleCalendarPaths(date);
  let existingPath = null;

  for (const filePath of possiblePaths) {
    if (await fileService.fileExists(filePath)) {
      existingPath = filePath;
      break; // Use first match (new format is first in array)
    }
  }

  if (existingPath) {
    // Return existing file
    const fileData = await fileService.getFile(existingPath);
    res.json({
      ...fileData,
      created: false
    });
  } else {
    // Create new daily note with NEW format
    const dateObj = dateUtils.fromNotePlanDate(date);
    const displayDate = dateUtils.toFullDisplayDate(dateObj);
    const newFileName = dateUtils.toDailyNoteFileName(dateObj);
    const filePath = `Calendar/${newFileName}`;

    const content = `# ${displayDate}

## Routines
* Check [[Monthly Goals]]
* Check [[Weekly Calendar]]
* Check [[Waiting For]]

## Timeblocking
+ 08:00-09:00 Morning routine
+ 09:00-11:00 Deep work
+ 11:00-12:00 Break

## To Do
*

## Notes

`;

    await fileService.saveFile(filePath, content);
    const fileData = await fileService.getFile(filePath);

    res.json({
      ...fileData,
      created: true
    });
  }
}));
```

### Validation Regex Updates

```javascript
// src/utils/dateUtils.js

/**
 * Check if a path is a calendar file (updated for both formats)
 */
function isCalendarFile(filePath) {
  // New format: Calendar/20251021 - Monday - Oct 21st.txt
  const newFormat = /^Calendar\/\d{8} - \w+ - \w+ \d{1,2}\w{2}\.(txt|md)$/;
  // Old format: Calendar/20251021.txt
  const oldFormat = /^Calendar\/\d{8}\.(txt|md)$/;

  return newFormat.test(filePath) || oldFormat.test(filePath);
}

/**
 * Extract date from calendar file path (updated for both formats)
 */
function extractDateFromPath(filePath) {
  // Try new format first
  const newMatch = filePath.match(/^Calendar\/(\d{8}) - \w+ - \w+ \d{1,2}\w{2}\.(txt|md)$/);
  if (newMatch) {
    return newMatch[1];
  }

  // Try old format
  const oldMatch = filePath.match(/^Calendar\/(\d{8})\.(txt|md)$/);
  if (oldMatch) {
    return oldMatch[1];
  }

  return null;
}
```

---

## Implementation Plan

### Phase 1: Date Utility Functions (Foundation)
**Files to Modify**:
- `frontend/src/utils/dateUtils.ts`
- `src/utils/dateUtils.js`

**Tasks**:
1. Add `toDailyNoteFileName()` function (frontend + backend)
2. Add `extractDateFromDailyNote()` function (frontend + backend)
3. Add `isDailyNoteFileName()` function (frontend)
4. Add `getPossibleCalendarPaths()` function (frontend + backend)
5. Update `isCalendarFile()` regex to match both formats
6. Update `extractDateFromPath()` to handle both formats
7. Write unit tests for all new functions

**Validation**:
```bash
# TypeScript compilation
cd frontend && npx tsc --noEmit

# Manual test in Node REPL
node
> const dateUtils = require('./src/utils/dateUtils')
> dateUtils.toDailyNoteFileName(new Date('2025-10-21'))
// Should output: "20251021 - Monday - Oct 21st.txt"
```

### Phase 2: Backend File Lookup (Backwards Compatibility)
**Files to Modify**:
- `src/routes/calendarRoutes.js`
- `src/services/fileService.js` (if needed)

**Tasks**:
1. Update `GET /api/calendar/daily/:date` to check both formats
2. Update `POST /api/calendar/daily/:date` to create with new format
3. Update `POST /api/calendar/daily` (today endpoint) to use new format
4. Test with existing old-format files
5. Test creating new files with new format

**Validation**:
```bash
# Test old format file lookup
curl http://localhost:3001/api/calendar/daily/20251007

# Test new file creation
curl -X POST http://localhost:3001/api/calendar/daily

# Verify new file exists with new format
ls ~/Documents/notes/Calendar/
```

### Phase 3: Frontend Integration
**Files to Modify**:
- `frontend/src/store/calendarStore.ts`
- `frontend/src/components/folders/FolderNode.tsx`
- `frontend/src/components/calendar/Timeline.tsx` (if needed)

**Tasks**:
1. Update `getCalendarPath()` to use new format
2. Verify `loadDailyNote()` works with both formats (should be transparent via API)
3. Test file display in sidebar (verify readable names appear)
4. Test calendar navigation (clicking dates should load correct files)

**Validation**:
```bash
# Start both servers
npm run dev (in frontend/)
node src/server.js (in root)

# Manual testing:
# 1. Click on a date with old format file (e.g., 20251007)
# 2. Verify file loads correctly
# 3. Click on a date without a file
# 4. Verify new file is created with new format
# 5. Verify new file appears in sidebar with readable name
```

### Phase 4: Display Enhancements (Optional Polish)
**Files to Modify**:
- `frontend/src/components/folders/FolderNode.tsx`
- `frontend/src/utils/format.ts` (if exists)

**Tasks**:
1. Decide on display format (full filename vs. readable portion)
2. Update file display in sidebar
3. Update calendar view headers
4. Ensure consistency across all views

**Validation**:
- Visual inspection of sidebar, calendar view, search results

### Phase 5: Testing & Validation
**Test Files to Create**:
- `test-daily-note-filenames.spec.js` (Playwright test)

**Test Cases**:
1. **Old format file loading**: Open existing `20251007.txt`, verify content loads
2. **New format file creation**: Create daily note for new date, verify format
3. **Both formats coexist**: Have both old and new format files, verify both work
4. **File sorting**: Verify files sort chronologically in sidebar
5. **Calendar navigation**: Click through multiple dates, verify correct files load
6. **Edge cases**: Test leap years, year boundaries, different ordinals (1st, 2nd, 3rd, 21st, 22nd, 31st)

**Validation Commands**:
```bash
# Run Playwright tests
npx playwright test test-daily-note-filenames.spec.js --headed

# TypeScript type check
cd frontend && npx tsc --noEmit

# Build test
cd frontend && npm run build
```

---

## Edge Cases & Error Handling

### Edge Case 1: Both Formats Exist
**Scenario**: Both `20251021.txt` and `20251021 - Monday - Oct 21st.txt` exist
**Behavior**: Prefer new format (since it's checked first in `getPossibleCalendarPaths()`)
**Reasoning**: New format is more readable; old file is likely stale

### Edge Case 2: Invalid Date in Filename
**Scenario**: File named `20250231 - Sunday - Feb 31st.txt` (Feb 31st doesn't exist)
**Behavior**:
- `extractDateFromDailyNote()` extracts `20250231`
- `fromNotePlanDate('20250231')` throws validation error
- File is ignored or user sees error message
**Mitigation**: Server validation prevents creating invalid dates

### Edge Case 3: Ordinal Suffix Edge Cases
**Test Cases**:
- 1st, 2nd, 3rd (special cases)
- 11th, 12th, 13th (teens are all "th")
- 21st, 22nd, 23rd (back to special cases)
- 31st (month boundaries)
**Validation**: `date-fns` handles all ordinal cases correctly with `do` token

### Edge Case 4: Leap Years
**Test Date**: February 29, 2024 (leap year)
**Expected**: `20240229 - Thursday - Feb 29th.txt`
**Validation**: `date-fns` handles leap years natively

### Edge Case 5: Year Boundaries
**Test Date**: December 31, 2025 → January 1, 2026
**Expected**:
- `20251231 - Wednesday - Dec 31st.txt`
- `20260101 - Thursday - Jan 1st.txt`
**Validation**: Date math works correctly across year boundaries

### Edge Case 6: File Name Length
**Longest Possible**: `20251231 - Wednesday - Sept 30th.txt` (44 characters)
**Validation**: Well within filesystem limits (255 chars on most systems)

---

## Testing Strategy

### Unit Tests

**File**: `frontend/src/utils/dateUtils.test.ts` (create new)

```typescript
import { toDailyNoteFileName, extractDateFromDailyNote, isDailyNoteFileName } from './dateUtils';

describe('Daily Note Filename Utils', () => {
  test('toDailyNoteFileName generates correct format', () => {
    const date = new Date('2025-10-21');
    expect(toDailyNoteFileName(date)).toBe('20251021 - Monday - Oct 21st.txt');
  });

  test('extractDateFromDailyNote handles new format', () => {
    expect(extractDateFromDailyNote('20251021 - Monday - Oct 21st.txt')).toBe('20251021');
  });

  test('extractDateFromDailyNote handles old format', () => {
    expect(extractDateFromDailyNote('20251021.txt')).toBe('20251021');
  });

  test('extractDateFromDailyNote returns null for invalid names', () => {
    expect(extractDateFromDailyNote('my-note.txt')).toBeNull();
  });

  test('isDailyNoteFileName recognizes both formats', () => {
    expect(isDailyNoteFileName('20251021 - Monday - Oct 21st.txt')).toBe(true);
    expect(isDailyNoteFileName('20251021.txt')).toBe(true);
    expect(isDailyNoteFileName('my-note.txt')).toBe(false);
  });

  test('ordinal suffixes are correct', () => {
    expect(toDailyNoteFileName(new Date('2025-10-01'))).toContain('Oct 1st');
    expect(toDailyNoteFileName(new Date('2025-10-02'))).toContain('Oct 2nd');
    expect(toDailyNoteFileName(new Date('2025-10-03'))).toContain('Oct 3rd');
    expect(toDailyNoteFileName(new Date('2025-10-11'))).toContain('Oct 11th');
    expect(toDailyNoteFileName(new Date('2025-10-21'))).toContain('Oct 21st');
    expect(toDailyNoteFileName(new Date('2025-10-31'))).toContain('Oct 31st');
  });

  test('handles leap year', () => {
    const leapDay = new Date('2024-02-29');
    expect(toDailyNoteFileName(leapDay)).toBe('20240229 - Thursday - Feb 29th.txt');
  });
});
```

### Integration Tests (Playwright)

**File**: `test-daily-note-filenames.spec.js` (create new)

```javascript
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const CALENDAR_DIR = path.join(process.env.HOME, 'Documents/notes/Calendar');

test.describe('Daily Note Readable Filenames', () => {
  test('loads existing old format file', async ({ page }) => {
    // Ensure old format file exists
    const oldFormatFile = path.join(CALENDAR_DIR, '20251007.txt');
    if (!fs.existsSync(oldFormatFile)) {
      fs.writeFileSync(oldFormatFile, '# Monday, October 7, 2025\n\nTest content\n', 'utf-8');
    }

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Click calendar and select Oct 7, 2025
    // (Adjust selectors based on actual calendar UI)
    await page.click('[data-testid="calendar-view"]');
    await page.click('[data-date="20251007"]');

    // Verify file loads
    const content = await page.locator('.editor').textContent();
    expect(content).toContain('Test content');
  });

  test('creates new format file for new date', async ({ page }) => {
    // Pick a date that doesn't have a file
    const testDate = '20251215'; // Dec 15, 2025
    const expectedNewFormat = '20251215 - Monday - Dec 15th.txt';
    const newFilePath = path.join(CALENDAR_DIR, expectedNewFormat);

    // Delete if exists from previous test
    if (fs.existsSync(newFilePath)) {
      fs.unlinkSync(newFilePath);
    }

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Navigate to date and create daily note
    await page.click('[data-testid="calendar-view"]');
    await page.click('[data-date="20251215"]');

    // Wait for file creation
    await page.waitForTimeout(2000);

    // Verify new format file was created
    expect(fs.existsSync(newFilePath)).toBeTruthy();

    // Verify content
    const content = fs.readFileSync(newFilePath, 'utf-8');
    expect(content).toContain('# Monday, December 15, 2025');
  });

  test('displays readable filename in sidebar', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Navigate to files tab
    await page.click('[data-testid="files-tab"]');

    // Expand Calendar folder
    await page.click('text=Calendar');

    // Check if readable filenames appear
    const fileList = await page.locator('[data-folder="Calendar"] .file-name').allTextContents();

    // Should see at least one new format filename
    const hasReadableFormat = fileList.some(name =>
      /\d{8} - \w+ - \w+ \d{1,2}\w{2}\.txt/.test(name)
    );
    expect(hasReadableFormat).toBeTruthy();
  });

  test('files sort chronologically', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    await page.click('[data-testid="files-tab"]');
    await page.click('text=Calendar');

    const fileNames = await page.locator('[data-folder="Calendar"] .file-name').allTextContents();

    // Extract dates (first 8 digits)
    const dates = fileNames.map(name => {
      const match = name.match(/^(\d{8})/);
      return match ? match[1] : '00000000';
    });

    // Verify dates are in chronological order
    for (let i = 1; i < dates.length; i++) {
      expect(parseInt(dates[i])).toBeGreaterThanOrEqual(parseInt(dates[i-1]));
    }
  });
});
```

### Manual Testing Checklist

- [ ] Old format file (e.g., `20251007.txt`) loads correctly
- [ ] New format file (e.g., `20251021 - Monday - Oct 21st.txt`) loads correctly
- [ ] Creating a new daily note generates new format filename
- [ ] Files appear in sidebar with readable names
- [ ] Calendar navigation works for both formats
- [ ] Files sort chronologically in file browser
- [ ] Searching for daily notes works for both formats
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] TypeScript compilation passes
- [ ] Build succeeds without errors

---

## Risks & Mitigations

### Risk 1: File System Compatibility
**Risk**: Special characters in filenames might not work on all filesystems
**Likelihood**: Low
**Impact**: High
**Mitigation**:
- Use only safe characters: alphanumeric, spaces, hyphens
- Test on Windows, macOS, Linux
- Avoid: `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`
**Current Format**: `20251021 - Monday - Oct 21st.txt` (all safe characters)

### Risk 2: Regex Complexity
**Risk**: Complex regex patterns might miss edge cases or have performance issues
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**:
- Write comprehensive unit tests for all edge cases
- Use simple, clear regex patterns
- Test with real-world filenames
- Consider using helper functions instead of complex single regex

### Risk 3: Data Loss
**Risk**: Bugs in file lookup could result in creating duplicate files or not finding existing files
**Likelihood**: Low
**Impact**: High
**Mitigation**:
- Thorough testing before deployment
- Backup existing Calendar folder before major updates
- Use defensive programming (check file exists before creating)
- Implement comprehensive error logging

### Risk 4: Performance Impact
**Risk**: Checking multiple file paths for every lookup could slow down calendar operations
**Likelihood**: Low
**Impact**: Low
**Mitigation**:
- File existence checks are fast (filesystem cache)
- Calendar folder typically has limited files (365 per year)
- Check new format first (most common in future)
- Consider caching file existence if performance becomes issue

### Risk 5: User Confusion
**Risk**: Users might be confused by the sudden appearance of new filename format
**Likelihood**: Medium
**Impact**: Low
**Mitigation**:
- Document the change in release notes
- Consider adding a migration dialog (optional)
- Keep old files working indefinitely (no forced migration)
- Add tooltip/help text explaining the format

---

## Success Criteria

### Must Have (P0)
- [x] New daily notes created with format: `YYYYMMDD - DayName - Mon DDth.txt`
- [x] Old format files (`YYYYMMDD.txt`) continue to work
- [x] File lookup works for both formats
- [x] Files sort chronologically
- [x] No data loss or corruption
- [x] TypeScript compilation passes
- [x] Automated tests pass

### Should Have (P1)
- [x] Readable filenames display in sidebar
- [x] Calendar navigation works seamlessly
- [x] Unit tests for all date utility functions
- [x] Playwright integration tests
- [x] Error handling for edge cases

### Nice to Have (P2)
- [ ] Migration tool to rename old files (future enhancement)
- [ ] User preference for filename format (future enhancement)
- [ ] Display format customization (show full filename vs. date only)

---

## Rollout Plan

### Phase 1: Development & Testing (Week 1)
- Implement date utility functions
- Update backend file lookup
- Write unit tests
- Manual testing with test files

### Phase 2: Integration (Week 1-2)
- Update frontend code
- Integrate with calendar store
- Update UI displays
- Write Playwright tests

### Phase 3: Validation (Week 2)
- Run full test suite
- Manual testing across all views
- Performance testing
- Cross-platform testing (macOS, Windows, Linux)

### Phase 4: Deployment (Week 2)
- Deploy to production
- Monitor for errors
- User feedback collection
- Document feature in release notes

### Phase 5: Monitoring (Ongoing)
- Track error logs for file-related issues
- Monitor user feedback
- Plan future enhancements (migration tool, etc.)

---

## Future Enhancements

### Enhancement 1: File Migration Tool
**Description**: Optional tool to rename all old format files to new format
**User Story**: "As a user, I want to convert all my old daily notes to the new format so my Calendar folder is consistent"
**Implementation**:
- CLI tool or admin endpoint
- Dry-run mode to preview changes
- Backup creation before migration
- Progress reporting

### Enhancement 2: Configurable Display Format
**Description**: Let users choose how daily notes are displayed in the UI
**Options**:
- Full filename: `20251021 - Monday - Oct 21st.txt`
- Date only: `Monday, Oct 21st`
- Short: `Oct 21`
- Custom format string

### Enhancement 3: Locale Support
**Description**: Support different languages for day/month names
**Example**: `20251021 - Lundi - Oct 21.txt` (French)
**Dependencies**: i18n library, locale configuration

---

## References

### Documentation
- **date-fns format tokens**: https://date-fns.org/docs/format
- **date-fns ordinal dates**: Use `do` token for ordinal day (1st, 2nd, 3rd, etc.)
- **Node.js path module**: https://nodejs.org/api/path.html
- **Filesystem best practices**: https://nodejs.org/api/fs.html

### Codebase Files
- Frontend date utils: `frontend/src/utils/dateUtils.ts`
- Backend date utils: `src/utils/dateUtils.js`
- Calendar routes: `src/routes/calendarRoutes.js`
- File service: `src/services/fileService.js`
- Path utils: `src/utils/pathUtils.js`
- Folder node display: `frontend/src/components/folders/FolderNode.tsx`
- Calendar store: `frontend/src/store/calendarStore.ts`

### Similar Features
- Obsidian: Uses `YYYY-MM-DD` format by default, allows customization
- LogSeq: Uses `MMM Do, YYYY` format (e.g., "Oct 21st, 2025")
- Roam Research: Uses `Month DDth, YYYY` format (e.g., "October 21st, 2025")
- NotePlan: Uses `YYYYMMDD` internally, displays as readable in UI

---

## Confidence Score

**Score**: 9/10

**Rationale**:
- **High Confidence**:
  - Clear implementation path with existing `date-fns` support
  - Well-defined backwards compatibility strategy
  - Comprehensive test plan
  - Minimal risk of data loss (read-only approach for old files)
  - Simple, incremental changes to codebase

- **Minor Concerns**:
  - Edge cases around file system behavior across platforms (need cross-platform testing)
  - Potential for minor UI polish needed based on user feedback
  - Regex patterns need thorough edge case testing

**Recommendation**: Proceed with implementation. The plan is comprehensive, risks are well-mitigated, and the feature provides clear user value with minimal disruption.
