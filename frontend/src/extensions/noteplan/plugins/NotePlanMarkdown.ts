import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Node as PMNode } from 'prosemirror-model';
import { getStateFromMarker, getMarkerFromState, type TaskState } from '../types';

/**
 * NotePlan Markdown Extension
 *
 * Handles parsing and serializing NotePlan task format:
 * [] Open task
 * [x] Completed task
 * [-] Cancelled task
 * [>] Scheduled task
 * [!] Important task
 *
 * This integrates with tiptap-markdown to provide proper task handling.
 */

export interface NotePlanMarkdownOptions {
  /**
   * Whether to preserve indentation for tasks
   */
  preserveIndentation: boolean;
}

export const NotePlanMarkdown = Extension.create<NotePlanMarkdownOptions>({
  name: 'noteplanMarkdown',

  addOptions() {
    return {
      preserveIndentation: true,
    };
  },

  onBeforeCreate() {
    // Hook into the markdown storage to handle NotePlan tasks
    const editor = this.editor;

    // Wait for editor to be fully initialized
    setTimeout(() => {
      const markdownStorage = editor.storage.markdown as any;

      if (markdownStorage && markdownStorage.serializer) {
        // Store original serialize method
        const originalSerialize = markdownStorage.serializer.serialize.bind(
          markdownStorage.serializer
        );

        // Override serialize to handle NotePlan tasks
        markdownStorage.serializer.serialize = function (node: PMNode) {
          // If this is a noteplanTask, use our custom serializer in GFM format
          if (node.type.name === 'noteplanTask') {
            const indent = '  '.repeat(node.attrs.indent || 0);
            const marker = getMarkerFromState(node.attrs.state as TaskState);
            const content = node.textContent || '';
            return `${indent}- [${marker}] ${content}`;
          }

          // Otherwise use the original serializer
          return originalSerialize(node);
        };
      }

      // Override getMarkdown to properly serialize the document
      if (markdownStorage && markdownStorage.getMarkdown) {
        const originalGetMarkdown = markdownStorage.getMarkdown.bind(markdownStorage);

        markdownStorage.getMarkdown = function () {
          const doc = editor.state.doc;
          return serializeDocument(doc);
        };
      }
    }, 0);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('noteplanMarkdown'),
        // This plugin helps with markdown transformation
      }),
    ];
  },

  addStorage() {
    return {
      // Markdown node spec for tiptap-markdown
      markdown: {
        serialize: (state: any, node: PMNode) => {
          const indent = '  '.repeat(node.attrs.indent || 0);
          const marker = getMarkerFromState(node.attrs.state as TaskState);
          // GFM format: - [marker] text
          state.write(`${indent}- [${marker}] `);
          state.renderInline(node);
          state.closeBlock(node);
        },
        parse: {
          // This will be handled by a custom parser
        },
      },
      // Helper functions for serialization
      serializeTask: (node: PMNode) => {
        const indent = '  '.repeat(node.attrs.indent || 0);
        const marker = getMarkerFromState(node.attrs.state as TaskState);
        const content = node.textContent || '';
        // GFM format: - [marker] text
        return `${indent}- [${marker}] ${content}`;
      },
    };
  },

  // Override onCreate to register markdown handlers
  onCreate() {
    const editor = this.editor;

    // Wait for markdown extension to be ready
    setTimeout(() => {
      const markdownStorage = editor.storage.markdown as any;

      if (markdownStorage?.options?.transformers) {
        // Add NotePlan task transformer
        markdownStorage.options.transformers.push({
          type: 'noteplanTask',
          serialize: (state: any, node: PMNode) => {
            const indent = '  '.repeat(node.attrs.indent || 0);
            const marker = getMarkerFromState(node.attrs.state as TaskState);
            // GFM format: - [marker] text
            state.write(`${indent}- [${marker}] `);
            state.renderInline(node);
            state.closeBlock(node);
          },
        });
      }
    }, 100);
  },
});

/**
 * Custom markdown transformer for tiptap-markdown
 */
export const noteplanTaskMarkdownTransformer = {
  /**
   * Match NotePlan task format
   */
  match: (line: string) => {
    return /^(\s*)\[([xX\s\-!>]?)\]\s+(.*)$/.test(line);
  },

  /**
   * Parse NotePlan task line to node spec
   */
  parse: (line: string) => {
    const match = line.match(/^(\s*)\[([xX\s\-!>]?)\]\s+(.*)$/);
    if (!match) return null;

    const [, spaces, marker, content] = match;
    const indent = Math.floor(spaces.length / 2);
    const state = getStateFromMarker(marker.trim());

    return {
      type: 'noteplanTask',
      attrs: {
        state,
        indent,
      },
      content: content.trim(),
    };
  },

  /**
   * Serialize node to GFM markdown
   */
  serialize: (node: any) => {
    if (node.type.name !== 'noteplanTask') return null;

    const indent = '  '.repeat(node.attrs.indent || 0);
    const marker = getMarkerFromState(node.attrs.state);
    const content = node.textContent || '';
    // GFM format: - [marker] text
    return `${indent}- [${marker}] ${content}`;
  },
};

/**
 * Helper function to extract task info from markdown line
 */
export function parseNotePlanTaskLine(line: string): {
  isTask: boolean;
  state?: TaskState;
  indent?: number;
  content?: string;
} {
  const match = line.match(/^(\s*)\[([xX\s\-!>]?)\]\s+(.*)$/);

  if (!match) {
    return { isTask: false };
  }

  const [, spaces, marker, content] = match;
  const indent = Math.floor(spaces.length / 2);
  const state = getStateFromMarker(marker.trim());

  return {
    isTask: true,
    state,
    indent,
    content: content.trim(),
  };
}

/**
 * Helper function to serialize task to GFM markdown
 */
export function serializeNotePlanTask(
  state: TaskState,
  content: string,
  indent: number = 0
): string {
  const indentStr = '  '.repeat(indent);
  const marker = getMarkerFromState(state);
  // GFM format: - [marker] text
  return `${indentStr}- [${marker}] ${content}`;
}

/**
 * Serialize entire document to markdown
 */
function serializeDocument(doc: PMNode): string {
  let markdown = '';

  doc.forEach((node, offset, index) => {
    const serialized = serializeNode(node);
    if (serialized) {
      markdown += serialized + '\n';
    }
  });

  return markdown.trim();
}

/**
 * Serialize a single node to markdown
 */
function serializeNode(node: PMNode): string {
  switch (node.type.name) {
    case 'noteplanTask':
      return serializeNotePlanTask(
        node.attrs.state as TaskState,
        node.textContent,
        node.attrs.indent || 0
      );

    case 'heading':
      const level = node.attrs.level || 1;
      return `${'#'.repeat(level)} ${node.textContent}`;

    case 'paragraph':
      return node.textContent;

    case 'bulletList':
      let listMarkdown = '';
      node.forEach((child) => {
        listMarkdown += serializeNode(child) + '\n';
      });
      return listMarkdown.trim();

    case 'listItem':
      return `- ${node.textContent}`;

    case 'orderedList':
      let orderedMarkdown = '';
      let counter = 1;
      node.forEach((child) => {
        orderedMarkdown += `${counter}. ${child.textContent}\n`;
        counter++;
      });
      return orderedMarkdown.trim();

    case 'codeBlock':
      const language = node.attrs.language || '';
      return `\`\`\`${language}\n${node.textContent}\n\`\`\``;

    case 'blockquote':
      const lines = node.textContent.split('\n');
      return lines.map((line) => `> ${line}`).join('\n');

    case 'horizontalRule':
      return '---';

    default:
      return node.textContent || '';
  }
}
