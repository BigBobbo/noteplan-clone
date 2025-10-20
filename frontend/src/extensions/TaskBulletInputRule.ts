import { Extension } from '@tiptap/core';
import { InputRule } from '@tiptap/core';

/**
 * Simplified input rule for tasks and bullets
 * Only inserts the characters, doesn't create any list structures
 *
 * This allows users to type:
 * - "[]" for tasks
 * - "-" for bullet points
 * - "*" for bullet points
 *
 * WITHOUT any automatic formatting or list creation
 */
export const TaskBulletInputRule = Extension.create({
  name: 'taskBulletInputRule',

  addInputRules() {
    return [
      // Handle typing "[] " at the start of a line
      // This just keeps the text as-is, no list creation
      new InputRule({
        find: /^(\[\])\s$/,
        handler: ({ state, range }) => {
          // Do nothing - let the text stay as typed
          // The user typed "[] " and we keep it exactly like that
          return null;
        },
      }),

      // Handle typing task states like "[x] ", "[-] ", etc.
      new InputRule({
        find: /^(\[[xX\-!>]\])\s$/,
        handler: ({ state, range }) => {
          // Do nothing - let the text stay as typed
          return null;
        },
      }),

      // Handle typing "- " or "* " at start of line for bullets
      new InputRule({
        find: /^([-*])\s$/,
        handler: ({ state, range }) => {
          // Do nothing - let the text stay as typed
          return null;
        },
      }),
    ];
  },
});