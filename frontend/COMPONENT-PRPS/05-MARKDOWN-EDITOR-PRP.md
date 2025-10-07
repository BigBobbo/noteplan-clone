# Markdown Editor Component - Implementation Guide

## Overview
TipTap-based WYSIWYG markdown editor with formatting toolbar and auto-save.

## File Location
`src/components/editor/MarkdownEditor.tsx`

## Dependencies
```bash
# Already installed
@tiptap/react
@tiptap/starter-kit
@tiptap/extension-link
@tiptap/extension-task-list
@tiptap/extension-task-item
```

## Implementation

```tsx
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useFileStore } from '../../store/fileStore';
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
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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
    if (editor && content !== editor.getHTML()) {
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
```

## Toolbar Component

Create `src/components/editor/EditorToolbar.tsx`:

```tsx
import React from 'react';
import { Editor } from '@tiptap/react';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  LinkIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) return null;

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
    </div>
  );
};
```

## Editor Container

Create `src/components/editor/Editor.tsx`:

```tsx
import React, { useCallback, useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { MarkdownEditor } from './MarkdownEditor';
import { EditorToolbar } from './EditorToolbar';
import { useFileStore } from '../../store/fileStore';
import { Loading } from '../common/Loading';

export const Editor: React.FC = () => {
  const { currentFile, saveFile } = useFileStore();
  const [content, setContent] = React.useState('');
  const [saveTimeout, setSaveTimeout] = React.useState<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: currentFile?.content || '',
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setContent(newContent);

      // Debounced auto-save
      if (saveTimeout) clearTimeout(saveTimeout);

      const timeout = setTimeout(() => {
        if (currentFile) {
          saveFile(currentFile.metadata.path, newContent);
        }
      }, 1000);

      setSaveTimeout(timeout);
    },
  });

  useEffect(() => {
    if (editor && currentFile) {
      editor.commands.setContent(currentFile.content);
      setContent(currentFile.content);
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
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor
          content={content}
          onChange={(newContent) => {
            setContent(newContent);
            // Auto-save logic handled in editor
          }}
        />
      </div>
    </div>
  );
};
```

## Features
- **WYSIWYG Editing**: Live preview as you type
- **Formatting Toolbar**: Bold, italic, headings, lists, links, code
- **Task Lists**: Interactive checkboxes
- **Auto-save**: Debounced 1 second after typing stops
- **Dark Mode**: Full dark mode support
- **Keyboard Shortcuts**: Built-in TipTap shortcuts (Cmd+B, etc.)

## Styling
- Uses Tailwind Typography (`prose`) for beautiful markdown rendering
- Custom styling for links and task items
- Responsive padding and sizing

## Testing Checklist
- [ ] Editor loads with file content
- [ ] Typing updates content
- [ ] Auto-save triggers after 1 second
- [ ] Toolbar buttons work
- [ ] Bold/italic shortcuts work
- [ ] Task checkboxes toggle
- [ ] Links can be inserted
- [ ] Dark mode styling correct
- [ ] Empty state shows when no file selected
