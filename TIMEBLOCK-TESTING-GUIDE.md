# TimeBlock Feature Testing Guide

## Prerequisites
- Frontend dev server running on http://localhost:5173
- Backend server running on http://localhost:3001
- Today's daily note exists at `~/Documents/notes/Calendar/YYYYMMDD.txt` with timeblocks

## Setup Test Environment

1. Create or edit today's daily note:
```bash
# Get today's date in YYYYMMDD format
TODAY=$(date +%Y%m%d)

# Create test file
cat > ~/Documents/notes/Calendar/${TODAY}.txt << 'EOF'
# ${TODAY}

## Tasks
- [ ] Task 1: Morning standup
- [ ] Task 2: Code review
- [ ] Task 3: Team meeting

## Timeblocking
+ 09:00-10:00 Morning standup
+ 14:00-15:30 Afternoon meeting

## Notes
EOF
```

2. Open http://localhost:5173 in your browser
3. Open Browser DevTools Console (F12 → Console tab)

## Test 1: Timeblocks Render on Timeline

**Steps:**
1. Navigate to Calendar tab
2. Look at the timeline on the right side

**Expected Result:**
- ✅ You should see two blue timeblocks:
  - "Morning standup" at 9:00 AM
  - "Afternoon meeting" at 2:00 PM
- ✅ Timeblocks should be positioned vertically based on their time
- ✅ Each hour slot should be 60px tall

**Debug if fails:**
- Check browser console for errors
- Verify file exists: `ls ~/Documents/notes/Calendar/$(date +%Y%m%d).txt`
- Check API response: `curl http://localhost:3001/api/calendar/timeblocks/$(date +%Y%m%d)`

## Test 2: Edit Existing Timeblock

**Steps:**
1. Navigate to Calendar tab
2. **Click once** on the "Morning standup" timeblock (blue box at 9:00 AM)
3. Wait for edit dialog to appear
4. Change start time from 09:00 to 09:30
5. Click "Save Changes"
6. Wait 2 seconds

**Expected Result:**
- ✅ Edit dialog appears with current time values
- ✅ After saving, timeblock moves to 9:30 AM position
- ✅ File is updated: `cat ~/Documents/notes/Calendar/$(date +%Y%m%d).txt | grep "09:30"`
- ✅ Console shows: "✅ Timeblock updated successfully"

**Debug if fails:**
- Check console for errors
- Verify dialog appears (if not, click detection may be broken)
- Check if save button is clicked (watch Network tab for API call)

## Test 3: Drag Timeblock to Reposition

**Steps:**
1. Navigate to Calendar tab
2. **Click and hold** on the "Afternoon meeting" timeblock
3. **Drag it UP** approximately 2 hours (120 pixels)
4. **Release the mouse**
5. Wait 2 seconds

**Expected Result:**
- ✅ While dragging, timeblock becomes semi-transparent (opacity 0.5)
- ✅ Cursor changes to "grabbing"
- ✅ No blue overlay appears (overlay only shows for task drops)
- ✅ After release, timeblock snaps to nearest 15-minute interval
- ✅ Timeblock moves to new time (around 12:00 PM)
- ✅ File is updated with new time
- ✅ Console shows:
   ```
   === DRAG END ===
   Updating timeblock: { oldStart: "14:00", newStart: "12:00", ...}
   ✅ Timeblock updated successfully
   ```

**Debug if fails:**
- Check if console shows "=== DRAG END ===" (if not, drag isn't completing)
- Check if `activeType: "timeblock"` in console (verifies drag data)
- Check if `overType: "timeline"` in console (verifies drop target)
- Verify delta.y is not 0 (should be around 120)

## Test 4: Drag Task from Tasks Tab to Timeline

**Steps:**
1. Navigate to Tasks tab
2. Find "Task 1: Morning standup"
3. **Click and hold** the drag handle (6 dots icon) on the left
4. **Drag to Calendar tab** (tab should auto-switch)
5. **Drop on timeline** at 11:00 AM position
6. In the dialog that appears:
   - Set start time: 11:00
   - Click "1 hour" duration
   - Click "Create Time Block"

**Expected Result:**
- ✅ Blue overlay appears during drag: "Drop to create time block"
- ✅ Dialog appears with time selection
- ✅ After creating, new timeblock appears at 11:00 AM
- ✅ Daily note file contains the new timeblock
- ✅ Task reference is created in daily note

**Debug if fails:**
- Check if drag handle exists (might need to add one)
- Verify task has `data-noteplan-task` attribute
- Check console for drag/drop events

## Test 5: Drag Task from Kanban to Timeline

**Steps:**
1. Navigate to Kanban tab
2. Find a task card in any column
3. **Click and hold** the task card
4. **Drag to Calendar tab** (wait for auto-switch)
5. **Drop on timeline** at a specific time
6. Fill in time block dialog
7. Click "Create Time Block"

**Expected Result:**
- ✅ Same as Test 4
- ✅ Task is scheduled on timeline

## Test 6: Delete Timeblock

**Steps:**
1. Navigate to Calendar tab
2. **Click** on any timeblock
3. In edit dialog, click "Delete" button
4. Confirm deletion in alert dialog

**Expected Result:**
- ✅ Timeblock disappears from timeline
- ✅ Timeblock line removed from file

## Common Issues & Fixes

### Issue: Timeblocks don't render
**Cause:** Daily note not loaded
**Fix:** Check Timeline component loads daily note in useEffect

### Issue: Click opens edit but drag doesn't work
**Cause:** Drag activation constraint too strict
**Fix:** Check PointerSensor activation constraint in DragDropProvider

### Issue: Drag works but doesn't save
**Causes:**
1. currentFile is null → Timeline not loading daily note properly
2. updateTimeBlock function failing → Check calendarStore
3. File path mismatch → Check if file is in Calendar/ directory

### Issue: Blue overlay covers timeline during drag
**Cause:** Overlay showing for timeblock drags (should only show for task drags)
**Fix:** Check Timeline.tsx: `{isOver && isDraggingTask && !isDraggingTimeBlock && (...)}`

## Console Commands for Debugging

```javascript
// Check if timeblocks loaded
useCalendarStore.getState().timeBlocks

// Check current file
useFileStore.getState().currentFile

// Manually trigger timeblock load
useCalendarStore.getState().refreshTimeBlocks()

// Check drag context
// (paste this while dragging)
useDndContext().active
```

## File Verification Commands

```bash
# Check today's file content
cat ~/Documents/notes/Calendar/$(date +%Y%m%d).txt

# Watch file for changes
watch -n 1 "cat ~/Documents/notes/Calendar/$(date +%Y%m%d).txt"

# Check API endpoint
curl http://localhost:3001/api/calendar/timeblocks/$(date +%Y%m%d) | jq '.'
```

## Success Criteria

All tests pass ✅:
- [x] Timeblocks render on timeline
- [x] Click to edit works
- [ ] Drag to reposition works
- [ ] Drag task from Tasks tab works
- [ ] Drag task from Kanban works
- [ ] Delete timeblock works

Current Status: **2/6 tests passing** (as of implementation)

Please test manually and report which tests pass/fail with specific error messages or console output.
