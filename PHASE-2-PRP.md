# Phase 2: Web UI & Editor - Product Requirements & Planning

## Overview

Phase 2 builds the React frontend that provides a NotePlan-like user interface. This phase focuses on creating a polished, responsive web application that connects to the Phase 1 backend.

**Goal:** Create a three-pane web interface with file browsing, markdown editing, and real-time updates.

---

## Success Criteria

- ✅ Three-pane layout matches NotePlan's design
- ✅ Can browse folders and files in sidebar
- ✅ Can create, edit, and delete notes
- ✅ Markdown editor with live preview
- ✅ Real-time updates via WebSocket
- ✅ Dark mode support
- ✅ Responsive design (desktop priority, mobile aware)
- ✅ Keyboard shortcuts for common actions

---

## Technical Specifications

### Technology Stack

**Core Framework:**
- **React 18** with TypeScript
- **Vite** for build tooling (faster than CRA)
- **React Router** for navigation

**UI/Styling:**
- **Tailwind CSS** (matches NotePlan's modern aesthetic)
- **Headless UI** for accessible components
- **Heroicons** or **Font Awesome** for icons

**Markdown Editor:**
- **TipTap** (recommended) - Modern, extensible, React-friendly
  - Alternative: **CodeMirror 6** (more code-focused)

**State Management:**
- **Zustand** (lightweight) or **React Context** (simpler)

**HTTP Client:**
- **Axios** or native **fetch**

**WebSocket:**
- **socket.io-client**

### Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tiptap/react": "^2.1.0",
    "@tiptap/starter-kit": "^2.1.0",
    "@tiptap/extension-link": "^2.1.0",
    "socket.io-client": "^4.6.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    "date-fns": "^2.30.0",
    "@headlessui/react": "^1.7.0",
    "@heroicons/react": "^2.1.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## Architecture

### Directory Structure

```
noteplan-frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx           # Main 3-pane layout
│   │   │   ├── Sidebar.tsx          # File browser
│   │   │   ├── NoteList.tsx         # Middle pane (optional)
│   │   │   ├── Editor.tsx           # Editor pane
│   │   │   └── Header.tsx           # Top bar
│   │   ├── editor/
│   │   │   ├── MarkdownEditor.tsx   # TipTap wrapper
│   │   │   ├── EditorToolbar.tsx    # Formatting toolbar
│   │   │   └── EditorMenu.tsx       # Bubble menu
│   │   ├── sidebar/
│   │   │   ├── FolderTree.tsx       # Recursive folder tree
│   │   │   ├── FileItem.tsx         # File list item
│   │   │   └── SearchBar.tsx        # Quick search
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   └── Loading.tsx
│   │   └── modals/
│   │       ├── NewFileModal.tsx
│   │       ├── DeleteConfirm.tsx
│   │       └── SettingsModal.tsx
│   ├── hooks/
│   │   ├── useFiles.ts              # File operations
│   │   ├── useWebSocket.ts          # WebSocket connection
│   │   ├── useKeyboard.ts           # Keyboard shortcuts
│   │   └── useTheme.ts              # Dark mode
│   ├── store/
│   │   ├── fileStore.ts             # File/folder state
│   │   ├── editorStore.ts           # Editor state
│   │   └── uiStore.ts               # UI state (sidebar, theme)
│   ├── services/
│   │   ├── api.ts                   # API client
│   │   └── websocket.ts             # WebSocket client
│   ├── utils/
│   │   ├── markdown.ts              # Markdown utilities
│   │   ├── shortcuts.ts             # Keyboard shortcuts
│   │   └── format.ts                # Date/text formatting
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Detailed Requirements

### 1. Layout System

**Main Layout Component:**
```tsx
<Layout>
  <Sidebar
    collapsed={sidebarCollapsed}
    onToggle={toggleSidebar}
  />
  <Editor
    file={currentFile}
    onSave={handleSave}
  />
</Layout>
```

**Layout Features:**
- Resizable panes (drag divider to resize)
- Collapsible sidebar
- Responsive breakpoints:
  - Desktop (>1024px): Full 3-pane
  - Tablet (768-1024px): 2-pane, toggle sidebar
  - Mobile (<768px): Single pane with navigation

**State Management:**
```typescript
interface LayoutState {
  sidebarWidth: number      // Default: 300px
  sidebarCollapsed: boolean
  currentView: 'editor' | 'list'
}
```

### 2. Sidebar Component

**Folder Tree:**
```tsx
<FolderTree>
  {folders.map(folder => (
    <FolderItem
      key={folder.path}
      folder={folder}
      expanded={expandedFolders.has(folder.path)}
      onToggle={toggleFolder}
    >
      {folder.files.map(file => (
        <FileItem
          key={file.path}
          file={file}
          active={currentFile?.path === file.path}
          onClick={openFile}
        />
      ))}
    </FolderItem>
  ))}
</FolderTree>
```

**Features:**
- Collapsible folder tree
- Visual hierarchy (indentation, icons)
- Active file highlight
- Right-click context menu (New, Rename, Delete)
- Drag-and-drop file organization (Phase 4)
- Search/filter bar at top

**Styling:**
```css
Sidebar:
- Background: bg-stone-100 dark:bg-[#333333]
- Border: border-r-2
- Icons: Folder (closed/open), File

Active File:
- Background: bg-amber-100 dark:bg-amber-900
- Bold text

Hover:
- Background: hover:bg-gray-200 dark:hover:bg-gray-700
```

### 3. Editor Component

**TipTap Configuration:**
```typescript
const editor = useEditor({
  extensions: [
    StarterKit,
    Link,
    TaskList,
    TaskItem,
    // Custom extensions for NotePlan syntax
  ],
  content: currentFile?.content,
  onUpdate: ({ editor }) => {
    handleContentChange(editor.getHTML())
  }
})
```

**Editor Features:**
- **Live markdown rendering** (WYSIWYG style)
- **Syntax highlighting** for markdown source mode
- **Auto-save** (debounced to 1 second)
- **Formatting toolbar** (Bold, Italic, Link, List, etc.)
- **Task checkbox** support
- **Wiki-link** syntax support `[[Note]]`
- **Split view** option (markdown | preview)

**Editor Modes:**
```typescript
type EditorMode = 'wysiwyg' | 'source' | 'split'
```

**Toolbar Actions:**
- Bold (Cmd+B)
- Italic (Cmd+I)
- Heading 1-3
- Bullet List
- Task List
- Insert Link
- Insert Wiki Link [[]]
- Code Block

### 4. File Operations

**Create New File:**
```tsx
const createFile = async (path: string, content: string = '') => {
  const response = await api.post(`/api/files/${path}`, { content })
  // Optimistic update
  addFileToStore(response.data)
  // Open new file
  openFile(response.data.path)
}
```

**Save File:**
```tsx
const saveFile = useDebouncedCallback(
  async (path: string, content: string) => {
    await api.post(`/api/files/${path}`, { content })
    toast.success('Saved')
  },
  1000 // Debounce 1 second
)
```

**Delete File:**
```tsx
const deleteFile = async (path: string) => {
  if (confirm('Delete this note?')) {
    await api.delete(`/api/files/${path}`)
    removeFileFromStore(path)
    if (currentFile?.path === path) {
      setCurrentFile(null)
    }
  }
}
```

### 5. WebSocket Integration

**Connection:**
```typescript
const socket = useWebSocket('ws://localhost:3001')

useEffect(() => {
  socket.on('file:changed', (data) => {
    const { event, path, content } = data

    if (event === 'modified' && path !== currentFile?.path) {
      // Update file in store
      updateFileInStore(path, content)
    } else if (event === 'created') {
      addFileToStore(path)
    } else if (event === 'deleted') {
      removeFileFromStore(path)
    }
  })

  return () => socket.disconnect()
}, [])
```

**Conflict Handling:**
- If current file modified externally, show warning banner
- Option to "Reload" or "Keep editing"

### 6. Keyboard Shortcuts

**Global Shortcuts:**
- `Cmd+N` - New note
- `Cmd+S` - Save (explicit, even with auto-save)
- `Cmd+K` - Command palette (Phase 4)
- `Cmd+B` - Toggle sidebar
- `Cmd+/` - Toggle source/preview mode
- `Cmd+P` - Quick file switcher
- `Cmd+F` - Search in current note

**Editor Shortcuts:**
- `Cmd+B` - Bold
- `Cmd+I` - Italic
- `Cmd+L` - Insert link
- `Cmd+[` - Decrease heading level
- `Cmd+]` - Increase heading level

### 7. Theme System

**Theme Toggle:**
```typescript
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) setTheme(saved as 'light' | 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark')
  }

  return { theme, toggleTheme }
}
```

**Color Scheme:**

**Light Mode:**
```css
Background: #f5f5f5 (stone-100)
Sidebar: #e5e5e5 (stone-200)
Editor: #ffffff
Text: #333333
Accent: #f59e0b (amber-500)
Border: #d4d4d4
```

**Dark Mode:**
```css
Background: #1f1f1f
Sidebar: #333333
Editor: #2a2a2a
Text: #e5e5e5
Accent: #fbbf24 (amber-400)
Border: #404040
```

### 8. State Management

**File Store (Zustand):**
```typescript
interface FileStore {
  files: File[]
  folders: Folder[]
  currentFile: File | null

  loadFiles: () => Promise<void>
  openFile: (path: string) => Promise<void>
  saveFile: (path: string, content: string) => Promise<void>
  createFile: (path: string, content?: string) => Promise<void>
  deleteFile: (path: string) => Promise<void>
}
```

**UI Store:**
```typescript
interface UIStore {
  sidebarCollapsed: boolean
  sidebarWidth: number
  theme: 'light' | 'dark'
  editorMode: 'wysiwyg' | 'source' | 'split'

  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  toggleTheme: () => void
  setEditorMode: (mode: EditorMode) => void
}
```

---

## UI Mockup (Text)

```
┌─────────────────────────────────────────────────────────────────┐
│  NotePlan Clone              [Search]  [New+]  [🌙]  [Settings] │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                     │
│  📁 Notes   │  # Project Planning                                │
│    📁 10... │                                                     │
│      📄 Prj │  ## Goals                                          │
│    📁 20... │  * [ ] Define scope                                │
│    📁 @Temp │  * [ ] Create timeline                             │
│             │                                                     │
│  📁 Calendar│  ## Notes                                          │
│    📄 20... │  Need to coordinate with [[Team Lead]] on this.   │
│    📄 20... │                                                     │
│             │  + 09:00-10:00 Planning meeting                    │
│  [+ New]    │  + 14:00-15:00 Review                             │
│             │                                                     │
│             │                                                     │
│             │                                      Auto-saved ✓  │
└─────────────┴───────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Project Setup (3 hours)
1. Initialize Vite + React + TypeScript
2. Configure Tailwind CSS
3. Set up ESLint + Prettier
4. Install dependencies
5. Configure path aliases

### Step 2: Layout & Routing (6 hours)
1. Create Layout component
2. Implement resizable panes
3. Set up React Router
4. Create Header component
5. Implement responsive breakpoints
6. Test layout on different screen sizes

### Step 3: Sidebar Component (8 hours)
1. Create FolderTree component
2. Implement recursive folder rendering
3. Create FileItem component
4. Add expand/collapse logic
5. Implement active file highlighting
6. Add search bar
7. Style with Tailwind
8. Add loading states

### Step 4: Editor Integration (10 hours)
1. Set up TipTap
2. Configure extensions
3. Create MarkdownEditor component
4. Build toolbar
5. Implement auto-save
6. Add mode switching (WYSIWYG/source)
7. Style editor content
8. Handle edge cases

### Step 5: File Operations (8 hours)
1. Create API service layer
2. Implement file CRUD hooks
3. Add optimistic updates
4. Build NewFileModal
5. Build DeleteConfirm modal
6. Add error handling
7. Show loading states
8. Add success/error toasts

### Step 6: WebSocket Integration (5 hours)
1. Create WebSocket service
2. Implement useWebSocket hook
3. Handle file change events
4. Show conflict warnings
5. Test real-time updates

### Step 7: Theme System (4 hours)
1. Set up dark mode toggle
2. Configure Tailwind dark mode
3. Style all components for both themes
4. Persist theme preference
5. Test theme switching

### Step 8: Keyboard Shortcuts (4 hours)
1. Create useKeyboard hook
2. Implement global shortcuts
3. Implement editor shortcuts
4. Handle conflicts
5. Show shortcut hints

### Step 9: Polish & Testing (6 hours)
1. Add loading skeletons
2. Improve error messages
3. Add animations/transitions
4. Test on different browsers
5. Test responsive layouts
6. Fix bugs

**Total Estimated Time: 54 hours (~3-4 weeks part-time)**

---

## Component Examples

### Sidebar Component
```tsx
// Sidebar.tsx
export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle
}) => {
  const { folders, files } = useFileStore()

  return (
    <div className={`
      sidebar bg-stone-100 dark:bg-[#333333]
      border-r-2 dark:border-gray-700
      ${collapsed ? 'w-0' : 'w-[300px]'}
      transition-all duration-200
    `}>
      <div className="p-4">
        <SearchBar />
        <FolderTree folders={folders} files={files} />
        <button
          onClick={() => createNewFile()}
          className="btn-primary w-full mt-4"
        >
          + New Note
        </button>
      </div>
    </div>
  )
}
```

### Editor Component
```tsx
// Editor.tsx
export const Editor: React.FC<EditorProps> = ({ file }) => {
  const { saveFile } = useFileStore()
  const [content, setContent] = useState(file?.content || '')

  const debouncedSave = useDebouncedCallback(
    (newContent: string) => {
      if (file) {
        saveFile(file.path, newContent)
      }
    },
    1000
  )

  const handleChange = (newContent: string) => {
    setContent(newContent)
    debouncedSave(newContent)
  }

  if (!file) {
    return <EmptyState message="Select a note to edit" />
  }

  return (
    <div className="editor flex-1 bg-white dark:bg-[#2a2a2a]">
      <EditorToolbar />
      <MarkdownEditor
        content={content}
        onChange={handleChange}
      />
    </div>
  )
}
```

---

## Testing Strategy

### Unit Tests
- Component rendering
- File operation hooks
- Keyboard shortcut handlers
- Theme toggle logic

### Integration Tests
- File CRUD flow
- WebSocket updates
- Sidebar navigation
- Editor save/load

### E2E Tests (Playwright)
- Create note flow
- Edit and save note
- Delete note flow
- Theme switching
- Keyboard shortcuts

---

## Performance Considerations

1. **Virtual scrolling** for large file lists
2. **Lazy loading** folder contents
3. **Debounced save** (1 second)
4. **Memoization** of expensive renders
5. **Code splitting** by route

---

## Accessibility

- [ ] Keyboard navigation for file tree
- [ ] ARIA labels on buttons/icons
- [ ] Focus management in modals
- [ ] Screen reader support
- [ ] High contrast mode

---

## Phase 2 Deliverables

### Code
- [x] Working React application
- [x] All components implemented
- [x] Connected to Phase 1 API
- [x] Responsive design working

### Documentation
- [x] Component documentation
- [x] User guide (basic usage)
- [x] Keyboard shortcuts reference

### Demo
- [x] Video walkthrough
- [x] Deployed version (localhost)
- [x] Sample content loaded

---

## Transition to Phase 3

With Phase 2 complete, you'll have a fully functional note-taking app. Phase 3 will add:
- Calendar-specific UI
- Daily note automation
- Timeline view for time blocks
- Date navigation

---

*Phase 2 PRP Version: 1.0*
*Estimated Completion: 3-4 weeks*
*Dependencies: Phase 1*
