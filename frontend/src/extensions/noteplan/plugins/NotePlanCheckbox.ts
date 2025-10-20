import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { getNextState } from '../types';

/**
 * NotePlan Checkbox Extension
 *
 * Makes task checkboxes interactive - clicking them cycles through states:
 * Open → Completed → Cancelled → Open
 *
 * Special states (scheduled, important) → Completed
 */

export const NotePlanCheckbox = Extension.create({
  name: 'noteplanCheckbox',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('noteplanCheckbox'),

        props: {
          handleDOMEvents: {
            click: (view, event) => {
              const target = event.target as HTMLElement;

              // Check if we clicked on the checkbox span or the task container
              const checkboxSpan = target.closest('.task-checkbox');
              const taskContainer = target.closest('[data-noteplan-task="true"]');

              if (!checkboxSpan || !taskContainer) {
                return false;
              }

              // Get the position of the task node
              const pos = view.posAtDOM(taskContainer, 0);
              if (pos === null || pos === undefined) {
                return false;
              }

              // Resolve the position and get the node
              const $pos = view.state.doc.resolve(pos);
              const node = view.state.doc.nodeAt(pos);

              if (!node || node.type.name !== 'noteplanTask') {
                return false;
              }

              // Get current state and calculate next state
              const currentState = node.attrs.state;
              const nextState = getNextState(currentState);

              // Create transaction to update the task state
              const tr = view.state.tr;
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                state: nextState,
              });

              view.dispatch(tr);

              // Prevent default and stop propagation
              event.preventDefault();
              event.stopPropagation();
              return true;
            },
          },
        },
      }),
    ];
  },
});
