# Global Task System Documentation

## Overview

The Global Task System allows tasks from all Notes files to be accessible throughout the application, enabling features like:
- Dragging tasks from ANY Notes file to the Calendar/Timeline
- A unified "All Tasks" view showing tasks from all Notes files
- Future expansion for cross-file task management

## Architecture

### Core Components

#### 1. **Global Task Store** (`/frontend/src/store/globalTaskStore.ts`)
- Maintains an index of all tasks from all Notes files
- Provides methods to query tasks by file or ID
- Tracks indexing status and last update time
- Key methods:
  - `indexFile()` - Index tasks from a single file
  - `indexMultipleFiles()` - Batch index multiple files
  - `getTaskById()` - Find any task by its ID
  - `getAllTasks()` - Get all tasks from all files

#### 2. **Global Task Indexer** (`/frontend/src/services/globalTaskIndexer.ts`)
- Service that manages the indexing process
- Loads all Notes files on initialization
- Sets up file watchers to keep index in sync
- Automatically re-indexes when files change
- Key features:
  - Auto-initialization on app start
  - Real-time updates via file watching
  - Filters out Calendar files (only indexes Notes)

#### 3. **All Tasks View** (`/frontend/src/components/tasks/AllTasksView.tsx`)
- UI component showing tasks from all Notes files
- Groups tasks by source file
- Supports filtering (active, completed, scheduled, etc.)
- Expandable/collapsible file sections
- Drag-and-drop enabled for all tasks

## How It Works

### Initialization Flow
1. App starts → `App.tsx` calls `globalTaskIndexer.initialize()`
2. Indexer loads all files from Notes folder via API
3. Each file's content is parsed for tasks
4. Tasks are stored in the global store
5. File watchers are set up for real-time updates

### Drag and Drop Flow
1. User views Calendar tab
2. User opens "All Tasks" view
3. Tasks from all Notes files are displayed
4. User drags task from any file
5. `DragDropProvider` handles the drop event
6. `createTaskReferenceInDailyNote` looks up task:
   - First checks current file tasks
   - Falls back to global task store if not found
7. Task reference/timeblock is created in daily note

## Key Changes Made

### Modified Files

#### `/frontend/src/hooks/useTasks.ts`
```typescript
// Modified createTaskReferenceInDailyNote to use global tasks
let task = tasks.find((t) => t.id === taskId);
if (!task) {
  task = useGlobalTaskStore.getState().getTaskById(taskId);
}
```

#### `/frontend/src/App.tsx`
```typescript
// Added global task indexer initialization
await globalTaskIndexer.initialize();
```

#### `/frontend/src/components/layout/MainView.tsx`
```typescript
// Added "All Tasks" tab
{currentView === 'alltasks' && <AllTasksView />}
```

## Usage Guide

### For Users

1. **Viewing All Tasks**
   - Click the "All Tasks" tab in the main view
   - See tasks organized by source file
   - Use filters to narrow down tasks
   - Click file headers to expand/collapse

2. **Dragging Tasks to Timeline**
   - Open Calendar view
   - Click "All Tasks" tab
   - Drag any task to the Timeline
   - Task creates timeblock at drop position

3. **Task Management**
   - Tasks maintain their source file association
   - Editing tasks updates the original file
   - Task state (completed, etc.) is preserved

### For Developers

#### Adding New Task Sources
```typescript
// Index a new directory
const files = await api.getFiles('NewDirectory/');
useGlobalTaskStore.getState().indexMultipleFiles(files);
```

#### Accessing Global Tasks
```typescript
// Get all tasks
const allTasks = useGlobalTaskStore.getState().getAllTasks();

// Find specific task
const task = useGlobalTaskStore.getState().getTaskById('task-123');

// Get tasks from specific file
const fileTasks = useGlobalTaskStore.getState().getTasksByFile('Notes/project.txt');
```

## Performance Considerations

- Initial indexing happens once on app load
- File watching provides incremental updates
- Tasks are indexed in memory for fast access
- Large numbers of files/tasks are handled efficiently
- Only `.txt` and `.md` files are indexed

## Future Enhancements

1. **Global Task Search**
   - Full-text search across all tasks
   - Filter by tags, dates, projects

2. **Bulk Operations**
   - Select and modify multiple tasks
   - Batch scheduling/rescheduling
   - Cross-file task moves

3. **Task Analytics**
   - Task completion rates
   - Time tracking across projects
   - Productivity insights

4. **Smart Scheduling**
   - AI-powered task prioritization
   - Automatic time blocking
   - Workload balancing

## Troubleshooting

### Tasks Not Appearing
1. Check console for indexing errors
2. Verify files are in Notes/ directory
3. Ensure files are `.txt` or `.md` format
4. Check file permissions

### Drag and Drop Issues
1. Verify global indexer initialized
2. Check console for task lookup errors
3. Ensure task IDs are unique
4. Verify drop target is properly configured

### Performance Issues
1. Reduce number of indexed files
2. Check for infinite re-indexing loops
3. Verify file watchers aren't duplicated
4. Consider pagination for large task lists

## API Reference

### GlobalTaskStore

```typescript
interface GlobalTaskStore {
  tasksByFile: Map<string, ParsedTask[]>;
  allGlobalTasks: ParsedTask[];
  isIndexing: boolean;

  indexFile(filePath: string, content: string): void;
  getTaskById(taskId: string): ParsedTask | undefined;
  getAllTasks(): ParsedTask[];
}
```

### GlobalTaskIndexer

```typescript
class GlobalTaskIndexer {
  initialize(): Promise<void>;
  refreshFile(filePath: string): Promise<void>;
  refreshAll(): Promise<void>;
  dispose(): void;
}
```

## Testing

### Manual Testing
1. Create test files in Notes/ with tasks
2. Open app and navigate to "All Tasks"
3. Verify all tasks appear
4. Drag task to Calendar timeline
5. Verify timeblock is created
6. Edit original file and verify updates

### Automated Testing
```javascript
// Test global task indexing
const store = useGlobalTaskStore.getState();
await globalTaskIndexer.initialize();
expect(store.getAllTasks().length).toBeGreaterThan(0);

// Test task lookup
const task = store.getTaskById('test-task-id');
expect(task).toBeDefined();
```

## Summary

The Global Task System transforms the NotePlan clone from a file-centric to a task-centric application. Users can now:
- See all their tasks regardless of file location
- Drag tasks from any Notes file to the calendar
- Maintain a unified view of their task universe

This foundation enables powerful future features like global task search, bulk operations, and intelligent scheduling.