/**
 * NotePlan Extensions for Tiptap
 *
 * This package provides a complete NotePlan-compatible task system for Tiptap,
 * replacing the built-in GFM task extensions with pure NotePlan format support.
 *
 * Features:
 * - NotePlan task syntax: [] [x] [-] [>] [!]
 * - Interactive checkbox clicking
 * - Keyboard shortcuts (Tab, Shift-Tab, Enter, Backspace)
 * - Automatic task creation via input rules
 * - Markdown parsing and serialization
 * - Task indentation support
 *
 * Usage:
 * ```typescript
 * import { NotePlanExtensions } from './extensions/noteplan';
 *
 * const editor = useEditor({
 *   extensions: [
 *     ...NotePlanExtensions,
 *     // other extensions
 *   ],
 * });
 * ```
 */

export * from './types';
export { NotePlanTask } from './nodes/NotePlanTask';
export { TaskDetails } from './nodes/TaskDetails';
export { NotePlanMarkdown, noteplanTaskMarkdownTransformer } from './plugins/NotePlanMarkdown';
export { NotePlanCheckbox } from './plugins/NotePlanCheckbox';
export { NotePlanKeymap } from './plugins/NotePlanKeymap';
export { NotePlanInputRules } from './plugins/NotePlanInputRules';
export { NotePlanParser } from './plugins/NotePlanParser';

import { NotePlanTask } from './nodes/NotePlanTask';
import { TaskDetails } from './nodes/TaskDetails';
import { NotePlanMarkdown } from './plugins/NotePlanMarkdown';
import { NotePlanCheckbox } from './plugins/NotePlanCheckbox';
import { NotePlanKeymap } from './plugins/NotePlanKeymap';
import { NotePlanInputRules } from './plugins/NotePlanInputRules';
import { NotePlanParser } from './plugins/NotePlanParser';

/**
 * Complete NotePlan extension bundle
 *
 * Includes all NotePlan extensions in the correct order:
 * 1. NotePlanParser for markdown parsing (FIRST - highest priority to intercept content)
 * 2. NotePlanTask node
 * 3. TaskDetails node for task descriptions
 * 4. NotePlanMarkdown for serialization
 * 5. NotePlanCheckbox for interactive clicking
 * 6. NotePlanKeymap for keyboard shortcuts
 * 7. NotePlanInputRules for automatic task creation
 */
export const NotePlanExtensions = [
  NotePlanParser, // MUST be first - parses markdown before anything else
  NotePlanTask,
  TaskDetails, // Task description/details node
  NotePlanMarkdown,
  NotePlanCheckbox,
  NotePlanKeymap,
  NotePlanInputRules,
];

/**
 * Default export for convenience
 */
export default NotePlanExtensions;
