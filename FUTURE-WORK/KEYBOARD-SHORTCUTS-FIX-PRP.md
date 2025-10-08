# Keyboard Shortcuts Fix - Product Requirements & Planning

**Priority:** Medium
**Status:** Not Started
**Estimated Time:** 2-4 hours

---

## Problem Statement

Keyboard shortcuts are not functioning in the application despite being implemented. Users report that pressing shortcuts like Cmd+K, Cmd+S, Cmd+N, etc. do not trigger their associated actions.

---

## Important: Existing Implementation

⚠️ **CRITICAL:** Keyboard shortcuts are already implemented in the codebase. Do NOT rewrite from scratch. Debug and fix the existing implementation.

### Existing Files to Review:

1. **`frontend/src/hooks/useKeyboard.ts`** (80 lines)
   - Main keyboard event handler
   - Implements all global shortcuts (Cmd+K, Cmd+N, Cmd+S, etc.)
   - Uses custom `matchesShortcut()` utility
   - Connected to UI store actions

2. **`frontend/src/utils/shortcuts.ts`** (155 lines)
   - Keyboard shortcut definitions
   - `matchesShortcut()` function for event matching
   - `formatShortcut()` for display
   - Pre-defined shortcut configurations:
     - `GLOBAL_SHORTCUTS` - Cmd+K, Cmd+N, Cmd+S, Cmd+B, Cmd+Shift+D
     - `EDITOR_SHORTCUTS` - Cmd+B, Cmd+I, Cmd+Shift+K
     - `CALENDAR_SHORTCUTS` - Cmd+T, Cmd+Shift+[, Cmd+Shift+]

3. **`frontend/src/store/uiStore.ts`**
   - Command palette state: `commandPaletteOpen`, `toggleCommandPalette()`
   - Modal state: `openNewFileModal()`, `toggleTheme()`, etc.

4. **`frontend/src/components/command/CommandPalette.tsx`** (145 lines)
   - Command palette UI using `cmdk`
   - Connected to UI store for open/close state
   - Should be triggered by Cmd+K

---

## Current Shortcuts Implemented

### Global Shortcuts
| Shortcut | Action | Status |
|----------|--------|--------|
| `Cmd+K` / `Ctrl+K` | Open Command Palette | ❌ Not Working |
| `Cmd+N` / `Ctrl+N` | New Note | ❌ Not Working |
| `Cmd+S` / `Ctrl+S` | Save Note | ❌ Not Working |
| `Cmd+B` / `Ctrl+B` | Toggle Sidebar | ❌ Not Working |
| `Cmd+Shift+D` | Toggle Theme | ❌ Not Working |
| `Cmd+T` / `Ctrl+T` | Go to Today | ❌ Not Working |
| `Cmd+L` / `Ctrl+L` | Toggle Timeline | ❌ Not Working |

### Editor Shortcuts (TipTap)
| Shortcut | Action | Status |
|----------|--------|--------|
| `Cmd+B` / `Ctrl+B` | Bold | ✅ Working (TipTap native) |
| `Cmd+I` / `Ctrl+I` | Italic | ✅ Working (TipTap native) |
| `Cmd+Shift+K` | Insert Link | Unknown |

---

## Potential Root Causes

### 1. Event Handler Not Registering
- The `useKeyboard()` hook may not be running
- Check if `useKeyboard()` is called in the right component
- Currently called in `App.tsx` and `Layout.tsx` (duplicate?)

### 2. Event Propagation Issues
- TipTap editor may be capturing events
- Events might be stopped before reaching the global handler
- Check `event.stopPropagation()` calls

### 3. Focus/Context Issues
- Keyboard events only fire on focused elements
- Document-level listener may not be catching events
- Consider using `window` instead of `document`

### 4. Platform Detection
```typescript
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const ctrlKey = isMac ? event.metaKey : event.ctrlKey;
```
- This logic determines Cmd vs Ctrl
- May be incorrectly detecting platform
- Test on both Mac and Windows/Linux

### 5. Shortcut Matching Logic
```typescript
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: Partial<KeyboardShortcut>
): boolean {
  // Check implementation
}
```
- May have bugs in key comparison
- Case sensitivity issues
- Modifier key detection problems

---

## Investigation Steps

### Phase 1: Diagnosis (30 min)

1. **Add Debug Logging**
   ```typescript
   // In useKeyboard.ts
   const handleKeyDown = (event: KeyboardEvent) => {
     console.log('Key pressed:', event.key, {
       metaKey: event.metaKey,
       ctrlKey: event.ctrlKey,
       shiftKey: event.shiftKey,
       target: event.target
     });
     // ... rest of handler
   };
   ```

2. **Check Hook Execution**
   - Add `console.log('useKeyboard initialized')` in `useKeyboard()`
   - Verify it runs on app load
   - Check for duplicate registrations

3. **Test Event Capture**
   - Open browser console
   - Press Cmd+K and observe logs
   - Check if `handleKeyDown` is called

4. **Platform Detection**
   - Log `navigator.platform`
   - Verify `isMac` is correct
   - Test modifier key detection

### Phase 2: Common Fixes (1 hour)

#### Fix 1: Remove Duplicate Hook Call
```typescript
// In Layout.tsx - REMOVE this line:
useKeyboard(); // ❌ Duplicate

// Keep only in App.tsx:
useKeyboard(); // ✅ Single registration
```

#### Fix 2: Use Window Instead of Document
```typescript
// In useKeyboard.ts
window.addEventListener('keydown', handleKeyDown);
return () => window.removeEventListener('keydown', handleKeyDown);
```

#### Fix 3: Add Capture Phase
```typescript
window.addEventListener('keydown', handleKeyDown, { capture: true });
```

#### Fix 4: Check for Editor Focus
```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  const isEditorFocused = target.closest('.ProseMirror');

  // Allow certain shortcuts in editor
  if (isEditorFocused) {
    // Only allow non-editor shortcuts like Cmd+K, Cmd+S
    const allowedInEditor = ['k', 's', 'n'];
    if (!allowedInEditor.includes(event.key.toLowerCase())) {
      return; // Let editor handle it
    }
  }

  // ... rest of handler
};
```

#### Fix 5: Fix Key Comparison
```typescript
// Make sure key comparison is case-insensitive
if (shortcut.key && event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
  return false;
}
```

### Phase 3: Alternative Implementations (1-2 hours)

If the custom implementation has fundamental issues, consider:

#### Option A: Use react-hotkeys-hook Properly
```typescript
import { useHotkeys } from 'react-hotkeys-hook';

export function useKeyboard() {
  const { toggleCommandPalette, openNewFileModal, saveFile } = useUIStore();

  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    toggleCommandPalette();
  });

  useHotkeys('mod+n', (e) => {
    e.preventDefault();
    openNewFileModal();
  });

  // ... more shortcuts
}
```

#### Option B: Use Mousetrap Library
```bash
npm install mousetrap
```

```typescript
import Mousetrap from 'mousetrap';

useEffect(() => {
  Mousetrap.bind('mod+k', (e) => {
    e.preventDefault();
    toggleCommandPalette();
  });

  return () => Mousetrap.reset();
}, []);
```

#### Option C: TipTap Keyboard Extension
For editor-specific shortcuts:
```typescript
import { Extension } from '@tiptap/core';

const CustomKeyboard = Extension.create({
  addKeyboardShortcuts() {
    return {
      'Mod-s': () => {
        saveFile();
        return true;
      },
    };
  },
});
```

---

## Testing Checklist

After implementing fixes:

### Manual Testing
- [ ] Cmd+K opens command palette
- [ ] Cmd+N opens new file modal
- [ ] Cmd+S saves current file
- [ ] Cmd+B toggles sidebar
- [ ] Cmd+Shift+D toggles theme
- [ ] Cmd+T goes to today
- [ ] Cmd+L toggles timeline
- [ ] Shortcuts work on Mac
- [ ] Shortcuts work on Windows/Linux (Ctrl instead of Cmd)
- [ ] Shortcuts work when editor is focused
- [ ] Shortcuts work when sidebar is focused
- [ ] ESC closes command palette

### Edge Cases
- [ ] Shortcuts don't interfere with typing in editor
- [ ] Shortcuts don't interfere with input fields
- [ ] Multiple shortcuts don't fire simultaneously
- [ ] Shortcuts work after opening/closing modals
- [ ] Shortcuts persist after navigation

---

## Success Criteria

✅ All keyboard shortcuts working as expected
✅ No conflicts with editor shortcuts
✅ Cross-platform compatibility (Mac/Windows/Linux)
✅ Shortcuts documented for users
✅ Console logs removed (no debug clutter)

---

## Files to Modify

1. `frontend/src/hooks/useKeyboard.ts` - Main debugging/fixes
2. `frontend/src/utils/shortcuts.ts` - Fix matching logic if needed
3. `frontend/src/App.tsx` - Ensure single hook registration
4. `frontend/src/components/layout/Layout.tsx` - Remove duplicate hook call
5. `frontend/package.json` - Add alternative library if needed

---

## Related Issues

- Command Palette not opening (Cmd+K)
- Save shortcut not working (Cmd+S)
- Theme toggle not working (Cmd+Shift+D)

---

## References

- [React Keyboard Events](https://react.dev/learn/responding-to-events#keyboard-events)
- [MDN KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [react-hotkeys-hook Docs](https://github.com/JohannesKlauss/react-hotkeys-hook)
- [Mousetrap Docs](https://craig.is/killing/mice)
- [TipTap Keyboard Extension](https://tiptap.dev/api/extensions/keyboard-shortcuts)

---

## Notes for Implementation

⚠️ **DO NOT:**
- Rewrite from scratch without understanding the issue
- Add new keyboard libraries without trying to fix existing code first
- Remove debug logs before confirming everything works

✅ **DO:**
- Start by adding debug logging to understand the problem
- Check browser console for errors
- Test on multiple platforms if possible
- Review existing code carefully before making changes
- Keep the existing shortcut configuration structure

---

*Created: October 8, 2025*
*Status: Ready for implementation*
*Priority: Medium (nice-to-have, not critical)*
