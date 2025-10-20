import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { Loading } from '../common/Loading';
import { WikiLink } from '../../extensions/WikiLink';
import { wikiLinkMarkdownTransformer } from '../../extensions/WikiLinkMarkdown';
import { NotePlanExtensions, noteplanTaskMarkdownTransformer } from '../../extensions/noteplan';
import { useFileStore } from '../../store/fileStore';
import { resolveLink } from '../../services/linkService';

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
  const { files, openFile } = useFileStore();

  const handleLinkClick = async (target: string) => {
    const targetPath = resolveLink(target, files);
    if (targetPath) {
      await openFile(targetPath);
    } else {
      console.warn(`Could not resolve link: ${target}`);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Keep listItem enabled for regular lists
        listItem: true,
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc ml-4',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ml-4',
          },
        },
        // Keep code blocks enabled for proper markdown
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-gray-100 dark:bg-gray-900 p-4 rounded',
          },
        },
        // Re-enable useful features
        horizontalRule: true,
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic',
          },
        },
      }),
      // NotePlan task extensions (replaces Tiptap's TaskList/TaskItem)
      ...NotePlanExtensions,
      // Link handling
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-amber-600 dark:text-amber-400 underline cursor-pointer',
        },
      }),
      WikiLink.configure({
        onLinkClick: handleLinkClick,
        HTMLAttributes: {
          class: 'wiki-link-decoration',
        },
      }),
      // Markdown support with proper task handling
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        breaks: false,
        linkify: false,
        transformPastedText: false,
        transformCopiedText: false,
        transformers: [
          wikiLinkMarkdownTransformer,
          noteplanTaskMarkdownTransformer,
        ],
      }),
    ],
    content: content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // Get markdown with proper task formatting
      const markdown = ((editor.storage as any).markdown as any).getMarkdown();

      // Apply wiki link post-processing
      const processed = wikiLinkMarkdownTransformer.postProcess(markdown);

      // Save the processed content
      onChange(processed);
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
      editor.commands.setContent(content, false);

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
  }, [content, editor]);

  // Update link click handler when files change
  useEffect(() => {
    if (editor && files) {
      // Force re-render to update click handlers with new file list
      editor.view.updateState(editor.state);
    }
  }, [files, editor]);

  if (!editor) {
    return <Loading size="md" text="Loading editor..." />;
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-800">
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
};