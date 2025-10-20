import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

/**
 * NotePlanTaskExtension - Adds NotePlan-specific task states to standard GFM tasks
 *
 * Supports:
 * - [ ] Open task (standard GFM)
 * - [x] Completed task (standard GFM)
 * - [-] Cancelled task (NotePlan)
 * - [>] Scheduled/forwarded task (NotePlan)
 * - [!] Important/priority task (NotePlan)
 */

interface TaskState {
  type: 'open' | 'completed' | 'cancelled' | 'scheduled' | 'important';
  marker: string;
}

function getTaskState(text: string): TaskState {
  const trimmed = text.trim();

  // Check for GFM task format with state markers
  const match = trimmed.match(/^-\s+\[([xX\-\>!\s]?)\]/);
  if (!match) return { type: 'open', marker: '' };

  const state = match[1].trim();

  switch (state.toLowerCase()) {
    case 'x':
      return { type: 'completed', marker: 'x' };
    case '-':
      return { type: 'cancelled', marker: '-' };
    case '>':
      return { type: 'scheduled', marker: '>' };
    case '!':
      return { type: 'important', marker: '!' };
    default:
      return { type: 'open', marker: ' ' };
  }
}

export const NotePlanTaskExtension = Extension.create({
  name: 'noteplanTask',

  addProseMirrorPlugins() {
    return [
      // Plugin for adding state decorations
      new Plugin({
        key: new PluginKey('noteplanTaskState'),

        props: {
          decorations(state) {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, pos) => {
              // Check for task items
              if (node.type.name === 'taskItem') {
                // Get the text content
                let textContent = '';
                node.content.forEach((child) => {
                  if (child.isText) {
                    textContent += child.text;
                  }
                });

                // Get task state
                const taskState = getTaskState(textContent);

                // Add decoration for custom states
                if (taskState.type !== 'open') {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      'data-task-state': taskState.type,
                      class: `task-state-${taskState.type}`,
                    })
                  );
                }
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),

      // Plugin for interactive checkbox behavior
      new Plugin({
        key: new PluginKey('noteplanTaskInteraction'),

        props: {
          handleDOMEvents: {
            click: (view, event) => {
              const target = event.target as HTMLElement;

              // Check if click was on checkbox input
              const checkbox = target.closest('input[type="checkbox"]');
              if (!checkbox) return false;

              // Find the task item
              const taskItem = checkbox.closest('li[data-type="taskItem"]');
              if (!taskItem) return false;

              // Get position in document
              const pos = view.posAtDOM(taskItem, 0);
              if (pos === null || pos === undefined) return false;

              // Get the node
              const $pos = view.state.doc.resolve(pos);
              const node = $pos.node();

              if (node.type.name !== 'taskItem') return false;

              // Get current text
              let textContent = '';
              node.content.forEach((child) => {
                if (child.isText && child.text) {
                  textContent += child.text;
                }
              });

              // Get current state and determine next state
              const currentState = getTaskState(textContent);
              let newMarker = '';

              // Cycle through states: open → completed → cancelled → open
              // Special states (scheduled, important) → completed
              switch (currentState.type) {
                case 'open':
                  newMarker = 'x';
                  break;
                case 'completed':
                  newMarker = '-';
                  break;
                case 'cancelled':
                  newMarker = ' ';
                  break;
                case 'scheduled':
                case 'important':
                  newMarker = 'x';
                  break;
              }

              // Update the text
              const newText = textContent.replace(
                /^(-\s+\[)[xX\-\>!\s]?(\])/,
                `$1${newMarker}$2`
              );

              // Create transaction
              const tr = view.state.tr;
              const textStart = pos + 1; // +1 to get inside the taskItem
              const textEnd = textStart + textContent.length;

              tr.replaceRangeWith(
                textStart,
                textEnd,
                view.state.schema.text(newText)
              );

              view.dispatch(tr);

              // Prevent default checkbox behavior
              event.preventDefault();
              return true;
            },
          },
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      // Tab/Shift-Tab for indentation in task lists
      Tab: () => this.editor.commands.sinkListItem('taskItem'),
      'Shift-Tab': () => this.editor.commands.liftListItem('taskItem'),
    };
  },
});