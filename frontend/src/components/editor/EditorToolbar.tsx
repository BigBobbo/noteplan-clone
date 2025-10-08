import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  LinkIcon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { TemplateSelector } from '../templates/TemplateSelector';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  const [showTemplates, setShowTemplates] = useState(false);

  if (!editor) return null;

  const handleTemplateSelect = (content: string) => {
    editor.chain().focus().insertContent(content).run();
  };

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      onClick={onClick}
      className={clsx(
        'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
        isActive && 'bg-gray-300 dark:bg-gray-600'
      )}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 flex items-center gap-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Cmd+B)"
      >
        <BoldIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Cmd+I)"
      >
        <ItalicIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">H1</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">H2</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">H3</span>
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <ListBulletIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title="Task List"
      >
        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">☑</span>
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <ToolbarButton
        onClick={() => {
          const url = window.prompt('URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        isActive={editor.isActive('link')}
        title="Insert Link"
      >
        <LinkIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        <CodeBracketIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      <ToolbarButton
        onClick={() => setShowTemplates(true)}
        isActive={false}
        title="Insert Template"
      >
        <DocumentDuplicateIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </ToolbarButton>

      <TemplateSelector
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
};
