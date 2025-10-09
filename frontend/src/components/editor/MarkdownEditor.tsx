import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
// Removed TaskList and TaskItem - they conflict with our NotePlan-style tasks
import { Markdown } from 'tiptap-markdown';
import { Loading } from '../common/Loading';
import { WikiLink } from '../../extensions/WikiLink';
import { wikiLinkMarkdownTransformer } from '../../extensions/WikiLinkMarkdown';
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
      }),
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
      // Removed TaskList/TaskItem - we handle tasks in the sidebar
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: '*',  // Changed from '+' to '*' for task compatibility
        breaks: true,
        transformPastedText: true,
        transformCopiedText: true,
        linkify: false,
        transformers: [wikiLinkMarkdownTransformer],
      }),
    ],
    content: wikiLinkMarkdownTransformer.preProcess(content),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const markdown = ((editor.storage as any).markdown as any).getMarkdown();
      const processed = wikiLinkMarkdownTransformer.postProcess(markdown);
      console.log('Editor saving markdown:', processed); // Debug log
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

      // Preprocess content to remove escaping from wiki links
      const processedContent = wikiLinkMarkdownTransformer.preProcess(content);

      // Update content
      editor.commands.setContent(processedContent);

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
