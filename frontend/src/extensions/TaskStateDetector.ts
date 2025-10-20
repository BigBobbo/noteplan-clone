import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

/**
 * Custom TipTap extension to detect NotePlan-style task states
 * and add data-attributes for CSS styling
 *
 * Detects:
 * - [x] or [X] = completed
 * - [-] = cancelled
 * - [>] = scheduled/in-progress
 * - [!] = important
 */

interface TaskState {
  type: 'completed' | 'cancelled' | 'scheduled' | 'important' | 'open';
  marker?: string;
}

function detectTaskState(text: string): TaskState {
  // Check for state markers at the beginning of task text
  const trimmed = text.trim();

  if (/^\[x\]/i.test(trimmed)) {
    return { type: 'completed', marker: '[x]' };
  }
  if (/^\[-\]/.test(trimmed)) {
    return { type: 'cancelled', marker: '[-]' };
  }
  if (/^\[>\]/.test(trimmed)) {
    return { type: 'scheduled', marker: '[>]' };
  }
  if (/^\[!\]/.test(trimmed)) {
    return { type: 'important', marker: '[!]' };
  }

  return { type: 'open' };
}

export const TaskStateDetector = Extension.create({
  name: 'taskStateDetector',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('taskStateDetector'),

        props: {
          decorations(state) {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, pos) => {
              // Only process list items that are tasks
              if (node.type.name === 'listItem') {
                // Check if this is a task item
                const isTask = node.attrs?.isTask === true;
                if (!isTask) return;  // Skip bullet items

                // Get the first child (usually paragraph)
                const firstChild = node.firstChild;
                if (firstChild && firstChild.isTextblock) {
                  // Get the text content
                  let textContent = '';
                  firstChild.content.forEach((child) => {
                    if (child.isText) {
                      textContent += child.text;
                    }
                  });

                  // Detect task state
                  const state = detectTaskState(textContent);

                  // Add decoration with data-attribute
                  if (state.type !== 'open') {
                    decorations.push(
                      Decoration.node(pos, pos + node.nodeSize, {
                        'data-task-state': state.type,
                        class: `task-state-${state.type}`,
                      })
                    );
                  }
                }
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
