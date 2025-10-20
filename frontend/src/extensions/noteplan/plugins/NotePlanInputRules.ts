import { Extension } from '@tiptap/core';
import { InputRule } from '@tiptap/core';
import { getStateFromMarker } from '../types';

/**
 * NotePlan Input Rules Extension
 *
 * Automatically converts typed text into NotePlan tasks:
 * - [] → Open task
 * - [x] or [X] → Completed task
 * - [-] → Cancelled task
 * - [>] → Scheduled task
 * - [!] → Important task
 *
 * Also supports indentation with spaces at the beginning of the line.
 */

export const NotePlanInputRules = Extension.create({
  name: 'noteplanInputRules',

  addInputRules() {
    return [
      new InputRule({
        find: /^(\s*)\[([xX\s\-!>]?)\]\s$/,
        handler: ({ state, range, match, commands }) => {
          const [fullMatch, spaces, marker] = match;
          const indent = Math.floor((spaces?.length || 0) / 2);
          const taskState = getStateFromMarker(marker?.trim() || ' ');

          const { tr } = state;
          const start = range.from;
          const end = range.to;

          // Delete the matched text
          tr.delete(start, end);

          // Insert a noteplanTask node
          const node = state.schema.nodes.noteplanTask?.create({
            state: taskState,
            indent,
          });

          if (node) {
            tr.insert(start, node);
            // Place cursor inside the task
            tr.setSelection(
              state.selection.constructor.near(tr.doc.resolve(start + 1))
            );
          }
        },
      }),
    ];
  },
});
