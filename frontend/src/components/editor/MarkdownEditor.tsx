import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useFileStore } from '../../store/fileStore';

// Simple HTML to Markdown converter for TipTap output
function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Remove wrapper paragraph if it exists
  markdown = markdown.replace(/^<p>|<\/p>$/g, '');

  // Convert headers
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n');
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n');
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n');
  markdown = markdown.replace(/<h5>(.*?)<\/h5>/g, '##### $1\n');
  markdown = markdown.replace(/<h6>(.*?)<\/h6>/g, '###### $1\n');

  // Convert line breaks BEFORE paragraphs
  markdown = markdown.replace(/<br\s*\/?>/g, '\n');

  // Convert paragraphs to newlines
  markdown = markdown.replace(/<\/p><p>/g, '\n\n');
  markdown = markdown.replace(/<p>/g, '');
  markdown = markdown.replace(/<\/p>/g, '\n');

  // Convert bold
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**');

  // Convert italic
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*');

  // Convert links
  markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');

  // Convert task lists
  markdown = markdown.replace(/<ul data-type="taskList">(.*?)<\/ul>/gs, (_match, content) => {
    return content.replace(/<li data-type="taskItem" data-checked="true">.*?<label><input type="checkbox" checked="checked"><span><\/span><\/label><div>(.*?)<\/div><\/li>/g, '* [x] $1\n')
                  .replace(/<li data-type="taskItem" data-checked="false">.*?<label><input type="checkbox"><span><\/span><\/label><div>(.*?)<\/div><\/li>/g, '* [ ] $1\n');
  });

  // Convert regular lists
  markdown = markdown.replace(/<ul>(.*?)<\/ul>/gs, (_match, content) => {
    // Preserve time blocks that might have been incorrectly wrapped in list
    let result = content.replace(/<li>(\d{2}:\d{2}-\d{2}:\d{2}\s+.+?)<\/li>/g, '+ $1\n')
                        .replace(/<li>(.*?)<\/li>/g, '* $1\n');
    return result + '\n'; // Add newline after list
  });

  markdown = markdown.replace(/<ol>(.*?)<\/ol>/gs, (_match, content) => {
    let index = 1;
    let result = content.replace(/<li>(.*?)<\/li>/g, () => `${index++}. $1\n`);
    return result + '\n'; // Add newline after list
  });

  // Convert code
  markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');
  markdown = markdown.replace(/<pre><code>(.*?)<\/code><\/pre>/gs, '```\n$1\n```\n');

  // Clean up any remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");

  // Clean up excessive newlines (but preserve intentional spacing)
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();

  return markdown;
}

// Simple Markdown to HTML converter for TipTap input
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML entities first
  html = html.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');

  // Convert headers (must be done before paragraphs)
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Convert bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Convert italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Convert links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Convert task items
  html = html.replace(/^\*\s+\[x\]\s+(.+)$/gm, '<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div>$1</div></li>');
  html = html.replace(/^\*\s+\[\s\]\s+(.+)$/gm, '<li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div>$1</div></li>');

  // Wrap task items in task list
  html = html.replace(/(<li data-type="taskItem".*?<\/li>\n?)+/g, '<ul data-type="taskList">$&</ul>');

  // Convert unordered lists (must be after task items)
  // IMPORTANT: Don't convert time blocks (+ HH:MM-HH:MM format) to lists
  html = html.replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\+\s+(?!\d{2}:\d{2})(.+)$/gm, '<li>$1</li>'); // Only convert + if NOT followed by time
  html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');

  // Wrap list items in ul (but not task items)
  html = html.replace(/(<li>(?!.*data-type).*?<\/li>\n?)+/g, '<ul>$&</ul>');

  // Convert code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Convert inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Split content by lines to handle time blocks properly
  const allLines = html.split(/\n/);
  const processedLines: string[] = [];
  let paragraphBuffer: string[] = [];

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim();

    // Check if this is a time block
    const isTimeBlock = line.match(/^\+\s+\d{2}:\d{2}-\d{2}:\d{2}/);
    // Check if this is a block element
    const isBlockElement = line.match(/^<(h[1-6]|ul|ol|pre|blockquote)/);
    // Check if line is empty
    const isEmpty = line === '';

    if (isTimeBlock) {
      // Flush paragraph buffer if needed
      if (paragraphBuffer.length > 0) {
        processedLines.push(`<p>${paragraphBuffer.join('<br>')}</p>`);
        paragraphBuffer = [];
      }
      // Add time block as plain text with <br> after it
      processedLines.push(line + '<br>');
    } else if (isBlockElement) {
      // Flush paragraph buffer if needed
      if (paragraphBuffer.length > 0) {
        processedLines.push(`<p>${paragraphBuffer.join('<br>')}</p>`);
        paragraphBuffer = [];
      }
      processedLines.push(line);
    } else if (isEmpty) {
      // Empty line ends paragraph
      if (paragraphBuffer.length > 0) {
        processedLines.push(`<p>${paragraphBuffer.join('<br>')}</p>`);
        paragraphBuffer = [];
      }
    } else {
      // Regular text - add to paragraph buffer
      paragraphBuffer.push(line);
    }
  }

  // Flush remaining paragraph buffer
  if (paragraphBuffer.length > 0) {
    processedLines.push(`<p>${paragraphBuffer.join('<br>')}</p>`);
  }

  html = processedLines.join('');

  return html;
}

export const MarkdownEditor: React.FC = () => {
  const { currentFile, saveFile } = useFileStore();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUpdatingFromExternalRef = useRef(false);

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
      if (currentFile && !isUpdatingFromExternalRef.current) {
        // Get HTML content and convert back to markdown-like format
        const html = editor.getHTML();
        const content = htmlToMarkdown(html);

        // Clear existing timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Debounce save by 1 second
        saveTimeoutRef.current = setTimeout(() => {
          saveFile(currentFile.metadata.path, content).catch(console.error);
        }, 1000);
      }
    },
  });

  // Update editor content when file changes
  useEffect(() => {
    if (editor && currentFile) {
      const currentContent = htmlToMarkdown(editor.getHTML());
      if (currentContent !== currentFile.content) {
        // Set flag to prevent triggering save during external update
        isUpdatingFromExternalRef.current = true;

        // Convert markdown to HTML-like format that TipTap can understand
        const htmlContent = markdownToHtml(currentFile.content);
        editor.commands.setContent(htmlContent);

        // Reset flag after a short delay
        setTimeout(() => {
          isUpdatingFromExternalRef.current = false;
        }, 100);
      }
    }
  }, [currentFile, editor]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
