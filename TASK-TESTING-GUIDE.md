# Task Testing Guide

## What I Fixed

1. **Removed TipTap TaskList/TaskItem extensions** - These were creating GitHub-style checkboxes (`+ [ ]`) that conflicted with our NotePlan-style tasks (`* Task`)

2. **Fixed bullet marker** - Changed from `+` to `*` in markdown config

3. **Added debugging** - Console logs to see what's being parsed

4. **Created test file** - `Task-Test.txt` with working examples

## How to Test

### Step 1: Refresh the Browser
Refresh the page at **http://localhost:5174** to load the updated editor

### Step 2: Open the Test File
1. Click on **"Task-Test.txt"** in the Files sidebar
2. This file has pre-made tasks that should work

### Step 3: Check the Tasks Tab
1. Click on the **"Tasks"** tab in the left sidebar (second tab)
2. You should see:
   - Tasks with checkboxes
   - Priority badges (P1=red, P2=orange, P3=yellow, P4=blue)
   - Nested tasks with expand/collapse chevrons
   - Task counts in the filters

### Step 4: Check Browser Console
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. You should see logs like:
   ```
   Parsing tasks from file: Notes/Task-Test.txt
   File content length: 2344
   Parsed tasks: 15 [Array of tasks]
   ```

### Step 5: Try Creating a New Task
In the editor, type on a new line:
```
* My new task #p1 >2025-10-15
```

Then check:
1. Console logs show the task being parsed
2. Tasks tab updates with the new task
3. Priority badge appears
4. Date shows up

## Task Format

### Basic Task
```
* Task description
```

### Task with Priority
```
* Important task #p1
* High priority #p2
* Medium priority #p3
* Low priority #p4
```

### Task with Date
```
* Task with deadline >2025-10-15
```

### Completed Task
```
* [x] Done task
```

### Nested Tasks (4 spaces = 1 level)
```
* Parent task #p1
    * Child task #p2
        * Nested child #p3
```

### Complex Task
```
* Deploy feature #p1 >2025-10-15 @john #frontend
```

## Troubleshooting

### Tasks Not Showing Up

**Check Console Logs:**
- Look for "Parsing tasks from file"
- Check if tasks array is empty or populated
- If empty, the regex might not be matching

**Check File Content:**
- Make sure lines start with `* ` (asterisk + space)
- No extra characters before the asterisk
- Proper indentation (4 spaces per level)

### Tasks Showing Wrong Format

**If you see `+ [ ]` in the file:**
- This is the old format from TipTap TaskList
- Manually change to `* Task name`
- Save the file

**If you see escaped characters (`\*` or `&gt;`):**
- The editor is escaping markdown
- Try typing fresh in the editor after refresh

### Priority Badges Not Showing

**Check tag format:**
- Must be exactly `#p1`, `#p2`, `#p3`, or `#p4`
- Lowercase only
- No space after `#`

### Nested Tasks Not Working

**Check indentation:**
- Must use exactly 4 spaces per level
- Or 1 tab per level
- Mix of tabs and spaces might break it

## Expected Behavior

### In Editor
- Type `* Task name` and it appears as a bullet point
- Typing continues normally
- No automatic checkbox creation

### In Tasks Tab
- All `* Task` lines appear with checkboxes
- Click checkbox to mark complete
- Expandable chevrons for tasks with children
- Priority badges appear automatically
- Date badges appear next to tasks with dates
- Filter buttons work (All, Active, Completed, Today, Scheduled)

## Debug Checklist

If tasks still don't work:

1. ✅ Refresh browser (Cmd+R or F5)
2. ✅ Open Task-Test.txt file
3. ✅ Check console logs for parsing messages
4. ✅ Check Tasks tab in sidebar
5. ✅ Try typing a new task in editor
6. ✅ Check if `*` appears (not `+`)
7. ✅ Save and check console for "Editor saving markdown"

## What Should Work Now

- ✅ Tasks parse from files with `* ` prefix
- ✅ Priority badges (P1-P4) display correctly
- ✅ Nested tasks with indentation work
- ✅ Expand/collapse for parent tasks
- ✅ All task metadata (dates, tags, mentions)
- ✅ Task filters work
- ✅ Checkbox toggles work

## What Won't Work Yet

- ❌ Creating tasks by clicking buttons in UI
- ❌ Drag-and-drop task reordering
- ❌ Context menu for task actions
- ❌ Date picker for scheduling

---

**Next Steps:** If tasks still aren't showing up, paste the console logs and I'll debug further!
