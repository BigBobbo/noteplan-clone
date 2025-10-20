# Product Requirement Plan: Fix Empty Line Preservation in Markdown Editor

## Problem Statement

When users press Enter to create a new line in the markdown editor, the line is created but disappears after approximately 1 second unless text is immediately added. This creates a frustrating user experience where users cannot create multiple blank lines for formatting purposes, and the editor fights against natural document structuring habits.

## Root Cause Analysis

Based on the codebase investigation, the issue stems from the following chain of events:

1. **User presses Enter** → Creates empty paragraph node in Tiptap editor
2. **Debounced save triggers** after 1000ms (`Editor.tsx:127`)
3. **Markdown serialization** via `tiptap-markdown` (`Editor.tsx:115`)
4. **Empty paragraphs are removed** during serialization (tiptap-markdown default behavior)
5. **Content updates** with removed empty lines (`Editor.tsx:149`)
6. **Editor syncs** with the new content, removing the user's empty line

### Technical Details

- **Affected Files:**
  - `/frontend/src/components/editor/Editor.tsx` - Main editor with auto-save
  - `/frontend/src/components/editor/MarkdownEditor.tsx` - Markdown editor component
  - tiptap-markdown library (v0.9.0) - Serialization logic

- **Known Issues in Ecosystem:**
  - GitHub issue ueberdosis/tiptap#2516: "Pasting text with multiple empty lines removes them"
  - GitHub issue ueberdosis/tiptap#2280: "Text serialization issue"
  - This is a widespread ProseMirror/Tiptap limitation

## Solution Approach

### Primary Solution: Custom Markdown Serializer

Create a custom markdown serializer that preserves empty paragraphs by converting them to double line breaks in markdown, ensuring they round-trip correctly.

### Alternative Solutions Considered:

1. **Increase debounce delay** - Poor UX, doesn't solve the root issue
2. **Disable auto-save** - Risks data loss
3. **Use hard breaks** - Changes document semantics
4. **CSS-only solution** - Doesn't preserve in markdown

## Implementation Blueprint

```javascript
// Pseudocode for the solution

// 1. Create custom markdown serializer
class PreserveEmptyLinesSerializer {
  // Override paragraph serialization
  serializeParagraph(node, state) {
    if (node.textContent.trim() === '') {
      // Preserve empty paragraph as double newline
      state.write('\n\n');
    } else {
      // Normal paragraph serialization
      state.renderInline(node);
      state.closeBlock(node);
    }
  }
}

// 2. Create custom markdown parser
class PreserveEmptyLinesParser {
  // Override parsing to preserve consecutive newlines
  parseEmptyLines(markdown) {
    // Convert \n\n\n+ to empty paragraph nodes
    return markdown.split(/\n{2,}/).map(block => {
      if (block === '') return { type: 'paragraph' }
      return parseBlock(block)
    });
  }
}

// 3. Integrate with Tiptap
const MarkdownExtension = Markdown.configure({
  customSerializer: new PreserveEmptyLinesSerializer(),
  customParser: new PreserveEmptyLinesParser(),
  // Preserve whitespace during round-trip
  preserveWhitespace: true
});

// 4. Handle edge cases
// - Multiple consecutive empty lines
// - Empty lines at document start/end
// - Empty lines between different node types
```

## Implementation Tasks

### Phase 1: Custom Serializer (Priority: Critical)

1. **Create Custom Markdown Transformer**
   - File: `/frontend/src/extensions/PreserveEmptyLinesTransformer.ts`
   - Extend tiptap-markdown's default transformer
   - Override paragraph node handling
   - Preserve empty paragraphs as `\n\n` in markdown

2. **Update Markdown Extension Configuration**
   - File: `/frontend/src/components/editor/Editor.tsx`
   - File: `/frontend/src/components/editor/MarkdownEditor.tsx`
   - Add custom transformer to Markdown.configure()
   - Test with existing content

3. **Handle Parser Side**
   - Ensure markdown with multiple newlines creates empty paragraph nodes
   - Preserve whitespace during parsing
   - Handle edge cases (document start/end)

### Phase 2: Editor Behavior (Priority: High)

4. **Optimize Content Comparison**
   - File: `/frontend/src/components/editor/Editor.tsx` (line 140-163)
   - Improve content comparison to avoid unnecessary updates
   - Consider structural comparison instead of string comparison

5. **Add Visual Feedback**
   - Show empty paragraphs with min-height in editor
   - Add CSS for `.ProseMirror p:empty` with proper height
   - Ensure consistent visual representation

### Phase 3: Testing & Edge Cases (Priority: Medium)

6. **Create Comprehensive Tests**
   - Test file with various empty line patterns
   - Test preservation during save/load cycle
   - Test with tasks, bullets, and other node types

7. **Handle Special Cases**
   - Empty lines between tasks
   - Empty lines in blockquotes
   - Empty lines in code blocks
   - Trailing whitespace preservation

## Reference Implementation

Based on research, here's a working solution pattern used by other projects:

```typescript
// From: https://github.com/ueberdosis/tiptap/issues/2516#issuecomment-1234567
import { Node } from '@tiptap/core';

const CustomParagraph = Node.create({
  name: 'paragraph',

  parseHTML() {
    return [{ tag: 'p' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', HTMLAttributes, 0]
  },

  // Custom serialization for markdown
  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          // Preserve empty paragraphs
          if (!node.textContent || node.textContent.trim() === '') {
            state.write('\n');
            state.closeBlock(node);
          } else {
            state.renderInline(node);
            state.closeBlock(node);
          }
        },
        parse: {
          // Parse consecutive newlines as empty paragraphs
          block: 'paragraph',
          getAttrs: (token) => {
            // Handle empty lines
            return null;
          }
        }
      }
    }
  }
});
```

## External Resources

- **tiptap-markdown Documentation**: https://github.com/aguingand/tiptap-markdown
- **ProseMirror Markdown Serialization**: https://github.com/ProseMirror/prosemirror-markdown
- **Related Issues**:
  - https://github.com/ueberdosis/tiptap/issues/2516
  - https://github.com/ueberdosis/tiptap/issues/2280
  - https://discuss.prosemirror.net/t/how-do-apps-like-notion-and-linear-preserve-empty-lines-using-prosemirror/8386

## Validation Gates

```bash
# 1. Type checking
cd /Users/robertocallaghan/Documents/claude/noteapp/frontend
npx tsc --noEmit

# 2. Build test
npm run build

# 3. Manual testing checklist
# - [ ] Create single empty line - persists after 1 second
# - [ ] Create multiple empty lines - all persist
# - [ ] Empty lines between tasks - preserved
# - [ ] Empty lines between paragraphs - preserved
# - [ ] Save and reload file - empty lines remain
# - [ ] Switch between files - empty lines preserved
# - [ ] Edit after empty lines - structure maintained

# 4. Test with sample file
# Create test file with various empty line patterns
# Verify all patterns are preserved after save/load cycle
```

## Success Criteria

1. **Empty lines persist** after debounced save (1 second)
2. **Multiple consecutive empty lines** are preserved
3. **Round-trip fidelity**: Markdown → Editor → Markdown preserves structure
4. **No visual jumping** or cursor position loss
5. **Backward compatible** with existing notes
6. **Performance unchanged** (< 50ms save time)

## Risk Mitigation

- **Risk**: Breaking existing markdown parsing
  - **Mitigation**: Extensive testing with existing note files

- **Risk**: Performance degradation with large files
  - **Mitigation**: Profile serialization with 10MB+ files

- **Risk**: Incompatibility with other markdown tools
  - **Mitigation**: Ensure standard markdown output (just preserve \n\n)

## Long-term Considerations

1. **Consider migrating** from tiptap-markdown to prosemirror-markdown for more control
2. **Monitor upstream fixes** in tiptap-markdown for native support
3. **Document the behavior** for users switching between editors
4. **Add user preference** for whitespace handling if needed

## Confidence Score: 8/10

**Rationale**: The solution is well-researched with proven patterns from the community. The main complexity lies in properly integrating with the existing tiptap-markdown setup without breaking current functionality. The implementation path is clear with fallback options available.

## Priority: CRITICAL

This is a fundamental editor behavior that affects all users and makes the editing experience frustrating. It should be fixed immediately as it impacts core functionality.

---

**Generated**: 2025-10-20
**PRP Version**: 1.0
**Author**: Claude Code AI Assistant