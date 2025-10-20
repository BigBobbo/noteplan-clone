import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

/**
 * Detects whether a list item is a task (starts with []) or a regular bullet.
 * Adds data-is-task="true" attribute to task items for CSS targeting.
 *
 * Task patterns detected:
 * - [ ] = open task
 * - [x] or [X] = completed task
 * - [-] = cancelled task
 * - [>] = scheduled task
 * - [!] = important task
 *
 * Non-tasks:
 * - Regular bullet points starting with -, *, or +
 * - Any text that doesn't start with a checkbox marker
 */
export const TaskListItemDetector = Extension.create({
  name: 'taskListItemDetector',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('taskListItemDetector'),

        appendTransaction(transactions, oldState, newState) {
          let modified = false;
          const tr = newState.tr;

          // Only process if document changed
          if (!transactions.some(t => t.docChanged)) {
            return null;
          }

          newState.doc.descendants((node, pos) => {
            // Only process list items
            if (node.type.name === 'listItem') {
              // Get text content of first child (paragraph)
              let textContent = '';
              const firstChild = node.firstChild;
              if (firstChild && firstChild.isTextblock) {
                firstChild.content.forEach((child) => {
                  if (child.isText) {
                    textContent += child.text;
                  }
                });
              }

              const trimmed = textContent.trim();

              // Check if this is a task (starts with checkbox marker)
              // Matches: [], [ ], [x], [X], [-], [>], [!]
              const isTask = /^\[[x\s\-!>]?\]/i.test(trimmed);

              // Get current attrs
              const currentAttrs = node.attrs || {};
              const currentIsTask = currentAttrs.isTask;

              // Only update if changed
              if (isTask !== currentIsTask) {
                tr.setNodeMarkup(pos, null, {
                  ...currentAttrs,
                  isTask: isTask
                });
                modified = true;
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});
