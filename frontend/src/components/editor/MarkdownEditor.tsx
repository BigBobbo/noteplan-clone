import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';
import { Loading } from '../common/Loading';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  readOnly = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-amber-600 dark:text-amber-400 underline cursor-pointer',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: '+',
        breaks: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(((editor.storage as any).markdown as any).getMarkdown());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none p-4',
      },
    },
  });

  // Update editor when content changes externally
  useEffect(() => {
    if (editor && content !== ((editor.storage as any).markdown as any).getMarkdown()) {
      // Save cursor position
      const { from, to } = editor.state.selection;
      const hasFocus = editor.isFocused;

      // Update content
      editor.commands.setContent(content);

      // Restore cursor position if editor was focused
      if (hasFocus) {
        // Use setTimeout to ensure content is updated first
        setTimeout(() => {
          const docSize = editor.state.doc.content.size;
          const safeFrom = Math.min(from, docSize);
          const safeTo = Math.min(to, docSize);

          editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
          editor.commands.focus();
        }, 0);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return <Loading size="md" text="Loading editor..." />;
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-800">
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
};
