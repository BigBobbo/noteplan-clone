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
      editor.commands.setContent(content);
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
