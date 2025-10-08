import React, { useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';
import { EditorContent } from '@tiptap/react';
import { EditorToolbar } from './EditorToolbar';
import { useFileStore } from '../../store/fileStore';
import { Loading } from '../common/Loading';

export const Editor: React.FC = () => {
  const { currentFile, saveFile } = useFileStore();
  const [saveTimeout, setSaveTimeout] = React.useState<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-amber-600 dark:text-amber-400 underline cursor-pointer',
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: '+',
        breaks: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: currentFile?.content || '',
    onUpdate: ({ editor }) => {
      const newContent = ((editor.storage as any).markdown as any).getMarkdown();

      // Debounced auto-save
      if (saveTimeout) clearTimeout(saveTimeout);

      const timeout = setTimeout(() => {
        if (currentFile) {
          saveFile(currentFile.metadata.path, newContent);
        }
      }, 1000);

      setSaveTimeout(timeout);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none p-6',
      },
    },
  });

  useEffect(() => {
    if (editor && currentFile) {
      editor.commands.setContent(currentFile.content);
    }
  }, [currentFile, editor]);

  if (!currentFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg">Select a note to edit</p>
          <p className="text-sm mt-2">or create a new one</p>
        </div>
      </div>
    );
  }

  if (!editor) {
    return <Loading fullScreen text="Loading editor..." />;
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      <EditorToolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
