# Product Requirements Plan: Raw Text Editor Tab

**Version:** 1.0
**Date:** October 10, 2025
**Status:** Ready for Implementation
**Author:** System Generated
**Project:** NotePlan Clone - Raw Text Editor Tab

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background & Context](#2-background--context)
3. [Goals & Objectives](#3-goals--objectives)
4. [User Stories](#4-user-stories)
5. [Functional Requirements](#5-functional-requirements)
6. [Technical Requirements](#6-technical-requirements)
7. [Implementation Plan](#7-implementation-plan)
8. [Testing Strategy](#8-testing-strategy)
9. [Success Metrics](#9-success-metrics)
10. [Risks & Mitigation](#10-risks--mitigation)
11. [Appendix](#11-appendix)

---

## 1. Executive Summary

### Overview
Add a "Raw" tab alongside the existing Editor tab that displays and allows editing of the underlying plain text (.txt) file with no markdown formatting or rendering.

### Problem Statement
Currently, users can only edit notes through the rich text TipTap editor which:
- Renders markdown with formatting, making it hard to see raw syntax
- May auto-format or transform text in unexpected ways
- Doesn't allow direct manipulation of the raw markdown
- Makes it difficult to troubleshoot formatting issues

Users need a way to:
- View and edit the exact raw text without any rendering
- Debug markdown formatting issues
- Make precise edits to markdown syntax
- Copy raw markdown content easily
- Understand how their formatting is actually stored

### Solution
Add a "Raw" tab in the MainView component that:
- Shows the unformatted .txt file content in a plain textarea
- Allows direct editing with no markdown processing
- Auto-saves changes to the file (debounced)
- Syncs with the Editor tab (changes in one reflected in the other)
- Uses monospace font for code-like readability
- Supports all standard textarea features (select, copy, paste, etc.)

**UI Mock:**
```
┌─────────────────────────────────────────────┐
│ [Editor] [Raw] [Tasks] [Board] [References] │ ← New "Raw" tab
├─────────────────────────────────────────────┤
│                                             │
│  # My Note Title                            │
│                                             │
│  This is **bold** text and this is         │
│  *italic* text.                             │
│                                             │
│  * [ ] Task item                            │
│  * [x] Completed task                       │
│                                             │
│  [[Wiki Link]]                              │
│                                             │
└─────────────────────────────────────────────┘
```

### Success Criteria
- Raw tab appears in MainView alongside Editor tab
- Raw content matches file exactly (byte-for-byte)
- Edits in Raw tab save to file and update Editor tab
- Edits in Editor tab update Raw tab
- No formatting or rendering applied in Raw view
- Monospace font used for readability
- Auto-save with debouncing (1 second)
- Works in both light and dark modes

---

## 2. Background & Context

### Current State

**MainView Component** (frontend/src/components/layout/MainView.tsx:1-87):
```typescript
type MainViewType = 'editor' | 'tasks' | 'board' | 'references';

export const MainView: React.FC = () => {
  const [currentView, setCurrentView] = useState<MainViewType>('editor');

  return (
    <div className="h-full flex-1 flex flex-col min-w-0">
      {/* View Tabs */}
      <div className="flex-shrink-0 flex border-b ...">
        <button onClick={() => setCurrentView('editor')} ...>Editor</button>
        <button onClick={() => setCurrentView('tasks')} ...>Tasks</button>
        <button onClick={() => setCurrentView('board')} ...>Board</button>
        <button onClick={() => setCurrentView('references')} ...>References</button>
      </div>

      {/* View Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {currentView === 'editor' && <Editor />}
        {currentView === 'tasks' && <TaskList />}
        {currentView === 'board' && <KanbanBoard />}
        {currentView === 'references' && <ReferenceView />}
      </div>
    </div>
  );
};
```

**Current tabs:**
- Editor: Rich text editor using TipTap
- Tasks: Task list view
- Board: Kanban board view
- References: Tag/mention references

**Editor Component** (frontend/src/components/editor/Editor.tsx:18-157):
- Uses TipTap for markdown editing with formatting
- Auto-saves with 1-second debounce
- Preserves cursor position
- Processes wiki links and task syntax
- Content accessed via `currentFile.content`
- Saves via `saveFile(currentFile.metadata.path, newContent)`

**File Store** (frontend/src/store/fileStore.ts:1-242):
```typescript
interface FileStore {
  currentFile: FileData | null;  // { metadata, content }
  saveFile: (path: string, content: string) => Promise<void>;
  // ...
}
```

### Similar Patterns in Codebase

**Textarea Usage Example** (frontend/src/components/templates/TemplateManager.tsx:275-286):
```typescript
<textarea
  value={content}
  onChange={(e) => setContent(e.target.value)}
  rows={12}
  className="w-full px-3 py-2 border ... font-mono text-sm"
/>
```

**Tab Pattern:** Already implemented in MainView.tsx with active state styling

**Auto-save Pattern:** Already implemented in Editor.tsx with debounced timeout

### Why This Matters
1. **Transparency**: Users see exactly what's in their files
2. **Debugging**: Easier to troubleshoot markdown formatting issues
3. **Precision**: Direct control over raw markdown syntax
4. **Learning**: Helps users understand markdown format
5. **Compatibility**: Standard textarea works everywhere

---

## 3. Goals & Objectives

### Primary Goals
1. **Add Raw Tab**: Create a new "Raw" tab in MainView
2. **Display Raw Content**: Show unformatted file content in textarea
3. **Enable Editing**: Allow full editing with no restrictions
4. **Auto-save**: Save changes with debouncing
5. **Sync Tabs**: Keep Editor and Raw tabs in sync

### Secondary Goals
1. **Dark Mode Support**: Proper styling in dark mode
2. **Keyboard Shortcuts**: Support Cmd/Ctrl+S for manual save
3. **Accessibility**: Proper ARIA labels and keyboard navigation
4. **Performance**: Fast switching between tabs
5. **UX Polish**: Smooth transitions, clear visual feedback

### Non-Goals (Out of Scope)
- Syntax highlighting for markdown (future enhancement)
- Line numbers (future enhancement)
- Find/replace functionality (future enhancement)
- Multiple cursors or advanced editing features
- Diff view between Editor and Raw
- Version history in Raw view
- Code completion or suggestions

---

## 4. User Stories

### Epic 1: Basic Raw Text Editing

**US-1.1**: As a user, I want a Raw tab next to the Editor tab so I can view the plain text version of my note.
- **Acceptance Criteria:**
  - "Raw" tab appears in MainView tab bar
  - Tab is positioned after "Editor" and before "Tasks"
  - Clicking Raw tab shows plain text content
  - Tab has appropriate icon (DocumentTextIcon or CodeBracketIcon)

**US-1.2**: As a user, I want to see the exact raw content of my note with no formatting so I can understand the underlying markdown.
- **Acceptance Criteria:**
  - Content shown in monospace font
  - No markdown rendering (see raw `**bold**`, `[[links]]`, etc.)
  - Exact match to file content (byte-for-byte)
  - All whitespace preserved (spaces, tabs, newlines)

**US-1.3**: As a user, I want to edit the raw content directly so I can make precise changes to markdown syntax.
- **Acceptance Criteria:**
  - Can type, delete, select, copy, paste normally
  - All standard textarea keyboard shortcuts work
  - No auto-formatting or transformation
  - Changes reflected immediately in textarea

### Epic 2: Synchronization

**US-2.1**: As a user, I want my edits in Raw tab to save automatically so I don't lose work.
- **Acceptance Criteria:**
  - Changes auto-save after 1 second of inactivity
  - Visual indication when saving (if possible)
  - No data loss on tab switch
  - Works same as Editor auto-save

**US-2.2**: As a user, I want changes in Raw tab to appear in Editor tab so both views stay in sync.
- **Acceptance Criteria:**
  - Editing in Raw and switching to Editor shows changes
  - No refresh or reload needed
  - Cursor position preserved where possible
  - Real-time sync via fileStore

**US-2.3**: As a user, I want changes in Editor tab to appear in Raw tab so I can verify the markdown.
- **Acceptance Criteria:**
  - Editing in Editor and switching to Raw shows changes
  - Raw view always shows current saved state
  - Wiki link processing doesn't affect raw view

### Epic 3: UX & Polish

**US-3.1**: As a user, I want the Raw tab to work in dark mode so I can use it comfortably at night.
- **Acceptance Criteria:**
  - Background color appropriate for dark mode
  - Text color has good contrast
  - Border and UI elements match theme
  - No bright flash when switching modes

**US-3.2**: As a user, I want keyboard shortcuts to work in Raw tab so I can work efficiently.
- **Acceptance Criteria:**
  - Cmd/Ctrl+S saves immediately (optional, already auto-saves)
  - Cmd/Ctrl+A selects all
  - Cmd/Ctrl+Z/Y for undo/redo
  - Tab key inserts tab character

---

## 5. Functional Requirements

### FR-1: Raw Tab in MainView
- **ID**: FR-1
- **Priority**: P0 (Critical)
- **Description**: Add "Raw" tab to MainView tab bar
- **Specifications**:
  - Add 'raw' to MainViewType union
  - Add tab button between 'editor' and 'tasks'
  - Use CodeBracketIcon from Heroicons
  - Same styling as other tabs (active/inactive states)
  - Tab label: "Raw"
- **Acceptance Criteria**:
  - Tab visible in MainView
  - Clicking switches to Raw view
  - Active state shows amber underline
  - Tab order: Editor, Raw, Tasks, Board, References

### FR-2: RawTextEditor Component
- **ID**: FR-2
- **Priority**: P0 (Critical)
- **Description**: Create component to display and edit raw text
- **Specifications**:
  - React functional component
  - Uses textarea element
  - Displays currentFile.content unmodified
  - Full height/width of container
  - Monospace font (font-mono)
  - No spell check or autocorrect
  - Preserve all whitespace
- **UI Specifications**:
  ```typescript
  <textarea
    className="w-full h-full p-6 font-mono text-sm
               bg-white dark:bg-gray-800
               text-gray-900 dark:text-gray-100
               focus:outline-none resize-none"
    spellCheck={false}
    autoCorrect="off"
    autoCapitalize="off"
  />
  ```
- **Acceptance Criteria**:
  - Textarea fills container
  - Content matches currentFile.content exactly
  - Can edit freely
  - Works in light and dark modes

### FR-3: Auto-save Functionality
- **ID**: FR-3
- **Priority**: P0 (Critical)
- **Description**: Auto-save changes with debouncing
- **Specifications**:
  - Debounce delay: 1000ms (1 second)
  - Call fileStore.saveFile(path, content)
  - Clear timeout on unmount
  - Match Editor.tsx save pattern
- **Algorithm**:
  ```typescript
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);

    if (saveTimeout) clearTimeout(saveTimeout);

    const timeout = setTimeout(() => {
      if (currentFile) {
        saveFile(currentFile.metadata.path, newContent);
      }
    }, 1000);

    setSaveTimeout(timeout);
  };
  ```
- **Acceptance Criteria**:
  - Changes save 1 second after last keystroke
  - Multiple rapid changes only trigger one save
  - Timeout cleared on component unmount
  - Save updates fileStore and backend

### FR-4: Content Synchronization
- **ID**: FR-4
- **Priority**: P0 (Critical)
- **Description**: Sync content between Raw and Editor tabs
- **Specifications**:
  - useEffect watches currentFile.content
  - Update local state when currentFile changes
  - Preserve textarea scroll position if possible
  - Handle case when no file selected
- **Implementation**:
  ```typescript
  useEffect(() => {
    if (currentFile) {
      setLocalContent(currentFile.content);
    }
  }, [currentFile]);
  ```
- **Acceptance Criteria**:
  - Switching tabs shows latest content
  - Edits in Editor appear in Raw
  - Edits in Raw appear in Editor
  - No stale content shown

### FR-5: Empty State Handling
- **ID**: FR-5
- **Priority**: P1 (High)
- **Description**: Show message when no file selected
- **Specifications**:
  - Display centered message when currentFile is null
  - Match Editor.tsx empty state styling
  - Message: "Select a note to view raw content"
- **Acceptance Criteria**:
  - Empty state shown when no file selected
  - Matches Editor empty state design
  - Clear and helpful message

### FR-6: Keyboard Shortcuts
- **ID**: FR-6
- **Priority**: P2 (Medium)
- **Description**: Support standard textarea keyboard shortcuts
- **Specifications**:
  - All browser default textarea shortcuts work
  - Tab key inserts tab character (optional)
  - No custom shortcuts needed (auto-save handles save)
- **Acceptance Criteria**:
  - Cmd/Ctrl+A selects all
  - Cmd/Ctrl+C/V copy/paste works
  - Cmd/Ctrl+Z/Y undo/redo works
  - Arrow keys, Home, End work

---

## 6. Technical Requirements

### TR-1: Update MainView Component

**File**: `frontend/src/components/layout/MainView.tsx`

**Changes**:
1. Add 'raw' to MainViewType
2. Add Raw tab button
3. Import RawTextEditor component
4. Render RawTextEditor when currentView === 'raw'

**Code**:
```typescript
import { CodeBracketIcon } from '@heroicons/react/24/outline';
import { RawTextEditor } from '../editor/RawTextEditor';

type MainViewType = 'editor' | 'raw' | 'tasks' | 'board' | 'references';

export const MainView: React.FC = () => {
  const [currentView, setCurrentView] = useState<MainViewType>('editor');

  return (
    <div className="h-full flex-1 flex flex-col min-w-0">
      {/* View Tabs */}
      <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Editor Tab */}
        <button
          onClick={() => setCurrentView('editor')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
            currentView === 'editor'
              ? 'text-amber-600 dark:text-amber-400 border-amber-600 dark:border-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-transparent'
          )}
        >
          <DocumentTextIcon className="h-4 w-4" />
          <span>Editor</span>
        </button>

        {/* NEW: Raw Tab */}
        <button
          onClick={() => setCurrentView('raw')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
            currentView === 'raw'
              ? 'text-amber-600 dark:text-amber-400 border-amber-600 dark:border-amber-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-transparent'
          )}
        >
          <CodeBracketIcon className="h-4 w-4" />
          <span>Raw</span>
        </button>

        {/* Existing tabs: Tasks, Board, References */}
        {/* ... */}
      </div>

      {/* View Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {currentView === 'editor' && <Editor />}
        {currentView === 'raw' && <RawTextEditor />}
        {currentView === 'tasks' && <TaskList />}
        {currentView === 'board' && <KanbanBoard />}
        {currentView === 'references' && <ReferenceView />}
      </div>
    </div>
  );
};
```

### TR-2: Create RawTextEditor Component

**File**: `frontend/src/components/editor/RawTextEditor.tsx` (NEW)

**Implementation**:
```typescript
import React, { useEffect, useState } from 'react';
import { useFileStore } from '../../store/fileStore';

export const RawTextEditor: React.FC = () => {
  const { currentFile, saveFile } = useFileStore();
  const [localContent, setLocalContent] = useState('');
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Update local content when file changes
  useEffect(() => {
    if (currentFile) {
      setLocalContent(currentFile.content);
    }
  }, [currentFile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Debounced auto-save
    const timeout = setTimeout(() => {
      if (currentFile) {
        saveFile(currentFile.metadata.path, newContent);
      }
    }, 1000);

    setSaveTimeout(timeout);
  };

  // Empty state - no file selected
  if (!currentFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg">Select a note to view raw content</p>
          <p className="text-sm mt-2">The raw text will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 h-full">
      <textarea
        value={localContent}
        onChange={handleChange}
        className="w-full h-full p-6 font-mono text-sm
                   bg-white dark:bg-gray-800
                   text-gray-900 dark:text-gray-100
                   focus:outline-none resize-none
                   placeholder:text-gray-400 dark:placeholder:text-gray-500"
        placeholder="Start typing..."
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
};
```

### TR-3: Import CodeBracketIcon

**File**: `frontend/src/components/layout/MainView.tsx`

**Add to imports**:
```typescript
import {
  DocumentTextIcon,
  CheckCircleIcon,
  Squares2X2Icon,
  LinkIcon,
  CodeBracketIcon,  // NEW
} from '@heroicons/react/24/outline';
```

### TR-4: No Backend Changes Needed

The existing API already supports:
- `api.getFile(path)` - Gets file content
- `api.saveFile(path, content)` - Saves file content

No new endpoints needed.

### TR-5: Dependencies

**No new dependencies required**. All needed packages already installed:
- React (UI framework)
- Zustand (state management via fileStore)
- Heroicons (CodeBracketIcon)
- Tailwind CSS (styling)

---

## 7. Implementation Plan

### Phase 1: Create RawTextEditor Component (30 min)

**Tasks**:
1. Create `frontend/src/components/editor/RawTextEditor.tsx`
2. Implement component structure:
   - Import useFileStore
   - Add state for localContent and saveTimeout
   - Add useEffect for currentFile sync
   - Add useEffect for cleanup
3. Implement handleChange with debounced save
4. Implement empty state UI
5. Implement textarea with proper styling
6. Test dark mode styling

**Deliverable**: Standalone RawTextEditor component

**Validation**:
```bash
# Manual testing:
# 1. Import and render RawTextEditor in a test page
# 2. Verify empty state shows when no file
# 3. Verify textarea renders with correct styling
# 4. Test in light and dark modes
```

### Phase 2: Integrate into MainView (20 min)

**Tasks**:
1. Update `frontend/src/components/layout/MainView.tsx`:
   - Import RawTextEditor and CodeBracketIcon
   - Add 'raw' to MainViewType
   - Add Raw tab button after Editor
   - Add conditional render for Raw view
2. Test tab switching
3. Verify styling matches other tabs
4. Test active/inactive states

**Deliverable**: Raw tab in MainView

**Validation**:
```bash
# Manual testing:
# 1. Open app and verify Raw tab appears
# 2. Click Raw tab and verify it activates
# 3. Verify active state styling (amber underline)
# 4. Click other tabs and verify Raw deactivates
```

### Phase 3: Test Content Sync (20 min)

**Tasks**:
1. Open a note in Editor
2. Switch to Raw tab - verify content appears
3. Edit in Raw tab - verify auto-save works (wait 1 second)
4. Switch to Editor tab - verify changes appear
5. Edit in Editor tab
6. Switch to Raw tab - verify changes appear
7. Test with various content:
   - Plain text
   - Markdown with formatting
   - Wiki links
   - Tasks
   - Empty file
   - Large file (1000+ lines)

**Deliverable**: Verified bidirectional sync

**Validation**:
```bash
# Manual testing:
# 1. Edit in Raw, switch to Editor - verify sync
# 2. Edit in Editor, switch to Raw - verify sync
# 3. Make rapid changes - verify debouncing works
# 4. Check file on disk - verify saves persist
```

### Phase 4: Edge Cases & Polish (15 min)

**Tasks**:
1. Test no file selected - verify empty state
2. Test switching files - verify content updates
3. Test rapid tab switching - verify no race conditions
4. Test with very long lines - verify horizontal scroll
5. Test with special characters - verify no escaping
6. Test undo/redo in textarea
7. Test select all, copy, paste
8. Test scroll position preservation

**Deliverable**: Polished, robust feature

**Validation**:
```bash
# Manual testing:
# 1. Close all files and click Raw tab - see empty state
# 2. Open file A, then file B - verify content changes
# 3. Rapidly click Editor → Raw → Editor - no crashes
# 4. Test with file containing very long lines
# 5. Test with file containing emoji, unicode, special chars
```

### Phase 5: Accessibility & Final Testing (10 min)

**Tasks**:
1. Test keyboard navigation
   - Tab to Raw tab button
   - Enter to activate
   - Tab into textarea
   - All textarea keyboard shortcuts
2. Test screen reader (if available)
   - Tab button announced correctly
   - Textarea has proper label
3. Test color contrast in light/dark modes
4. Final visual review
5. Cross-browser testing (Chrome, Firefox, Safari)

**Deliverable**: Accessible, polished feature

**Validation**:
```bash
# Manual testing:
# 1. Navigate using only keyboard
# 2. Verify all functionality accessible
# 3. Test in Chrome, Firefox, Safari
# 4. Verify dark mode contrast ratios
```

---

## 8. Testing Strategy

### Manual Testing Checklist

**Basic Functionality:**
- [ ] Raw tab appears in MainView
- [ ] Clicking Raw tab shows raw content
- [ ] Content matches file exactly (no formatting)
- [ ] Can edit in textarea
- [ ] Changes auto-save after 1 second
- [ ] Empty state shows when no file selected

**Synchronization:**
- [ ] Edits in Raw appear in Editor after save
- [ ] Edits in Editor appear in Raw after save
- [ ] Switching files updates Raw content
- [ ] No stale content shown
- [ ] Debouncing prevents excessive saves

**Styling:**
- [ ] Monospace font used
- [ ] Textarea fills container
- [ ] Light mode styling correct
- [ ] Dark mode styling correct
- [ ] Active tab has amber underline
- [ ] Inactive tab has gray text

**Edge Cases:**
- [ ] Empty file shows empty textarea
- [ ] Very long lines scroll horizontally
- [ ] Special characters preserved (emoji, unicode)
- [ ] Whitespace preserved (tabs, multiple spaces, newlines)
- [ ] Large files (1000+ lines) load without lag
- [ ] Rapid tab switching doesn't cause issues
- [ ] Rapid edits don't trigger multiple saves

**Keyboard & Accessibility:**
- [ ] Tab key navigation works
- [ ] Enter activates Raw tab
- [ ] Cmd/Ctrl+A selects all in textarea
- [ ] Cmd/Ctrl+C/V copy/paste works
- [ ] Cmd/Ctrl+Z/Y undo/redo works
- [ ] Screen reader announces tab correctly
- [ ] Textarea has proper ARIA label

**Browser Compatibility:**
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge (if needed)

### Automated Testing (Future)

**Unit Tests** (when test suite exists):
```typescript
describe('RawTextEditor', () => {
  it('renders empty state when no file selected', () => {
    // Test empty state
  });

  it('displays file content in textarea', () => {
    // Test content display
  });

  it('saves changes after debounce delay', () => {
    // Test auto-save
  });

  it('updates when currentFile changes', () => {
    // Test sync
  });
});
```

### Performance Testing

**Metrics to Check:**
- Time to switch to Raw tab: <100ms
- Time to load 1000-line file: <500ms
- Auto-save execution time: <50ms
- Memory usage: No leaks on repeated tab switches

---

## 9. Success Metrics

### Quantitative Metrics

**Performance:**
- Tab switch latency: <100ms
- File load time: <500ms for 1000 lines
- Auto-save latency: <50ms
- No memory leaks

**Reliability:**
- 0 data loss incidents
- 0 sync failures
- 100% accuracy in content display
- <1% of users report issues

**Adoption:**
- 30% of users try Raw tab within first week
- 15% of users actively use Raw tab regularly
- Average 2-3 Raw edits per active user per week

### Qualitative Metrics

**User Feedback:**
- Users find Raw tab "useful" for debugging
- Users appreciate seeing exact markdown syntax
- Positive feedback about monospace font
- No confusion about purpose of Raw tab

**UX Quality:**
- Fast, responsive textarea
- Smooth tab transitions
- Clear visual design
- Accessible keyboard navigation

### Acceptance Criteria for Launch

**Must Have:**
- ✅ Raw tab visible and functional
- ✅ Content matches file exactly
- ✅ Auto-save works correctly
- ✅ Syncs with Editor tab
- ✅ Works in light and dark modes
- ✅ Manual test checklist 100% complete
- ✅ Zero known critical bugs

**Nice to Have:**
- ⚠️ Syntax highlighting (future enhancement)
- ⚠️ Line numbers (future enhancement)
- ⚠️ Find/replace (future enhancement)
- ⚠️ Vim mode (future enhancement)

---

## 10. Risks & Mitigation

### Risk 1: Content Sync Race Conditions
**Risk**: Rapid tab switching may cause sync issues
**Impact**: Medium
**Likelihood**: Low
**Mitigation**:
- Use debouncing for auto-save
- Clear timeout on component unmount
- fileStore already handles concurrent saves
- Test rapid tab switching during development
- Add loading state if needed

### Risk 2: Large File Performance
**Risk**: Very large files may cause textarea to lag
**Impact**: Medium
**Likelihood**: Low
**Mitigation**:
- Native textarea is highly optimized
- Browser handles large textareas well (tested to 10MB+)
- If issues arise, add warning for files >1MB
- Consider virtualized textarea for very large files (future)
- Most note files are <100KB

### Risk 3: Browser Compatibility
**Risk**: Textarea styling may differ across browsers
**Impact**: Low
**Likelihood**: Low
**Mitigation**:
- Use standard textarea element (highly compatible)
- Tailwind CSS ensures consistent styling
- Test in Chrome, Firefox, Safari
- Use CSS resets for consistent rendering
- No advanced features that might break

### Risk 4: Dark Mode Contrast
**Risk**: Dark mode colors may have poor contrast
**Impact**: Low
**Likelihood**: Very Low
**Mitigation**:
- Use Tailwind's dark mode classes (already tested)
- Test with WCAG contrast checker
- Match Editor component's dark mode
- Get user feedback early
- Easy to adjust colors if needed

### Risk 5: User Confusion
**Risk**: Users may not understand difference between Editor and Raw
**Impact**: Low
**Likelihood**: Medium
**Mitigation**:
- Use clear tab label: "Raw"
- Use CodeBracketIcon to suggest code/plain text
- Add tooltip: "View and edit raw markdown"
- Empty state explains purpose
- Documentation clarifies use case

---

## 11. Appendix

### A. Code References

**Key Files**:
- Main View: `frontend/src/components/layout/MainView.tsx:1-87`
- Editor Component: `frontend/src/components/editor/Editor.tsx:18-157`
- File Store: `frontend/src/store/fileStore.ts:1-242`
- Template Manager (textarea example): `frontend/src/components/templates/TemplateManager.tsx:275-286`
- API Service: `frontend/src/services/api.ts:81-94`

**External Documentation**:
- React Textarea: https://react.dev/reference/react-dom/components/textarea
- Heroicons: https://heroicons.com/
- Tailwind CSS: https://tailwindcss.com/docs
- Zustand: https://docs.pmnd.rs/zustand/getting-started/introduction

### B. Textarea Styling Reference

**Full Styling**:
```typescript
<textarea
  value={localContent}
  onChange={handleChange}
  className={`
    w-full h-full p-6
    font-mono text-sm
    bg-white dark:bg-gray-800
    text-gray-900 dark:text-gray-100
    focus:outline-none
    resize-none
    placeholder:text-gray-400 dark:placeholder:text-gray-500
  `}
  placeholder="Start typing..."
  spellCheck={false}
  autoCorrect="off"
  autoCapitalize="off"
/>
```

**Key Properties**:
- `w-full h-full`: Fill container
- `p-6`: Padding matching Editor
- `font-mono text-sm`: Monospace, readable size
- `bg-white dark:bg-gray-800`: Light/dark backgrounds
- `text-gray-900 dark:text-gray-100`: Light/dark text
- `focus:outline-none`: Remove default outline
- `resize-none`: Prevent manual resize
- `spellCheck={false}`: No spell checking (for markdown)
- `autoCorrect="off"`: No auto-correction
- `autoCapitalize="off"`: No auto-capitalization

### C. Alternative Approaches Considered

**Alternative 1: Use CodeMirror**
- **Pros**: Syntax highlighting, line numbers, advanced features
- **Cons**: Large dependency, overkill for simple view, complexity
- **Decision**: Rejected (use native textarea for simplicity)

**Alternative 2: Read-only View**
- **Pros**: Simpler, no save logic needed
- **Cons**: Less useful, can't fix formatting directly
- **Decision**: Rejected (editing is valuable)

**Alternative 3: Modal/Sidebar**
- **Pros**: Can see Editor and Raw simultaneously
- **Cons**: Complex UI, takes up space, harder to implement
- **Decision**: Rejected for MVP (maybe future enhancement)

**Alternative 4: Toggle in Editor**
- **Pros**: Single view, simpler navigation
- **Cons**: Destroys Editor state on toggle, confusing UX
- **Decision**: Rejected (separate tabs clearer)

### D. Future Enhancements

1. **Syntax Highlighting**
   - Use CodeMirror or Monaco editor
   - Highlight markdown syntax
   - Configurable themes

2. **Line Numbers**
   - Show line numbers in gutter
   - Click to select line
   - Useful for debugging

3. **Find/Replace**
   - Cmd/Ctrl+F to find text
   - Find and replace functionality
   - Regex support

4. **Vim Mode**
   - Optional Vim keybindings
   - Modal editing
   - For power users

5. **Diff View**
   - Compare Raw and Editor
   - Highlight differences
   - Useful for debugging transformations

6. **Export Raw**
   - Export raw markdown to file
   - Copy raw markdown to clipboard
   - Share raw content

---

## Conclusion

This PRP outlines a straightforward implementation for adding a Raw text editor tab to the NotePlan clone application. By using a simple textarea element and leveraging existing patterns from the codebase, we can deliver this feature quickly and reliably.

**Key Technical Challenges**:
1. **Component Creation**: Simple React component with textarea
2. **MainView Integration**: Add tab and routing
3. **Auto-save**: Reuse debouncing pattern from Editor
4. **Synchronization**: Use fileStore reactivity

**Estimated Implementation Time**: 1-2 hours (1 developer)

**Confidence Level for One-Pass Success**: 9.5/10

**Reasoning**:
- ✅ Very simple implementation (mostly textarea)
- ✅ Clear existing patterns to follow (tabs, auto-save)
- ✅ No new dependencies needed
- ✅ No backend changes required
- ✅ Standard browser features (textarea)
- ⚠️ Minor risk of sync edge cases (easily testable)

**Next Steps**:
1. Create RawTextEditor component
2. Integrate into MainView
3. Test content synchronization
4. Verify in light/dark modes
5. Final polish and testing

---

**PRP Confidence Score: 9.5/10**

This PRP provides comprehensive context for one-pass implementation success, including:
- ✅ Clear, simple feature requirements
- ✅ Existing code patterns to follow
- ✅ Step-by-step implementation plan
- ✅ Complete code examples
- ✅ Thorough testing strategy
- ✅ Minimal complexity (native textarea)
- ✅ No external dependencies
- ✅ Well-understood browser features
