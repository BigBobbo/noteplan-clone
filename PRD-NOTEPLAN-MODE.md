# Product Requirements Document: Full NotePlan Mode Implementation

## Executive Summary

This PRD outlines the implementation of a **Full NotePlan Mode** for the markdown editor, removing Tiptap's built-in task handling in favor of custom NotePlan-compatible extensions. This approach will resolve current conflicts between multiple task systems and provide consistent NotePlan-style task management.

**Goal**: Achieve 100% NotePlan syntax compatibility while maintaining all existing custom functionality.

---

## 1. Background & Problem Statement

### Current Issues
1. **Three conflicting task systems** are running simultaneously:
   - Tiptap's built-in TaskList/TaskItem (expects GFM format: `- [ ] Task`)
   - NotePlanTaskExtension (supports NotePlan states: `[-]`, `[>]`, `[!]`)
   - TaskListItemDetector (adds `data-is-task` attribute)

2. **Markdown serialization is broken** due to conflicts between systems
3. **Input rules don't work** (handlers return null)
4. **Type casting hacks** indicate poor integration (`editor.storage as any`)
5. **Inconsistent task rendering** between editor and saved files

### Root Cause
The app attempts to support NotePlan's task syntax (`[] Task`) while Tiptap expects GitHub Flavored Markdown (`- [ ] Task`). The mixing of these incompatible systems causes unpredictable behavior.

---

## 2. Proposed Solution: Full NotePlan Mode

### Core Approach
- **Remove** all Tiptap built-in task handling (TaskList, TaskItem)
- **Implement** custom NotePlan-compatible extensions from scratch
- **Create** a proper markdown serializer for NotePlan format
- **Maintain** all existing features with improved consistency

### NotePlan Task Format Specification

```markdown
# Pure NotePlan Format (Option A - Preferred)
[] Open task
[x] Completed task
[-] Cancelled task
[>] Scheduled/forwarded task
[!] Important/priority task
    Task details here (indented)
    Can span multiple lines
    [] Subtask under main task

# Hybrid Format (Option B - For compatibility)
- [] Open task
- [x] Completed task
- [-] Cancelled task
- [>] Scheduled task
- [!] Important task
```

**Recommendation**: Support both formats on input, serialize to Option A for pure NotePlan compatibility.

---

## 3. Existing Functionality to Maintain

### ✅ All Current Features MUST Be Preserved

| Feature | Current Implementation | Required in New System |
|---------|----------------------|------------------------|
| **Wiki Links** | `[[note-name]]` | ✅ Keep as-is |
| **Task States** | `[]`, `[x]`, `[-]`, `[>]`, `[!]` | ✅ Fully supported |
| **Task Hierarchy** | Indentation-based | ✅ Enhanced support |
| **Task Details** | Indented content under tasks | ✅ Improved parsing |
| **Interactive Checkboxes** | Click to toggle states | ✅ Better UX |
| **Bullet Lists** | `- item`, `* item` | ✅ Clear distinction |
| **Date References** | `>2025-10-08` | ✅ Keep as-is |
| **Tags** | `#tag` | ✅ Keep as-is |
| **Mentions** | `@person` | ✅ Keep as-is |
| **Drag & Drop** | Task reordering | ✅ Keep as-is |
| **Keyboard Shortcuts** | Tab for indent | ✅ Enhanced |
| **Real-time Sync** | WebSocket updates | ✅ Keep as-is |
| **Calendar Integration** | Daily notes | ✅ Keep as-is |
| **Kanban Board** | Task visualization | ✅ Keep as-is |

### ⚠️ Potential Compatibility Challenges

1. **GitHub Integration**: Pure NotePlan format (`[] Task`) won't render as checkboxes on GitHub
   - **Solution**: Add export option for GFM format

2. **Third-party Markdown Tools**: May not recognize NotePlan syntax
   - **Solution**: Provide format converter utility

3. **Migration of Existing Notes**: Mixed format notes need cleanup
   - **Solution**: Automatic format detection and migration tool

---

## 4. Technical Architecture

### 4.1 Extension Architecture

```typescript
// Core Extensions to Implement
├── NotePlanDocument          // Custom document node
├── NotePlanTask              // Task node (replaces TaskItem)
├── NotePlanTaskList          // Task list node (replaces TaskList)
├── NotePlanBulletList        // Clear bullet list without tasks
├── NotePlanMarkdown          // Custom markdown serializer
├── NotePlanInputRules        // Proper input handling
├── NotePlanKeymap            // Keyboard shortcuts
└── NotePlanCheckbox          // Interactive checkbox behavior
```

### 4.2 Node Schema Definition

```typescript
// NotePlanTask node schema
{
  name: 'noteplanTask',
  group: 'block',
  content: 'inline*',
  attrs: {
    state: { default: 'open' }, // open|completed|cancelled|scheduled|important
    indent: { default: 0 },
    hasDetails: { default: false },
    id: { default: null },
    rank: { default: null }
  },
  parseDOM: [{
    tag: 'div[data-noteplan-task]',
    getAttrs: (dom) => ({
      state: dom.getAttribute('data-state'),
      indent: parseInt(dom.getAttribute('data-indent') || '0'),
    })
  }],
  toDOM: (node) => [
    'div',
    {
      'data-noteplan-task': 'true',
      'data-state': node.attrs.state,
      'data-indent': node.attrs.indent,
      class: `noteplan-task noteplan-task-${node.attrs.state}`
    },
    ['span', { class: 'task-checkbox' }],
    ['span', { class: 'task-content' }, 0]
  ]
}
```

### 4.3 Markdown Serialization

```typescript
class NotePlanMarkdownSerializer {
  serialize(doc: Node): string {
    let markdown = '';

    doc.forEach(node => {
      switch (node.type.name) {
        case 'noteplanTask':
          markdown += this.serializeTask(node);
          break;
        case 'bulletList':
          markdown += this.serializeBulletList(node);
          break;
        // ... other nodes
      }
    });

    return markdown;
  }

  serializeTask(node: Node): string {
    const indent = '  '.repeat(node.attrs.indent);
    const state = this.getStateMarker(node.attrs.state);
    const content = node.textContent;

    return `${indent}[${state}] ${content}\n`;
  }

  getStateMarker(state: string): string {
    const markers = {
      'open': ' ',
      'completed': 'x',
      'cancelled': '-',
      'scheduled': '>',
      'important': '!'
    };
    return markers[state] || ' ';
  }
}
```

### 4.4 Parser Implementation

```typescript
class NotePlanMarkdownParser {
  parse(markdown: string): Node {
    const lines = markdown.split('\n');
    const nodes = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Parse NotePlan task
      if (this.isNotePlanTask(line)) {
        const task = this.parseTask(line, lines, i);
        nodes.push(task.node);
        i = task.nextLine - 1; // Skip processed lines
      }
      // Parse bullet
      else if (this.isBullet(line)) {
        nodes.push(this.parseBullet(line));
      }
      // ... other parsing
    }

    return this.buildDocument(nodes);
  }

  isNotePlanTask(line: string): boolean {
    return /^(\s*)\[([xX\s\-!>]?)\]/.test(line);
  }

  parseTask(line: string, allLines: string[], lineNum: number) {
    const match = line.match(/^(\s*)\[([xX\s\-!>]?)\]\s+(.*)$/);
    if (!match) return null;

    const [_, spaces, marker, content] = match;
    const indent = Math.floor(spaces.length / 2);
    const state = this.getStateFromMarker(marker);

    // Parse task details
    const details = this.parseTaskDetails(allLines, lineNum, indent);

    return {
      node: this.createTaskNode(state, content, indent, details),
      nextLine: details.endLine + 1
    };
  }
}
```

---

## 5. Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Remove Tiptap's TaskList and TaskItem extensions
- [ ] Implement NotePlanTask node schema
- [ ] Create NotePlanMarkdownSerializer
- [ ] Create NotePlanMarkdownParser
- [ ] Test basic task creation and serialization

### Phase 2: Core Features (Week 2)
- [ ] Implement all task states (open, completed, cancelled, scheduled, important)
- [ ] Add interactive checkbox behavior
- [ ] Implement task hierarchy with indentation
- [ ] Add task details support
- [ ] Create input rules for task creation

### Phase 3: Enhanced Features (Week 3)
- [ ] Keyboard shortcuts (Tab/Shift-Tab for indentation)
- [ ] Drag and drop support
- [ ] Task state cycling on click
- [ ] Proper distinction between tasks and bullets
- [ ] Wiki link integration

### Phase 4: Migration & Compatibility (Week 4)
- [ ] Create format detection utility
- [ ] Build migration tool for existing notes
- [ ] Add GFM export option
- [ ] Implement import from various formats
- [ ] Comprehensive testing

### Phase 5: Polish & Optimization (Week 5)
- [ ] Performance optimization
- [ ] Edge case handling
- [ ] Documentation
- [ ] User testing
- [ ] Bug fixes

---

## 6. Success Metrics

### Functional Requirements
- ✅ 100% NotePlan syntax compatibility
- ✅ All existing features maintained
- ✅ No type casting hacks (`as any`)
- ✅ Clean markdown serialization/parsing
- ✅ Consistent behavior across all views

### Performance Requirements
- ✅ Editor responds in <100ms for typical operations
- ✅ Handles documents with 1000+ tasks smoothly
- ✅ No memory leaks
- ✅ Efficient diff detection for real-time sync

### Quality Requirements
- ✅ 90%+ test coverage for parser/serializer
- ✅ Zero data loss during format conversion
- ✅ Graceful handling of malformed input

---

## 7. Risks & Mitigations

### Risk 1: Breaking Existing Notes
**Mitigation**:
- Implement backwards compatibility mode
- Create automatic backup before migration
- Provide rollback option

### Risk 2: Loss of GFM Compatibility
**Mitigation**:
- Add import/export converters
- Maintain GFM renderer for preview
- Document format differences

### Risk 3: Complex Edge Cases
**Mitigation**:
- Extensive test suite with real NotePlan files
- Beta testing period
- Gradual rollout with feature flag

---

## 8. Alternative Approaches

### Alternative A: Dual Parser System
Maintain both NotePlan and GFM parsers, auto-detect format:
- **Pros**: Maximum compatibility
- **Cons**: Complex maintenance, potential conflicts

### Alternative B: Progressive Enhancement
Keep Tiptap defaults, layer NotePlan features on top:
- **Pros**: Easier implementation
- **Cons**: Doesn't solve core conflicts

### Alternative C: Fork Tiptap
Create custom Tiptap fork with NotePlan support:
- **Pros**: Deep integration
- **Cons**: Maintenance burden, upgrade difficulties

**Recommendation**: Stick with Option 1 (Full NotePlan Mode) as it provides the cleanest architecture.

---

## 9. Implementation Details

### 9.1 File Structure
```
frontend/src/extensions/noteplan/
├── index.ts                    // Main export
├── nodes/
│   ├── NotePlanTask.ts         // Task node
│   ├── NotePlanTaskList.ts     // Task list container
│   └── NotePlanDocument.ts     // Document node
├── marks/
│   └── NotePlanState.ts        // Task state mark
├── plugins/
│   ├── NotePlanParser.ts       // Markdown parser
│   ├── NotePlanSerializer.ts   // Markdown serializer
│   ├── NotePlanInputRules.ts   // Input handling
│   └── NotePlanKeymap.ts       // Keyboard shortcuts
├── helpers/
│   ├── taskHelpers.ts          // Task utilities
│   ├── indentHelpers.ts        // Indentation logic
│   └── stateHelpers.ts         // State management
└── types/
    └── noteplan.types.ts       // TypeScript definitions
```

### 9.2 CSS Requirements
```css
/* NotePlan-specific styles */
.noteplan-task {
  display: flex;
  align-items: flex-start;
  padding: 2px 0;
}

.noteplan-task-open .task-checkbox::before {
  content: '☐';
}

.noteplan-task-completed .task-checkbox::before {
  content: '☑';
}

.noteplan-task-cancelled {
  text-decoration: line-through;
  opacity: 0.6;
}

.noteplan-task-scheduled {
  color: var(--scheduled-color);
}

.noteplan-task-important {
  font-weight: bold;
  color: var(--important-color);
}

/* Indentation */
.noteplan-task[data-indent="1"] { margin-left: 2rem; }
.noteplan-task[data-indent="2"] { margin-left: 4rem; }
.noteplan-task[data-indent="3"] { margin-left: 6rem; }
```

---

## 10. Testing Strategy

### Unit Tests
- Parser: 50+ test cases for various formats
- Serializer: Round-trip tests
- State management: State transition tests
- Input rules: User interaction tests

### Integration Tests
- Editor initialization with NotePlan content
- Task interaction workflows
- Import/export with different formats
- Real-time sync with WebSocket

### E2E Tests
- Complete task lifecycle
- Migration of existing notes
- Multi-user collaboration
- Performance with large documents

---

## 11. Documentation Requirements

### User Documentation
- NotePlan syntax guide
- Migration guide from GFM
- Keyboard shortcuts reference
- Troubleshooting guide

### Developer Documentation
- Architecture overview
- Extension API reference
- Contributing guidelines
- Test writing guide

---

## 12. Rollout Strategy

### Phase 1: Alpha (Internal Testing)
- Deploy to development environment
- Test with team's notes
- Gather feedback

### Phase 2: Beta (Limited Release)
- Feature flag for opt-in users
- Migration tool available
- Collect metrics and feedback

### Phase 3: General Availability
- Default for new users
- Migration prompt for existing users
- Full documentation published

---

## 13. Conclusion

Implementing Full NotePlan Mode will:
1. **Resolve all current conflicts** between task systems
2. **Provide consistent NotePlan compatibility**
3. **Maintain all existing features**
4. **Improve code maintainability**
5. **Enable future NotePlan-specific features**

The implementation is **feasible** with all existing functionality maintained. The main trade-off is losing native GFM compatibility, which is addressed through import/export converters.

**Estimated Timeline**: 5 weeks
**Estimated Effort**: 1 developer full-time
**Risk Level**: Medium (with proper testing and migration tools)

---

## Appendix A: NotePlan Format Examples

```markdown
# Task Examples
[] Simple task
[x] Completed task
[-] Cancelled task
[>] Scheduled task >2025-10-15
[!] Important task #priority

# Hierarchy Example
[] Parent task
    This is a detail line
    [] Child task 1
        More details here
    [] Child task 2
        [] Grandchild task

# Mixed Content
[] Task with details
    Description of the task

    Requirements:
    - First requirement
    - Second requirement

    [] Subtask 1
    [] Subtask 2

- Regular bullet point (not a task)
* Another bullet style

# Date and Tags
[] Task >2025-10-08 #project @john
    Due tomorrow, assigned to John
    Part of #project
```

## Appendix B: Migration Examples

### Before (Mixed Format)
```markdown
- [ ] GFM style task
[] NotePlan style task
- Regular bullet
```

### After (Pure NotePlan)
```markdown
[] GFM style task
[] NotePlan style task
- Regular bullet
```

### Export to GFM
```markdown
- [ ] GFM style task
- [ ] NotePlan style task
- Regular bullet
```