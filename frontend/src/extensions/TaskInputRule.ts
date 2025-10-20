import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { InputRule } from '@tiptap/core';

/**
 * Input rule to create task list items when typing [] at start of line
 *
 * Detects patterns like:
 * - "[] " -> Creates open task
 * - "[x] " -> Creates completed task
 * - "[-] " -> Creates cancelled task
 * - "[>] " -> Creates scheduled task
 * - "[!] " -> Creates important task
 */
export const TaskInputRule = Extension.create({
  name: 'taskInputRule',

  addInputRules() {
    return [
      // Match task patterns at start of line: [], [x], [-], [>], [!]
      new InputRule({
        find: /^(\[([xX\s\-!>]?)\])\s$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          // Delete the matched text
          tr.delete(start, end);

          // Get the task marker
          const marker = match[2] || ' '; // Default to space for []

          // Create a bullet list with a list item containing the task marker
          const bulletListType = state.schema.nodes.bulletList;
          const listItemType = state.schema.nodes.listItem;
          const paragraphType = state.schema.nodes.paragraph;

          if (!bulletListType || !listItemType || !paragraphType) {
            return null;
          }

          // Create the list structure with the task marker as text
          const taskText = `[${marker}] `;
          const paragraph = paragraphType.create(null, state.schema.text(taskText));
          const listItem = listItemType.create({ isTask: true }, paragraph);
          const bulletList = bulletListType.create(null, listItem);

          // Insert the bullet list
          tr.replaceWith(start, start, bulletList);

          // Set cursor position after the task marker
          const cursorPos = start + 4; // After "[X] "
          tr.setSelection(state.selection.constructor.near(tr.doc.resolve(cursorPos)));

          return tr;
        },
      }),
    ];
  },
});
