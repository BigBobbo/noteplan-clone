# Phase 4: Advanced Features - Product Requirements & Planning

## Overview

Phase 4 completes the NotePlan clone by adding power-user features: advanced task management, bi-directional linking, full-text search, templates, and productivity enhancements. This phase transforms the app into a complete personal knowledge management system.

**Goal:** Implement tasks, linking, search, and templates to achieve feature parity with core NotePlan.

---

## Success Criteria

- ✅ Task parsing and visual rendering
- ✅ Task completion toggle (checkbox)
- ✅ Scheduled tasks (date references)
- ✅ Bi-directional wiki-style links `[[Note]]`
- ✅ Backlink panel showing references
- ✅ Full-text search across all notes
- ✅ Search with preview/context
- ✅ Template system with insertion
- ✅ Task filters (all, active, completed, scheduled)
- ✅ Command palette (Cmd+K)

---

## Technical Specifications

### New Dependencies

```json
{
  "dependencies": {
    "fuse.js": "^7.0.0",
    "flexsearch": "^0.7.43",
    "cmdk": "^0.2.0",
    "react-hotkeys-hook": "^4.4.0",
    "@tiptap/extension-task-list": "^2.1.0",
    "@tiptap/extension-task-item": "^2.1.0"
  }
}
```

---

## Architecture Updates

### New Components

```
src/
├── components/
│   ├── tasks/
│   │   ├── TaskList.tsx           # Task list view
│   │   ├── TaskItem.tsx           # Individual task
│   │   ├── TaskFilters.tsx        # Filter bar
│   │   └── TaskModal.tsx          # Task detail modal
│   ├── links/
│   │   ├── WikiLink.tsx           # Clickable [[Link]]
│   │   ├── BacklinkPanel.tsx      # Show backlinks
│   │   └── LinkGraph.tsx          # Visual graph (future)
│   ├── search/
│   │   ├── SearchBar.tsx          # Search input
│   │   ├── SearchResults.tsx      # Results list
│   │   ├── SearchPreview.tsx      # Result preview
│   │   └── CommandPalette.tsx     # Cmd+K interface
│   ├── templates/
│   │   ├── TemplateSelector.tsx   # Choose template
│   │   ├── TemplateEditor.tsx     # Create templates
│   │   └── TemplateVariables.tsx  # Variable insertion
├── hooks/
│   ├── useTasks.ts                # Task operations
│   ├── useLinks.ts                # Link resolution
│   ├── useSearch.ts               # Search functionality
│   └── useTemplates.ts            # Template operations
├── services/
│   ├── searchService.ts           # Search indexing
│   ├── linkService.ts             # Link graph
│   └── taskService.ts             # Task parsing
└── store/
    ├── taskStore.ts               # Task state
    ├── searchStore.ts             # Search state
    └── linkStore.ts               # Link graph state
```

---

## Feature 1: Task Management

### Task Syntax

NotePlan task formats:
```markdown
* Task name                    # Open task
* [x] Completed task          # Completed
* [>] Scheduled/forwarded     # Moved to future date
* [-] Cancelled task          # Cancelled
* [!] Important task          # Priority
* Task >2025-10-08            # Scheduled for date
* Task @person                # Assigned/mentioned
* Task #tag                   # Tagged
```

### Task Parsing

```typescript
interface Task {
  id: string
  text: string
  completed: boolean
  scheduled: boolean
  cancelled: boolean
  important: boolean
  date?: Date           // Scheduled date
  mentions: string[]    // @mentions
  tags: string[]        // #tags
  line: number          // Line in file
  file: string          // Source file path
}

const parseTask = (line: string, lineNumber: number, filePath: string): Task | null => {
  const taskRegex = /^\* (\[([xX>\-!])\] )?(.+)$/
  const match = line.match(taskRegex)

  if (!match) return null

  const [_, __, status, text] = match

  // Extract date references
  const dateMatch = text.match(/>(\d{4}-\d{2}-\d{2})/)
  const scheduledDate = dateMatch ? new Date(dateMatch[1]) : undefined

  // Extract mentions and tags
  const mentions = [...text.matchAll(/@([a-zA-Z0-9_-]+)/g)].map(m => m[1])
  const tags = [...text.matchAll(/#([a-zA-Z0-9_-]+)/g)].map(m => m[1])

  return {
    id: nanoid(),
    text: text.replace(/>(\d{4}-\d{2}-\d{2})/, '').trim(),
    completed: status === 'x' || status === 'X',
    scheduled: status === '>',
    cancelled: status === '-',
    important: status === '!',
    date: scheduledDate,
    mentions,
    tags,
    line: lineNumber,
    file: filePath
  }
}
```

### Task Component

```tsx
const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const { toggleTask, rescheduleTask } = useTasks()

  return (
    <div className="task-item flex items-start gap-2 p-2 hover:bg-gray-50">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => toggleTask(task.id)}
        className="mt-1"
      />
      <div className="flex-1">
        <span className={task.completed ? 'line-through text-gray-400' : ''}>
          {task.text}
        </span>
        {task.date && (
          <span className="ml-2 text-xs text-gray-500">
            📅 {format(task.date, 'MMM d')}
          </span>
        )}
        {task.tags.map(tag => (
          <span key={tag} className="ml-1 text-xs text-blue-600">
            #{tag}
          </span>
        ))}
      </div>
      <button
        onClick={() => rescheduleTask(task.id)}
        className="text-gray-400 hover:text-gray-600"
      >
        ⏰
      </button>
    </div>
  )
}
```

### Task Filters

```tsx
const TaskFilters: React.FC = () => {
  const { filter, setFilter } = useTaskStore()

  return (
    <div className="flex gap-2 p-2 border-b">
      <FilterButton
        active={filter === 'all'}
        onClick={() => setFilter('all')}
      >
        All
      </FilterButton>
      <FilterButton
        active={filter === 'active'}
        onClick={() => setFilter('active')}
      >
        Active
      </FilterButton>
      <FilterButton
        active={filter === 'completed'}
        onClick={() => setFilter('completed')}
      >
        Completed
      </FilterButton>
      <FilterButton
        active={filter === 'today'}
        onClick={() => setFilter('today')}
      >
        Today
      </FilterButton>
      <FilterButton
        active={filter === 'scheduled'}
        onClick={() => setFilter('scheduled')}
      >
        Scheduled
      </FilterButton>
    </div>
  )
}
```

### Task Operations

```typescript
// useTasks.ts
export const useTasks = () => {
  const { currentFile, saveFile } = useFileStore()

  const toggleTask = async (taskId: string) => {
    const task = findTaskById(taskId)
    if (!task) return

    const lines = currentFile.content.split('\n')
    const line = lines[task.line]

    // Toggle checkbox
    const newLine = line.replace(
      /^\* (\[[ xX]\] )?/,
      task.completed ? '* ' : '* [x] '
    )

    lines[task.line] = newLine
    await saveFile(currentFile.path, lines.join('\n'))
  }

  const rescheduleTask = async (taskId: string, newDate: Date) => {
    const task = findTaskById(taskId)
    if (!task) return

    const lines = currentFile.content.split('\n')
    const line = lines[task.line]

    // Add/update date reference
    const dateStr = format(newDate, 'yyyy-MM-dd')
    const newLine = line.replace(
      />(\d{4}-\d{2}-\d{2})/,
      ''
    ) + ` >${dateStr}`

    lines[task.line] = newLine
    await saveFile(currentFile.path, lines.join('\n'))
  }

  return { toggleTask, rescheduleTask }
}
```

### Task View

Separate view showing all tasks:
```
┌─────────────────────────────────────────────┐
│  Tasks                    [Filters ▼]       │
├─────────────────────────────────────────────┤
│  Today (3)                                  │
│    ☐ Sign Larry's docs                     │
│    ☐ Reply to Jim                          │
│    ☐ Make house spreadsheet               │
│                                             │
│  Scheduled (2)                              │
│    ☐ Follow up with Tom     📅 Oct 10     │
│    ☐ Review project plan    📅 Oct 12     │
│                                             │
│  Completed (5)                              │
│    ☑ Morning workout                       │
│    ☑ Check emails                          │
└─────────────────────────────────────────────┘
```

---

## Feature 2: Bi-directional Linking

### Wiki-Link Parsing

```typescript
interface WikiLink {
  target: string        // Note name
  alias?: string        // Display text
  source: string        // Source file
  line: number
}

const parseWikiLinks = (content: string, filePath: string): WikiLink[] => {
  const regex = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g
  const links: WikiLink[] = []
  let match

  while ((match = regex.exec(content)) !== null) {
    links.push({
      target: match[1].trim(),
      alias: match[3]?.trim(),
      source: filePath,
      line: content.substring(0, match.index).split('\n').length
    })
  }

  return links
}
```

### Link Resolution

```typescript
const resolveLink = async (linkText: string): Promise<string | null> => {
  // Try exact match first
  let file = await findFileByName(linkText)
  if (file) return file.path

  // Try with .txt extension
  file = await findFileByName(`${linkText}.txt`)
  if (file) return file.path

  // Try fuzzy match
  const fuzzyMatches = await fuzzySearchFiles(linkText)
  if (fuzzyMatches.length > 0) return fuzzyMatches[0].path

  return null // Broken link
}
```

### Backlink Panel

```tsx
const BacklinkPanel: React.FC<{ file: string }> = ({ file }) => {
  const backlinks = useBacklinks(file)

  if (backlinks.length === 0) {
    return <div className="p-4 text-gray-500">No backlinks</div>
  }

  return (
    <div className="backlink-panel">
      <h3 className="p-2 font-bold">Linked Mentions ({backlinks.length})</h3>
      {backlinks.map(link => (
        <BacklinkItem
          key={`${link.source}-${link.line}`}
          link={link}
          onClick={() => openFile(link.source)}
        />
      ))}
    </div>
  )
}

const BacklinkItem: React.FC<{ link: WikiLink }> = ({ link }) => {
  const context = useFileContext(link.source, link.line)

  return (
    <div className="backlink-item p-2 hover:bg-gray-50 cursor-pointer">
      <div className="text-sm font-medium">{getFileName(link.source)}</div>
      <div className="text-xs text-gray-600">{context}</div>
    </div>
  )
}
```

### Link Graph

Build graph of all connections:
```typescript
interface LinkGraph {
  nodes: Array<{ id: string; label: string; file: string }>
  edges: Array<{ source: string; target: string }>
}

const buildLinkGraph = (files: File[]): LinkGraph => {
  const nodes: LinkGraph['nodes'] = []
  const edges: LinkGraph['edges'] = []

  files.forEach(file => {
    nodes.push({
      id: file.path,
      label: getFileName(file.path),
      file: file.path
    })

    const links = parseWikiLinks(file.content, file.path)
    links.forEach(link => {
      const target = resolveLink(link.target)
      if (target) {
        edges.push({
          source: file.path,
          target
        })
      }
    })
  })

  return { nodes, edges }
}
```

### Wiki-Link Component in Editor

```tsx
// Custom TipTap extension
const WikiLinkExtension = Node.create({
  name: 'wikiLink',

  group: 'inline',
  inline: true,
  atom: true,

  parseHTML() {
    return [{ tag: 'a.wiki-link' }]
  },

  renderHTML({ node }) {
    return [
      'a',
      {
        class: 'wiki-link text-blue-600 hover:underline',
        'data-target': node.attrs.target,
        href: '#'
      },
      node.attrs.alias || node.attrs.target
    ]
  },

  addCommands() {
    return {
      insertWikiLink: (attrs) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs
        })
      }
    }
  }
})
```

---

## Feature 3: Full-Text Search

### Search Indexing

```typescript
// searchService.ts
import FlexSearch from 'flexsearch'

class SearchService {
  private index: FlexSearch.Index

  constructor() {
    this.index = new FlexSearch.Index({
      tokenize: 'forward',
      cache: true,
      context: {
        depth: 2,
        resolution: 3
      }
    })
  }

  async indexFiles(files: File[]) {
    files.forEach((file, idx) => {
      this.index.add(idx, `${file.name} ${file.content}`)
    })
  }

  async search(query: string): Promise<SearchResult[]> {
    const results = await this.index.search(query, { limit: 50 })
    return results.map(idx => this.getFileByIndex(idx))
  }

  async searchWithContext(query: string): Promise<SearchResultWithContext[]> {
    const results = await this.search(query)

    return results.map(result => ({
      ...result,
      contexts: this.extractContexts(result.content, query)
    }))
  }

  private extractContexts(content: string, query: string, radius: number = 50): string[] {
    const regex = new RegExp(query, 'gi')
    const contexts: string[] = []
    let match

    while ((match = regex.exec(content)) !== null) {
      const start = Math.max(0, match.index - radius)
      const end = Math.min(content.length, match.index + query.length + radius)
      const context = content.substring(start, end)
      contexts.push(context)
    }

    return contexts.slice(0, 3) // Limit to 3 contexts per file
  }
}
```

### Search UI

```tsx
const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const { search } = useSearch()

  const handleSearch = useDebouncedCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }

    const searchResults = await search(q)
    setResults(searchResults)
  }, 300)

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          handleSearch(e.target.value)
        }}
        placeholder="Search notes..."
        className="search-input"
      />
      {results.length > 0 && (
        <SearchResults results={results} query={query} />
      )}
    </div>
  )
}

const SearchResults: React.FC<{ results: SearchResult[]; query: string }> = ({
  results,
  query
}) => {
  return (
    <div className="search-results absolute bg-white shadow-lg rounded-lg max-h-96 overflow-y-auto">
      {results.map(result => (
        <SearchResultItem
          key={result.path}
          result={result}
          query={query}
        />
      ))}
    </div>
  )
}

const SearchResultItem: React.FC = ({ result, query }) => {
  return (
    <div
      className="p-3 hover:bg-gray-50 cursor-pointer border-b"
      onClick={() => openFile(result.path)}
    >
      <div className="font-medium">{result.name}</div>
      <div className="text-sm text-gray-600 mt-1">
        {result.contexts.map((context, idx) => (
          <div key={idx} className="mb-1">
            ...{highlightQuery(context, query)}...
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 mt-1">{result.path}</div>
    </div>
  )
}
```

---

## Feature 4: Command Palette

**Cmd+K Interface:**

```tsx
import { Command } from 'cmdk'

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false)
  const { files, openFile, createFile } = useFileStore()
  const { goToDate } = useCalendar()

  useHotkeys('cmd+k', () => setOpen(true))

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Group heading="Files">
          {files.map(file => (
            <Command.Item
              key={file.path}
              onSelect={() => openFile(file.path)}
            >
              📄 {file.name}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Actions">
          <Command.Item onSelect={() => createFile('New Note.txt')}>
            ➕ New Note
          </Command.Item>
          <Command.Item onSelect={() => goToDate(new Date())}>
            📅 Go to Today
          </Command.Item>
          <Command.Item onSelect={() => toggleTheme()}>
            🌙 Toggle Theme
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
```

**Commands:**
- File navigation (fuzzy search)
- Create new note
- Go to date
- Toggle theme
- Show tasks
- Search

---

## Feature 5: Templates

### Template System

```typescript
interface Template {
  id: string
  name: string
  content: string
  variables: string[]  // e.g., ['date', 'title']
  type: 'note' | 'daily'
}

const parseTemplate = (content: string): Template => {
  // Extract frontmatter
  const { data, content: body } = matter(content)

  // Find variables in template ({{variable}})
  const variableRegex = /\{\{(\w+)\}\}/g
  const variables = [...body.matchAll(variableRegex)].map(m => m[1])

  return {
    id: nanoid(),
    name: data.title || 'Untitled Template',
    content: body,
    variables: [...new Set(variables)],
    type: data.type || 'note'
  }
}

const renderTemplate = (template: Template, values: Record<string, any>): string => {
  let rendered = template.content

  template.variables.forEach(variable => {
    const value = values[variable] || ''
    rendered = rendered.replace(
      new RegExp(`\\{\\{${variable}\\}\\}`, 'g'),
      value
    )
  })

  return rendered
}
```

### Template Selector

```tsx
const TemplateSelector: React.FC = () => {
  const templates = useTemplates()

  return (
    <Modal>
      <h2>Insert Template</h2>
      <div className="grid grid-cols-2 gap-4">
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={insertTemplate}
          />
        ))}
      </div>
    </Modal>
  )
}

const insertTemplate = (template: Template) => {
  // Prompt for variables if needed
  if (template.variables.length > 0) {
    showVariableModal(template)
  } else {
    editor.insertContent(template.content)
  }
}
```

### Built-in Templates

1. **Daily Note Template**
2. **Meeting Notes Template**
3. **Project Template**
4. **Weekly Review Template**

---

## Implementation Steps

### Step 1: Task System (12 hours)
1. Build task parser
2. Create TaskItem component
3. Implement task toggles
4. Build TaskList view
5. Add task filters
6. Implement scheduling
7. Test task operations

### Step 2: Wiki Links (10 hours)
1. Parse wiki-style links
2. Create WikiLink component
3. Implement link resolution
4. Build backlink panel
5. Add link graph construction
6. Test broken links
7. Style link components

### Step 3: Search System (10 hours)
1. Set up FlexSearch
2. Build indexing service
3. Create search UI
4. Implement search with context
5. Add result highlighting
6. Optimize performance
7. Test with large corpus

### Step 4: Command Palette (6 hours)
1. Integrate cmdk
2. Build command list
3. Add file search
4. Add action commands
5. Style palette
6. Test keyboard shortcuts

### Step 5: Template System (8 hours)
1. Build template parser
2. Create template renderer
3. Build template selector UI
4. Add variable prompts
5. Create default templates
6. Test insertion

### Step 6: Backend Updates (4 hours)
1. Add search endpoint
2. Add template endpoints
3. Optimize file listing
4. Add metadata caching

### Step 7: Integration (6 hours)
1. Connect all features
2. Update sidebar with new views
3. Add task/link indicators
4. Test workflows
5. Fix bugs

### Step 8: Polish & Documentation (4 hours)
1. Add animations
2. Improve error handling
3. Write user docs
4. Create tutorial
5. Record demo videos

**Total Estimated Time: 60 hours (~3-4 weeks part-time)**

---

## Backend API Extensions

### New Endpoints

```
GET /api/search
  - Query: ?q=search+term
  - Returns: [{ file, name, contexts }]

GET /api/tasks
  - Query: ?filter=active&date=2025-10-07
  - Returns: [{ id, text, file, completed }]

PUT /api/tasks/:id
  - Body: { completed, date }
  - Returns: { success }

GET /api/links
  - Returns link graph
  - Returns: { nodes: [], edges: [] }

GET /api/links/backlinks/:file
  - Returns backlinks for file
  - Returns: [{ source, line, context }]

GET /api/templates
  - Returns: [{ id, name, type }]

GET /api/templates/:id
  - Returns: { id, name, content, variables }

POST /api/templates
  - Body: { name, content, type }
  - Returns: { id }
```

---

## UI Updates

### New Sidebar Section
```
📁 Notes
📁 Calendar
───────────
🔍 Search
✓ Tasks
🔗 Linked Notes
📋 Templates
```

### Task Badge on Files
Show task count on file items:
```
📄 Project Planning  (3)
```

---

## Performance Optimizations

1. **Search Index:** Build on startup, update incrementally
2. **Link Graph:** Cache and rebuild on file changes
3. **Task Parsing:** Parse on-demand, cache results
4. **Backlinks:** Pre-compute and store in index
5. **Virtual Lists:** For long search results

---

## Testing Strategy

### Unit Tests
- Task parsing edge cases
- Link resolution
- Template rendering
- Search ranking

### Integration Tests
- Task toggle → File update
- Link click → Navigate
- Search → Open file
- Template insert → Editor update

### E2E Tests
- Complete task workflow
- Create linked notes
- Search and navigate
- Apply template

---

## Phase 4 Deliverables

### Code
- [x] Task management system
- [x] Wiki-link implementation
- [x] Full-text search
- [x] Command palette
- [x] Template system
- [x] All backend APIs

### Documentation
- [x] User guide (complete)
- [x] Feature documentation
- [x] Keyboard shortcuts reference
- [x] Template creation guide

### Demo
- [x] Full app walkthrough video
- [x] Feature showcase
- [x] Sample vault with content

---

## Post-Phase 4: Future Enhancements

### Phase 5 Ideas (Optional)
1. **Mobile App** (React Native/Capacitor)
2. **Cloud Sync** (Dropbox, Google Drive)
3. **Collaboration** (Real-time editing)
4. **Plugin System** (Custom extensions)
5. **AI Integration** (Summaries, suggestions)
6. **Git Integration** (Version control)
7. **Export** (PDF, HTML, Markdown)
8. **Import** (Obsidian, Notion, etc.)
9. **Graph View** (Visual link network)
10. **Kanban Board** (Task visualization)

---

## Final Product Features

After Phase 4, you'll have:

✅ Local markdown storage
✅ Three-pane web interface
✅ Daily notes with calendar
✅ Time blocking with timeline
✅ Task management
✅ Bi-directional linking
✅ Full-text search
✅ Templates
✅ Command palette
✅ Dark mode
✅ Real-time sync
✅ Keyboard shortcuts

This represents **80% feature parity** with NotePlan core functionality!

---

*Phase 4 PRP Version: 1.0*
*Estimated Completion: 3-4 weeks*
*Dependencies: Phase 1, 2, 3*
