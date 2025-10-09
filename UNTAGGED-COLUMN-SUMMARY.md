# Untagged Column Feature

## What Was Added

A new "No Status" column has been added to the left of all other columns in the Kanban board. This column automatically displays all tasks that don't have any `status-*` tags.

## Changes Made

### Backend (src/services/boardService.js)
- Updated DEFAULT_CONFIG to include a "No Status" column as the first column (order: 0)
- Column uses special tagFilter: `__no_status__`
- Column has gray color (#9ca3af) to distinguish it from status columns

### Frontend (src/services/boardService.ts)
- Updated `getTasksForColumn()` function to handle the special `__no_status__` filter
- When tagFilter is `__no_status__`, returns tasks that DON'T have any tags starting with "status-"

### Frontend (src/components/kanban/KanbanBoard.tsx)
- Updated `handleDragEnd()` to properly handle dragging to/from the "No Status" column
- When dragging TO "No Status": removes all status tags
- When dragging FROM "No Status": adds the target column's status tag
- Added cleanup to prevent extra whitespace

## How It Works

1. **Display**: Tasks without `status-*` tags automatically appear in the "No Status" column
2. **Drag To**: Dragging a task to "No Status" removes its status tag from the markdown
3. **Drag From**: Dragging from "No Status" to any other column adds that column's status tag

## Example

In the test file `data/Notes/test-kanban.md`:

```markdown
## Untagged Tasks
* Task without status tags
* Another untagged task #urgent
```

These tasks will appear in the "No Status" column because they don't have `#status-todo`, `#status-doing`, or `#status-done` tags.

## Board Configuration

The default board now has 4 columns:
1. **No Status** (tagFilter: `__no_status__`) - Shows untagged tasks
2. **To Do** (tagFilter: `status-todo`)
3. **In Progress** (tagFilter: `status-doing`)
4. **Done** (tagFilter: `status-done`)

## Testing

To test:
1. Open the Kanban board view
2. Look for the "No Status" column on the left
3. Drag an untagged task to "To Do" → status tag is added
4. Drag a tagged task to "No Status" → status tag is removed
