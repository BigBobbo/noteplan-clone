declare module 'tiptap-markdown' {
  import { Extension } from '@tiptap/core';

  export interface MarkdownStorage {
    getMarkdown: () => string;
  }

  export const Markdown: Extension<any, MarkdownStorage>;
}
