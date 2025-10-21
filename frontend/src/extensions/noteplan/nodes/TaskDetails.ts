import { Node, mergeAttributes } from '@tiptap/core';

export interface TaskDetailsAttrs {
  taskState?: 'open' | 'completed' | 'cancelled' | 'scheduled' | 'important';
}

/**
 * TaskDetails Node
 *
 * Represents the indented description content below a NotePlanTask.
 * Renders as a blockquote-style visual element with:
 * - Left border (color matches parent task state)
 * - Background shading
 * - Indentation
 * - Supports rich block content (paragraphs, lists, etc.)
 *
 * Format in markdown:
 * - [ ] Task title
 *     Task description paragraph
 *     Another paragraph
 *     - Bullet point
 */
export const TaskDetails = Node.create({
  name: 'taskDetails',

  group: 'block',

  content: 'block+', // Allow paragraphs, lists, code blocks, etc.

  defining: true, // Prevent unwanted transformations during paste

  addAttributes() {
    return {
      taskState: {
        default: 'open',
        parseHTML: (element) => element.getAttribute('data-task-state') || 'open',
        renderHTML: (attributes) => {
          return {
            'data-task-state': attributes.taskState,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-task-details]',
        priority: 51,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const taskState = node.attrs.taskState || 'open';

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-task-details': 'true',
        'data-task-state': taskState,
        class: `task-details task-details-${taskState}`,
      }),
      0, // Content slot
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          // Serialize as indented content (4 spaces = 1 task detail level)
          const indent = '    '; // 4 spaces for task details

          // Render each child block with indentation
          node.content.forEach((child: any, index: number) => {
            state.write(indent);
            state.renderInline(child);
            state.write('\n');
          });

          state.closeBlock(node);
        },
      },
    };
  },
});
