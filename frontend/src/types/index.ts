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
export type Theme = 'light' | 'dark';

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
