# PHASE 4 PRP: Templates & Productivity Tools

## Overview
Template system with multiple trigger methods, quick capture inbox, performance optimization, and UI polish.

## Goals
- ✅ Template creation and storage in `@Templates/` folder
- ✅ Three trigger methods: Cmd+K, slash commands, sidebar button
- ✅ Quick capture inbox for brain dumps
- ✅ Performance optimization for large datasets
- ✅ UI polish, animations, and onboarding

## Template System

### Template Storage

**Location:** `data/Notes/@Templates/` folder

**File format:** Standard markdown with frontmatter + variables

**Example template: `Weekly Review.txt`**
```markdown
---
title: Weekly Review
description: End-of-week reflection and planning
trigger: /weekly
category: Productivity
icon: 📊
---

# Weekly Review - {{date:MMM d, yyyy}}

## Completed This Week
*

## Lessons Learned
*

## Next Week Priorities
* [P1]
* [P2]
* [P3]

## Metrics
- Tasks completed:
- Hours focused:
- Energy level:

## Notes
{{cursor}}
```

**Example template: `Daily Standup.txt`**
```markdown
---
title: Daily Standup
description: Quick daily team update
trigger: /standup
category: Work
---

## Standup - {{date:ddd, MMM d}}

### Yesterday
*

### Today
* {{cursor}}

### Blockers
*
```

### Template Variables

**Date/Time Variables:**
- `{{date}}` - Current date (YYYY-MM-DD)
- `{{date:FORMAT}}` - Custom format (using date-fns tokens)
- `{{time}}` - Current time (HH:MM)
- `{{day}}` - Day name (Monday, Tuesday, etc.)
- `{{week}}` - Week number (1-52)
- `{{month}}` - Month name (January, February, etc.)
- `{{year}}` - Current year (2025)

**Special Variables:**
- `{{cursor}}` - Cursor placement after insertion
- `{{selection}}` - Current selection (replaces if exists)
- `{{clipboard}}` - Clipboard content

**Custom Variables (future):**
- `{{user.name}}` - User's name from config
- `{{prompt:What's the topic?}}` - Interactive prompt

## Implementation Steps

### Step 1: Template Service

#### 1a. Create templateService.ts

**Location:** `frontend/src/services/templateService.ts`

**Functions:**
```typescript
interface Template {
  id: string;
  title: string;
  description?: string;
  trigger?: string;  // e.g., "/weekly"
  category?: string;
  icon?: string;
  content: string;
  filePath: string;
}

export const parseTemplate = (
  content: string,
  filePath: string
): Template => {
  // Extract frontmatter
  const { data, content: body } = matter(content);

  return {
    id: generateId(filePath),
    title: data.title || path.basename(filePath, '.txt'),
    description: data.description,
    trigger: data.trigger,
    category: data.category || 'Uncategorized',
    icon: data.icon || '📄',
    content: body,
    filePath
  };
};

export const loadTemplates = async (): Promise<Template[]> => {
  const response = await api.getFiles('@Templates');
  return response.files.map(file => parseTemplate(file.content, file.path));
};

export const renderTemplate = (
  template: Template,
  variables?: Record<string, string>
): { content: string; cursorOffset?: number } => {
  let rendered = template.content;

  // Date variables
  const now = new Date();
  rendered = rendered.replace(/\{\{date:([^}]+)\}\}/g, (_, format) => {
    return formatDate(now, format);
  });
  rendered = rendered.replace(/\{\{date\}\}/g, format(now, 'yyyy-MM-dd'));
  rendered = rendered.replace(/\{\{time\}\}/g, format(now, 'HH:mm'));
  rendered = rendered.replace(/\{\{day\}\}/g, format(now, 'EEEE'));
  rendered = rendered.replace(/\{\{week\}\}/g, format(now, 'w'));
  rendered = rendered.replace(/\{\{month\}\}/g, format(now, 'MMMM'));
  rendered = rendered.replace(/\{\{year\}\}/g, format(now, 'yyyy'));

  // Custom variables
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
  }

  // Find cursor position
  const cursorMatch = rendered.match(/\{\{cursor\}\}/);
  const cursorOffset = cursorMatch?.index;
  rendered = rendered.replace(/\{\{cursor\}\}/g, '');

  return { content: rendered, cursorOffset };
};

export const createTemplate = async (
  title: string,
  content: string,
  metadata?: Partial<Template>
): Promise<Template> => {
  const frontmatter = {
    title,
    ...metadata
  };

  const fileContent = `---\n${yaml.stringify(frontmatter)}---\n\n${content}`;
  const filePath = `@Templates/${sanitizeFilename(title)}.txt`;

  await api.saveFile(filePath, fileContent);

  return parseTemplate(fileContent, filePath);
};
```

---

### Step 2: Template Store

#### 2a. Create templateStore.ts

**Location:** `frontend/src/store/templateStore.ts`

**State:**
```typescript
interface TemplateStore {
  templates: Template[];
  recentTemplates: string[]; // Template IDs
  loading: boolean;

  // Actions
  loadTemplates: () => Promise<void>;
  getTemplate: (id: string) => Template | undefined;
  getTemplateByTrigger: (trigger: string) => Template | undefined;
  createTemplate: (title: string, content: string, metadata?: Partial<Template>) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  addToRecent: (id: string) => void;

  // Filters
  getTemplatesByCategory: (category: string) => Template[];
  searchTemplates: (query: string) => Template[];
}
```

---

### Step 3: Trigger Method A - Command Palette

#### 3a. Update CommandPalette.tsx

**Location:** `frontend/src/components/command/CommandPalette.tsx`

**Add template commands:**
```typescript
const TemplateCommands: React.FC = () => {
  const { templates } = useTemplateStore();
  const editor = useEditor();

  const templateCommands = templates.map(template => ({
    id: `template-${template.id}`,
    label: `Insert template: ${template.title}`,
    description: template.description,
    icon: template.icon,
    category: 'Templates',
    action: () => {
      const { content, cursorOffset } = renderTemplate(template);
      editor.commands.insertContent(content);
      if (cursorOffset) {
        editor.commands.setTextSelection(cursorOffset);
      }
    }
  }));

  return <CommandGroup heading="Templates" commands={templateCommands} />;
};
```

**Add to command palette:**
```tsx
<CommandPalette>
  <FileCommands />
  <TemplateCommands />  {/* NEW */}
  <NavigationCommands />
  <SettingsCommands />
</CommandPalette>
```

---

### Step 4: Trigger Method B - Slash Commands

#### 4a. Create SlashCommand Extension

**Location:** `frontend/src/components/editor/extensions/SlashCommand.ts`

**Purpose:** TipTap extension to detect `/` and show template suggestions

**Implementation:**
```typescript
import { Extension } from '@tiptap/core';
import { Suggestion } from '@tiptap/suggestion';

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: true,
        command: ({ editor, range, props }) => {
          const { content, cursorOffset } = renderTemplate(props.template);

          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(content)
            .run();

          if (cursorOffset) {
            editor.commands.setTextSelection(range.from + cursorOffset);
          }
        }
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion
      })
    ];
  }
});
```

---

#### 4b. Create SlashCommandList Component

**Location:** `frontend/src/components/editor/SlashCommandList.tsx`

**Purpose:** Dropdown showing matching templates

**Structure:**
```tsx
export const SlashCommandList: React.FC<SlashCommandListProps> = ({
  items,
  command
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => Math.max(0, prev - 1));
      return true;
    }
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => Math.min(items.length - 1, prev + 1));
      return true;
    }
    if (e.key === 'Enter') {
      command(items[selectedIndex]);
      return true;
    }
    return false;
  };

  return (
    <div className="slash-command-list">
      {items.map((item, index) => (
        <button
          key={item.id}
          className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => command(item)}
        >
          <span className="icon">{item.icon}</span>
          <div>
            <div className="title">{item.title}</div>
            <div className="description">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
```

---

### Step 5: Trigger Method C - Sidebar Templates Panel

#### 5a. Create TemplatesPanel Component

**Location:** `frontend/src/components/sidebar/TemplatesPanel.tsx`

**Purpose:** Sidebar section listing all templates

**Structure:**
```tsx
export const TemplatesPanel: React.FC = () => {
  const { templates, getTemplatesByCategory, recentTemplates } = useTemplateStore();
  const editor = useEditor();

  const categories = groupBy(templates, 'category');
  const recent = recentTemplates
    .map(id => templates.find(t => t.id === id))
    .filter(Boolean);

  const insertTemplate = (template: Template) => {
    const { content, cursorOffset } = renderTemplate(template);
    editor.commands.insertContent(content);
    if (cursorOffset) {
      editor.commands.setTextSelection(cursorOffset);
    }
    addToRecent(template.id);
  };

  return (
    <div className="templates-panel">
      <div className="templates-header">
        <h3>Templates</h3>
        <button onClick={createNewTemplate}>+</button>
      </div>

      {recent.length > 0 && (
        <div className="recent-templates">
          <h4>Recent</h4>
          {recent.map(template => (
            <TemplateItem
              key={template.id}
              template={template}
              onClick={() => insertTemplate(template)}
            />
          ))}
        </div>
      )}

      {Object.entries(categories).map(([category, items]) => (
        <div key={category} className="template-category">
          <h4>{category}</h4>
          {items.map(template => (
            <TemplateItem
              key={template.id}
              template={template}
              onClick={() => insertTemplate(template)}
              onEdit={() => editTemplate(template)}
              onDelete={() => deleteTemplate(template.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
```

**TemplateItem sub-component:**
```tsx
const TemplateItem: React.FC<TemplateItemProps> = ({
  template,
  onClick,
  onEdit,
  onDelete
}) => {
  return (
    <div className="template-item group">
      <button onClick={onClick} className="template-button">
        <span className="icon">{template.icon}</span>
        <div className="template-info">
          <span className="title">{template.title}</span>
          {template.trigger && (
            <span className="trigger">{template.trigger}</span>
          )}
        </div>
      </button>

      <div className="template-actions opacity-0 group-hover:opacity-100">
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
};
```

---

### Step 6: Quick Capture

#### 6a. Create QuickCapture Component

**Location:** `frontend/src/components/modals/QuickCapture.tsx`

**Purpose:** Global hotkey modal for instant task capture

**Structure:**
```tsx
export const QuickCapture: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<1 | 2 | 3 | 4>(3);

  useHotkeys('cmd+shift+n', () => setIsOpen(true));

  const handleSubmit = async () => {
    // Append to inbox file
    const inboxPath = 'Notes/Inbox.txt';
    const task = `* ${input} #p${priority}`;
    await appendToFile(inboxPath, task);

    setInput('');
    setIsOpen(false);

    // Show success toast
    toast.success('Added to inbox');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      className="quick-capture"
    >
      <h3>Quick Capture</h3>

      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="What needs to be done?"
        autoFocus
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />

      <div className="priority-selector">
        <label>Priority:</label>
        {[1, 2, 3, 4].map(p => (
          <button
            key={p}
            onClick={() => setPriority(p as 1 | 2 | 3 | 4)}
            className={priority === p ? 'active' : ''}
          >
            P{p}
          </button>
        ))}
      </div>

      <div className="actions">
        <button onClick={() => setIsOpen(false)}>Cancel</button>
        <button onClick={handleSubmit} disabled={!input.trim()}>
          Add to Inbox
        </button>
      </div>
    </Modal>
  );
};
```

**Add to App.tsx:**
```tsx
<App>
  {/* ... */}
  <QuickCapture />
</App>
```

---

### Step 7: Performance Optimization

#### 7a. Virtualize Long Lists

**Install react-window:**
```bash
npm install react-window
```

**Update TaskList.tsx:**
```tsx
import { FixedSizeList as List } from 'react-window';

export const TaskList: React.FC = () => {
  const { tasks } = useTasks();

  const Row = ({ index, style }) => (
    <div style={style}>
      <TaskTreeItem task={tasks[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={tasks.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

---

#### 7b. Debounce File Saves

**Location:** `frontend/src/hooks/useDebouncedSave.ts`

```typescript
export const useDebouncedSave = (delay = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return (callback: () => void) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(callback, delay);
  };
};
```

**Use in editor:**
```typescript
const debouncedSave = useDebouncedSave(300);

editor.on('update', () => {
  debouncedSave(() => {
    saveFile(currentFile.path, editor.getHTML());
  });
});
```

---

#### 7c. Memoize Task Parsing

**Update taskService.ts:**
```typescript
const parseCache = new Map<string, ParsedTask[]>();

export const parseTasksFromContent = (
  content: string,
  filePath: string
): ParsedTask[] => {
  const cacheKey = `${filePath}:${hashContent(content)}`;

  if (parseCache.has(cacheKey)) {
    return parseCache.get(cacheKey)!;
  }

  const tasks = /* parse tasks */;
  parseCache.set(cacheKey, tasks);

  // Limit cache size
  if (parseCache.size > 100) {
    const firstKey = parseCache.keys().next().value;
    parseCache.delete(firstKey);
  }

  return tasks;
};
```

---

#### 7d. Web Worker for Search

**Location:** `frontend/src/workers/searchWorker.ts`

```typescript
// Search worker for offloading heavy search operations
import FlexSearch from 'flexsearch';

const index = new FlexSearch.Index({
  tokenize: 'forward',
  cache: true
});

self.addEventListener('message', (e) => {
  const { type, payload } = e.data;

  if (type === 'INDEX') {
    payload.documents.forEach(doc => {
      index.add(doc.id, doc.content);
    });
    self.postMessage({ type: 'INDEXED' });
  }

  if (type === 'SEARCH') {
    const results = index.search(payload.query);
    self.postMessage({ type: 'RESULTS', payload: results });
  }
});
```

---

### Step 8: UI Polish

#### 8a. Smooth Animations

**Install framer-motion:**
```bash
npm install framer-motion
```

**Add to drag-drop:**
```tsx
import { motion } from 'framer-motion';

const KanbanCard: React.FC = ({ task }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileDrag={{ scale: 1.05, rotate: 2 }}
      className="kanban-card"
    >
      {/* card content */}
    </motion.div>
  );
};
```

---

#### 8b. Loading States

**Create LoadingSpinner component:**
```tsx
export const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
  </div>
);
```

**Use in components:**
```tsx
{loading ? <LoadingSpinner /> : <TaskList tasks={tasks} />}
```

---

#### 8c. Empty States

**Create EmptyState component:**
```tsx
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-500 mb-6">{description}</p>
    {action && (
      <button onClick={action.onClick} className="btn-primary">
        {action.label}
      </button>
    )}
  </div>
);
```

---

#### 8d. Keyboard Shortcuts Help

**Create KeyboardShortcuts modal:**
```tsx
export const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useHotkeys('?', () => setIsOpen(true));

  const shortcuts = [
    { key: 'Cmd+K', description: 'Open command palette' },
    { key: 'Cmd+Shift+N', description: 'Quick capture' },
    { key: 'Cmd+P', description: 'Open file' },
    { key: 'Cmd+/', description: 'Toggle sidebar' },
    { key: '?', description: 'Show keyboard shortcuts' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <h2>Keyboard Shortcuts</h2>
      <table>
        {shortcuts.map(({ key, description }) => (
          <tr key={key}>
            <td><kbd>{key}</kbd></td>
            <td>{description}</td>
          </tr>
        ))}
      </table>
    </Modal>
  );
};
```

---

#### 8e. Onboarding Tour

**Install react-joyride:**
```bash
npm install react-joyride
```

**Create onboarding tour:**
```tsx
export const OnboardingTour: React.FC = () => {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, []);

  const steps = [
    {
      target: '.sidebar',
      content: 'Navigate your notes and folders here'
    },
    {
      target: '.editor',
      content: 'Write your notes using markdown syntax'
    },
    {
      target: '.kanban-board',
      content: 'Organize tasks in kanban boards'
    },
    {
      target: '.calendar',
      content: 'Schedule tasks by dragging to dates'
    }
  ];

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showSkipButton
      callback={(data) => {
        if (data.status === 'finished') {
          localStorage.setItem('hasSeenTour', 'true');
        }
      }}
    />
  );
};
```

---

## Technical Requirements

1. **Template rendering <50ms** - Fast variable substitution
2. **Quick capture <100ms** - Instant modal appearance
3. **60fps animations** - Smooth throughout
4. **Template hot-reload** - Changes reflect immediately
5. **Search performance** - 1000+ files in <100ms
6. **Memory efficient** - Handle large datasets without leaks

## Testing Plan

### Manual Tests
1. Create template in @Templates → appears in sidebar
2. Type `/weekly` in editor → template inserts
3. Cmd+K "Insert template" → modal shows templates
4. Click template in sidebar → inserts at cursor
5. Cmd+Shift+N → quick capture opens
6. Add task via quick capture → appears in Inbox.txt
7. Large file (1000 tasks) → renders smoothly
8. Edit template → changes reflect without reload
9. Press `?` → keyboard shortcuts modal appears

### Performance Tests
1. Load 1000 tasks → renders in <100ms
2. Type in editor → saves after 300ms delay
3. Search 1000 files → results in <100ms
4. Drag card → 60fps animation

## Success Criteria

- ✅ All 3 trigger methods work (Cmd+K, slash, sidebar)
- ✅ Templates support all variable types
- ✅ Quick capture is instant (<100ms)
- ✅ Cursor placement works with `{{cursor}}`
- ✅ Performance handles 1000+ tasks smoothly
- ✅ Animations are smooth (60fps)
- ✅ Empty states are helpful
- ✅ Onboarding tour guides new users
- ✅ Keyboard shortcuts accessible via `?`

## Timeline

**Estimated Time:** 2 weeks

**Breakdown:**
- Step 1-2 (Template service & store): 2 days
- Step 3 (Command palette): 1 day
- Step 4 (Slash commands): 2 days
- Step 5 (Sidebar panel): 1 day
- Step 6 (Quick capture): 1 day
- Step 7 (Performance): 2-3 days
- Step 8 (UI polish): 2-3 days
- Testing: 1-2 days

## Dependencies

**Required before starting:**
- Phase 1, 2, 3 complete
- Editor working
- File system stable

**Blocks:**
- Nothing (final phase)

## Notes

- Template variables are extensible (add custom ones later)
- Consider template sharing/export
- Future: Template marketplace
- Future: AI-generated templates
- Future: Template versioning

---

**Status:** 🔴 Not Started

**Last Updated:** 2025-10-08

**Next Step:** Create templateService.ts and define template parsing
