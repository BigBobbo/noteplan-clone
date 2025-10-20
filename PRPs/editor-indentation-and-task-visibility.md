# Product Requirements Plan: Editor Indentation Display & Task Visibility Enhancement

**Version:** 1.0
**Date:** October 10, 2025
**Status:** Ready for Implementation
**Author:** System Generated
**Project:** NotePlan Clone - Editor UX Improvements

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background & Context](#2-background--context)
3. [Problem Analysis](#3-problem-analysis)
4. [Research Findings](#4-research-findings)
5. [Solution Approach](#5-solution-approach)
6. [Technical Requirements](#6-technical-requirements)
7. [Implementation Plan](#7-implementation-plan)
8. [Testing Strategy](#8-testing-strategy)
9. [Success Criteria](#9-success-criteria)
10. [Risks & Mitigation](#10-risks--mitigation)

---

## 1. Executive Summary

### Problem Statement

The TipTap editor currently has two critical UX issues that impact readability and usability:

1. **Indentation Not Displayed**: Indented lines in markdown files (like task details) appear flush left in the editor, making it impossible to see hierarchical structure
2. **Tasks Not Clearly Visible**: Regular text lines with `*` markers don't visually stand out as tasks, lacking clear visual affordance

**Example from test-kanban.txt:**
```markdown
File content (properly indented):
* Task 1 in todo #status-todo #p1
    This is a detailed description of Task 1.
    It can span multiple lines and include:
    - Bullet points for steps

Editor display (everything flush left):
* Task 1 in todo #status-todo #p1
This is a detailed description of Task 1.
It can span multiple lines and include:
- Bullet points for steps
```

### Root Cause

1. **Indentation Issue**: TipTap's default configuration doesn't preserve whitespace display in the visual editor. While whitespace is preserved in the underlying data, the HTML rendering collapses spaces.
2. **Task Visibility Issue**: No custom styling applied to task list items to distinguish them from regular list items or paragraphs.

### Solution

1. **Fix Indentation**: Configure TipTap with `preserveWhitespace: 'full'` in parseOptions and add CSS for whitespace preservation
2. **Enhance Task Visibility**: Add custom CSS with checkbox icons (using Font Awesome or Unicode symbols), distinct colors, and hover states to make tasks clearly identifiable

### Success Criteria

- ✅ Indented content displays with proper visual indentation in editor
- ✅ Tasks are immediately recognizable with checkbox icons/styling
- ✅ Different task states (open, completed, cancelled) have distinct visual appearance
- ✅ No data loss or corruption of markdown content
- ✅ Performance remains acceptable (<100ms render time)

---

## 2. Background & Context

### Current Editor Implementation

**Editor.tsx** (lines 40-94):
```typescript
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Link.configure({ /* ... */ }),
    WikiLink.configure({ /* ... */ }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Markdown.configure({
      html: true,
      tightLists: false,
      bulletListMarker: '+',
      breaks: true,
      transformPastedText: true,
      transformCopiedText: true,
      linkify: false,
    }),
  ],
  content: wikiLinkMarkdownTransformer.preProcess(currentFile?.content || ''),
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none p-6',
    },
  },
});
```

**Current CSS** (index.css lines 149-206):
```css
.ProseMirror {
  outline: none;
  min-height: 200px;
  padding: 1rem;
}

.ProseMirror ul[data-type="taskList"] {
  list-style: none;
  padding: 0;
}

.ProseMirror ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
}

.ProseMirror ul[data-type="taskList"] li input[type="checkbox"] {
  margin-right: 0.5rem;
  margin-top: 0.25rem;
}
```

### Test File Evidence

**test-kanban.txt** shows proper indentation in file:
```markdown
* Task 1 in todo #status-todo #p1
    This is a detailed description of Task 1.
    It can span multiple lines and include:
    - Bullet points for steps
    - Links: https://example.com
    - **Bold** and *italic* text
    - Code: `npm install`

* Task 4 in progress #status-doing #p2 #work
    This task has both details AND child tasks.
    The details should appear before the child tasks.
    * Child task 4.1
    * Child task 4.2
        Details for child task 4.2
```

But in the editor, all content appears flush left, making structure invisible.

### User Impact

**Readability Issues:**
- Cannot distinguish task details from task titles
- Cannot see nesting levels of tasks
- Cannot identify which content belongs to which task
- Mixed content (details + child tasks) is confusing

**Task Recognition Issues:**
- Tasks look like regular bullet points
- No visual indication of task status
- Hard to scan for incomplete tasks
- No clear call-to-action to complete tasks

---

## 3. Problem Analysis

### Issue 1: Whitespace Collapse

**HTML Rendering Behavior:**
```html
<!-- What's stored in ProseMirror doc -->
<li>
  <p>Task 1</p>
  <p>    This is indented detail</p>
</li>

<!-- What browser renders -->
<li>
  <p>Task 1</p>
  <p>This is indented detail</p>  <!-- Spaces collapsed! -->
</li>
```

**Why This Happens:**
- HTML collapses consecutive whitespace by default
- TipTap preserves whitespace in data but not in visual display
- CSS `white-space` property not set on content elements

### Issue 2: Missing Task Visual Affordance

**Current State:**
```
* Task to complete      ← Looks like regular bullet
* Another task          ← No visual distinction
[ ] Task with checkbox  ← Only if using TaskList extension syntax
```

**What Users Expect (from NotePlan, Obsidian, Todoist):**
```
☐ Task to complete      ← Clear checkbox icon
☐ Another task          ← Obvious it's actionable
✓ Completed task        ← Visual feedback of completion
```

### Technical Constraints

**TipTap TaskList Extension:**
- Requires specific markdown syntax: `- [ ]` or `- [x]`
- Conflicts with NotePlan-style tasks: `* Task text #tags`
- Cannot use both syntaxes simultaneously
- Already removed from MarkdownEditor.tsx (line 5 comment)

**Solution Requirements:**
- Must work with NotePlan markdown format (`* Task` not `- [ ]`)
- Must preserve existing task parsing logic
- Must not interfere with task service or task details feature
- Must be CSS/visual-only solution

---

## 4. Research Findings

### TipTap Whitespace Preservation

**From TipTap Documentation** (https://tiptap.dev/docs/editor/api/editor):

```typescript
new Editor({
  parseOptions: {
    preserveWhitespace: 'full',
  },
})
```

Options:
- `'full'`: Preserve all whitespace including leading spaces
- `true`: Same as 'full'
- `false`/default: HTML-standard whitespace collapsing

**Additional CSS Required:**
```css
.ProseMirror {
  white-space: pre-wrap;  /* Preserve spaces, wrap lines */
}
```

Or more targeted:
```css
.ProseMirror p {
  white-space: pre-wrap;
}
```

### Task Visibility Best Practices

**NotePlan Implementation** (from researched CSS):
```css
[data-content-type=taskListItem][data-checked=false]>label:before {
  content: "";  /* Font Awesome unchecked circle */
  font: var(--fa-font-regular);
  color: var(--orange-noteplan);
}

[data-content-type=taskListItem][data-checked=true]>label:before {
  content: "";  /* Font Awesome check circle */
  font: var(--fa-font-regular);
  color: #9ca3af;
}

[data-content-type=taskListItem][data-checked=true] {
  opacity: 0.4;
}
```

**Obsidian Custom Checkboxes** (GitHub gist research):
- Uses Unicode symbols: ☐ ☑ ☒
- Custom CSS for different states
- Data attributes for state tracking
- Hover effects for interactivity

**Key Design Patterns:**
1. **Visual Checkbox**: Use icon (Font Awesome, Unicode, or SVG)
2. **Color Coding**: Different colors for states (open=orange, done=gray, cancelled=red)
3. **Opacity**: Reduce opacity for completed tasks
4. **Padding**: Consistent spacing around checkbox
5. **Hover States**: Visual feedback for interactivity

### Comparison of Icon Approaches

| Approach | Pros | Cons | Choice |
|----------|------|------|--------|
| **Font Awesome** | Professional, consistent, many icons | Requires library/CDN | ⚠️ Need to install |
| **Unicode Symbols** | No dependencies, universal | Limited styling, inconsistent rendering | ✅ Fallback |
| **SVG Icons** | Flexible, scalable, custom | More code, need asset management | ❌ Overkill |
| **CSS ::before** | Simple, pure CSS | Limited visual complexity | ✅ Primary |

**Recommended: Unicode + CSS ::before**

---

## 5. Solution Approach

### Solution 1: Fix Whitespace Display

**Three-Part Fix:**

1. **Add `preserveWhitespace` to TipTap config**
   ```typescript
   const editor = useEditor({
     parseOptions: {
       preserveWhitespace: 'full',
     },
     extensions: [ /* ... */ ],
   });
   ```

2. **Add CSS for whitespace preservation**
   ```css
   .ProseMirror pre,
   .ProseMirror code {
     white-space: pre-wrap;
   }

   /* For paragraphs within lists (task details) */
   .ProseMirror li > p {
     white-space: pre-wrap;
   }
   ```

3. **Alternative: CSS tab-size for 4-space indents**
   ```css
   .ProseMirror {
     tab-size: 4;
     -moz-tab-size: 4;
   }
   ```

### Solution 2: Enhance Task Visibility

**CSS-Only Enhancement (No JS Required):**

```css
/* Target list items that contain tasks (start with * ) */
.ProseMirror ul > li {
  position: relative;
  padding-left: 1.75em;
  list-style: none;
}

/* Add checkbox icon before task items */
.ProseMirror ul > li::before {
  content: "☐";  /* Unicode checkbox */
  position: absolute;
  left: 0;
  top: 0.15em;
  font-size: 1.1em;
  color: #f59e0b;  /* Amber/orange like NotePlan */
  font-weight: bold;
}

/* Detect completed tasks (contains [x] or [X]) */
.ProseMirror ul > li:has(input[type="checkbox"]:checked)::before,
.ProseMirror li[data-checked="true"]::before {
  content: "☑";  /* Unicode checked checkbox */
  color: #9ca3af;  /* Gray */
  opacity: 0.6;
}

/* Cancelled tasks (contains [-]) */
.ProseMirror li[data-cancelled="true"]::before {
  content: "☒";  /* Unicode cancelled checkbox */
  color: #ef4444;  /* Red */
  opacity: 0.7;
}

/* Hover state */
.ProseMirror ul > li:hover::before {
  color: #d97706;  /* Darker orange */
  transform: scale(1.1);
  transition: all 0.15s ease;
}

/* Completed task styling */
.ProseMirror li[data-checked="true"] {
  opacity: 0.5;
  text-decoration: line-through;
  color: #6b7280;
}
```

**Unicode Symbol Reference:**
- ☐ (U+2610): Ballot Box (unchecked)
- ☑ (U+2611): Ballot Box with Check
- ☒ (U+2612): Ballot Box with X
- ✓ (U+2713): Check Mark
- ✗ (U+2717): Ballot X
- ◯ (U+25CB): White Circle
- ⦿ (U+29BF): Circled Bullet

---

## 6. Technical Requirements

### TR-1: Update TipTap Configuration

**Modify: frontend/src/components/editor/Editor.tsx**

```typescript
const editor = useEditor({
  parseOptions: {
    preserveWhitespace: 'full',  // ADD THIS
  },
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    // ... rest of extensions
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none p-6',
    },
  },
});
```

**Modify: frontend/src/components/editor/MarkdownEditor.tsx**

```typescript
const editor = useEditor({
  parseOptions: {
    preserveWhitespace: 'full',  // ADD THIS
  },
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    // ... rest of extensions
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none p-4',
    },
  },
});
```

### TR-2: Add Whitespace Preservation CSS

**Modify: frontend/src/index.css** (add after line 206)

```css
/* ========================================
   WHITESPACE & INDENTATION PRESERVATION
   ======================================== */

/* Preserve whitespace in editor content */
.ProseMirror {
  white-space: pre-wrap;  /* Preserve spaces, wrap lines */
  tab-size: 4;            /* Make tabs = 4 spaces */
  -moz-tab-size: 4;
}

/* Specifically for paragraphs within lists (task details) */
.ProseMirror li > p,
.ProseMirror li > div {
  white-space: pre-wrap;
  margin: 0.25rem 0;
}

/* Preserve indentation in code blocks */
.ProseMirror pre,
.ProseMirror code {
  white-space: pre-wrap;
  tab-size: 4;
  -moz-tab-size: 4;
}

/* Ensure nested lists show indentation visually */
.ProseMirror ul ul,
.ProseMirror ol ul,
.ProseMirror ul ol,
.ProseMirror ol ol {
  margin-left: 1.5em;
}
```

### TR-3: Add Task Visibility CSS

**Modify: frontend/src/index.css** (add after whitespace section)

```css
/* ========================================
   TASK VISIBILITY ENHANCEMENTS
   ======================================== */

/* Base task item styling */
.ProseMirror ul:not([data-type="taskList"]) > li {
  position: relative;
  padding-left: 2em;
  list-style: none;
  margin: 0.5rem 0;
  min-height: 1.5em;
  transition: background-color 0.15s ease;
}

/* Checkbox icon before task items */
.ProseMirror ul:not([data-type="taskList"]) > li::before {
  content: "☐";
  position: absolute;
  left: 0.25em;
  top: 0.1em;
  font-size: 1.2em;
  color: #f59e0b;  /* Amber - matches app accent */
  font-weight: bold;
  line-height: 1;
  transition: all 0.15s ease;
  user-select: none;
}

/* Hover effect on tasks */
.ProseMirror ul:not([data-type="taskList"]) > li:hover {
  background-color: rgba(249, 250, 251, 0.5);
  border-radius: 0.25rem;
  padding-right: 0.5rem;
}

[data-theme='dark'] .ProseMirror ul:not([data-type="taskList"]) > li:hover {
  background-color: rgba(55, 65, 81, 0.3);
}

.ProseMirror ul:not([data-type="taskList"]) > li:hover::before {
  color: #d97706;  /* Darker orange on hover */
  transform: scale(1.15);
}

/* Completed tasks (if task contains [x] or [X]) */
.ProseMirror ul:not([data-type="taskList"]) > li:has(> *:first-child:contains("[x]"))::before,
.ProseMirror ul:not([data-type="taskList"]) > li:has(> *:first-child:contains("[X]"))::before {
  content: "☑";
  color: #9ca3af;  /* Gray */
}

/* Completed task text styling */
.ProseMirror ul:not([data-type="taskList"]) > li:has(> *:first-child:contains("[x]")),
.ProseMirror ul:not([data-type="taskList"]) > li:has(> *:first-child:contains("[X]")) {
  opacity: 0.5;
}

.ProseMirror ul:not([data-type="taskList"]) > li:has(> *:first-child:contains("[x]")) > *,
.ProseMirror ul:not([data-type="taskList"]) > li:has(> *:first-child:contains("[X]")) > * {
  text-decoration: line-through;
  color: #6b7280;
}

[data-theme='dark'] .ProseMirror ul:not([data-type="taskList"]) > li:has(> *:first-child:contains("[x]")) > *,
[data-theme='dark'] .ProseMirror ul:not([data-type="taskList"]) > li:has(> *:first-child:contains("[X]")) > * {
  color: #9ca3af;
}

/* Cancelled tasks (contains [-]) */
.ProseMirror ul:not([data-type="taskList"]) > li:has(> *:first-child:contains("[-]"))::before {
  content: "☒";
  color: #ef4444;  /* Red */
}

/* Scheduled/in-progress tasks (contains [>]) */
.ProseMirror ul:not([data-type="taskList"]) > li:has(> *:first-child:contains("[>]"))::before {
  content: "◷";  /* Clock symbol */
  color: #3b82f6;  /* Blue */
}

/* Important tasks (contains [!]) */
.ProseMirror ul:not([data-type="taskList"]) > li:has(> *:first-child:contains("[!]"))::before {
  content: "☐";
  color: #dc2626;  /* Bright red for important */
  font-weight: 900;
}

/* Nested task indentation */
.ProseMirror ul:not([data-type="taskList"]) ul {
  margin-left: 2em;
  margin-top: 0.5rem;
  border-left: 2px solid rgba(249, 115, 22, 0.2);
  padding-left: 0.5rem;
}

[data-theme='dark'] .ProseMirror ul:not([data-type="taskList"]) ul {
  border-left-color: rgba(251, 146, 60, 0.3);
}

/* Task tags styling (enhance existing) */
.ProseMirror ul:not([data-type="taskList"]) > li a[href^="#"] {
  background-color: rgba(245, 158, 11, 0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-weight: 500;
  text-decoration: none;
}

[data-theme='dark'] .ProseMirror ul:not([data-type="taskList"]) > li a[href^="#"] {
  background-color: rgba(245, 158, 11, 0.15);
}
```

### TR-4: Optional - Font Awesome Integration

**If we want professional icons (Phase 2 enhancement):**

```bash
# Install Font Awesome
cd frontend
npm install @fortawesome/fontawesome-free
```

```typescript
// frontend/src/App.tsx or index.tsx
import '@fortawesome/fontawesome-free/css/all.min.css';
```

```css
/* Use Font Awesome icons instead of Unicode */
.ProseMirror ul:not([data-type="taskList"]) > li::before {
  font-family: "Font Awesome 6 Free";
  font-weight: 400;
  content: "\f0c8";  /* fa-square */
  /* ... other styles ... */
}

.ProseMirror ul:not([data-type="taskList"]) > li[data-checked="true"]::before {
  content: "\f14a";  /* fa-check-square */
  font-weight: 900;
}
```

---

## 7. Implementation Plan

### Phase 1: Fix Whitespace Display (2 hours)

**Goal:** Make indentation visible in editor

**Tasks:**
1. Update Editor.tsx config
   - Add `preserveWhitespace: 'full'` to parseOptions
   - Test with test-kanban.txt

2. Update MarkdownEditor.tsx config
   - Add same preserveWhitespace option
   - Test consistency

3. Add whitespace CSS
   - Add CSS rules to index.css
   - Test with various indentation levels

4. Test round-trip
   - Open file → Edit → Save → Reopen
   - Verify no data loss

**Validation:**
```bash
# Manual test:
# 1. Open test-kanban.txt in editor
# 2. Verify indented content shows indentation
# 3. Verify nested tasks show hierarchy
# 4. Edit and save - verify no data corruption
```

**Deliverable:** Indentation visible in editor

### Phase 2: Basic Task Visibility (2 hours)

**Goal:** Add checkbox icons to tasks

**Tasks:**
1. Add base task CSS
   - Add checkbox ::before content
   - Style with Unicode symbols
   - Test positioning and sizing

2. Add color scheme
   - Orange for open tasks
   - Gray for completed
   - Match app color palette

3. Add hover states
   - Scale effect on hover
   - Color change
   - Smooth transitions

4. Test across themes
   - Light mode
   - Dark mode
   - Ocean theme (if exists)

**Validation:**
```bash
# Manual test:
# 1. Open file with tasks
# 2. Verify checkbox appears before each task
# 3. Verify color matches design
# 4. Hover over tasks - verify hover effect
# 5. Switch to dark mode - verify visibility
```

**Deliverable:** Tasks have checkbox icons

### Phase 3: Task State Styling (2 hours)

**Goal:** Different styles for different task states

**Tasks:**
1. Add completed task detection
   - Use :has() selector for [x] detection
   - Alternative: data-attribute based
   - Apply checkmark icon and opacity

2. Add cancelled task styling
   - Detect [-] marker
   - Apply X icon and red color

3. Add scheduled task styling
   - Detect [>] marker
   - Apply clock icon and blue color

4. Add important task styling
   - Detect [!] marker
   - Apply bold checkbox and red color

**Validation:**
```bash
# Create test file with all states:
* Open task #test
* [x] Completed task #test
* [-] Cancelled task #test
* [>] Scheduled task #test
* [!] Important task #test

# Verify each shows correct icon and color
```

**Deliverable:** Task states visually distinct

### Phase 4: Polish & Accessibility (2 hours)

**Goal:** Smooth UX and accessible

**Tasks:**
1. Add smooth transitions
   - Hover effects
   - State changes
   - 150-200ms duration

2. Improve nested task styling
   - Visual hierarchy
   - Border lines connecting nested items
   - Proper spacing

3. Test keyboard navigation
   - Tab through tasks
   - Visual focus indicators
   - Screen reader compatibility

4. Cross-browser testing
   - Chrome
   - Firefox
   - Safari

**Validation:**
```bash
# Accessibility testing:
# 1. Tab through editor - verify focus visible
# 2. Test with screen reader (if available)
# 3. Verify contrast ratios (WCAG AA minimum)
# 4. Test on different browsers
```

**Deliverable:** Polished, accessible task display

### Phase 5: Edge Cases & Testing (2 hours)

**Goal:** Handle edge cases, ensure robustness

**Tasks:**
1. Test edge cases
   - Very long task text
   - Tasks with many tags
   - Deeply nested tasks (4+ levels)
   - Mixed content (tasks + regular lists)
   - Empty task lines

2. Performance testing
   - Large file (500+ tasks)
   - Measure render time
   - Check for lag on typing

3. Fix any issues found
   - Adjust CSS as needed
   - Optimize selectors
   - Handle edge cases

4. Documentation
   - Add code comments
   - Document CSS classes
   - Update README if needed

**Validation:**
```bash
# Create stress test file with:
# - 500+ tasks
# - Deep nesting (5 levels)
# - Long task text (200+ chars)
# - All task states mixed

# Test:
# 1. Open file - measure load time (should be <2s)
# 2. Edit tasks - verify no lag
# 3. Scroll - verify smooth scrolling
# 4. Search - verify highlighting works
```

**Deliverable:** Robust, performant solution

---

## 8. Testing Strategy

### Manual Test Checklist

**Whitespace Display:**
- [ ] Indented content shows visual indentation
- [ ] 4-space indents display correctly
- [ ] Nested tasks show hierarchy
- [ ] Task details (indented paragraphs) are visually distinguished
- [ ] Code blocks preserve formatting
- [ ] Round-trip editing preserves indentation
- [ ] Works in both Editor.tsx and MarkdownEditor.tsx

**Task Visibility:**
- [ ] Tasks show checkbox icon
- [ ] Checkbox is properly aligned
- [ ] Checkbox color matches design (orange)
- [ ] Hover effect works smoothly
- [ ] Icons are visible in light and dark modes

**Task States:**
- [ ] Open tasks: ☐ orange
- [ ] Completed tasks: ☑ gray + strikethrough + opacity
- [ ] Cancelled tasks: ☒ red
- [ ] Scheduled tasks: ◷ blue
- [ ] Important tasks: ☐ bold red

**Edge Cases:**
- [ ] Long task text wraps correctly
- [ ] Tasks with many tags display well
- [ ] Deeply nested tasks (4+ levels) work
- [ ] Empty task lines handled gracefully
- [ ] Mixed bullets and tasks display correctly
- [ ] Tasks with links/formatting work

**Performance:**
- [ ] Large files (500+ tasks) load quickly
- [ ] No lag when typing
- [ ] Smooth scrolling
- [ ] No memory leaks

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatible (if testable)
- [ ] Contrast ratios meet WCAG AA

**Cross-Browser:**
- [ ] Chrome: all features work
- [ ] Firefox: all features work
- [ ] Safari: all features work

### Automated Tests (Future Enhancement)

```typescript
describe('Editor Whitespace Preservation', () => {
  it('should preserve indentation in displayed content', () => {
    const content = '* Task\n    Detail line';
    // Render editor
    // Assert indentation visible in DOM
  });

  it('should not corrupt data on edit', () => {
    // Load content with indentation
    // Edit task
    // Save
    // Verify markdown unchanged
  });
});

describe('Task Visibility', () => {
  it('should add checkbox icon to tasks', () => {
    // Render editor with task
    // Assert ::before content exists
    // Assert correct icon character
  });

  it('should style completed tasks correctly', () => {
    // Render task with [x]
    // Assert opacity reduced
    // Assert text-decoration line-through
  });
});
```

---

## 9. Success Criteria

### Functional Requirements

**Must Have (P0):**
- ✅ Indentation visible in editor display
- ✅ Tasks have clear checkbox icons
- ✅ Completed tasks visually distinct (opacity + strikethrough)
- ✅ Works in both Editor.tsx and MarkdownEditor.tsx
- ✅ No data loss or corruption
- ✅ Dark mode support

**Should Have (P1):**
- ✅ Different states (cancelled, scheduled, important) styled
- ✅ Hover effects on tasks
- ✅ Nested tasks show visual hierarchy
- ✅ Smooth transitions

**Nice to Have (P2):**
- ⚠️ Font Awesome icons (can be post-launch)
- ⚠️ Customizable colors (future enhancement)
- ⚠️ Animation effects (future enhancement)

### Non-Functional Requirements

**Performance:**
- Editor load time <100ms for typical files
- No lag when typing
- Large files (500+ tasks) render in <2s
- Smooth 60fps scrolling

**Compatibility:**
- Chrome, Firefox, Safari support
- Light and dark mode
- Mobile responsive (if applicable)

**Maintainability:**
- CSS well-organized and commented
- No over-specific selectors
- Easy to customize colors/icons
- Documented in code comments

### Acceptance Criteria

**Gate 1: Whitespace Fixed (End of Phase 1)**
- Open test-kanban.txt
- Indented content shows indentation
- No console errors
- No data corruption on save

**Gate 2: Basic Tasks Visible (End of Phase 2)**
- Tasks show checkbox icons
- Orange color matches design
- Hover effect works
- Dark mode compatible

**Gate 3: All States Work (End of Phase 3)**
- All task states distinguishable
- Colors and icons appropriate
- No visual glitches

**Gate 4: Production Ready (End of Phase 5)**
- All manual tests pass
- Performance acceptable
- Cross-browser compatible
- No regressions in existing features

---

## 10. Risks & Mitigation

### Risk 1: preserveWhitespace Doesn't Work as Expected

**Risk:** TipTap's preserveWhitespace option may not affect visual display
**Impact:** High
**Likelihood:** Medium
**Mitigation:**
- Test early in Phase 1
- Fallback: Use CSS white-space only
- Alternative: Custom TipTap extension for whitespace
- Document which browsers support CSS approach

### Risk 2: :has() Selector Not Supported

**Risk:** CSS :has() selector has limited browser support (Chrome 105+, Firefox 121+, Safari 15.4+)
**Impact:** Medium
**Likelihood:** Low (modern browsers)
**Mitigation:**
- Check browser support: https://caniuse.com/css-has
- Fallback: Use data-attributes set via JS
- Alternative: Simpler detection without :has()
- Progressive enhancement: works in modern browsers

### Risk 3: Performance Degradation

**Risk:** Extra CSS selectors and whitespace preservation may slow rendering
**Impact:** Medium
**Likelihood:** Low
**Mitigation:**
- Profile performance with large files
- Use efficient CSS selectors
- Avoid expensive pseudo-selectors
- Test with 500+ task files
- Optimize if needed

### Risk 4: Conflicts with Existing Extensions

**Risk:** Changes may conflict with TaskList, StarterKit, or other extensions
**Impact:** High
**Likelihood:** Low
**Mitigation:**
- Test incrementally
- Use CSS selectors that don't target data-type="taskList"
- Verify all existing features still work
- Have rollback plan

### Risk 5: Unicode Rendering Inconsistency

**Risk:** Unicode symbols may render differently across OS/browsers
**Impact:** Low
**Likelihood:** Medium
**Mitigation:**
- Test on Windows, macOS, Linux
- Choose widely-supported Unicode characters
- Consider Font Awesome fallback (Phase 2 enhancement)
- Document any known rendering issues
- Provide customization option

---

## Appendix A: Code References

**Key Files to Modify:**
- `frontend/src/components/editor/Editor.tsx:40-94` (add parseOptions)
- `frontend/src/components/editor/MarkdownEditor.tsx:36-84` (add parseOptions)
- `frontend/src/index.css:149-206` (add whitespace & task CSS)

**Files to Reference:**
- `data/Notes/test-kanban.txt` (test file with indentation)
- `frontend/src/services/taskService.ts` (task parsing - no changes needed)
- `frontend/src/components/tasks/TaskTreeItem.tsx` (task display in sidebar)

**External Documentation:**
- TipTap parseOptions: https://tiptap.dev/docs/editor/api/editor
- TipTap whitespace: https://github.com/ueberdosis/tiptap/issues/168
- CSS white-space: https://developer.mozilla.org/en-US/docs/Web/CSS/white-space
- CSS :has() selector: https://developer.mozilla.org/en-US/docs/Web/CSS/:has
- Unicode symbols: https://unicode-table.com/en/blocks/miscellaneous-symbols/

---

## Appendix B: Alternative Approaches Considered

**Alternative 1: Convert to Plain Textarea**
- **Pros:** Complete control, no whitespace issues
- **Cons:** Lose WYSIWYG, lose all rich editing features
- **Decision:** Rejected - too much UX loss

**Alternative 2: Custom TipTap Node for Tasks**
- **Pros:** Full control over rendering
- **Cons:** Complex, high maintenance burden
- **Decision:** Rejected - CSS solution simpler

**Alternative 3: Replace TipTap with CodeMirror**
- **Pros:** Better for technical users, no parsing issues
- **Cons:** Major refactor, worse UX for non-technical users
- **Decision:** Rejected - out of scope

**Alternative 4: Use TipTap TaskList Extension**
- **Pros:** Built-in checkbox support
- **Cons:** Incompatible with NotePlan markdown format
- **Decision:** Rejected - breaks existing functionality

---

## Conclusion

This PRP provides a comprehensive solution for fixing editor indentation display and enhancing task visibility in the NotePlan clone application.

The solution uses:
1. **TipTap's preserveWhitespace option** to preserve whitespace in data
2. **CSS white-space property** to display whitespace visually
3. **CSS ::before pseudo-elements** to add checkbox icons
4. **Unicode symbols** for cross-platform icon support
5. **CSS :has() selector** for intelligent state detection

**Estimated Implementation Time:** 10 hours (1.5 days)

**Confidence Level for One-Pass Success:** 8.5/10

**Reasoning:**
- ✅ Well-researched solutions (TipTap docs, NotePlan implementation)
- ✅ CSS-only approach is straightforward
- ✅ No changes to existing JS/TS logic
- ✅ Clear test plan and validation gates
- ✅ Multiple fallback strategies
- ⚠️ CSS :has() selector support may vary
- ⚠️ Unicode rendering may need adjustment per browser

**Next Steps:**
1. Review and approve PRP
2. Begin Phase 1 (whitespace fix)
3. Validate each phase before proceeding
4. Deploy incrementally if needed
5. Gather user feedback post-launch

---

**PRP Confidence Score: 8.5/10**

This PRP provides excellent context for one-pass implementation:
- ✅ Root causes clearly identified
- ✅ Research-backed solutions with references
- ✅ Detailed implementation plan with code examples
- ✅ Comprehensive test strategy
- ✅ Clear success criteria and validation gates
- ✅ Risk mitigation strategies documented
- ✅ Alternative approaches evaluated
- ⚠️ Some browser compatibility uncertainty (:has() selector)
- ⚠️ Unicode rendering consistency unknown until tested
