# Quick Capture Feature - User Guide

**Status:** ✅ IMPLEMENTED
**Date:** 2025-10-22
**Keyboard Shortcut:** `Cmd+Shift+N` (Mac) / `Ctrl+Shift+N` (Windows)

---

## 📥 What is Quick Capture?

Quick Capture is an **instant inbox** for capturing tasks from anywhere in the app without breaking your flow. It implements the GTD (Getting Things Done) methodology's "ubiquitous capture" principle.

### ✨ Key Features

- **Global keyboard shortcut** - Works from any view
- **Priority selection** - Tag tasks as P1, P2, P3, or P4
- **Instant save** - Tasks append to `Inbox.txt`
- **Toast confirmation** - Visual feedback when saved
- **Zero navigation** - No need to open files or switch views

---

## 🚀 How to Use

### Method 1: Keyboard Shortcut (Recommended)

1. **Press `Cmd+Shift+N`** (Mac) or **`Ctrl+Shift+N`** (Windows)
2. **Type your task**
3. **(Optional) Select priority** - Click P1, P2, P3, or P4
4. **Press `Enter`** or click "Add to Inbox"
5. **Done!** - Task is added to `~/Documents/notes/Notes/Inbox.txt`

### Method 2: ESC to Cancel

- Press `ESC` to close without saving
- Input is cleared automatically

---

## 📝 Task Format

Tasks are saved in GitHub Flavored Markdown format:

```markdown
# Inbox

- [ ] Your task here
- [ ] Another task #p1
- [ ] Task with priority 3 #p3
```

### Priority Tags

| Priority | Tag | Color | Use Case |
|----------|-----|-------|----------|
| **P1** | `#p1` | 🔴 Red | Urgent & Important |
| **P2** | `#p2` | 🟠 Orange | Important |
| **P3** | `#p3` | 🟡 Yellow | Normal (default) |
| **P4** | `#p4` | 🔵 Blue | Low priority |

---

## 🔄 Workflow Integration

Quick Capture fits into a complete GTD workflow:

```
1. CAPTURE → Quick capture (Cmd+Shift+N) → tasks go to Inbox
              ↓
2. ORGANIZE → Open Inbox.txt → Drag tasks to proper files
              ↓
3. CATEGORIZE → Add status tags (#todo, #inprogress, #done)
              ↓
4. SCHEDULE → Drag from Tasks tab to Calendar dates
              ↓
5. TIME BLOCK → Drag to timeline slots for focused work
              ↓
6. EXECUTE → Check off tasks, see progress across all views
```

### Processing Your Inbox

It's recommended to **review your inbox daily or weekly**:

1. Open `Inbox.txt` from the sidebar
2. For each task:
   - **Organize:** Move to appropriate project file
   - **Schedule:** Drag to calendar if time-sensitive
   - **Delegate:** Add to shared notes
   - **Delete:** If no longer relevant
3. Keep inbox empty (or near-empty)

---

## 🎯 Best Practices

### DO ✅

- **Capture immediately** - Don't let thoughts escape
- **Keep it brief** - One sentence per task
- **Use priorities sparingly** - P1 should be rare
- **Process inbox regularly** - Daily or weekly review
- **Don't overthink** - Just dump and organize later

### DON'T ❌

- **Don't organize while capturing** - That's for later
- **Don't skip the inbox** - Use it for ALL quick thoughts
- **Don't let inbox grow** - Process it regularly
- **Don't add too much detail** - Inbox is for capture, not planning

---

## 🛠️ Technical Details

### File Location

Tasks are appended to:
```
~/Documents/notes/Notes/Inbox.txt
```

If the file doesn't exist, it will be created automatically with:
```markdown
# Inbox

```

### Implementation

- **Component:** `frontend/src/components/quickCapture/QuickCapture.tsx`
- **Integration:** `frontend/src/App.tsx` (global component)
- **Keyboard Hook:** `react-hotkeys-hook` library
- **Toast System:** `react-hot-toast` library
- **API Call:** Uses existing `api.getFile()` and `api.saveFile()`

### Keyboard Shortcut

The shortcut is registered globally and works from:
- ✅ Editor view
- ✅ Tasks tab
- ✅ Kanban board
- ✅ Calendar view
- ✅ All Tasks tab
- ✅ Even when typing in other inputs

---

## 🧪 Testing Quick Capture

1. **Open the app** at http://localhost:5173

2. **Press `Cmd+Shift+N`** (or `Ctrl+Shift+N`)
   - Modal should appear instantly
   - Input should be auto-focused

3. **Type a task:** "Test quick capture"

4. **Select priority:** Click "P2" button

5. **Press Enter**
   - Modal should close
   - Toast notification: "✅ Added to inbox"

6. **Verify file was updated:**
   ```bash
   cat ~/Documents/notes/Notes/Inbox.txt
   ```
   Should show:
   ```markdown
   # Inbox

   - [ ] Test quick capture #p2
   ```

7. **Test from different views:**
   - Go to Tasks tab → Try shortcut
   - Go to Kanban → Try shortcut
   - Go to Calendar → Try shortcut
   - All should work!

8. **Test ESC key:**
   - Open with `Cmd+Shift+N`
   - Type something
   - Press `ESC`
   - Modal should close, input cleared

9. **Test multiple tasks:**
   - Add 3-4 tasks rapidly
   - Check Inbox.txt - all should be there

10. **View in Multi-File mode:**
    - Go to Tasks tab
    - Click "Multi-File" button
    - Expand "Inbox.txt"
    - Your tasks should be visible!

---

## 🎨 UI Components

### Modal Layout

```
┌─────────────────────────────────────────┐
│ Quick Capture                        × │  ← Header
│ Add a task to your inbox               │
├─────────────────────────────────────────┤
│ [What needs to be done?____________] │  ← Input
├─────────────────────────────────────────┤
│ Priority: [P1] [P2] [P3] [P4]    Clear │  ← Priority
├─────────────────────────────────────────┤
│ Enter to add • ESC to cancel           │  ← Footer
│                     [Cancel] [Add...] │
└─────────────────────────────────────────┘
```

### Dark Mode Support

- ✅ Full dark mode support
- ✅ Proper contrast in both themes
- ✅ Themed priority buttons

---

## 🐛 Troubleshooting

### Shortcut not working?

- **Check:** Another app may be using `Cmd+Shift+N`
- **Try:** Close other apps and test again
- **Alternative:** Manually open `Inbox.txt` and add tasks

### Toast not showing?

- **Check:** Browser console for errors
- **Verify:** `react-hot-toast` is installed
- **Try:** Refresh page (Cmd+Shift+R)

### Tasks not saving?

- **Check:** Backend server is running (`node src/server.js`)
- **Check:** File permissions on `~/Documents/notes/Notes/`
- **Verify:** Open DevTools → Network tab → See if POST request succeeds

### Inbox.txt doesn't exist?

- It will be **created automatically** on first use
- If manually created, ensure format:
  ```markdown
  # Inbox

  ```
  (Header + blank line)

---

## 🚀 Future Enhancements

Potential future improvements:

- [ ] **Custom inbox location** - Choose different file
- [ ] **Templates** - Pre-fill with templates (e.g., "Call [person]")
- [ ] **Due dates** - Add date picker for scheduling
- [ ] **Tags** - Quick tag selection (#work, #personal)
- [ ] **History** - Show recently added tasks
- [ ] **Keyboard navigation** - Arrow keys to select priority
- [ ] **Mobile support** - Touch-friendly UI
- [ ] **Sync indicator** - Show when saving/syncing

---

## 📊 Comparison with NotePlan

| Feature | Our Implementation | NotePlan |
|---------|-------------------|----------|
| Keyboard Shortcut | ✅ `Cmd+Shift+N` | ✅ `Cmd+Shift+N` |
| Priority Selection | ✅ P1-P4 | ✅ P1-P4 |
| Instant Save | ✅ Yes | ✅ Yes |
| Toast Notification | ✅ Yes | ❌ No |
| Dark Mode | ✅ Yes | ✅ Yes |
| Custom Inbox | ❌ Not yet | ✅ Yes |
| Tags | ❌ Not yet | ✅ Yes |
| Due Dates | ❌ Not yet | ✅ Yes |

---

## 🎓 GTD Philosophy

Quick Capture implements David Allen's GTD principle:

> **"Your mind is for having ideas, not holding them."**

By providing instant, frictionless capture:
- **Reduces mental load** - Get thoughts out of your head
- **Prevents loss** - Never lose a fleeting idea
- **Enables flow** - Don't break focus to organize
- **Defers decisions** - Capture now, organize later

---

## ✅ Success Criteria

All implemented:

- ✅ Global keyboard shortcut works from any view
- ✅ Modal appears instantly with auto-focused input
- ✅ Priority selection (optional)
- ✅ Tasks append to Inbox.txt
- ✅ Toast confirmation shown
- ✅ ESC to cancel
- ✅ Enter to submit
- ✅ Dark mode support
- ✅ TypeScript compilation passes
- ✅ No breaking changes

---

**Enjoy your new productivity superpower!** 🚀

Press `Cmd+Shift+N` and start capturing! 📝
