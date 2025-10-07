import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useFileStore } from '../../store/fileStore';

export const MarkdownEditor: React.FC = () => {
  const { currentFile, saveFile } = useFileStore();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none p-6',
      },
    },
    onUpdate: ({ editor }) => {
      if (currentFile) {
        const content = editor.getText();
        // Debounced save would go here
        saveFile(currentFile.metadata.path, content).catch(console.error);
      }
    },
  });

  // Update editor content when file changes
  useEffect(() => {
    if (editor && currentFile) {
      const currentContent = editor.getText();
      if (currentContent !== currentFile.content) {
        editor.commands.setContent(currentFile.content);
      }
    }
  }, [currentFile, editor]);

  if (!currentFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-xl mb-2">No note selected</p>
          <p className="text-sm">Select a note from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-gray-900 overflow-y-auto">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex gap-2 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor?.isActive('bold') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor?.isActive('italic') ? 'bg-gray-300 dark:bg-gray-600' : ''
          }`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
          className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Task List"
        >
          ☑
        </button>
      </div>

      {/* Editor */}
      <div className="text-gray-900 dark:text-gray-100">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
