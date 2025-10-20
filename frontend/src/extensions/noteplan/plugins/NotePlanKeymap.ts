import { Extension } from '@tiptap/core';

/**
 * NotePlan Keymap Extension
 *
 * Provides keyboard shortcuts for NotePlan tasks:
 * - Tab: Increase indent
 * - Shift-Tab: Decrease indent
 * - Enter: Create new task below
 * - Backspace: Convert empty task to paragraph
 */

export const NotePlanKeymap = Extension.create({
  name: 'noteplanKeymap',

  addKeyboardShortcuts() {
    return {
      // Tab to increase indent
      Tab: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        const node = $from.parent;

        if (node.type.name === 'noteplanTask') {
          const currentIndent = node.attrs.indent || 0;
          const pos = $from.before();

          return editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent: Math.min(currentIndent + 1, 10), // Max indent of 10
            });
            return true;
          });
        }

        return false;
      },

      // Shift-Tab to decrease indent
      'Shift-Tab': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        const node = $from.parent;

        if (node.type.name === 'noteplanTask') {
          const currentIndent = node.attrs.indent || 0;

          if (currentIndent > 0) {
            const pos = $from.before();

            return editor.commands.command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: currentIndent - 1,
              });
              return true;
            });
          }
        }

        return false;
      },
    };
  },
});
