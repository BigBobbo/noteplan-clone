# Manual Test Instructions - Task Description Visibility

## Test Setup
1. Ensure both servers are running:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`

2. Test file location:
   - `/Users/robertocallaghan/Documents/notes/Notes/task-description-demo.txt`

## Test Cases

### ✅ Test 1: Visual Indicators in Editor
1. Open the app at `http://localhost:5173`
2. Click on "task-description-demo" in the sidebar
3. **Verify:**
   - Tasks WITHOUT descriptions (first 3 tasks) have NO 📝 icon
   - Tasks WITH descriptions show the 📝 icon
   - Hovering over 📝 shows a tooltip with preview text

### ✅ Test 2: Tasks Tab - Newline Preservation
1. Click on the "Tasks" tab
2. Look for tasks with expand buttons (blue chevron)
3. Click to expand a task with multi-line description
4. **Verify:**
   - Multiple paragraphs are displayed (not all on one line)
   - Bullet lists render as proper lists
   - Bold/italic formatting is preserved
   - Blank lines create paragraph breaks

### ✅ Test 3: Save and Reload
1. In the editor, make a small change (add a space and delete it)
2. Wait 2 seconds for auto-save
3. Reload the browser (Cmd+R or F5)
4. Open the same file again
5. **Verify:**
   - All 📝 indicators are still present
   - Task descriptions are preserved
   - No data loss

### ✅ Test 4: Add New Task with Description
1. In the editor, add a new task:
   ```
   - [ ] New test task
     This is the description for my new task.
     It has multiple lines.
   ```
2. **Verify:**
   - The new task immediately shows the 📝 icon
   - The tooltip shows the preview
   - It appears in the Tasks tab with expandable details

## Expected Results

### In Editor View:
- Tasks with descriptions show 📝 emoji
- Emoji has tooltip on hover
- Clear visual distinction

### In Tasks Tab:
- Descriptions preserve all formatting
- Multi-line text displays correctly
- Markdown formatting renders properly

### Console Logs (if Debug Mode):
You should see logs like:
- `[parseTaskDetails] Task at line X has details:`
- `[parseTaskDetails] Has newlines: true`
- `[parseNotePlanMarkdown] Found task: ... hasDetails: true`

## Success Criteria
✅ All tasks with descriptions show visual indicators
✅ Newlines and formatting are preserved
✅ Changes persist across saves and reloads
✅ No performance issues or lag