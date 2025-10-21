import { Node, mergeAttributes } from '@tiptap/core';
import { type NotePlanTaskAttrs, getMarkerFromState } from '../types';

/**
 * NotePlanTask node
 *
 * This node represents a NotePlan-style task with the format:
 * [] Open task
 * [x] Completed task
 * [-] Cancelled task
 * [>] Scheduled task
 * [!] Important task
 *
 * Unlike Tiptap's TaskItem which expects GFM format (- [ ] Task),
 * this node handles pure NotePlan format ([] Task) without the leading dash.
 */
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteplanTask: {
      /**
       * Toggle a NotePlan task
       */
      toggleNotePlanTask: () => ReturnType;
      /**
       * Set NotePlan task state
       */
      setNotePlanTaskState: (state: NotePlanTaskAttrs['state']) => ReturnType;
      /**
       * Cycle NotePlan task state
       */
      cycleNotePlanTaskState: () => ReturnType;
    };
  }
}

export const NotePlanTask = Node.create({
  name: 'noteplanTask',

  group: 'block',

  content: 'inline*',

  defining: true,

  addAttributes() {
    return {
      state: {
        default: 'open' as const,
        parseHTML: (element) => {
          const state = element.getAttribute('data-state');
          return state || 'open';
        },
        renderHTML: (attributes) => {
          return {
            'data-state': attributes.state,
          };
        },
      },
      indent: {
        default: 0,
        parseHTML: (element) => {
          const indent = element.getAttribute('data-indent');
          return indent ? parseInt(indent, 10) : 0;
        },
        renderHTML: (attributes) => {
          return {
            'data-indent': attributes.indent,
          };
        },
      },
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-id': attributes.id,
          };
        },
      },
      hasDetails: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-has-details') === 'true',
        renderHTML: (attributes) => {
          if (!attributes.hasDetails) {
            return {};
          }
          return {
            'data-has-details': 'true',
          };
        },
      },
      detailsPreview: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-details-preview') || '',
        renderHTML: (attributes) => {
          if (!attributes.detailsPreview) {
            return {};
          }
          return {
            'data-details-preview': attributes.detailsPreview,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-noteplan-task]',
        priority: 51,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const state = node.attrs.state;
    const indent = node.attrs.indent || 0;
    const hasDetails = node.attrs.hasDetails;
    const detailsPreview = node.attrs.detailsPreview;

    const children = [
      [
        'span',
        {
          class: 'task-checkbox',
          contenteditable: 'false',
        },
        `[${getMarkerFromState(state)}]`,
      ],
      ' ',
      [
        'span',
        {
          class: 'task-content',
        },
        0,
      ],
    ];

    // Add details indicator if task has details
    if (hasDetails) {
      children.push(' ');
      children.push([
        'span',
        {
          class: 'task-details-indicator',
          title: detailsPreview,
          contenteditable: 'false',
        },
        '📝',
      ]);
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-noteplan-task': 'true',
        'data-state': state,
        'data-indent': indent,
        'data-type': 'noteplanTask',
        'data-has-details': hasDetails ? 'true' : 'false',
        'data-details-preview': detailsPreview || '',
        class: `noteplan-task noteplan-task-${state}${hasDetails ? ' has-details' : ''}`,
        style: indent > 0 ? `margin-left: ${indent * 2}rem` : undefined,
      }),
      ...children,
    ];
  },

  addCommands() {
    return {
      toggleNotePlanTask:
        () =>
        ({ commands }) => {
          return commands.toggleNode(this.name, 'paragraph');
        },
      setNotePlanTaskState:
        (state) =>
        ({ tr, state: editorState }) => {
          const { selection } = editorState;
          const { $from } = selection;
          const node = $from.node();

          if (node.type.name === this.name) {
            tr.setNodeMarkup($from.before(), undefined, {
              ...node.attrs,
              state,
            });
            return true;
          }

          return false;
        },
      cycleNotePlanTaskState:
        () =>
        ({ tr, state: editorState }) => {
          const { selection } = editorState;
          const { $from } = selection;
          const node = $from.node();

          if (node.type.name !== this.name) {
            return false;
          }

          const currentState = node.attrs.state;
          let nextState: NotePlanTaskAttrs['state'];

          switch (currentState) {
            case 'open':
              nextState = 'completed';
              break;
            case 'completed':
              nextState = 'cancelled';
              break;
            case 'cancelled':
              nextState = 'open';
              break;
            case 'scheduled':
            case 'important':
              nextState = 'completed';
              break;
            default:
              nextState = 'open';
          }

          tr.setNodeMarkup($from.before(), undefined, {
            ...node.attrs,
            state: nextState,
          });

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => {
        return this.editor.commands.cycleNotePlanTaskState();
      },
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        const node = $from.node();

        // If we're in a noteplanTask, create a new one below
        if (node.type.name === this.name) {
          return editor.commands.insertContentAt(
            $from.after(),
            {
              type: this.name,
              attrs: {
                state: 'open',
                indent: node.attrs.indent || 0,
              },
            }
          );
        }

        return false;
      },
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty) {
          return false;
        }

        const node = $from.node();

        // If we're at the start of an empty task, convert to paragraph
        if (
          node.type.name === this.name &&
          $from.parentOffset === 0 &&
          node.content.size === 0
        ) {
          return editor.commands.setNode('paragraph');
        }

        return false;
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const indent = '  '.repeat(node.attrs.indent || 0);
          const marker = getMarkerFromState(node.attrs.state);
          // GFM format: - [marker] text
          state.write(`${indent}- [${marker}] `);
          state.renderInline(node);
          state.closeBlock(node);
        },
      },
    };
  },
});
