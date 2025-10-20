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

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-noteplan-task': 'true',
        'data-state': state,
        'data-indent': indent,
        'data-type': 'noteplanTask',
        class: `noteplan-task noteplan-task-${state}`,
        style: indent > 0 ? `margin-left: ${indent * 2}rem` : undefined,
      }),
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
