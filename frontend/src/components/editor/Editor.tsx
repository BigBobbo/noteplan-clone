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
import { WikiLink } from '../../extensions/WikiLink';
import { wikiLinkMarkdownTransformer } from '../../extensions/WikiLinkMarkdown';
import { resolveLink } from '../../services/linkService';

export const Editor: React.FC = () => {
  const { currentFile, saveFile, openFile } = useFileStore();
  const [saveTimeout, setSaveTimeout] = React.useState<ReturnType<typeof setTimeout> | null>(null);

  // Use a ref to store the latest openFile function
  const openFileRef = React.useRef(openFile);
  openFileRef.current = openFile;

  // Create a stable handler that always uses current state
  const handleLinkClickRef = React.useRef((target: string) => {
    // Get current files from store directly
    const currentFiles = useFileStore.getState().files;
    console.log('[Editor] handleLinkClick called with target:', target);
    console.log('[Editor] Current files count:', currentFiles.length);

    const targetPath = resolveLink(target, currentFiles);
    if (targetPath) {
      openFileRef.current(targetPath);
    } else {
      console.warn(`Could not resolve link: ${target}`);
    }
  });

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
      WikiLink.configure({
        onLinkClick: (target: string) => handleLinkClickRef.current(target),
        HTMLAttributes: {
          class: 'wiki-link-decoration',
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
        linkify: false,
      }),
    ],
    content: wikiLinkMarkdownTransformer.preProcess(currentFile?.content || ''),
    onUpdate: ({ editor }) => {
      const markdown = ((editor.storage as any).markdown as any).getMarkdown();
      const newContent = wikiLinkMarkdownTransformer.postProcess(markdown);

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
      const currentContent = ((editor.storage as any).markdown as any).getMarkdown();

      // Only update if content actually changed
      // Normalize whitespace to avoid false positives from trailing newlines
      const normalizedFileContent = currentFile.content.trimEnd();
      const normalizedEditorContent = currentContent.trimEnd();

      if (normalizedFileContent !== normalizedEditorContent) {
        // Save cursor position
        const { from, to } = editor.state.selection;
        const hasFocus = editor.isFocused;

        // Preprocess content to remove escaping from wiki links
        const processedContent = wikiLinkMarkdownTransformer.preProcess(currentFile.content);
        editor.commands.setContent(processedContent);

        // Restore cursor position if editor was focused
        if (hasFocus) {
          setTimeout(() => {
            const docSize = editor.state.doc.content.size;
            const safeFrom = Math.min(from, docSize);
            const safeTo = Math.min(to, docSize);

            editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
            editor.commands.focus();
          }, 0);
        }
      }
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
