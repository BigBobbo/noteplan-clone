# PRP: Fix Editor Auto-formatting Issues - Preserve User Text Integrity

## Overview
The editor must not make any automatic changes to the underlying text. Currently, it's removing whitespace and changing characters, causing major issues. All changes should only come from explicit user actions. Visual representation can change, but the underlying data must remain pristine.

## Problem Statement
1. **Automatic Text Modifications**: The editor is automatically changing text, removing whitespace, and modifying characters
2. **Whitespace/Indentation Loss**: Indentation for task details is being stripped or modified
3. **Character Escaping**: Square brackets are being escaped (`[]` → `\[\]`), causing issues with task markers
4. **List Conversion Issues**: Text is being auto-converted to lists when not intended
5. **Next Line Assumptions**: Editor assumes next line after task is also a task

## Requirements
1. **No Automatic Text Changes**: The editor should NEVER modify the underlying text automatically
2. **Task Creation**: Only `[]` at the start of a line should create a task with checkbox
3. **Bullet Points**: `-` or `*` at line start should create bullet points (not tasks)
4. **Indentation**: Support 4 spaces or tab for indentation
5. **Task Details**: Indented lines after tasks should be treated as task details (visible in Tasks and Kanban tabs)
6. **No Auto-continuation**: Don't assume the next line is a task unless it starts with task characters
7. **Preserve All Whitespace**: Maintain exact spacing and indentation as entered by user

## Research Findings

### Current Implementation Issues
Based on codebase analysis:

1. **WikiLinkMarkdown.ts** (lines 5-48): Pre/post processing is modifying text:
   - Converts task markers to bullet list syntax in preProcess
   - Strips backslashes and modifies format in postProcess

2. **TaskInputRule.ts** (lines 15-61): Auto-creates list structure when typing `[]`:
   - Automatically wraps tasks in bullet lists
   - May trigger unintended conversions

3. **preserveTaskDetailsIndentation.ts** (lines 92-173): Attempts to fix indentation after the fact:
   - Converts between 2-space (TipTap) and 4-space (NotePlan) indentation
   - Strips trailing backslashes that TipTap adds

4. **MarkdownEditor.tsx** (lines 119-131): Multiple layers of text processing:
   - Gets markdown from editor
   - Runs preserveTaskDetailsIndentation
   - Runs unescapeTaskBracketsSimple
   - Runs wikiLinkMarkdownTransformer.postProcess

### Tiptap/ProseMirror Configuration Options

From documentation research (https://tiptap.dev/docs/editor/core-concepts/schema):

1. **parseOptions.preserveWhitespace**: Set to 'full' to preserve all whitespace
2. **enableInputRules**: Can be disabled to prevent automatic conversions
3. **enablePasteRules**: Can be disabled to prevent paste transformations
4. **Node schema whitespace**: Controls how whitespace is parsed in nodes

## Implementation Plan

### Phase 1: Disable Automatic Text Transformations

1. **Update Editor Configuration**
   - Set `parseOptions.preserveWhitespace: 'full'`
   - Disable problematic input rules
   - Configure markdown extension properly

2. **Simplify Text Processing Pipeline**
   - Remove unnecessary pre/post processing
   - Eliminate multiple transformation layers
   - Preserve raw text integrity

### Phase 2: Fix Task/Bullet Handling

1. **Rewrite TaskInputRule**
   - Only trigger on explicit `[]` at line start
   - Don't auto-wrap in lists
   - Don't make assumptions about next lines

2. **Update Markdown Configuration**
   - Disable automatic list conversions
   - Preserve exact user input
   - Handle tasks and bullets distinctly

### Phase 3: Preserve Indentation

1. **Remove Indentation Conversions**
   - Stop converting between 2-space and 4-space
   - Preserve exact user indentation
   - Use CSS for visual representation only

2. **Fix Task Details**
   - Parse indented content correctly
   - Don't modify indentation levels
   - Ensure details appear in Tasks/Kanban views

## Implementation Details

### 1. Update MarkdownEditor.tsx
```typescript
// Key changes:
const editor = useEditor({
  parseOptions: {
    preserveWhitespace: 'full',  // Preserve ALL whitespace
  },
  extensions: [
    StarterKit.configure({
      // Disable automatic list item creation
      bulletList: {
        itemTypeName: 'listItem',
        HTMLAttributes: {
          class: 'list-disc ml-4',
        },
      },
      // Keep lists but don't auto-convert
      orderedList: false,  // Disable numbered lists (not needed)
    }),
    // ... other extensions
    Markdown.configure({
      html: true,
      tightLists: false,
      bulletListMarker: null,  // Don't auto-add markers
      breaks: true,
      transformPastedText: false,  // Don't transform pasted text
      transformCopiedText: false,  // Don't transform copied text
      linkify: false,
    }),
  ],
  // Disable automatic input rules that interfere
  enableInputRules: ['horizontalRule'],  // Only allow specific rules
  enablePasteRules: false,  // Disable all paste transformations
  onUpdate: ({ editor }) => {
    // Get raw markdown without any transformations
    const markdown = editor.storage.markdown.getMarkdown();
    // Save exactly what's in the editor
    onChange(markdown);
  },
});
```

### 2. Simplify WikiLinkMarkdown.ts
```typescript
// Remove all text modifications, only handle wiki links
export const wikiLinkMarkdownTransformer = {
  preProcess: (markdown: string): string => {
    // Only process wiki links, don't modify tasks or bullets
    return markdown;
  },
  postProcess: (markdown: string): string => {
    // Don't escape or modify any brackets
    return markdown;
  },
};
```

### 3. Create New TaskBulletInputRule.ts
```typescript
// Simpler, more controlled input rule
export const TaskBulletInputRule = Extension.create({
  name: 'taskBulletInputRule',

  addInputRules() {
    return [
      // Only convert [] at start of line to task
      new InputRule({
        find: /^(\[\])\s$/,
        handler: ({ state, range }) => {
          // Just add the task marker, don't create lists
          // Let the user control structure
        },
      }),
    ];
  },
});
```

### 4. Update taskService.ts
```typescript
// Ensure task parsing respects exact indentation
export const calculateIndentLevel = (line: string): number => {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  // Count exact spaces/tabs as entered by user
  const spaces = match[1];
  // Don't convert or normalize
  return spaces.length / 4;  // 4 spaces = 1 level
};
```

## Validation Steps

### Test Cases
1. **Task Creation**
   ```markdown
   [] Task 1
   Not a task
   [] Task 2
   ```
   - Verify only lines with `[]` create tasks
   - Verify "Not a task" remains plain text

2. **Bullet Points**
   ```markdown
   - Bullet 1
   * Bullet 2
   Not a bullet
   ```
   - Verify bullets show as bullets, not tasks
   - Verify no checkboxes appear

3. **Indentation Preservation**
   ```markdown
   [] Task
       Detail line 1 (4 spaces)
       Detail line 2 (4 spaces)
   		Detail line 3 (tab)
   ```
   - Verify exact indentation is preserved
   - Verify details appear in Tasks tab

4. **No Auto-continuation**
   ```markdown
   [] Task 1
   This should not be a task
   ```
   - Verify second line is not converted to task

5. **Whitespace Preservation**
   ```markdown
   [] Task    with    extra    spaces
       Indented    with    spaces
   ```
   - Verify all spaces are preserved

### Validation Commands
```bash
# 1. Type check
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend
npx tsc --noEmit

# 2. Build test
npm run build

# 3. Test with actual files
# Create test file with exact formatting
cat > ~/Documents/notes/Notes/editor-test.txt << 'EOF'
[] Task with exact spacing
    This has 4 spaces
        This has 8 spaces
- Bullet point
* Another bullet
[] Another task
Plain text line
EOF

# 4. Verify in running app
# Open http://localhost:5173
# Edit the test file
# Check Tasks and Kanban tabs
# Verify no automatic changes occur
```

### Success Criteria
1. ✅ No automatic text modifications
2. ✅ Tasks only created with `[]`
3. ✅ Bullets remain as bullets
4. ✅ Exact indentation preserved
5. ✅ Task details visible in Tasks/Kanban
6. ✅ No auto-continuation of tasks
7. ✅ All whitespace preserved
8. ✅ Test file renders correctly

## Error Handling

### Known Issues to Address
1. **Bracket Escaping**: Remove all escape character handling for brackets
2. **Indentation Conversion**: Stop converting between different indentation formats
3. **List Wrapping**: Don't auto-wrap content in lists
4. **Continuation Markers**: Remove trailing backslashes TipTap adds

### Rollback Plan
If issues occur:
1. Git stash changes
2. Restore original files
3. Document specific failure points
4. Iterate on solution

## Files to Modify
1. `/frontend/src/components/editor/MarkdownEditor.tsx` - Main editor configuration
2. `/frontend/src/extensions/WikiLinkMarkdown.ts` - Simplify transformations
3. `/frontend/src/extensions/TaskInputRule.ts` - Rewrite or replace
4. `/frontend/src/utils/preserveTaskDetailsIndentation.ts` - May be removed/simplified
5. `/frontend/src/utils/unescapeTaskBrackets.ts` - May be removed
6. `/frontend/src/components/editor/Editor.tsx` - Update if needed
7. `/frontend/src/services/taskService.ts` - Ensure correct parsing

## References
- Tiptap parseOptions: https://tiptap.dev/docs/editor/api/editor
- Input Rules: https://tiptap.dev/docs/editor/api/input-rules
- ProseMirror whitespace: https://prosemirror.net/docs/ref/#model.ParseOptions
- Existing test file: `~/Documents/notes/Notes/task-vs-bullet-test.txt`

## Quality Score: 8/10
High confidence in success due to:
- Comprehensive understanding of current issues
- Clear implementation path
- Specific configuration options identified
- Test cases defined
- Rollback plan in place

Points deducted for:
- Complex interaction between multiple components
- May require iterative refinement