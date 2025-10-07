# Phase 3 Validation Checklist

**Status:** ✅ Ready for Testing
**Backend Server:** http://localhost:3001 ✅ Running
**Frontend Server:** http://localhost:5173 ✅ Running

---

## Quick Start Testing

### 1. Access the Application
Open your browser and navigate to: **http://localhost:5173**

### 2. Initial View
You should see:
- ✅ Sidebar on the left with folder structure
- ✅ DateNavigator at the top showing today's date
- ✅ Main editor area in the center
- ✅ Timeline pane on the right (if enabled)

### 3. Date Navigation Tests

#### Test: Navigate to Today
1. Click the **"Today"** button in DateNavigator
2. Or press **Cmd/Ctrl + T**
3. **Expected:** Today's daily note opens/creates

#### Test: Previous/Next Day
1. Click the **left arrow** (←) to go to previous day
2. Or press **Cmd/Ctrl + Shift + [**
3. Click the **right arrow** (→) to go to next day
4. Or press **Cmd/Ctrl + Shift + ]**
5. **Expected:** Date changes, new note loads/creates

#### Test: Date Display
1. Check the date format in DateNavigator
2. **Expected:** "Monday, October 7, 2025" format for day view

### 4. Daily Note Tests

#### Test: Auto-Creation
1. Navigate to a new date (one that doesn't have a note)
2. **Expected:** Note automatically creates with template:
   ```markdown
   # [Day, Date]

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
   ```

#### Test: Note Persistence
1. Edit the daily note content
2. Wait for auto-save (2 seconds)
3. Navigate to a different date
4. Navigate back to the original date
5. **Expected:** Changes are saved and persist

### 5. Timeline Tests

#### Test: Timeline Visibility
1. Timeline should be visible by default
2. Press **Cmd/Ctrl + L** to toggle timeline
3. **Expected:** Timeline pane appears/disappears

#### Test: Time Blocks Display
1. Open today's note (or any note with time blocks)
2. Look at the Timeline pane on the right
3. **Expected:**
   - 24-hour vertical timeline with hour labels
   - Blue blocks for each time block in the note
   - Red line indicating current time
   - Time blocks show description and time range

#### Test: Time Block Parsing
1. Edit the note and add a new time block:
   ```
   + 14:00-15:30 Team meeting
   ```
2. Wait for auto-save
3. **Expected:** New blue block appears in timeline at 2 PM

#### Test: Timeline Scroll
1. Look at the timeline
2. **Expected:** Timeline should auto-scroll to current time

### 6. Keyboard Shortcut Tests

#### Test All Shortcuts
- **Cmd/Ctrl + T** → Go to today
- **Cmd/Ctrl + Shift + [** → Previous day
- **Cmd/Ctrl + Shift + ]** → Next day
- **Cmd/Ctrl + L** → Toggle timeline
- **Cmd/Ctrl + N** → New note (existing)
- **Cmd/Ctrl + S** → Save (existing)
- **Cmd/Ctrl + B** → Toggle sidebar (existing)

### 7. Calendar Integration Tests

#### Test: Folder Structure
1. Look at the sidebar
2. **Expected:**
   - "Notes" folder
   - "Calendar" folder
   - Daily notes appear under Calendar folder

#### Test: File Naming
1. Create notes for different dates
2. Check the file paths in sidebar
3. **Expected:** Files named as YYYYMMDD.txt (e.g., 20251007.txt)

---

## Backend API Validation

Run these curl commands to verify backend functionality:

### Test: Health Check
```bash
curl http://localhost:3001/health
```
**Expected:** Status "ok" with config info

### Test: Daily Note Creation
```bash
curl http://localhost:3001/api/calendar/daily/20251010
```
**Expected:** JSON response with note content and metadata

### Test: Time Blocks Extraction
```bash
curl http://localhost:3001/api/calendar/timeblocks/20251007
```
**Expected:** JSON with array of time blocks, conflicts, and total duration

### Test: Date Range Query
```bash
curl "http://localhost:3001/api/calendar/range?start=20251001&end=20251010"
```
**Expected:** JSON with array of 10 dates, showing which exist

---

## Known Issues & Workarounds

### Issue: Timeline Not Updating
**Symptom:** Time blocks don't appear in timeline after editing
**Workaround:** Navigate to another date and back

### Issue: Note Not Auto-Creating
**Symptom:** Blank screen when navigating to new date
**Workaround:** Check browser console for errors; refresh page

### Issue: Timeline Too Wide
**Symptom:** Timeline takes up too much space
**Workaround:** Press Cmd+L to hide timeline

---

## What to Look For

### ✅ Good Signs
- Date navigation is smooth
- Notes auto-create without errors
- Timeline shows blocks in correct positions
- Current time indicator (red line) is visible
- Keyboard shortcuts work
- Changes persist after navigation

### ❌ Red Flags
- Console errors in browser
- API 404 or 500 errors
- Timeline blocks overlapping incorrectly
- Time blocks not parsing from editor
- Sidebar not showing Calendar folder
- Backend connection errors

---

## File Locations

### Backend Logs
```bash
tail -f /Users/robertocallaghan/Documents/claude/noteapp/backend.log
```

### Frontend Logs
```bash
tail -f /Users/robertocallaghan/Documents/claude/noteapp/frontend.log
```

### Data Directory
```bash
ls -la /Users/robertocallaghan/Documents/notes/Calendar/
```

---

## Troubleshooting

### Backend Won't Start
```bash
# Kill existing processes
pkill -f "node src/server.js"

# Start fresh
cd /Users/robertocallaghan/Documents/claude/noteapp
npm start
```

### Frontend Won't Start
```bash
# Navigate to frontend
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend

# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### Clear All Daily Notes (For Clean Testing)
```bash
rm /Users/robertocallaghan/Documents/notes/Calendar/*.txt
```

---

## Success Criteria

Phase 3 is validated if:
- ✅ Date navigation works (previous, next, today)
- ✅ Daily notes auto-create with correct template
- ✅ Timeline displays time blocks
- ✅ Time blocks parse from markdown correctly
- ✅ Keyboard shortcuts respond
- ✅ Backend APIs return expected data
- ✅ Changes persist across navigation
- ✅ No console errors under normal usage

---

## Next Actions

After validation:
1. Fix any critical bugs found
2. Test on multiple dates to ensure consistency
3. Create sample notes with various time blocks
4. Test conflict detection with overlapping blocks
5. Proceed to Phase 4 planning

---

**Last Updated:** October 7, 2025
**Validated By:** [Pending User Testing]
