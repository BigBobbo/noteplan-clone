import React, { useEffect, useMemo } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { EditorContent } from '@tiptap/react';
import { EditorToolbar } from './EditorToolbar';
import { useFileStore } from '../../store/fileStore';
import { Loading } from '../common/Loading';
import { WikiLink } from '../../extensions/WikiLink';
import { wikiLinkMarkdownTransformer } from '../../extensions/WikiLinkMarkdown';
import { NotePlanExtensions } from '../../extensions/noteplan';
import { resolveLink } from '../../services/linkService';
import { ScheduledTasksSection } from '../ScheduledTasksSection';

// Helper function to parse task details content into structured nodes
function parseTaskDetailsContent(details: string, taskState: string): any[] {
  const lines = details.split('\n');
  const nodes: any[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for bullet lists
    const bulletMatch = line.match(/^(\s*)([-*+])\s+(.+)$/);
    if (bulletMatch) {
      // Collect consecutive bullets
      const bulletItems: any[] = [];
      let j = i;

      while (j < lines.length) {
        const bulletLine = lines[j].match(/^(\s*)([-*+])\s+(.+)$/);
        if (bulletLine) {
          bulletItems.push({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: bulletLine[3] }]
            }]
          });
          j++;
        } else {
          break;
        }
      }

      if (bulletItems.length > 0) {
        nodes.push({
          type: 'bulletList',
          content: bulletItems,
        });
        i = j;
        continue;
      }
    }

    // Empty line
    if (!line.trim()) {
      nodes.push({ type: 'paragraph' });
      i++;
      continue;
    }

    // Regular paragraph (trim leading/trailing spaces from line)
    nodes.push({
      type: 'paragraph',
      content: [{ type: 'text', text: line.trim() }],
    });
    i++;
  }

  return nodes;
}

// Helper function to parse task details
function parseTaskDetailsForEditor(
  taskLineNumber: number,
  lines: string[],
  taskDepth: number
): { details: string | null; detailsEndLine: number } {
  let detailsEndLine = taskLineNumber;
  const detailLines: string[] = [];

  for (let i = taskLineNumber + 1; i < lines.length; i++) {
    const line = lines[i];
    const leadingSpaces = line.match(/^(\s*)/)?.[1] || '';
    const lineDepth = Math.floor(leadingSpaces.length / 2);

    // Stop if we hit content at same or lower depth
    if (line.trim() && lineDepth <= taskDepth) break;

    // Stop if we hit another task
    if (line.match(/^(\s*)-\s*\[/) || line.match(/^(\s*)\[/)) break;

    // This is a detail line if it's indented more than the task
    if (lineDepth > taskDepth || !line.trim()) {
      // Remove base indentation (taskDepth + 1 levels)
      const baseIndent = '  '.repeat(taskDepth + 1);
      const detailText = line.startsWith(baseIndent)
        ? line.substring(baseIndent.length)
        : line.trimStart();
      detailLines.push(detailText);
      detailsEndLine = i;
    }
  }

  const details = detailLines.length > 0
    ? detailLines.join('\n').trim()
    : null;

  return { details, detailsEndLine };
}

// Helper to parse NotePlan markdown to ProseMirror JSON
function parseNotePlanMarkdown(markdown: string): any {
  const lines = markdown.split('\n');
  const nodes: any[] = [];

  console.log('[parseNotePlanMarkdown] Parsing', lines.length, 'lines');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Check for tasks - support both GFM (- [ ]) and legacy NotePlan ([ ]) formats
    // GFM format (preferred): - [ ] Task
    const gfmTaskMatch = line.match(/^(\s*)-\s+\[([xX\s\-!>]?)\]\s+(.+)$/);
    // Legacy NotePlan format (temporary): [] Task
    const legacyTaskMatch = line.match(/^(\s*)\[([xX\s\-!>]?)\]\s+(.+)$/);

    const taskMatch = gfmTaskMatch || legacyTaskMatch;
    if (taskMatch) {
      const [, spaces, marker, content] = taskMatch;
      const indent = Math.floor(spaces.length / 2);

      // Map marker to state
      let state = 'open';
      const m = marker.trim();
      if (m === 'x' || m === 'X') state = 'completed';
      else if (m === '-') state = 'cancelled';
      else if (m === '>') state = 'scheduled';
      else if (m === '!') state = 'important';

      // Check for task details
      const { details, detailsEndLine } = parseTaskDetailsForEditor(i, lines, indent);
      const hasDetails = !!details;
      const detailsPreview = details ? details.substring(0, 50) + (details.length > 50 ? '...' : '') : '';

      console.log('[parseNotePlanMarkdown] Found task:', content, 'hasDetails:', hasDetails);

      nodes.push({
        type: 'noteplanTask',
        attrs: { state, indent, hasDetails, detailsPreview },
        content: content.trim() ? [{ type: 'text', text: content.trim() }] : undefined,
      });

      // NEW: Create TaskDetails node if task has details
      if (hasDetails && details) {
        console.log('[parseNotePlanMarkdown] Creating TaskDetails node for:', content);
        const detailsNodes = parseTaskDetailsContent(details, state);
        nodes.push({
          type: 'taskDetails',
          attrs: { taskState: state },
          content: detailsNodes,
        });
      }

      // Skip detail lines
      i = detailsEndLine + 1;
      continue;
    }

    // Check for headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      nodes.push({
        type: 'heading',
        attrs: { level: headingMatch[1].length },
        content: [{ type: 'text', text: headingMatch[2] }],
      });
      i++;
      continue;
    }

    // Check for bullet points (-, *, +)
    const bulletMatch = line.match(/^(\s*)([-*+])\s+(.+)$/);
    if (bulletMatch) {
      // Collect consecutive bullet points
      const bulletItems: any[] = [];
      let j = i;

      while (j < lines.length) {
        const bulletLine = lines[j].match(/^(\s*)([-*+])\s+(.+)$/);
        if (bulletLine) {
          console.log('[parseNotePlanMarkdown] Found bullet:', bulletLine[3]);
          bulletItems.push({
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: bulletLine[3] }]
            }]
          });
          j++;
        } else {
          break;
        }
      }

      if (bulletItems.length > 0) {
        nodes.push({
          type: 'bulletList',
          content: bulletItems,
        });
        i = j;
        continue;
      }
    }

    // Empty line
    if (!line.trim()) {
      nodes.push({ type: 'paragraph' });
      i++;
      continue;
    }

    // Regular paragraph
    nodes.push({
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    });
    i++;
  }

  console.log('[parseNotePlanMarkdown] Created', nodes.length, 'nodes');
  return { type: 'doc', content: nodes };
}

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

  // Parse initial content
  const parsedContent = useMemo(() => {
    if (currentFile?.content) {
      console.log('[Editor] Parsing initial content');
      return parseNotePlanMarkdown(currentFile.content);
    }
    return '';
  }, [currentFile?.content]);

  // Detect if this is a calendar/daily note file
  const isCalendarFile = currentFile?.metadata.path.startsWith('Calendar/') ?? false;

  // Parse date from calendar filename (YYYYMMDD.txt)
  const calendarDate = useMemo(() => {
    if (!isCalendarFile || !currentFile) return null;

    const filename = currentFile.metadata.name.replace('.txt', '');
    const year = parseInt(filename.substring(0, 4));
    const month = parseInt(filename.substring(4, 6)) - 1; // 0-indexed
    const day = parseInt(filename.substring(6, 8));

    return new Date(year, month, day);
  }, [isCalendarFile, currentFile?.metadata.name]);

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
        onLinkClick: (target: string) => handleLinkClickRef.current(target),
        HTMLAttributes: {
          class: 'wiki-link-decoration',
        },
      }),
    ],
    content: parsedContent,
    editable: true,
    onUpdate: ({ editor }) => {
      // Get markdown - use custom serializer for noteplanTask nodes
      let markdown = '';
      const doc = editor.state.doc;

      console.log('[Editor.onUpdate] Total nodes:', doc.childCount);
      doc.forEach((node, offset, index) => {
        console.log(`[Editor.onUpdate] Node ${index}: type="${node.type.name}", text="${node.textContent.substring(0, 50)}"`);
      });

      doc.forEach((node) => {
        if (node.type.name === 'noteplanTask') {
          // Serialize NotePlan tasks manually in GFM format
          const state = node.attrs.state || 'open';
          const markerMap: Record<string, string> = {
            'open': ' ',
            'completed': 'x',
            'cancelled': '-',
            'scheduled': '>',
            'important': '!'
          };
          const marker = markerMap[state] || ' ';
          const indent = '  '.repeat(node.attrs.indent || 0);
          // GFM format: - [marker] text
          markdown += `${indent}- [${marker}] ${node.textContent}\n`;
        }
        else if (node.type.name === 'taskDetails') {
          // NEW: Serialize task details as indented content
          const baseIndent = '    '; // 4 spaces for details

          node.content.forEach((child) => {
            if (child.type.name === 'paragraph') {
              // Only add non-empty paragraphs
              if (child.textContent.trim()) {
                markdown += `${baseIndent}${child.textContent}\n`;
              } else {
                // Empty paragraph = blank line
                markdown += '\n';
              }
            } else if (child.type.name === 'bulletList') {
              child.forEach((listItem) => {
                markdown += `${baseIndent}- ${listItem.textContent}\n`;
              });
            } else {
              // Fallback for other node types
              if (child.textContent) {
                markdown += `${baseIndent}${child.textContent}\n`;
              }
            }
          });
        }
        else if (node.type.name === 'heading') {
          const level = node.attrs.level || 1;
          markdown += `${'#'.repeat(level)} ${node.textContent}\n`;
        } else if (node.type.name === 'paragraph') {
          // Only add paragraph if it has content
          if (node.textContent.trim()) {
            markdown += `${node.textContent}\n`;
          } else {
            // Empty paragraph = blank line
            markdown += '\n';
          }
        } else if (node.type.name === 'bulletList') {
          // Serialize each list item
          node.forEach((listItem) => {
            markdown += `- ${listItem.textContent}\n`;
          });
        } else if (node.type.name === 'orderedList') {
          // Serialize ordered list
          let counter = node.attrs.start || 1;
          node.forEach((listItem) => {
            markdown += `${counter}. ${listItem.textContent}\n`;
            counter++;
          });
        } else if (node.type.name === 'codeBlock') {
          const language = node.attrs.language || '';
          markdown += `\`\`\`${language}\n${node.textContent}\n\`\`\`\n`;
        } else if (node.type.name === 'blockquote') {
          const lines = node.textContent.split('\n');
          lines.forEach(line => {
            markdown += `> ${line}\n`;
          });
        } else if (node.type.name === 'horizontalRule') {
          markdown += '---\n';
        } else {
          // Fallback for other node types - skip empty nodes
          if (node.textContent && node.textContent.trim()) {
            markdown += `${node.textContent}\n`;
          }
        }
      });

      console.log('[Editor] Serialized markdown:', JSON.stringify(markdown));

      // Apply wiki link post-processing - DON'T trim yet
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
      // Get current editor content using our custom serializer
      let currentContent = '';
      const doc = editor.state.doc;

      doc.forEach((node) => {
        if (node.type.name === 'noteplanTask') {
          const state = node.attrs.state || 'open';
          const markerMap: Record<string, string> = {
            'open': ' ',
            'completed': 'x',
            'cancelled': '-',
            'scheduled': '>',
            'important': '!'
          };
          const marker = markerMap[state] || ' ';
          const indent = '  '.repeat(node.attrs.indent || 0);
          // GFM format: - [marker] text
          currentContent += `${indent}- [${marker}] ${node.textContent}\n`;
        } else if (node.type.name === 'heading') {
          const level = node.attrs.level || 1;
          currentContent += `${'#'.repeat(level)} ${node.textContent}\n`;
        } else if (node.type.name === 'paragraph') {
          currentContent += `${node.textContent}\n`;
        } else if (node.type.name === 'bulletList') {
          node.forEach((listItem) => {
            currentContent += `- ${listItem.textContent}\n`;
          });
        } else if (node.type.name === 'codeBlock') {
          const language = node.attrs.language || '';
          currentContent += `\`\`\`${language}\n${node.textContent}\n\`\`\`\n`;
        } else {
          currentContent += node.textContent ? `${node.textContent}\n` : '';
        }
      });

      currentContent = currentContent.trim();

      // Only update if content actually changed
      if (currentFile.content.trim() !== currentContent) {
        // Save cursor position
        const { from, to } = editor.state.selection;
        const hasFocus = editor.isFocused;

        // Parse and update content
        const parsed = parseNotePlanMarkdown(currentFile.content);
        editor.commands.setContent(parsed, false);

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
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Show scheduled tasks section for calendar files */}
          {isCalendarFile && calendarDate && (
            <ScheduledTasksSection
              dailyNoteContent={currentFile.content}
              date={calendarDate}
            />
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
