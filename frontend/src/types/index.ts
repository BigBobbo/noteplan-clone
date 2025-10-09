// File and Folder Types
export interface FileMetadata {
  path: string;
  name: string;
  folder: string;
  modified: string;
  created: string;
  size: number;
  type: 'note' | 'daily' | 'template';
}

export interface ParsedMarkdown {
  frontmatter: Record<string, any>;
  body: string;
  tasks: Task[];
  timeBlocks: TimeBlock[];
  links: WikiLink[];
  tags: string[];
  mentions: string[];
  dateReferences: string[];
}

export interface FileData {
  content: string;
  metadata: FileMetadata;
  parsed?: ParsedMarkdown;
}

export interface Task {
  text: string;
  completed: boolean;
  scheduled: boolean;
  canceled: boolean;
  line: number;
}

export interface TimeBlock {
  start: string;
  end: string;
  description: string;
  line: number;
}

export interface WikiLink {
  target: string;
  alias: string | null;
  line: number;
}

export interface FolderNode {
  name: string;
  type: 'folder';
  path: string;
  children: FolderNode[];
}

export interface FolderTree {
  tree: FolderNode;
}

// UI State Types
export type EditorMode = 'wysiwyg' | 'source' | 'split';
export type Theme = 'light' | 'dark' | 'ocean';

// WebSocket Event Types
export interface FileChangedEvent {
  event: 'created' | 'modified' | 'deleted';
  path: string;
  type: 'file' | 'directory';
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code: string;
    path?: string;
  };
}

export interface FileListResponse {
  files: FileMetadata[];
  count: number;
}

export interface SaveFileResponse {
  success: boolean;
  path: string;
}

export interface DeleteFileResponse {
  success: boolean;
}

export interface InitFoldersResponse {
  success: boolean;
  created: string[];
}

// Kanban Board Types
export interface KanbanColumn {
  id: string;
  name: string;
  tagFilter: string;  // e.g., "status-todo", "waiting", "review"
  color?: string;
  limit?: number;     // WIP limit (optional)
  order: number;
}

export interface KanbanBoard {
  id: string;
  name: string;
  columns: KanbanColumn[];
  filterTags?: string[];  // Show only tasks with these tags
  sortBy?: 'priority' | 'date' | 'manual';
  createdAt: string;
  updatedAt: string;
}

export interface BoardConfig {
  boards: KanbanBoard[];
  activeBoard: string;
  version: number;
}

export interface BoardResponse {
  boards: KanbanBoard[];
  activeBoard: string;
}

// Task Reference Types for Phase 3
export interface TaskReference {
  id: string;
  taskId: string;        // Original task ID (file:line)
  sourceFile: string;    // Where original task lives
  date: Date;            // Date referenced in
  timeBlock?: TimeBlockRef; // If time-blocked
  type: 'reference' | 'timeblock';
  createdAt: Date;
}

export interface TimeBlockRef {
  id: string;
  start: string;    // "09:00" (24-hour format)
  end: string;      // "11:00"
  duration: number; // minutes (auto-calculated)
  taskRef?: string; // Reference to task
}

export interface LinkedTask extends Task {
  references?: TaskReference[];  // Which daily notes reference this
  isReference?: boolean;          // Is this a reference link itself?
  originalTaskId?: string;       // If reference, points to original
}

// Reference Types for Tag References Feature
export interface Reference {
  id: string;
  type: 'tag' | 'wikilink' | 'unlinked' | 'task';
  sourceFile: string;
  sourceName: string;
  targetName: string;
  line: number;
  context: string[];
  matchText: string;
  dateModified: Date;
  isDaily: boolean;
}

export interface ParsedTag {
  tag: string;
  line: number;
  startIndex: number;
  endIndex: number;
}

export type SortOption = 'modified' | 'created' | 'filename' | 'count';

export interface ReferenceFilters {
  types: Array<'tag' | 'wikilink' | 'unlinked' | 'task'>;
  dateRange?: {
    start: Date;
    end: Date;
  };
  fileTypes: Array<'daily' | 'note' | 'template'>;
  folders: string[];
}

export interface ReferenceOptions {
  includeUnlinked?: boolean;
  caseSensitive?: boolean;
  contextLines?: number;
  minMentionLength?: number;
}
