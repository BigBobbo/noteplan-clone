import { Extension } from '@tiptap/core';
import { Markdown } from 'tiptap-markdown';

/**
 * Custom Markdown extension that prevents escaping of square brackets
 * This is needed for NotePlan-style tasks to work correctly
 */
export const CustomMarkdown = Extension.create({
  name: 'customMarkdown',

  addExtensions() {
    return [
      Markdown.extend({
        name: 'markdown',

        addStorage() {
          return {
            ...this.parent?.(),
            getMarkdown: () => {
              const editor = this.editor;

              // Get the raw text content
              const doc = editor.state.doc;
              let markdown = '';

              doc.descendants((node, pos) => {
                if (node.isText) {
                  markdown += node.text;
                } else if (node.type.name === 'paragraph') {
                  if (pos > 0) markdown += '\n';
                } else if (node.type.name === 'heading') {
                  if (pos > 0) markdown += '\n';
                  const level = node.attrs.level || 1;
                  markdown += '#'.repeat(level) + ' ';
                } else if (node.type.name === 'hardBreak') {
                  markdown += '\n';
                }
              });

              return markdown;
            },
          };
        },

        onCreate() {
          // Override the default markdown serializer
          const originalGetMarkdown = this.storage.getMarkdown;

          this.storage.getMarkdown = () => {
            // Get markdown from the original serializer
            const markdown = this.editor.storage.markdown?.originalGetMarkdown?.() ||
                            this.editor.state.doc.textContent;

            // Don't escape any brackets - return raw content
            return markdown;
          };

          // Store original for potential use
          this.storage.originalGetMarkdown = originalGetMarkdown;
        },
      }),
    ];
  },
});