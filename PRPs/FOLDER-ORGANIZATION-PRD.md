# Folder Organization Feature - Product Requirements Document (PRD)

**Version:** 1.0
**Date:** October 9, 2025
**Status:** Draft for Review
**Author:** Claude
**Project:** NotePlan Clone - Folder Management System

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Objectives](#2-goals--objectives)
3. [User Stories](#3-user-stories)
4. [Functional Requirements](#4-functional-requirements)
5. [Technical Requirements](#5-technical-requirements)
6. [UI/UX Specifications](#6-uiux-specifications)
7. [API Specifications](#7-api-specifications)
8. [Data Model Changes](#8-data-model-changes)
9. [Implementation Phases](#9-implementation-phases)
10. [Success Metrics](#10-success-metrics)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Open Questions](#12-open-questions)
13. [Appendix](#13-appendix)

---

## 1. Executive Summary

### Overview
This PRD defines the requirements for implementing a comprehensive folder organization system in the NotePlan clone application. The feature will enable users to create, manage, and organize their notes using a hierarchical folder structure with drag-and-drop capabilities, context menus, and bulk operations.

### Problem Statement
Currently, users can view notes grouped by folders, but cannot:
- Create new folders from the UI
- Rename or delete existing folders
- Move notes between folders
- Reorganize folder hierarchy
- Customize folder appearance

This limits users' ability to organize their growing note collections effectively.

### Solution
Implement a full-featured folder management system that allows users to:
- Create and manage nested folder hierarchies within the Notes directory
- Move notes between folders using multiple interaction patterns
- Customize folder appearance (icons, colors, tags)
- Configure folder-specific views (list vs. kanban)
- Perform bulk operations on notes
- Undo folder operations for safety

### Success Criteria
- Users can create up to 50 folders with unlimited nesting depth (technical limit: 5 levels)
- All folder operations complete in <500ms
- Zero data loss during move/rename operations
- 95% user satisfaction with folder management UX
- Seamless real-time sync across multiple clients

---

## 2. Goals & Objectives

### Primary Goals
1. **Enable Organization**: Allow users to organize notes into meaningful hierarchies
2. **Maintain Simplicity**: Keep the UI intuitive and uncluttered (priority #1)
3. **Ensure Data Safety**: Prevent accidental data loss with confirmations and undo
4. **Support Flexibility**: Accommodate different organizational styles (PARA, custom, etc.)

### Secondary Goals
1. **Performance**: Fast folder operations (<500ms response time)
2. **Visual Customization**: Let users personalize folder appearance
3. **Bulk Operations**: Enable efficient management of multiple notes
4. **Search Integration**: Make folders searchable and filterable

### Non-Goals (Out of Scope)
- Smart folders (saved searches)
- Folder sharing/collaboration
- Folder permissions/access control
- Automatic folder suggestions
- Folder templates
- Folder duplication
- Bulk folder operations

---

## 3. User Stories

### Epic 1: Folder Creation
**US-1.1**: As a user, I want to create a new folder in the Notes directory so I can organize my notes by topic.
- **Acceptance Criteria:**
  - "New Folder" button visible in sidebar when viewing Notes
  - Right-click context menu on folders shows "New Subfolder" option
  - Folder creation dialog validates name (no special characters)
  - New folder appears immediately in tree view
  - Folder creation triggers WebSocket event

**US-1.2**: As a user, I want the app to suggest a PARA folder structure on first use so I have a starting point for organization.
- **Acceptance Criteria:**
  - On first run, app offers to create PARA structure
  - Creates: "10 - Projects", "20 - Areas", "30 - Resources", "40 - Archive"
  - User can skip or customize during setup
  - Structure created in Notes/ directory

### Epic 2: Folder Navigation
**US-2.1**: As a user, I want to expand and collapse folders in the sidebar so I can focus on relevant areas.
- **Acceptance Criteria:**
  - Chevron icon next to folders with children
  - Click chevron to expand/collapse
  - State persists across sessions
  - Smooth animation on expand/collapse

**US-2.2**: As a user, I want to toggle between viewing notes in just this folder vs. including subfolders.
- **Acceptance Criteria:**
  - Toggle button when folder is selected
  - "This folder only" vs "Include subfolders" modes
  - Note count updates based on mode
  - Setting persists per folder

**US-2.3**: As a user, I want to see breadcrumb navigation showing the current folder path.
- **Acceptance Criteria:**
  - Breadcrumbs appear above editor when note is open
  - Shows: Notes / Projects / Work / Meeting Notes
  - Each breadcrumb is clickable to navigate
  - Updates when note is moved

### Epic 3: Moving Notes
**US-3.1**: As a user, I want to drag notes between folders so I can quickly reorganize.
- **Acceptance Criteria:**
  - Notes can be dragged from file list
  - Hover over folder highlights it as drop target
  - Drop moves note and updates file path
  - Visual feedback during drag operation
  - Undo option appears after move

**US-3.2**: As a user, I want to right-click a note and select "Move to..." so I can move notes with precision.
- **Acceptance Criteria:**
  - Right-click menu shows "Move to..." option
  - Modal displays folder tree picker
  - Search box to filter folders
  - Shows current location with checkmark
  - Move button disabled if same folder selected

**US-3.3**: As a user, I want to select multiple notes and move them at once so I can reorganize efficiently.
- **Acceptance Criteria:**
  - Checkbox selection mode for notes
  - "Move selected" button appears when notes selected
  - Bulk move dialog shows count: "Move 5 notes to..."
  - All notes move atomically (all or nothing)
  - Progress indicator for large batches

### Epic 4: Folder Management
**US-4.1**: As a user, I want to rename a folder so I can improve my organization over time.
- **Acceptance Criteria:**
  - Double-click folder name to edit inline
  - Right-click menu shows "Rename" option
  - Validation prevents duplicate names in same parent
  - All file paths update automatically
  - Undo option available

**US-4.2**: As a user, I want to delete a folder with confirmation so I can remove unused folders.
- **Acceptance Criteria:**
  - Right-click menu shows "Delete Folder" option
  - Confirmation dialog shows: "Delete folder and X notes?"
  - Checkbox: "I understand all notes will be permanently deleted"
  - Protected folders (Calendar, @Templates) cannot be deleted
  - Undo option available for 30 seconds

**US-4.3**: As a user, I want to drag folders to reorganize the hierarchy.
- **Acceptance Criteria:**
  - Folders can be dragged within Notes/ directory
  - Drop on folder creates subfolder relationship
  - Drop between folders reorders at same level
  - Cannot drag folders to Calendar or @Templates
  - Real-time file system updates

### Epic 5: Folder Customization
**US-5.1**: As a user, I want to assign icons to folders so I can identify them quickly.
- **Acceptance Criteria:**
  - Right-click menu shows "Choose Icon" option
  - Icon picker with categories (work, personal, etc.)
  - Default icon if none selected
  - Icons persist in folder metadata
  - Icons visible in tree view and breadcrumbs

**US-5.2**: As a user, I want to assign colors to folders for visual organization.
- **Acceptance Criteria:**
  - Right-click menu shows "Choose Color" option
  - Color picker with preset palette
  - Color applies to folder name and icon
  - Subtle background tint when folder selected
  - Colors saved in folder metadata

**US-5.3**: As a user, I want to tag folders so I can categorize them across hierarchy.
- **Acceptance Criteria:**
  - Folder properties dialog includes tags field
  - Tags appear as small badges next to folder
  - Can filter folder view by tags
  - Tags searchable in global search

**US-5.4**: As a user, I want to set a default view (list or kanban) per folder.
- **Acceptance Criteria:**
  - Folder properties include "Default View" setting
  - Options: List, Kanban, Inherit from Parent
  - View switches automatically when folder selected
  - Setting persists across sessions

### Epic 6: Search & Filtering
**US-6.1**: As a user, I want to search for folders by name so I can find them quickly.
- **Acceptance Criteria:**
  - Sidebar search box searches both notes and folders
  - Folder results shown separately
  - Clicking folder result navigates to it
  - Shows full path in results

**US-6.2**: As a user, I want to filter the reference view by folders.
- **Acceptance Criteria:**
  - Reference view has "Folders" filter dropdown
  - Multi-select folders to include
  - Shows references only from selected folders
  - Filter state persists in session

**US-6.3**: As a user, I want search results to show which folder each note is in.
- **Acceptance Criteria:**
  - Search results include folder path
  - Path displayed in muted text below note title
  - Clicking path navigates to folder
  - Path updates if note moved

### Epic 7: Undo & Safety
**US-7.1**: As a user, I want to undo folder operations so I can recover from mistakes.
- **Acceptance Criteria:**
  - Undo toast appears after destructive operations
  - 30-second window to undo
  - Undo stack supports last 10 operations
  - Operations: move, rename, delete, create
  - Undo restores exact previous state

**US-7.2**: As a user, I want confirmation dialogs for destructive actions.
- **Acceptance Criteria:**
  - Delete folder: shows note count and checkbox confirmation
  - Move many notes: shows source/destination preview
  - Rename folder: warns if many notes affected
  - Cancel button always visible and prominent

---

## 4. Functional Requirements

### 4.1 Folder Creation

#### FR-1.1: Folder Creation UI
- **Description**: Users can create folders through multiple entry points
- **Requirements**:
  - "New Folder" button in sidebar toolbar when Notes section active
  - Right-click context menu on folders shows "New Subfolder" option
  - Keyboard shortcut: `Cmd/Ctrl + Shift + N` when focused on Notes
  - Creation dialog with name input field

#### FR-1.2: Folder Naming Rules
- **Description**: Enforce naming conventions for consistency and safety
- **Requirements**:
  - Allowed characters: A-Z, a-z, 0-9, space, hyphen, underscore
  - No special characters: `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`
  - Maximum length: 100 characters
  - Trim leading/trailing whitespace
  - Prevent duplicate names in same parent folder
  - Case-insensitive duplicate detection

#### FR-1.3: Folder Limit
- **Description**: Prevent excessive folder creation
- **Requirements**:
  - Maximum 50 total folders across entire Notes/ directory
  - Warning at 45 folders: "Approaching folder limit (45/50)"
  - Error at 50: "Cannot create folder. Maximum limit reached (50)"
  - Limit does not include Calendar or @Templates

#### FR-1.4: Nesting Depth
- **Description**: Support nested folder hierarchies
- **Requirements**:
  - Unlimited nesting in data model
  - UI enforces 5-level depth limit
  - Error message: "Maximum nesting depth (5 levels) reached"
  - Breadcrumbs show full path regardless of depth

#### FR-1.5: PARA Default Structure
- **Description**: Offer PARA system setup for new users
- **Requirements**:
  - First-time setup wizard includes folder structure step
  - Option: "Set up PARA folders (Projects, Areas, Resources, Archive)"
  - Creates folders with numerical prefixes:
    - `10 - Projects`
    - `20 - Areas`
    - `30 - Resources`
    - `40 - Archive`
  - Skip option available
  - Can delete/rename these folders after creation

### 4.2 Folder Navigation

#### FR-2.1: Tree View
- **Description**: Display folders in expandable tree structure
- **Requirements**:
  - Hierarchical tree view in sidebar
  - Indentation: 16px per level
  - Chevron icon (▶) for collapsed folders
  - Chevron icon (▼) for expanded folders
  - No chevron for empty folders
  - Smooth expand/collapse animation (200ms)
  - Click chevron to toggle, click name to select folder

#### FR-2.2: Folder Expansion State
- **Description**: Remember which folders are expanded
- **Requirements**:
  - Store expansion state in localStorage
  - Key: `folderExpansion:${folderPath}`
  - Persist across browser sessions
  - Restore on app reload
  - Default state: Notes and Calendar folders expanded

#### FR-2.3: Folder Selection
- **Description**: Visual feedback when folder is selected
- **Requirements**:
  - Selected folder highlighted with background color
  - Active state: `bg-amber-100 dark:bg-amber-900`
  - Icon and text color: `text-amber-600 dark:text-amber-400`
  - Only one folder selected at a time
  - Selection persists until different folder/note selected

#### FR-2.4: Note Display Toggle
- **Description**: Toggle between folder-only and recursive view
- **Requirements**:
  - Toggle button above note list when folder selected
  - Icon states:
    - Folder icon: "This folder only"
    - Nested folder icon: "Include subfolders"
  - Note count updates based on mode
  - Setting saved per folder in localStorage
  - Default: "Include subfolders"

#### FR-2.5: Breadcrumb Navigation
- **Description**: Show current folder path as breadcrumbs
- **Requirements**:
  - Display location: Above editor, below main view tabs
  - Format: `Notes / Projects / Work / Meeting Notes`
  - Separator: ` / ` with padding
  - Each segment clickable (except last)
  - Clicking segment navigates to that folder
  - Truncate middle segments if path too long
  - Tooltip shows full path on hover

### 4.3 Moving Notes

#### FR-3.1: Drag-and-Drop Notes
- **Description**: Move notes by dragging to folders
- **Requirements**:
  - Drag handle: entire note row is draggable
  - Drag preview shows note icon + name
  - Drop targets: folder rows in sidebar
  - Visual feedback:
    - Drop target highlighted: `bg-amber-50 dark:bg-amber-950`
    - Blue border: `border-2 border-amber-400`
    - Invalid drop target: red border + cursor not-allowed
  - Drop triggers move operation
  - Loading state during move
  - Success toast: "Note moved to [Folder Name]"
  - Error toast if move fails

#### FR-3.2: Context Menu Move
- **Description**: Move notes via right-click menu
- **Requirements**:
  - Right-click note shows context menu
  - Menu item: "Move to..." with folder icon
  - Keyboard shortcut: `Cmd/Ctrl + Shift + M`
  - Opens folder picker modal
  - Modal components:
    - Title: "Move [Note Name]"
    - Folder tree (searchable)
    - Search box at top
    - Current location shown with checkmark
    - Cancel and Move buttons
  - Move button disabled if same folder selected
  - Close modal on successful move

#### FR-3.3: Bulk Move Notes
- **Description**: Move multiple notes simultaneously
- **Requirements**:
  - Checkbox appears on hover over note row
  - Click checkbox to toggle selection
  - Select all checkbox in header
  - Selection counter: "5 notes selected"
  - Bulk actions toolbar appears when notes selected:
    - "Move to..." button
    - "Cancel" button (clears selection)
  - Move dialog shows: "Move 5 notes to..."
  - Progress indicator for large batches (>10 notes)
  - Atomic operation: all succeed or all fail
  - Error handling: show which notes failed
  - Success toast: "5 notes moved to [Folder Name]"

#### FR-3.4: File Path Updates
- **Description**: Update file system paths when notes moved
- **Requirements**:
  - Backend renames/moves files on disk
  - New path format: `Notes/[FolderPath]/[NoteName].txt`
  - Update all references/links to moved notes
  - Update metadata.path in database/cache
  - Trigger WebSocket event: `file:moved` with old and new paths
  - All clients receive update and refresh

### 4.4 Folder Management

#### FR-4.1: Rename Folder
- **Description**: Change folder name with inline editing or modal
- **Requirements**:
  - **Inline Edit**:
    - Double-click folder name to enter edit mode
    - Input field replaces folder name
    - Focus automatically in input
    - Enter to save, Esc to cancel
    - Click outside to save
  - **Context Menu**:
    - Right-click shows "Rename" option
    - Opens rename modal with current name pre-filled
    - Validation same as folder creation
    - Shows preview: "This will rename X files"
  - **Backend Operations**:
    - Rename folder on file system
    - Update all file paths within folder (recursive)
    - Update metadata for all affected notes
    - Trigger WebSocket event: `folder:renamed`
    - Undo option available for 30 seconds
  - **Error Handling**:
    - Show error if duplicate name exists
    - Show error if rename fails on file system
    - Revert UI state on error

#### FR-4.2: Delete Folder
- **Description**: Remove folder and all contents with confirmation
- **Requirements**:
  - Right-click menu shows "Delete Folder" option in red
  - Keyboard shortcut: `Delete` key when folder selected
  - Confirmation dialog:
    - Title: "Delete [Folder Name]?"
    - Warning icon (red)
    - Message: "This folder contains X notes and Y subfolders. All content will be permanently deleted."
    - Checkbox: "I understand all content will be permanently deleted"
    - Cancel button (default focus)
    - Delete button (red, disabled until checkbox checked)
  - Protected folders cannot be deleted:
    - Calendar, @Templates, Notes (root)
    - No delete option in context menu
    - Attempting via API returns 403 Forbidden
  - Backend operations:
    - Delete folder and all contents from file system
    - Remove all metadata for deleted notes
    - Trigger WebSocket event: `folder:deleted`
    - Undo option available for 30 seconds
  - Undo mechanism:
    - Store deleted folder structure + content in memory
    - "Undo" button in toast notification
    - Restore all files and metadata if undo clicked
    - Clear undo stack after 30 seconds

#### FR-4.3: Move Folder (Drag-and-Drop)
- **Description**: Reorganize folder hierarchy by dragging
- **Requirements**:
  - Folders can be dragged by drag handle icon
  - Drop targets:
    - On another folder: becomes subfolder
    - Between folders: reorders at same level
    - On Notes root: moves to top level
  - Visual feedback same as note dragging
  - Validation:
    - Cannot drop folder into itself or its children (circular reference)
    - Cannot move folder to Calendar or @Templates
    - Cannot move Calendar or @Templates folders
    - Maximum nesting depth enforced
  - Backend operations:
    - Move folder directory on file system
    - Update all file paths recursively
    - Maintain folder metadata
    - Trigger WebSocket event: `folder:moved`
    - Undo available

#### FR-4.4: Protected Folders
- **Description**: Prevent deletion/modification of system folders
- **Requirements**:
  - Protected folders: `Calendar`, `@Templates`
  - Restrictions:
    - Cannot be deleted
    - Cannot be renamed
    - Cannot be moved
    - Cannot be nested under other folders
  - UI indicators:
    - Lock icon shown next to protected folders
    - Delete/rename options grayed out in context menu
    - Tooltip: "This is a system folder and cannot be modified"
  - API enforcement:
    - Backend validates folder is not protected
    - Returns 403 Forbidden for protected folder operations
    - Error message: "Cannot modify system folder"

### 4.5 Folder Customization

#### FR-5.1: Folder Icons
- **Description**: Assign icons to folders for visual identification
- **Requirements**:
  - Right-click menu: "Choose Icon..."
  - Icon picker modal:
    - Categories: Work, Personal, Projects, Archive, Custom
    - Grid layout with 48x48 icon preview
    - Search box to filter icons
    - Default icon option
    - Recently used icons section
  - Icon storage:
    - Saved in folder metadata file: `.folder-meta.json`
    - Format: `{ "icon": "briefcase", "color": "#f59e0b" }`
  - Icon display:
    - Shown in tree view (16x16)
    - Shown in breadcrumbs (14x14)
    - Default icon: folder icon (FolderIcon from heroicons)
  - Icon library: Use Heroicons outline set initially

#### FR-5.2: Folder Colors
- **Description**: Apply colors to folders for categorization
- **Requirements**:
  - Right-click menu: "Choose Color..."
  - Color picker modal:
    - Preset palette with 12 colors
    - Color names: Red, Orange, Yellow, Green, Blue, Purple, Pink, Gray
    - Color applies to:
      - Folder icon (tint)
      - Folder name text
      - Background (subtle tint when selected)
  - Color storage: Same `.folder-meta.json` as icons
  - Default color: Gray (no tint)
  - Color accessibility: Ensure sufficient contrast in dark mode

#### FR-5.3: Folder Tags
- **Description**: Tag folders for cross-hierarchy categorization
- **Requirements**:
  - Folder properties dialog includes Tags section
  - Tag input:
    - Autocomplete from existing tags
    - Create new tags inline
    - Multiple tags per folder
    - Tag format: `#tag-name`
  - Tag display:
    - Small badge next to folder name in tree
    - Maximum 2 tags visible, "+X more" if more
    - Tooltip shows all tags on hover
  - Tag storage: In `.folder-meta.json`
  - Tag filtering:
    - Filter sidebar by tag
    - Show all folders with selected tag
    - Tag cloud view (optional)

#### FR-5.4: Folder Default View
- **Description**: Set default view mode per folder
- **Requirements**:
  - Folder properties dialog includes "Default View" setting
  - Options:
    - List View (default)
    - Kanban View
    - Inherit from Parent
  - View persists when navigating away and back
  - Setting saved in `.folder-meta.json`
  - Auto-switch view when folder selected
  - Override: User can manually switch view, override persists for session

### 4.6 Search & Filtering

#### FR-6.1: Folder Search
- **Description**: Search for folders by name or path
- **Requirements**:
  - Sidebar search box searches folders and notes simultaneously
  - Search algorithm:
    - Match folder name (case-insensitive)
    - Match partial path segments
    - Fuzzy matching for typos
    - Rank by relevance
  - Search results display:
    - Section header: "Folders" and "Notes"
    - Folder results show full path
    - Clicking folder result navigates to folder and expands tree
  - Keyboard navigation:
    - Arrow keys to move between results
    - Enter to select
    - Esc to clear search

#### FR-6.2: Reference View Folder Filter
- **Description**: Filter references by source folder
- **Requirements**:
  - Reference view toolbar includes "Folders" dropdown
  - Dropdown shows:
    - "All Folders" (default)
    - List of all folders (with note count)
    - Multi-select checkboxes
    - Search box to filter folder list
  - Filter logic:
    - Show references only from selected folders
    - Include subfolders option (toggle)
  - Filter state:
    - Persists in session storage
    - Reset on page reload
    - Saved to URL query param for shareability

#### FR-6.3: Search Result Folder Display
- **Description**: Show folder location in search results
- **Requirements**:
  - Each search result shows:
    - Note title (bold)
    - Match preview (context)
    - Folder path (muted text, small font)
  - Folder path format: `in Notes / Projects / Work`
  - Clicking folder path:
    - Navigates to folder
    - Highlights note in folder view
  - Path updates:
    - Real-time update if note moved
    - WebSocket listener for file:moved events

### 4.7 Undo & Safety

#### FR-7.1: Undo System
- **Description**: Allow users to undo folder operations
- **Requirements**:
  - Undo stack:
    - In-memory stack of last 10 operations
    - Operations: create, rename, move, delete (folders and notes)
    - Each operation stores:
      - Type, timestamp, previous state, new state
  - Undo UI:
    - Toast notification appears after operation
    - Shows: "[Operation] completed. Undo?"
    - 30-second timeout, then auto-dismiss
    - Click "Undo" to revert
  - Undo operations:
    - Create → Delete
    - Delete → Restore with full content
    - Rename → Rename back
    - Move → Move back to original location
  - Undo implementation:
    - Backend API: `POST /api/undo/:operationId`
    - Returns success/failure
    - Triggers WebSocket event for sync
  - Limitations:
    - Cannot undo if subsequent operations conflict
    - Example: Cannot undo rename if folder was deleted
    - Show error: "Cannot undo: folder no longer exists"

#### FR-7.2: Confirmation Dialogs
- **Description**: Confirm before destructive actions
- **Requirements**:
  - Delete folder confirmation:
    - Modal dialog (not dismissible by clicking outside)
    - Shows folder name, note count, subfolder count
    - Checkbox: "I understand all content will be permanently deleted"
    - Cancel button (default focus, Esc key)
    - Delete button (red, enabled only after checkbox)
  - Bulk move confirmation:
    - Show if moving >10 notes
    - Preview: "Move 15 notes from Projects to Archive?"
    - List of notes (scrollable, max 5 visible)
    - "Show all" to expand list
    - Cancel and Confirm buttons
  - Rename folder confirmation:
    - Show if folder contains >20 notes
    - Warning: "This will rename X notes. Continue?"
    - Note: "File paths will be updated automatically"
    - Cancel and Rename buttons
  - No confirmation for:
    - Creating folders
    - Moving single notes
    - Expanding/collapsing folders
    - Changing folder properties (icon, color)

---

## 5. Technical Requirements

### 5.1 Backend Requirements

#### TR-1: Folder API Endpoints
- **New Endpoints**:
  ```
  POST   /api/folders/create          - Create new folder
  PUT    /api/folders/:path/rename    - Rename folder
  DELETE /api/folders/:path           - Delete folder
  PUT    /api/folders/:path/move      - Move folder
  GET    /api/folders/:path/metadata  - Get folder metadata
  PUT    /api/folders/:path/metadata  - Update folder metadata
  POST   /api/notes/:path/move        - Move note to folder
  POST   /api/notes/bulk-move         - Move multiple notes
  POST   /api/undo/:operationId       - Undo operation
  GET    /api/folders/search          - Search folders
  ```

- **Request/Response Formats**: See Section 7 (API Specifications)

#### TR-2: File System Operations
- **Requirements**:
  - Use Node.js `fs/promises` for async operations
  - Atomic operations: use temporary files and rename
  - Transaction-like behavior: rollback on partial failure
  - Lock mechanism: prevent concurrent modifications
  - Validation: check permissions, disk space before operations
  - Error handling: detailed errors with recovery suggestions

#### TR-3: Path Management
- **Requirements**:
  - Normalize paths: convert to Unix-style separators
  - Validate paths: prevent path traversal (`../`)
  - Canonicalize: resolve symbolic links
  - Update all references when paths change
  - Maintain path mapping in memory cache for performance
  - Index paths for fast lookup

#### TR-4: Metadata Storage
- **Requirements**:
  - Each folder has optional `.folder-meta.json` file
  - File format:
    ```json
    {
      "icon": "briefcase",
      "color": "#f59e0b",
      "tags": ["work", "active"],
      "defaultView": "list",
      "created": "2025-10-09T10:00:00.000Z",
      "modified": "2025-10-09T11:30:00.000Z"
    }
    ```
  - Metadata is optional (folder works without it)
  - Load metadata on demand, cache in memory
  - Exclude metadata files from note lists
  - Git-ignore metadata files (`.folder-meta.json`)

#### TR-5: Undo System Backend
- **Requirements**:
  - In-memory operation log:
    ```javascript
    {
      operationId: uuid(),
      type: 'folder:delete',
      timestamp: Date.now(),
      userId: 'local', // for multi-user future
      data: {
        folderPath: 'Notes/Projects',
        files: [...], // archived file contents
        metadata: {...}
      },
      expiresAt: Date.now() + 30000
    }
    ```
  - Background job: clean expired operations every minute
  - Undo endpoint validates operation exists and not expired
  - Restore operations: reverse the original operation
  - Limit: 100MB total undo storage per session

#### TR-6: WebSocket Events
- **New Events**:
  ```javascript
  // Folder created
  {
    event: 'folder:created',
    path: 'Notes/Projects/New Project',
    timestamp: '2025-10-09T10:00:00.000Z'
  }

  // Folder renamed
  {
    event: 'folder:renamed',
    oldPath: 'Notes/Old Name',
    newPath: 'Notes/New Name',
    affectedFiles: ['Notes/New Name/file1.txt', ...],
    timestamp: '2025-10-09T10:00:00.000Z'
  }

  // Folder deleted
  {
    event: 'folder:deleted',
    path: 'Notes/Archived',
    affectedFiles: [...],
    timestamp: '2025-10-09T10:00:00.000Z'
  }

  // Folder moved
  {
    event: 'folder:moved',
    oldPath: 'Notes/Projects/Old Location',
    newPath: 'Notes/Archive/Old Location',
    affectedFiles: [...],
    timestamp: '2025-10-09T10:00:00.000Z'
  }

  // Note moved
  {
    event: 'note:moved',
    oldPath: 'Notes/Projects/note.txt',
    newPath: 'Notes/Archive/note.txt',
    timestamp: '2025-10-09T10:00:00.000Z'
  }
  ```

#### TR-7: Validation & Constraints
- **Requirements**:
  - Maximum 50 folders (not including Calendar, @Templates)
  - Maximum nesting depth: 5 levels
  - Maximum folder name length: 100 characters
  - Allowed characters: A-Z, a-z, 0-9, space, hyphen, underscore
  - Maximum metadata file size: 10KB
  - Rate limiting: 10 folder operations per minute per client

### 5.2 Frontend Requirements

#### TR-8: State Management
- **Requirements**:
  - Extend `fileStore` with folder operations:
    - `createFolder(parentPath, name)`
    - `renameFolder(path, newName)`
    - `deleteFolder(path)`
    - `moveFolder(oldPath, newPath)`
    - `moveSingleNote(notePath, targetFolder)`
    - `moveBulkNotes(notePaths, targetFolder)`
  - New store: `folderStore` for folder-specific state:
    - `expandedFolders: Set<string>` (which folders are expanded)
    - `selectedFolder: string | null` (currently selected folder)
    - `folderMetadata: Map<string, FolderMetadata>`
    - `folderViewMode: Map<string, 'list' | 'kanban'>`
    - `includeSubfolders: Map<string, boolean>`
  - Undo store: `undoStore`
    - `undoStack: UndoOperation[]`
    - `addOperation(operation)`
    - `undo(operationId)`
    - `clearExpired()`

#### TR-9: UI Components
- **New Components**:
  - `FolderTree.tsx` - Tree view with expand/collapse
  - `FolderNode.tsx` - Individual folder in tree
  - `CreateFolderDialog.tsx` - Folder creation modal
  - `RenameFolderDialog.tsx` - Rename folder modal
  - `DeleteFolderDialog.tsx` - Delete confirmation modal
  - `MoveFolderPicker.tsx` - Folder picker for moving notes
  - `FolderContextMenu.tsx` - Right-click context menu
  - `FolderIconPicker.tsx` - Icon selection modal
  - `FolderColorPicker.tsx` - Color selection modal
  - `FolderPropertiesDialog.tsx` - Edit folder properties
  - `BreadcrumbNav.tsx` - Breadcrumb navigation
  - `UndoToast.tsx` - Undo notification
  - `BulkActionsToolbar.tsx` - Bulk operations toolbar

#### TR-10: Drag-and-Drop
- **Requirements**:
  - Library: Use `@dnd-kit` (already in project for kanban)
  - Draggable items:
    - Notes (from note list)
    - Folders (from tree view)
  - Drop zones:
    - Folder rows in tree view
    - Between folders for reordering
  - Drag preview:
    - Semi-transparent ghost of dragged item
    - Shows item icon + name
  - Visual feedback:
    - Highlight valid drop targets
    - Red border for invalid drops
    - Cursor changes: grab, grabbing, not-allowed
  - Performance: Throttle drag events to 60fps

#### TR-11: Keyboard Shortcuts
- **Shortcuts**:
  - `Cmd/Ctrl + Shift + N` - New folder
  - `Cmd/Ctrl + Shift + M` - Move note
  - `F2` - Rename selected folder
  - `Delete` - Delete selected folder
  - `Cmd/Ctrl + Z` - Undo last operation
  - `Cmd/Ctrl + F` - Focus search box
  - `Arrow Up/Down` - Navigate tree
  - `Arrow Left/Right` - Collapse/expand folder
  - `Enter` - Open selected folder/note
  - `Esc` - Close modal/cancel operation

#### TR-12: Persistence
- **LocalStorage Keys**:
  - `folderExpansion` - JSON object of expanded folders
  - `folderSelection` - Currently selected folder path
  - `folderViewModes` - JSON object of folder view settings
  - `includeSubfolders` - JSON object of subfolder inclusion settings
  - `undoStack` - JSON array of undo operations (cleared on close)

#### TR-13: Performance
- **Requirements**:
  - Virtual scrolling for folder trees >50 items
  - Debounce search input (300ms)
  - Memoize folder tree rendering
  - Lazy load folder metadata (fetch on expand)
  - Optimize WebSocket event handling (batch updates)
  - Target: 60fps animations, <500ms operation response

### 5.3 Data Model Changes

#### TR-14: TypeScript Types
- **New Types**:
  ```typescript
  // Folder metadata
  export interface FolderMetadata {
    icon?: string;
    color?: string;
    tags?: string[];
    defaultView?: 'list' | 'kanban';
    created?: string; // ISO date
    modified?: string; // ISO date
  }

  // Folder node with metadata
  export interface FolderNodeWithMeta extends FolderNode {
    metadata?: FolderMetadata;
    noteCount?: number; // Total notes in folder
    subfolderCount?: number; // Direct subfolders
    isProtected?: boolean; // Calendar, @Templates
  }

  // Folder operation result
  export interface FolderOperationResult {
    success: boolean;
    path?: string;
    affectedFiles?: string[];
    error?: string;
    operationId?: string; // For undo
  }

  // Undo operation
  export interface UndoOperation {
    id: string;
    type: 'folder:create' | 'folder:rename' | 'folder:delete' |
          'folder:move' | 'note:move' | 'note:bulk-move';
    timestamp: number;
    expiresAt: number;
    data: any; // Operation-specific data
    description: string; // Human-readable description
  }

  // Folder search result
  export interface FolderSearchResult {
    path: string;
    name: string;
    noteCount: number;
    metadata?: FolderMetadata;
    relevanceScore: number;
  }

  // Bulk move request
  export interface BulkMoveRequest {
    notePaths: string[];
    targetFolder: string;
  }
  ```

---

## 6. UI/UX Specifications

### 6.1 Layout Changes

#### Sidebar Folder Tree
```
┌─────────────────────────────────────────┐
│ [Search box........................... ] │ ← Existing search
├─────────────────────────────────────────┤
│ [Files][Tasks][Board][Search][Links]... │ ← Existing tabs
├─────────────────────────────────────────┤
│                                         │
│  📁 Calendar                      (12)  │ ← Protected, expanded
│    📄 2025-10-08.txt                    │
│    📄 2025-10-09.txt                    │
│                                         │
│  📁 Notes                         (45)  │ ← Root, expanded
│    ▼ 📁 10 - Projects            (15)  │ ← Custom icon, expanded
│        ▼ 📁 Work                  (8)  │
│            📄 Meeting Notes.txt         │
│            📄 Project Plan.txt          │
│        ▶ 📁 Personal               (7)  │ ← Collapsed
│    ▶ 📁 20 - Areas               (12)  │
│    ▶ 📁 30 - Resources            (9)  │
│    ▼ 📁 40 - Archive             (19)  │
│        📄 Old Note.txt                  │
│                                         │
│  📁 @Templates                     (3)  │ ← Protected
│                                         │
│  [+ New Folder]                         │ ← New button
└─────────────────────────────────────────┘
```

#### Main View Breadcrumbs
```
┌────────────────────────────────────────────────────┐
│ [Editor][Tasks][Board][References] ← Existing tabs │
├────────────────────────────────────────────────────┤
│ 📁 Notes / 10 - Projects / Work                    │ ← NEW: Breadcrumbs
│ [This folder only ▼] [☰ List] [◫ Kanban]          │ ← NEW: View controls
├────────────────────────────────────────────────────┤
│                                                    │
│  [Editor content here...]                          │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 6.2 Component Specifications

#### 6.2.1 FolderNode Component
- **Visual States**:
  - Default: Gray folder icon, gray text
  - Hover: Light gray background
  - Selected: Amber background, amber icon/text
  - Dragging: Semi-transparent, following cursor
  - Drop target: Blue border, light blue background
  - Protected: Lock icon overlay, muted appearance

- **Layout**:
  ```
  [▶] [📁] [Folder Name............] [(12)]
   |    |    |                        |
   |    |    |                        └─ Note count
   |    |    └─ Name (truncate with ellipsis)
   |    └─ Icon (custom or default)
   └─ Expand chevron (if has children)
  ```

- **Interaction**:
  - Click chevron: expand/collapse
  - Click name/icon: select folder
  - Double-click name: rename inline
  - Right-click: context menu
  - Drag icon: start drag operation
  - Hover: show tooltip with full name + path

#### 6.2.2 Context Menu
- **Structure**:
  ```
  ┌─────────────────────────────┐
  │ 📝 New Subfolder            │
  │ ✏️  Rename                  │
  │ 🎨 Choose Icon              │
  │ 🌈 Choose Color             │
  │ 🏷️  Edit Tags               │
  │ ⚙️  Folder Properties       │
  ├─────────────────────────────┤
  │ 📤 Move to...               │
  ├─────────────────────────────┤
  │ 🗑️  Delete Folder           │ ← Red text, destructive
  └─────────────────────────────┘
  ```

- **Conditional Items**:
  - "New Subfolder": Hidden if max nesting depth reached
  - "Rename": Grayed out for protected folders
  - "Delete Folder": Grayed out for protected folders
  - "Move to...": Grayed out for protected folders

#### 6.2.3 Create Folder Dialog
```
┌──────────────────────────────────────┐
│  Create New Folder                   │
│                                      │
│  Folder name:                        │
│  [________________________]          │
│  ^└─ Auto-focus input                │
│                                      │
│  Location: Notes / 10 - Projects     │
│                                      │
│  ℹ️ Tip: Use numbers to control      │
│    sort order (e.g., "50 - Ideas")  │
│                                      │
│          [Cancel]  [Create]          │
│                     ^└─ Primary      │
└──────────────────────────────────────┘
```

- **Validation**:
  - Show error below input for invalid names
  - Disable Create button if invalid
  - Show character count: "25/100"

#### 6.2.4 Delete Folder Confirmation
```
┌──────────────────────────────────────┐
│  ⚠️  Delete Folder?                  │
│                                      │
│  You are about to delete:            │
│  📁 10 - Projects / Old Work         │
│                                      │
│  This folder contains:               │
│  • 12 notes                          │
│  • 2 subfolders                      │
│                                      │
│  ☐ I understand all content will be │
│    permanently deleted               │
│                                      │
│  This action cannot be undone.       │
│                                      │
│        [Cancel]  [Delete]            │
│         ^Focus    ^Red, disabled     │
└──────────────────────────────────────┘
```

#### 6.2.5 Folder Picker (Move To)
```
┌──────────────────────────────────────┐
│  Move Note to Folder                 │
│                                      │
│  [🔍 Search folders...............]  │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ ✓ 📁 10 - Projects              │ │ ← Current location
│  │   📁 20 - Areas                │ │
│  │   📁 30 - Resources            │ │
│  │   📁 40 - Archive              │ │
│  └────────────────────────────────┘ │
│  ^└─ Scrollable list                │
│                                      │
│          [Cancel]  [Move Here]       │
│                     ^Disabled if ✓   │
└──────────────────────────────────────┘
```

#### 6.2.6 Undo Toast Notification
```
┌────────────────────────────────────────┐
│  ✅ Folder "Projects" renamed          │
│                                        │
│  [Undo] (30s)                          │
│   ^Blue    ^Countdown timer            │
└────────────────────────────────────────┘
```

- **Position**: Bottom-center of screen
- **Duration**: 30 seconds
- **Auto-dismiss**: Fade out after timeout
- **Stacking**: Multiple toasts stack vertically

### 6.3 Visual Design

#### Colors (Tailwind Classes)
- **Folder Colors**:
  - Red: `text-red-600 dark:text-red-400`
  - Orange: `text-orange-600 dark:text-orange-400`
  - Yellow: `text-yellow-600 dark:text-yellow-400`
  - Green: `text-green-600 dark:text-green-400`
  - Blue: `text-blue-600 dark:text-blue-400`
  - Purple: `text-purple-600 dark:text-purple-400`
  - Pink: `text-pink-600 dark:text-pink-400`
  - Gray: `text-gray-600 dark:text-gray-400` (default)
  - Amber: `text-amber-600 dark:text-amber-400` (active state)

- **Background States**:
  - Hover: `bg-gray-100 dark:bg-gray-800`
  - Selected: `bg-amber-100 dark:bg-amber-900`
  - Drop target: `bg-blue-50 dark:bg-blue-950 border-2 border-blue-400`

#### Typography
- Folder names: `text-sm font-medium`
- Note count: `text-xs text-gray-500`
- Breadcrumbs: `text-sm text-gray-700 dark:text-gray-300`
- Tooltips: `text-xs`

#### Spacing
- Tree indentation: `16px` per level (via `pl-4`)
- Folder row height: `36px`
- Icon size: `16x16` (h-4 w-4)
- Gap between icon and text: `8px` (gap-2)

#### Animations
- Expand/collapse: `200ms ease-in-out`
- Hover state: `150ms ease-in-out`
- Drag preview: `0ms` (instant)
- Toast fade-out: `300ms ease-out`

### 6.4 Responsive Behavior

#### Desktop (>1024px)
- Sidebar: 280px width (existing)
- Folder tree: Full height
- Context menus: Open at cursor position
- Drag-and-drop: Full support

#### Tablet (768px - 1024px)
- Sidebar: 240px width
- Folder names: Truncate earlier
- Context menus: Open at cursor position
- Drag-and-drop: Full support

#### Mobile (<768px)
- Sidebar: Full screen overlay when open
- Folder tree: Full width
- Context menus: Bottom sheet instead of popup
- Drag-and-drop: Disabled, use context menu instead
- Long-press folder: Open context menu

---

## 7. API Specifications

### 7.1 Create Folder

**Endpoint**: `POST /api/folders/create`

**Request Body**:
```json
{
  "name": "New Project",
  "parentPath": "Notes/10 - Projects"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "path": "Notes/10 - Projects/New Project",
  "metadata": {
    "created": "2025-10-09T10:00:00.000Z"
  },
  "operationId": "uuid-123"
}
```

**Error Responses**:
- 400 Bad Request: Invalid folder name
  ```json
  {
    "error": {
      "code": "INVALID_NAME",
      "message": "Folder name contains invalid characters"
    }
  }
  ```
- 409 Conflict: Folder already exists
  ```json
  {
    "error": {
      "code": "FOLDER_EXISTS",
      "message": "A folder with this name already exists"
    }
  }
  ```
- 400 Bad Request: Folder limit reached
  ```json
  {
    "error": {
      "code": "FOLDER_LIMIT",
      "message": "Maximum folder limit (50) reached"
    }
  }
  ```

### 7.2 Rename Folder

**Endpoint**: `PUT /api/folders/:path/rename`

**Path Parameters**:
- `path`: URL-encoded folder path (e.g., `Notes/10%20-%20Projects`)

**Request Body**:
```json
{
  "newName": "Projects (Active)"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "oldPath": "Notes/10 - Projects",
  "newPath": "Notes/Projects (Active)",
  "affectedFiles": [
    "Notes/Projects (Active)/note1.txt",
    "Notes/Projects (Active)/note2.txt"
  ],
  "operationId": "uuid-456"
}
```

**Error Responses**:
- 403 Forbidden: Protected folder
  ```json
  {
    "error": {
      "code": "PROTECTED_FOLDER",
      "message": "Cannot rename system folder"
    }
  }
  ```
- 404 Not Found: Folder doesn't exist
- 409 Conflict: New name already exists

### 7.3 Delete Folder

**Endpoint**: `DELETE /api/folders/:path`

**Query Parameters**:
- `confirm`: Must be `true` (safety check)

**Success Response** (200 OK):
```json
{
  "success": true,
  "path": "Notes/Old Folder",
  "deletedFiles": [
    "Notes/Old Folder/note1.txt",
    "Notes/Old Folder/note2.txt"
  ],
  "deletedFolders": [
    "Notes/Old Folder/Subfolder"
  ],
  "operationId": "uuid-789"
}
```

**Error Responses**:
- 400 Bad Request: Missing confirmation
  ```json
  {
    "error": {
      "code": "CONFIRMATION_REQUIRED",
      "message": "Must set confirm=true to delete folder"
    }
  }
  ```
- 403 Forbidden: Protected folder

### 7.4 Move Folder

**Endpoint**: `PUT /api/folders/:path/move`

**Request Body**:
```json
{
  "targetPath": "Notes/40 - Archive"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "oldPath": "Notes/10 - Projects/Old Project",
  "newPath": "Notes/40 - Archive/Old Project",
  "affectedFiles": [...],
  "operationId": "uuid-abc"
}
```

**Error Responses**:
- 400 Bad Request: Circular reference
  ```json
  {
    "error": {
      "code": "CIRCULAR_REFERENCE",
      "message": "Cannot move folder into itself or its children"
    }
  }
  ```
- 400 Bad Request: Max nesting depth
  ```json
  {
    "error": {
      "code": "MAX_DEPTH",
      "message": "Maximum nesting depth (5 levels) exceeded"
    }
  }
  ```

### 7.5 Get Folder Metadata

**Endpoint**: `GET /api/folders/:path/metadata`

**Success Response** (200 OK):
```json
{
  "icon": "briefcase",
  "color": "#f59e0b",
  "tags": ["work", "active"],
  "defaultView": "list",
  "created": "2025-10-09T10:00:00.000Z",
  "modified": "2025-10-09T11:30:00.000Z",
  "noteCount": 15,
  "subfolderCount": 3
}
```

**Error Response**:
- 404 Not Found: No metadata file (returns empty object)

### 7.6 Update Folder Metadata

**Endpoint**: `PUT /api/folders/:path/metadata`

**Request Body**:
```json
{
  "icon": "folder-open",
  "color": "#10b981",
  "tags": ["personal"],
  "defaultView": "kanban"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "metadata": {
    "icon": "folder-open",
    "color": "#10b981",
    "tags": ["personal"],
    "defaultView": "kanban",
    "modified": "2025-10-09T12:00:00.000Z"
  }
}
```

### 7.7 Move Note

**Endpoint**: `POST /api/notes/:path/move`

**Request Body**:
```json
{
  "targetFolder": "Notes/40 - Archive"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "oldPath": "Notes/10 - Projects/note.txt",
  "newPath": "Notes/40 - Archive/note.txt",
  "operationId": "uuid-def"
}
```

### 7.8 Bulk Move Notes

**Endpoint**: `POST /api/notes/bulk-move`

**Request Body**:
```json
{
  "notePaths": [
    "Notes/10 - Projects/note1.txt",
    "Notes/10 - Projects/note2.txt",
    "Notes/20 - Areas/note3.txt"
  ],
  "targetFolder": "Notes/40 - Archive"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "movedNotes": [
    {
      "oldPath": "Notes/10 - Projects/note1.txt",
      "newPath": "Notes/40 - Archive/note1.txt"
    },
    {
      "oldPath": "Notes/10 - Projects/note2.txt",
      "newPath": "Notes/40 - Archive/note2.txt"
    },
    {
      "oldPath": "Notes/20 - Areas/note3.txt",
      "newPath": "Notes/40 - Archive/note3.txt"
    }
  ],
  "failedNotes": [],
  "operationId": "uuid-ghi"
}
```

**Partial Success** (207 Multi-Status):
```json
{
  "success": false,
  "movedNotes": [...],
  "failedNotes": [
    {
      "path": "Notes/20 - Areas/note3.txt",
      "error": "File not found"
    }
  ],
  "operationId": null
}
```

### 7.9 Undo Operation

**Endpoint**: `POST /api/undo/:operationId`

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Operation undone successfully",
  "restoredState": {
    "path": "Notes/10 - Projects",
    "files": [...]
  }
}
```

**Error Responses**:
- 404 Not Found: Operation expired or doesn't exist
  ```json
  {
    "error": {
      "code": "OPERATION_NOT_FOUND",
      "message": "Cannot undo: operation expired or not found"
    }
  }
  ```
- 409 Conflict: Cannot undo due to conflicts
  ```json
  {
    "error": {
      "code": "UNDO_CONFLICT",
      "message": "Cannot undo: folder has been modified since operation"
    }
  }
  ```

### 7.10 Search Folders

**Endpoint**: `GET /api/folders/search`

**Query Parameters**:
- `q`: Search query (required)
- `limit`: Max results (default: 20)

**Success Response** (200 OK):
```json
{
  "results": [
    {
      "path": "Notes/10 - Projects",
      "name": "10 - Projects",
      "noteCount": 15,
      "metadata": {
        "icon": "briefcase",
        "color": "#f59e0b"
      },
      "relevanceScore": 0.95
    }
  ],
  "count": 1
}
```

---

## 8. Data Model Changes

### 8.1 FileMetadata Extension
```typescript
// Current type (existing)
export interface FileMetadata {
  path: string;
  name: string;
  folder: string;
  modified: string;
  created: string;
  size: number;
  type: 'note' | 'daily' | 'template';
}

// No changes needed - folder field already exists
```

### 8.2 New FolderMetadata Type
```typescript
export interface FolderMetadata {
  icon?: string;           // Icon identifier (e.g., "briefcase")
  color?: string;          // Hex color (e.g., "#f59e0b")
  tags?: string[];         // Tags for categorization
  defaultView?: 'list' | 'kanban';  // Default view mode
  created?: string;        // ISO date string
  modified?: string;       // ISO date string
}
```

### 8.3 Extended FolderNode Type
```typescript
// Current type (existing)
export interface FolderNode {
  name: string;
  type: 'folder';
  path: string;
  children: FolderNode[];
}

// Extended type (new)
export interface FolderNodeWithMeta extends FolderNode {
  metadata?: FolderMetadata;
  noteCount?: number;        // Total notes (recursive)
  directNoteCount?: number;  // Notes in this folder only
  subfolderCount?: number;   // Direct children count
  isProtected?: boolean;     // true for Calendar, @Templates
  depth?: number;            // Nesting level (0 = root)
}
```

### 8.4 Store Types
```typescript
// folderStore state
interface FolderStore {
  folders: FolderNodeWithMeta | null;
  expandedFolders: Set<string>;
  selectedFolder: string | null;
  folderMetadata: Map<string, FolderMetadata>;
  folderViewModes: Map<string, 'list' | 'kanban'>;
  includeSubfolders: Map<string, boolean>;
  loading: boolean;
  error: string | null;

  // Actions
  loadFolders: () => Promise<void>;
  createFolder: (parentPath: string, name: string) => Promise<void>;
  renameFolder: (path: string, newName: string) => Promise<void>;
  deleteFolder: (path: string) => Promise<void>;
  moveFolder: (oldPath: string, newPath: string) => Promise<void>;
  updateFolderMetadata: (path: string, metadata: Partial<FolderMetadata>) => Promise<void>;
  toggleFolder: (path: string) => void;
  selectFolder: (path: string) => void;
  setViewMode: (path: string, mode: 'list' | 'kanban') => void;
  setIncludeSubfolders: (path: string, include: boolean) => void;
}

// undoStore state
interface UndoStore {
  undoStack: UndoOperation[];

  // Actions
  addOperation: (operation: UndoOperation) => void;
  undo: (operationId: string) => Promise<void>;
  clearExpired: () => void;
  clear: () => void;
}
```

### 8.5 File System Structure
```
data/
├── Calendar/                    # Protected folder
│   ├── 20251007.txt
│   └── 20251008.txt
│
├── Notes/                       # Root folder for user notes
│   ├── .folder-meta.json        # Optional metadata
│   ├── 10 - Projects/
│   │   ├── .folder-meta.json
│   │   ├── Work/
│   │   │   ├── .folder-meta.json
│   │   │   ├── note1.txt
│   │   │   └── note2.txt
│   │   └── Personal/
│   │       └── note3.txt
│   ├── 20 - Areas/
│   ├── 30 - Resources/
│   └── 40 - Archive/
│
└── @Templates/                  # Protected folder
    └── template1.txt
```

---

## 9. Implementation Phases

### Phase 1: Core Folder Operations (Week 1-2)
**Goal**: Enable basic folder CRUD operations

#### Backend Tasks:
- [ ] Create folder API endpoints (create, rename, delete, move)
- [ ] Implement path validation and sanitization
- [ ] Add folder metadata file support
- [ ] Implement folder limit enforcement (50 folders)
- [ ] Add nesting depth validation (5 levels)
- [ ] Update file service to handle folder operations
- [ ] Add WebSocket events for folder operations
- [ ] Write unit tests for folder operations

#### Frontend Tasks:
- [ ] Create `folderStore` Zustand store
- [ ] Build `FolderTree` component with expand/collapse
- [ ] Build `FolderNode` component with visual states
- [ ] Implement "New Folder" button and dialog
- [ ] Add folder name validation in UI
- [ ] Implement folder expand/collapse state persistence
- [ ] Add WebSocket listener for folder events
- [ ] Test folder creation/deletion flows

**Deliverables**:
- Users can create folders from UI
- Folders appear in tree view
- Basic folder operations work (create, rename, delete)
- WebSocket sync works for folder changes

**Success Criteria**:
- Create folder in <500ms
- Folder limit enforced
- No data loss on errors
- All unit tests pass

---

### Phase 2: Moving & Reorganization (Week 3)
**Goal**: Enable moving notes and folders

#### Backend Tasks:
- [ ] Implement move note API endpoint
- [ ] Implement bulk move notes API endpoint
- [ ] Implement move folder API endpoint
- [ ] Add path update logic for moved files
- [ ] Add circular reference detection for folder moves
- [ ] Add transaction-like behavior (atomic operations)
- [ ] Write tests for move operations

#### Frontend Tasks:
- [ ] Integrate `@dnd-kit` for drag-and-drop
- [ ] Implement drag-and-drop for notes
- [ ] Implement drag-and-drop for folders
- [ ] Build `MoveFolderPicker` component
- [ ] Add "Move to..." context menu item
- [ ] Implement bulk selection for notes
- [ ] Build `BulkActionsToolbar` component
- [ ] Add visual feedback for drag operations
- [ ] Test all move scenarios

**Deliverables**:
- Drag-and-drop works for notes and folders
- Context menu "Move to..." works
- Bulk move works for multiple notes
- File paths update correctly

**Success Criteria**:
- Move single note in <300ms
- Move 10 notes in <1s
- Drag-and-drop smooth at 60fps
- All moved files accessible

---

### Phase 3: Folder Navigation & Views (Week 4)
**Goal**: Enhance folder browsing experience

#### Backend Tasks:
- [ ] Optimize folder tree API for performance
- [ ] Add note count calculation (per folder)
- [ ] Implement folder search endpoint
- [ ] Add folder filtering options

#### Frontend Tasks:
- [ ] Build `BreadcrumbNav` component
- [ ] Implement folder/subfolder toggle
- [ ] Add folder selection visual state
- [ ] Implement folder search in sidebar
- [ ] Add folder filter to Reference view
- [ ] Show folder path in search results
- [ ] Optimize tree rendering with memoization
- [ ] Add keyboard navigation for tree

**Deliverables**:
- Breadcrumbs show current folder path
- Toggle between folder-only and subfolder views
- Search works for folders
- Reference view filterable by folder

**Success Criteria**:
- Tree view renders <100ms for 50 folders
- Breadcrumbs update in real-time
- Search returns results <200ms
- Keyboard navigation works smoothly

---

### Phase 4: Customization & Metadata (Week 5)
**Goal**: Allow folder personalization

#### Backend Tasks:
- [ ] Implement get/update metadata endpoints
- [ ] Add metadata file creation/loading
- [ ] Implement metadata caching
- [ ] Add metadata to folder tree response

#### Frontend Tasks:
- [ ] Build `FolderIconPicker` component
- [ ] Build `FolderColorPicker` component
- [ ] Build `FolderPropertiesDialog` component
- [ ] Implement icon display in tree
- [ ] Implement color display in tree
- [ ] Add tag input and display
- [ ] Implement folder-specific view mode setting
- [ ] Add context menu items for customization

**Deliverables**:
- Users can assign icons to folders
- Users can assign colors to folders
- Users can tag folders
- Folders can have default view mode (list/kanban)

**Success Criteria**:
- Icon picker loads <200ms
- Color changes apply immediately
- Tags save correctly
- View mode persists across sessions

---

### Phase 5: Undo & Safety (Week 6)
**Goal**: Prevent data loss and enable recovery

#### Backend Tasks:
- [ ] Implement undo operation storage
- [ ] Add undo API endpoint
- [ ] Implement operation expiration cleanup
- [ ] Add undo support for all folder operations
- [ ] Add undo support for move operations
- [ ] Write tests for undo system

#### Frontend Tasks:
- [ ] Create `undoStore` Zustand store
- [ ] Build `UndoToast` component
- [ ] Implement undo button in toast
- [ ] Add confirmation dialog for destructive actions
- [ ] Build `DeleteFolderDialog` with checkbox
- [ ] Add keyboard shortcut for undo (Cmd+Z)
- [ ] Implement undo stack cleanup
- [ ] Test all undo scenarios

**Deliverables**:
- Undo works for all folder operations
- 30-second undo window
- Confirmation dialogs for destructive actions
- Toast notifications for operations

**Success Criteria**:
- Undo restores exact previous state
- Undo works within 30-second window
- All destructive actions require confirmation
- No accidental data loss

---

### Phase 6: Polish & Optimization (Week 7)
**Goal**: Refine UX and improve performance

#### Tasks:
- [ ] Add loading states for all operations
- [ ] Implement optimistic UI updates
- [ ] Add error recovery mechanisms
- [ ] Optimize WebSocket event handling
- [ ] Add virtual scrolling for large folder trees
- [ ] Implement keyboard shortcuts
- [ ] Add accessibility (ARIA labels, focus management)
- [ ] Write integration tests
- [ ] Write E2E tests with Playwright
- [ ] Performance testing and optimization
- [ ] Fix any reported bugs
- [ ] Update documentation

**Deliverables**:
- Smooth, polished UX
- All features performant
- Comprehensive test coverage
- Complete documentation

**Success Criteria**:
- All operations <500ms
- 60fps animations
- >80% test coverage
- Zero critical bugs

---

### Phase 7: PARA Setup Wizard (Optional - Week 8)
**Goal**: Guide new users to set up PARA structure

#### Tasks:
- [ ] Build onboarding wizard component
- [ ] Add PARA folder creation flow
- [ ] Create PARA documentation/help
- [ ] Add "Skip" option for advanced users
- [ ] Implement first-run detection
- [ ] Add sample notes to PARA folders (optional)

**Deliverables**:
- First-time users see setup wizard
- PARA folders created automatically (if chosen)
- Documentation explains PARA system

**Success Criteria**:
- >70% of new users complete setup
- Setup completes in <30 seconds
- Users understand PARA structure

---

## 10. Success Metrics

### 10.1 Functional Metrics
- **Folder Adoption**: % of users who create at least 1 folder (target: >80%)
- **Average Folders per User**: Median number of folders (target: 5-10)
- **Move Operations**: Average note moves per day (target: >3)
- **Organization Depth**: Average nesting depth (target: 2-3 levels)
- **PARA Adoption**: % of users using PARA structure (target: >40%)

### 10.2 Performance Metrics
- **Folder Creation Time**: <500ms (p95)
- **Move Operation Time**: <300ms for single note, <1s for 10 notes (p95)
- **Tree Render Time**: <100ms for 50 folders (p95)
- **Search Response Time**: <200ms (p95)
- **Undo Response Time**: <500ms (p95)

### 10.3 Quality Metrics
- **Error Rate**: <1% of operations fail
- **Data Loss**: 0 instances of data loss
- **Undo Success Rate**: >95% of undo operations succeed
- **User Satisfaction**: >4.5/5 rating
- **Bug Report Rate**: <2 bugs per 1000 operations

### 10.4 Usage Metrics
- **Feature Discovery**: % users who find folder features within first session (target: >70%)
- **Drag-and-Drop Usage**: % of moves via drag-and-drop vs. context menu (target: >60%)
- **Bulk Operations**: % of users using bulk move (target: >30%)
- **Customization**: % of users customizing folders (icon/color) (target: >20%)

---

## 11. Risks & Mitigations

### Risk 1: Data Loss During Move/Rename
**Probability**: Medium | **Impact**: High

**Mitigation**:
- Implement atomic operations (all or nothing)
- Use temporary files and rename pattern
- Add comprehensive error handling
- Implement undo system for all operations
- Add automatic backups before destructive operations
- Extensive testing of edge cases

### Risk 2: Performance Degradation with Many Folders
**Probability**: Medium | **Impact**: Medium

**Mitigation**:
- Implement virtual scrolling for trees >50 items
- Lazy load folder metadata
- Cache folder tree in memory
- Debounce search and filter operations
- Optimize WebSocket event handling
- Set maximum folder limit (50)

### Risk 3: File System Sync Issues
**Probability**: Low | **Impact**: High

**Mitigation**:
- Use file system locks during operations
- Implement conflict resolution
- WebSocket events for real-time sync
- Periodic refresh to catch missed events
- Add "Refresh" button for manual sync
- Log all file system operations for debugging

### Risk 4: User Confusion with Nested Folders
**Probability**: Medium | **Impact**: Low

**Mitigation**:
- Limit nesting depth to 5 levels
- Show breadcrumbs for current location
- Provide visual nesting indicators
- Add tooltips showing full path
- Include PARA setup wizard for guidance
- Document best practices in help docs

### Risk 5: Accidental Deletions
**Probability**: High | **Impact**: High

**Mitigation**:
- Require confirmation for deletions
- Show content count before deleting
- Require checkbox: "I understand..."
- Implement 30-second undo window
- Protected folders cannot be deleted
- Consider adding trash/archive feature (future)

### Risk 6: Circular References in Folder Moves
**Probability**: Low | **Impact**: Medium

**Mitigation**:
- Validate move operations on backend
- Detect circular references before moving
- Show clear error message: "Cannot move folder into itself"
- Gray out invalid drop targets in UI
- Write comprehensive tests for this scenario

### Risk 7: WebSocket Event Overload
**Probability**: Medium | **Impact**: Medium

**Mitigation**:
- Batch WebSocket events (max 1 per 100ms per folder)
- Debounce rapid operations
- Send only necessary data in events
- Implement event throttling on client
- Add reconnection logic for dropped connections

### Risk 8: Cross-Platform Path Issues
**Probability**: Low | **Impact**: Medium

**Mitigation**:
- Normalize all paths to Unix-style separators
- Use Node.js `path` module for all path operations
- Sanitize paths on both frontend and backend
- Test on Windows, Mac, Linux
- Document known platform limitations

---

## 12. Open Questions

### Technical Questions
1. **Q**: Should we use a database for folder metadata instead of `.folder-meta.json` files?
   - **Pro**: Faster queries, easier to index, atomic updates
   - **Con**: Adds dependency, less "plain text" philosophy
   - **Decision**: Start with JSON files, migrate to DB if performance issues

2. **Q**: Should we implement a trash/archive system instead of permanent deletion?
   - **Pro**: Safer, can recover deleted folders
   - **Con**: More complexity, disk space concerns
   - **Decision**: Phase 1 = permanent deletion, Phase 2 = add trash (future)

3. **Q**: Should folder operations be versioned with Git?
   - **Pro**: Full history, can revert any change
   - **Con**: Requires Git integration, complexity
   - **Decision**: Out of scope for now, consider in future

### UX Questions
4. **Q**: Should we auto-expand folders when dragging over them?
   - **Decision**: Yes, with 500ms delay to prevent accidental expansion

5. **Q**: Should we show a visual indicator for folders with unsaved changes?
   - **Decision**: No, all operations save immediately

6. **Q**: Should we allow duplicate folder names in different parents?
   - **Decision**: Yes, paths are unique even if names duplicate

### Feature Questions
7. **Q**: Should we support folder templates (e.g., "Project" template creates standard subfolders)?
   - **Decision**: Out of scope for Phase 1, consider for Phase 4

8. **Q**: Should we add a "Favorites" or "Pinned Folders" feature?
   - **Decision**: Out of scope for Phase 1, consider for Phase 4

9. **Q**: Should we support folder-level permissions (read-only, etc.)?
   - **Decision**: Out of scope for single-user version

---

## 13. Appendix

### A. PARA System Overview
**PARA** is a organizational method created by Tiago Forte:

- **10 - Projects**: Active projects with specific goals and deadlines
  - Example: "Website Redesign", "Q4 Marketing Campaign"

- **20 - Areas**: Ongoing responsibilities to maintain
  - Example: "Health", "Finances", "Team Management"

- **30 - Resources**: Topics of ongoing interest
  - Example: "Design Inspiration", "Productivity Tips", "Recipes"

- **40 - Archive**: Inactive items from other categories
  - Example: Completed projects, outdated resources

### B. Folder Naming Conventions
**Best Practices**:
- Use numerical prefixes for sorting: `10 - Projects`, `20 - Areas`
- Keep names concise (<30 characters)
- Use title case: `Meeting Notes` not `meeting notes`
- Avoid special characters: `Project-Alpha` not `Project/Alpha`
- Be consistent: Always use same format

**Examples**:
```
✅ Good:
- 10 - Projects
- 20 - Areas / Work
- 30 - Resources / Design

❌ Bad:
- projects (no number, lowercase)
- Work/Personal (slash not allowed)
- !!IMPORTANT!! (special characters)
```

### C. Keyboard Shortcuts Reference
```
Cmd/Ctrl + Shift + N   Create new folder
Cmd/Ctrl + Shift + M   Move selected note
F2                     Rename selected folder
Delete                 Delete selected folder
Cmd/Ctrl + Z           Undo last operation
Cmd/Ctrl + F           Focus search box
Arrow Up/Down          Navigate tree
Arrow Left/Right       Collapse/expand folder
Enter                  Open selected folder/note
Esc                    Close modal/cancel operation
```

### D. Testing Checklist

#### Unit Tests
- [ ] Folder name validation
- [ ] Path sanitization
- [ ] Circular reference detection
- [ ] Folder limit enforcement
- [ ] Nesting depth validation
- [ ] Metadata file operations
- [ ] Undo operation logic

#### Integration Tests
- [ ] Create folder via API
- [ ] Rename folder updates all paths
- [ ] Delete folder removes all contents
- [ ] Move folder updates all paths
- [ ] Move note updates path
- [ ] Bulk move notes
- [ ] WebSocket events trigger correctly
- [ ] Undo restores previous state

#### E2E Tests (Playwright)
- [ ] User creates folder from sidebar
- [ ] User renames folder via double-click
- [ ] User deletes folder with confirmation
- [ ] User drags note to folder
- [ ] User drags folder to new location
- [ ] User moves note via context menu
- [ ] User bulk moves multiple notes
- [ ] User undoes folder deletion
- [ ] User customizes folder icon/color
- [ ] User searches for folders
- [ ] User filters references by folder
- [ ] Folder operations sync across tabs

### E. API Error Codes Reference
```
INVALID_NAME           - Folder name invalid (special chars, too long)
FOLDER_EXISTS          - Folder with this name already exists
FOLDER_LIMIT           - Maximum folder limit (50) reached
MAX_DEPTH              - Maximum nesting depth (5) exceeded
PROTECTED_FOLDER       - Cannot modify system folder
FOLDER_NOT_FOUND       - Folder doesn't exist
CIRCULAR_REFERENCE     - Cannot move folder into itself
CONFIRMATION_REQUIRED  - Must confirm destructive operation
OPERATION_NOT_FOUND    - Undo operation expired or not found
UNDO_CONFLICT          - Cannot undo due to conflicts
FILE_SYSTEM_ERROR      - File system operation failed
VALIDATION_ERROR       - Request validation failed
SECURITY_ERROR         - Path traversal or other security issue
```

### F. Resources & References
- **PARA Method**: https://fortelabs.com/blog/para/
- **Johnny.Decimal**: https://johnnydecimal.com/
- **NotePlan Folder Docs**: https://help.noteplan.co/article/155-how-to-organize-your-notes-and-folders-using-johnny-decimal-and-para
- **@dnd-kit Docs**: https://docs.dndkit.com/
- **Heroicons**: https://heroicons.com/

---

## Document Control

**Version History**:
- v1.0 (2025-10-09): Initial draft

**Reviewers**:
- [ ] Product Owner
- [ ] Lead Developer
- [ ] UX Designer
- [ ] QA Lead

**Approval**:
- [ ] Approved by: _______________
- [ ] Date: _______________

**Next Review Date**: TBD

---

**End of Document**
