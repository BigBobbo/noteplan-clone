import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

/**
 * Makes task checkboxes interactive - clicking them cycles through states
 *
 * State cycle:
 * Open (no marker) → Completed [x] → Cancelled [-] → Open
 *
 * Or if you click on important/scheduled:
 * Important [!] → Completed [x]
 * Scheduled [>] → Completed [x]
 */

function getTaskState(text: string): string | null {
  const trimmed = text.trim();
  if (/^\[x\]/i.test(trimmed)) return 'completed';
  if (/^\[-\]/.test(trimmed)) return 'cancelled';
  if (/^\[>\]/.test(trimmed)) return 'scheduled';
  if (/^\[!\]/.test(trimmed)) return 'important';
  return null; // open
}

function getNextState(currentState: string | null): string {
  // Normal cycle: open → completed → cancelled → open
  if (currentState === null) return '[x] '; // open → completed
  if (currentState === 'completed') return '[-] '; // completed → cancelled
  if (currentState === 'cancelled') return ''; // cancelled → open

  // Special states go to completed
  if (currentState === 'important' || currentState === 'scheduled') {
    return '[x] ';
  }

  return '';
}

function updateTaskState(text: string, newStateMarker: string): string {
  // Remove existing state marker
  let cleanText = text.trim();
  cleanText = cleanText.replace(/^\[(x|X|\-|>|!)\]\s*/, '');

  // Add new state marker
  return newStateMarker + cleanText;
}

export const InteractiveCheckbox = Extension.create({
  name: 'interactiveCheckbox',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('interactiveCheckbox'),

        props: {
          handleDOMEvents: {
            click: (view, event) => {
              const target = event.target as HTMLElement;

              // Check if click was on or near a list item
              let listItem = target.closest('li');

              if (!listItem) return false;

              // Check if this is a task item (has data-is-task attribute)
              const isTask = listItem.getAttribute('data-is-task') === 'true';
              if (!isTask) return false;  // Ignore clicks on non-task bullets

              // Check if this is a bullet list item (not inside taskList)
              const bulletList = listItem.closest('ul:not([data-type="taskList"])');
              if (!bulletList) return false;

              // Get the click position relative to the list item
              const rect = listItem.getBoundingClientRect();
              const clickX = event.clientX - rect.left;

              // If click is in the first 50px (where checkbox is), toggle state
              if (clickX > 50) return false;

              // Find the position of this list item in the document
              const pos = view.posAtDOM(listItem, 0);
              if (pos === null || pos === undefined) return false;

              // Get the node at this position
              const $pos = view.state.doc.resolve(pos);
              const node = $pos.node();

              if (node.type.name !== 'listItem') return false;

              // Get the text content of the first paragraph
              let textContent = '';
              const firstChild = node.firstChild;
              if (firstChild && firstChild.isTextblock) {
                firstChild.content.forEach((child) => {
                  if (child.isText && child.text) {
                    textContent += child.text;
                  }
                });
              }

              // Get current state and determine next state
              const currentState = getTaskState(textContent);
              const newStateMarker = getNextState(currentState);
              const newText = updateTaskState(textContent, newStateMarker);

              // Update the text in the document
              const tr = view.state.tr;

              // Find the text node position
              const textStart = pos + 1; // +1 to get inside the listItem
              const textEnd = textStart + textContent.length;

              // Replace the text
              tr.replaceRangeWith(
                textStart,
                textEnd,
                view.state.schema.text(newText)
              );

              view.dispatch(tr);

              // Prevent default to avoid text selection
              event.preventDefault();
              return true;
            },
          },
        },
      }),
    ];
  },

  addOptions() {
    return {
      clickableWidth: 50, // Width in pixels where clicks are captured
    };
  },
});
