import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { getStateFromMarker } from '../types';

/**
 * NotePlan Parser Extension
 *
 * This extension handles parsing of markdown content to properly
 * convert NotePlan task format into noteplanTask nodes.
 *
 * It intercepts the content setting to pre-parse NotePlan tasks.
 */
export const NotePlanParser = Extension.create({
  name: 'noteplanParser',

  priority: 10000, // VERY high priority to run before EVERYTHING

  addOptions() {
    return {
      parseOnLoad: true,
    };
  },

  onBeforeCreate() {
    // This runs BEFORE the editor is created
    console.log('[NotePlanParser] onBeforeCreate - Extension loading');
  },

  onCreate() {
    const editor = this.editor;
    console.log('[NotePlanParser] onCreate - Installing setContent override');

    // Override at the next tick to ensure editor is ready
    setTimeout(() => {
      // Store the original setContent method
      const originalSetContent = editor.commands.setContent;

      // Override setContent to pre-process NotePlan tasks
      editor.commands.setContent = (content, emitUpdate, parseOptions) => {
        // If content is a string (markdown), parse NotePlan tasks
        if (typeof content === 'string') {
          console.log('[NotePlanParser] Intercepted setContent with string content');
          console.log('[NotePlanParser] Content length:', content.length);
          console.log('[NotePlanParser] Content preview:', content.substring(0, 200));

          const processedContent = parseNotePlanMarkdown(content, editor.schema);
          console.log('[NotePlanParser] Processed nodes:', processedContent.content?.length);

          return originalSetContent.call(editor.commands, processedContent, emitUpdate, parseOptions);
        }

        console.log('[NotePlanParser] setContent called with non-string content, passing through');
        // Otherwise, use original behavior
        return originalSetContent.call(editor.commands, content, emitUpdate, parseOptions);
      };

      console.log('[NotePlanParser] setContent override installed');
    }, 0);
  },
});

/**
 * Parse NotePlan markdown and convert to ProseMirror JSON
 */
function parseNotePlanMarkdown(markdown: string, schema: any): any {
  const lines = markdown.split('\n');
  const nodes: any[] = [];

  console.log('[parseNotePlanMarkdown] Total lines:', lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a NotePlan task
    const taskMatch = line.match(/^(\s*)\[([xX\s\-!>]?)\]\s+(.+)$/);

    if (taskMatch) {
      const [, spaces, marker, content] = taskMatch;
      const indent = Math.floor(spaces.length / 2);
      const state = getStateFromMarker(marker.trim() || ' ');

      console.log('[parseNotePlanMarkdown] Found task:', { line, state, content });

      // Create a noteplanTask node
      if (schema.nodes.noteplanTask) {
        nodes.push({
          type: 'noteplanTask',
          attrs: {
            state,
            indent,
          },
          content: content.trim() ? [
            {
              type: 'text',
              text: content.trim(),
            },
          ] : undefined,
        });
      }
    } else if (line.trim()) {
      // Handle other content types

      // Heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const [, hashes, content] = headingMatch;
        nodes.push({
          type: 'heading',
          attrs: {
            level: hashes.length,
          },
          content: [
            {
              type: 'text',
              text: content.trim(),
            },
          ],
        });
        continue;
      }

      // Bullet list item
      const bulletMatch = line.match(/^(\s*)-\s+(.+)$/);
      if (bulletMatch) {
        const [, , content] = bulletMatch;
        // For now, create paragraph - proper list handling would be more complex
        nodes.push({
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `- ${content.trim()}`,
            },
          ],
        });
        continue;
      }

      // Regular paragraph
      nodes.push({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: line,
          },
        ],
      });
    } else {
      // Empty line - add empty paragraph for spacing
      nodes.push({
        type: 'paragraph',
      });
    }
  }

  return {
    type: 'doc',
    content: nodes,
  };
}
