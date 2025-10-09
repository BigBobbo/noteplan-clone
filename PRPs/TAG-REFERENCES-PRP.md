# Product Requirements Plan: Tag References Feature

## Executive Summary

This PRP outlines the implementation of a comprehensive **References** view that allows users to see all instances where a tag, note name, or concept is mentioned across their vault. This feature will add a fourth tab (alongside Editor, Tasks, and Board) that provides bidirectional linking capabilities, making it easier to discover connections between notes and navigate knowledge graphs.

---

## Background & Context

### Current State
- The app currently supports:
  - Wiki-style links (`[[Note Name]]`) with backlink tracking
  - Tags in tasks (`#tag` syntax)
  - Backlink display for wiki-links (via `useLinks` hook)
  - Task references for calendar integration

### Problem Statement
Users cannot easily:
1. View all instances where a specific tag is used across their vault
2. Discover connections between notes through tag usage
3. See both explicit links (`[[Health]]`, `#Health`) and implicit mentions (plain text "Health")
4. Navigate from a note to all places that reference it

### Inspiration from Other Tools
- **Obsidian**: Shows linked and unlinked mentions with context
- **Roam Research**: Displays linked references with ability to link unlinked mentions
- **LogSeq**: Treats tags and page links equivalently in references

---

## Goals & Objectives

### Primary Goals
1. **Discovery**: Help users discover connections between notes they didn't explicitly create
2. **Navigation**: Provide quick navigation to all references of a concept
3. **Context**: Show enough context to understand why/how a reference was made
4. **Flexibility**: Support multiple reference types (tags, links, mentions)

### Success Metrics
- Users can find all references to a note/tag in < 2 seconds
- 80% of references load with full context
- Support for vaults with 1000+ notes without performance degradation
- Users create 20% more connections through unlinked mentions

---

## User Stories

### Core Stories
1. **As a user**, I want to see all places where `#Health` appears so I can review my health-related notes
2. **As a user**, I want to see both `#Health` and `[[Health]]` references in one place so I have a complete view
3. **As a user**, I want to see plain text mentions of "Health" so I can discover implicit connections
4. **As a user**, I want to click on a reference and jump to that exact location so I can navigate easily
5. **As a user**, I want to filter references by date or file type so I can focus on relevant references
6. **As a user**, I want daily note references shown separately so I can distinguish between permanent notes and daily logs

### Secondary Stories
7. **As a user**, I want to convert unlinked mentions to links with one click so I can strengthen connections
8. **As a user**, I want to create a note for a tag that doesn't exist yet so I can flesh out my knowledge graph
9. **As a user**, I want references sorted by most recent so I see the latest context first
10. **As a user**, I want task references to be highlighted so I can track action items

---

## Functional Requirements

### FR-1: References View Tab
- **ID**: FR-1
- **Priority**: P0 (Critical)
- **Description**: Add a "References" tab alongside Editor, Tasks, and Board
- **Acceptance Criteria**:
  - Tab appears in MainView navigation
  - Uses appropriate icon (e.g., LinkIcon or HashtagIcon)
  - Active state styling matches existing tabs
  - Persists selection when switching files

### FR-2: Tag & Link Reference Detection
- **ID**: FR-2
- **Priority**: P0 (Critical)
- **Description**: Detect and display all references to current note/tag
- **Types of References**:
  1. **Hashtag references**: `#Health`, `#health` (case-insensitive)
  2. **Wiki-link references**: `[[Health]]`, `[[Health|alias]]`
  3. **Unlinked mentions**: Plain text "Health" (case-sensitive option)
- **Acceptance Criteria**:
  - All three types detected correctly
  - Case-insensitive matching for tags and links
  - Optional case-sensitive for unlinked mentions
  - Support for multi-word tags: `#[[Health Care]]`

### FR-3: Context Display
- **ID**: FR-3
- **Priority**: P0 (Critical)
- **Description**: Show multi-line context for each reference
- **Specifications**:
  - Display 2 lines before and 2 lines after (configurable)
  - Highlight the exact match within context
  - Show file path and line number
  - Display file icon/badge based on type
- **Acceptance Criteria**:
  - Context is readable and properly formatted
  - Markdown rendering preserved in context
  - Long lines are truncated with ellipsis

### FR-4: Grouping & Organization
- **ID**: FR-4
- **Priority**: P0 (Critical)
- **Description**: Group references by source file and type
- **Grouping Strategy**:
  ```
  References (42)
  ├─ Direct References (25)
  │  ├─ Daily Notes (10)
  │  │  └─ 2025-10-09.txt (3 references)
  │  └─ Notes (15)
  │     └─ Wellness Routine.txt (5 references)
  ├─ Task References (8)
  │  └─ Weekly Review.txt (8 references)
  └─ Unlinked Mentions (9)
     └─ Meeting Notes.txt (9 references)
  ```
- **Acceptance Criteria**:
  - Collapsible sections for each group
  - Count badges for each section
  - Daily Notes shown separately
  - Task references highlighted differently

### FR-5: Filtering
- **ID**: FR-5
- **Priority**: P1 (High)
- **Description**: Allow users to filter references
- **Filter Options**:
  - **By Type**: Tags, Links, Unlinked Mentions, Tasks
  - **By Date**: Today, This Week, This Month, Custom Range
  - **By File Type**: Daily Notes, Regular Notes, Templates
  - **By Folder**: Filter by source folder
- **Acceptance Criteria**:
  - Filters update results immediately
  - Multiple filters can be active simultaneously
  - Filter state persists during session
  - Clear all filters button available

### FR-6: Sorting
- **ID**: FR-6
- **Priority**: P1 (High)
- **Description**: Sort references by various criteria
- **Sort Options**:
  - Date Modified (default)
  - Date Created
  - File Name (A-Z)
  - Reference Count (most references first)
- **Acceptance Criteria**:
  - Sort order persists in session
  - Visual indicator of current sort
  - Ascending/descending toggle

### FR-7: Click Navigation
- **ID**: FR-7
- **Priority**: P0 (Critical)
- **Description**: Navigate to reference source on click
- **Behavior**:
  - Click opens file in split view
  - Scrolls to exact line
  - Highlights the reference line
  - Split view shows current note on left, reference source on right
- **Acceptance Criteria**:
  - Split view created on first click
  - Subsequent clicks update right pane
  - Option to open in full view (modifier key)
  - Smooth scroll animation to line

### FR-8: Unlinked Mention Linking
- **ID**: FR-8
- **Priority**: P2 (Medium)
- **Description**: Convert unlinked mentions to proper links
- **Features**:
  - "Link" button next to each unlinked mention
  - Converts plain text to `[[Link]]` or `#tag`
  - User chooses link type (wiki-link vs tag)
  - Bulk link option (link all mentions)
- **Acceptance Criteria**:
  - File is saved after linking
  - Reference moves from "Unlinked" to "Direct References"
  - Undo capability
  - Confirmation for bulk operations

### FR-9: Note Creation
- **ID**: FR-9
- **Priority**: P1 (High)
- **Description**: Create note for non-existent tags
- **Behavior**:
  - If no note exists for tag name, show "Create Note" button
  - Button appears at top of References tab
  - Creates note in appropriate folder (configurable default)
  - Immediately opens note in editor
- **Acceptance Criteria**:
  - Clear messaging when note doesn't exist
  - User can choose folder location
  - Template applied if configured
  - Backlink to original note added automatically

### FR-10: Empty States
- **ID**: FR-10
- **Priority**: P2 (Medium)
- **Description**: Handle cases with no references
- **Scenarios**:
  1. **No references found**: "No references to this note yet. Link to it from other notes using [[Note Name]] or #tag"
  2. **Filters too restrictive**: "No references match current filters. Clear filters to see all references"
  3. **New note**: "This is a new note. References will appear as you link to it"
- **Acceptance Criteria**:
  - Clear, helpful messaging
  - Actionable suggestions
  - Visual design consistent with app

---

## Technical Requirements

### TR-1: Service Layer
- **ID**: TR-1
- **Component**: `referenceService.ts`
- **Functions**:
  ```typescript
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

  // Find all references to a note/tag
  export const findReferences = (
    targetName: string,
    files: FileData[],
    options: ReferenceOptions
  ): Reference[]

  // Parse tags from content
  export const parseTags = (content: string): ParsedTag[]

  // Find unlinked mentions
  export const findUnlinkedMentions = (
    targetName: string,
    files: FileData[],
    excludeFiles: string[]
  ): Reference[]

  // Convert mention to link
  export const linkMention = (
    filePath: string,
    line: number,
    mentionText: string,
    linkType: 'wikilink' | 'tag'
  ): string

  // Build reference index for performance
  export const buildReferenceIndex = (
    files: FileData[]
  ): Map<string, Reference[]>
  ```

### TR-2: Store Layer
- **ID**: TR-2
- **Component**: `referenceStore.ts`
- **State**:
  ```typescript
  interface ReferenceStore {
    references: Reference[];
    referenceIndex: Map<string, Reference[]>;
    filters: ReferenceFilters;
    sortBy: SortOption;
    loading: boolean;
    indexedAt: Date | null;

    // Actions
    setReferences: (refs: Reference[]) => void;
    updateReferenceIndex: (index: Map<string, Reference[]>) => void;
    setFilter: (filter: Partial<ReferenceFilters>) => void;
    setSortBy: (sort: SortOption) => void;
    getFilteredReferences: () => Reference[];
    linkMention: (refId: string, linkType: 'wikilink' | 'tag') => Promise<void>;
  }
  ```

### TR-3: Hook Layer
- **ID**: TR-3
- **Component**: `useReferences.ts`
- **Responsibilities**:
  - Load references for current file
  - Handle filtering and sorting
  - Manage split view navigation
  - Update references on file changes
  - Debounce reference updates for performance

### TR-4: Component Layer
- **ID**: TR-4
- **Components**:
  1. `ReferenceView.tsx` - Main container
  2. `ReferenceList.tsx` - List of references with grouping
  3. `ReferenceItem.tsx` - Individual reference display
  4. `ReferenceFilters.tsx` - Filter controls
  5. `ReferenceEmpty.tsx` - Empty states
  6. `CreateNotePrompt.tsx` - Note creation UI

### TR-5: Performance Strategy (Hybrid Approach)
- **ID**: TR-5
- **Strategy**:
  1. **Initial Index**: Build reference index on app start for common tags
  2. **On-Demand Search**: Search for references when viewing specific note
  3. **Incremental Updates**: Update index when files change (via WebSocket)
  4. **Caching**: Cache reference results for recently viewed notes (LRU cache)
  5. **Web Workers**: Consider moving heavy parsing to Web Worker for large vaults

- **Implementation**:
  ```typescript
  // Index common tags on startup
  useEffect(() => {
    const indexCommonTags = async () => {
      const commonTags = await getTopNTags(50);
      const index = await buildPartialIndex(commonTags);
      setReferenceIndex(index);
    };
    indexCommonTags();
  }, []);

  // Search on-demand for current file
  useEffect(() => {
    if (!currentFile) return;

    const loadReferences = async () => {
      const targetName = getNoteName(currentFile);

      // Check cache first
      const cached = referenceCache.get(targetName);
      if (cached && isFresh(cached)) {
        setReferences(cached.references);
        return;
      }

      // Check index
      const indexed = referenceIndex.get(targetName);
      if (indexed) {
        setReferences(indexed);
        return;
      }

      // Fall back to full search
      const refs = await findReferences(targetName, files);
      setReferences(refs);
      referenceCache.set(targetName, { references: refs, timestamp: Date.now() });
    };

    loadReferences();
  }, [currentFile]);
  ```

### TR-6: Split View Implementation
- **ID**: TR-6
- **Approach**: Modify `MainView.tsx` to support split layout
- **Options**:
  1. **Modal Overlay**: Open reference in modal (simpler)
  2. **Split Pane**: Divide editor 50/50 (better UX)
  3. **Side Panel**: Add third column (more complex)

- **Recommended**: Split Pane approach
  ```typescript
  const [splitView, setSplitView] = useState<{
    enabled: boolean;
    leftFile: string;
    rightFile: string;
    highlightLine?: number;
  }>({ enabled: false, leftFile: '', rightFile: '' });
  ```

---

## UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ [Editor] [Tasks] [Board] [References]                    │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ References to "Health"                 [Create Note]│ │
│ │                                                      │ │
│ │ [Filters: All Types ▼] [Sort: Modified ▼]          │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ ▼ Direct References (25)                           │ │
│ │   ▼ Daily Notes (10)                               │ │
│ │     📅 2025-10-09.txt (3)                          │ │
│ │       Line 42: ...context before...                │ │
│ │       → Reviewed #Health metrics                   │ │
│ │         ...context after...                        │ │
│ │                                                      │ │
│ │   ▼ Notes (15)                                      │ │
│ │     📄 Wellness Routine.txt (5)                    │ │
│ │       Line 12: ...context...                       │ │
│ │                                                      │ │
│ │ ▼ Task References (8)                              │ │
│ │   ☑️ Weekly Review.txt (8)                         │ │
│ │                                                      │ │
│ │ ▼ Unlinked Mentions (9)                            │ │
│ │   📄 Meeting Notes.txt (9)               [Link All]│ │
│ │     Line 24: ...context...              [Link]     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Component Styling
- Follow existing app patterns (dark mode support)
- Use Heroicons for consistency
- Tailwind classes for styling
- Hover states for interactive elements
- Loading skeletons during fetch

### Visual Hierarchy
1. **Primary**: Reference count and filters
2. **Secondary**: Group headers with counts
3. **Tertiary**: File names with icons
4. **Detail**: Context preview with highlighting

### Interaction Patterns
- **Hover**: Show tooltip with full file path
- **Click**: Open in split view, highlight line
- **Cmd/Ctrl+Click**: Open in full view
- **Right-click**: Context menu (copy link, open in new window)

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
**Goal**: Set up service layer and basic detection

1. Create `referenceService.ts`
   - Implement `parseTags()` for hashtag detection
   - Extend `parseWikiLinks()` for reference context
   - Implement `findUnlinkedMentions()`

2. Create `referenceStore.ts`
   - Define state shape
   - Implement basic actions

3. Create `useReferences.ts` hook
   - Load references for current file
   - Connect to file store

4. Update types in `types/index.ts`
   - Add `Reference` interface
   - Add `ReferenceFilters` interface

**Deliverable**: Backend can detect all three reference types

### Phase 2: Basic UI (Week 2)
**Goal**: Display references in new tab

1. Add References tab to `MainView.tsx`
   - Add tab button with icon
   - Add route for references view

2. Create `ReferenceView.tsx`
   - Basic layout structure
   - Connect to `useReferences` hook

3. Create `ReferenceList.tsx`
   - Display references in list
   - Group by source file

4. Create `ReferenceItem.tsx`
   - Display single reference with context
   - Show file name, line number
   - Add click handler (basic navigation)

**Deliverable**: Users can see references in dedicated tab

### Phase 3: Grouping & Filtering (Week 3)
**Goal**: Add organization and filtering

1. Implement grouping logic in `ReferenceList`
   - Group by type (tags, links, mentions)
   - Separate Daily Notes
   - Collapsible sections

2. Create `ReferenceFilters.tsx`
   - Filter dropdowns
   - Clear filters button

3. Implement filtering logic in store
   - `getFilteredReferences()` method
   - Multiple filter support

4. Add sorting
   - Sort dropdown
   - Implement sort functions

**Deliverable**: Users can filter and organize references

### Phase 4: Split View Navigation (Week 4)
**Goal**: Implement split view for navigation

1. Modify `MainView.tsx` for split layout
   - Add split view state
   - Create split pane layout
   - Handle resize (optional)

2. Update `ReferenceItem` click handler
   - Open file in right pane
   - Scroll to line
   - Highlight reference

3. Add close split button
   - Return to single pane

4. Handle keyboard shortcuts
   - Escape to close split
   - Cmd+W to close split

**Deliverable**: Clicking references opens split view

### Phase 5: Advanced Features (Week 5)
**Goal**: Add linking and note creation

1. Implement unlinked mention linking
   - Add "Link" button to mentions
   - Implement `linkMention()` in service
   - Update file content
   - Refresh references

2. Create `CreateNotePrompt.tsx`
   - Show when note doesn't exist
   - Handle folder selection
   - Create note

3. Add empty states
   - No references
   - No results from filters
   - New note

4. Add task reference highlighting
   - Special styling for task refs
   - Quick actions (complete task)

**Deliverable**: Full feature set complete

### Phase 6: Performance & Polish (Week 6)
**Goal**: Optimize and refine

1. Implement hybrid indexing
   - Index common tags on startup
   - Add caching layer
   - Incremental updates via WebSocket

2. Add loading states
   - Skeleton loaders
   - Progress indicators

3. Performance testing
   - Test with 1000+ notes
   - Optimize slow queries
   - Add virtual scrolling if needed

4. UI polish
   - Animations
   - Micro-interactions
   - Accessibility improvements

5. Documentation
   - User guide
   - Code comments
   - API documentation

**Deliverable**: Production-ready feature

---

## Data Flow

```
┌──────────────┐
│  User opens  │
│  Health.txt  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ useReferences Hook                                       │
│  1. Detects current file = "Health.txt"                 │
│  2. Extracts target name = "Health"                     │
│  3. Checks referenceCache for "Health"                  │
│  4. If not cached, checks referenceIndex                │
│  5. If not indexed, searches all files                  │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ referenceService.findReferences()                        │
│  1. Scans all files in vault                            │
│  2. Calls parseTags() for #Health                       │
│  3. Calls parseWikiLinks() for [[Health]]              │
│  4. Calls findUnlinkedMentions() for "Health"          │
│  5. Extracts context (±2 lines)                         │
│  6. Groups by file and type                             │
│  7. Returns Reference[]                                 │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ referenceStore                                           │
│  - setReferences(refs)                                   │
│  - Updates referenceCache                               │
│  - Applies filters via getFilteredReferences()          │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ ReferenceView Component                                  │
│  - Displays filtered references                          │
│  - Shows "Create Note" if needed                        │
│  - Renders ReferenceList                                │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ ReferenceList Component                                  │
│  - Groups references by type & file                     │
│  - Renders collapsible sections                         │
│  - Maps to ReferenceItem components                     │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ ReferenceItem Component                                  │
│  - Shows context with highlighting                       │
│  - Click → opens split view                             │
│  - "Link" button for unlinked mentions                  │
└──────────────────────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests
- `referenceService.ts`: Test all parsing functions
- `referenceStore.ts`: Test state management
- `useReferences.ts`: Test hook logic with mocked data

### Integration Tests
- Test reference detection across multiple files
- Test filtering combinations
- Test split view navigation
- Test linking unlinked mentions

### Performance Tests
- Benchmark with 100, 500, 1000+ notes
- Test indexing time
- Test query time
- Memory profiling

### User Acceptance Tests
1. Can user find all references to a tag?
2. Can user navigate to reference source?
3. Can user filter references effectively?
4. Can user link unlinked mentions?
5. Does split view work smoothly?

---

## Dependencies

### New Dependencies
- None required (use existing libraries)

### Modified Components
- `MainView.tsx` - Add References tab & split view
- `linkService.ts` - Extend for tag parsing
- `types/index.ts` - Add Reference interfaces

### New Components
- `components/references/ReferenceView.tsx`
- `components/references/ReferenceList.tsx`
- `components/references/ReferenceItem.tsx`
- `components/references/ReferenceFilters.tsx`
- `components/references/CreateNotePrompt.tsx`
- `services/referenceService.ts`
- `store/referenceStore.ts`
- `hooks/useReferences.ts`

---

## Open Questions & Future Enhancements

### Open Questions
1. Should we support regex patterns in tag names?
2. How to handle very long context (multi-paragraph)?
3. Should we deduplicate references (same file, multiple lines)?
4. What's the UX for bulk operations (link all, delete all)?

### Future Enhancements (Post-MVP)
1. **Graph View**: Visual representation of reference connections
2. **Reference Strength**: Score references by frequency/recency
3. **Smart Suggestions**: Suggest potential links based on content similarity
4. **Export References**: Export reference list to CSV/JSON
5. **Reference Analytics**: Stats on most-referenced notes
6. **Inline References**: Show reference count badge in editor
7. **Reference Notifications**: Alert when new references are created
8. **Cross-Vault References**: Support references across multiple vaults
9. **API Endpoint**: Expose reference data via REST API
10. **Mobile Support**: Optimize references view for mobile devices

---

## Success Metrics

### Quantitative Metrics
- **Performance**:
  - Reference search < 500ms for vaults with 500 notes
  - Index build time < 2s on startup
  - UI response < 100ms for interactions

- **Adoption**:
  - 70% of users try References tab within first week
  - 40% of users use References tab weekly
  - Average 15 reference navigations per user per week

- **Quality**:
  - 95% reference detection accuracy
  - < 1% false positives for unlinked mentions
  - 0 crashes related to reference loading

### Qualitative Metrics
- User feedback indicates feature is "intuitive"
- Users discover 3+ new connections per week
- Support tickets related to navigation decrease by 30%

---

## Risks & Mitigation

### Risk 1: Performance Degradation
**Risk**: Searching all files for references is slow for large vaults
**Impact**: High
**Mitigation**:
- Implement hybrid indexing strategy
- Use Web Workers for heavy parsing
- Add virtual scrolling for large reference lists
- Cache aggressively

### Risk 2: False Positives in Unlinked Mentions
**Risk**: Plain text matches may not be actual references (e.g., common words)
**Impact**: Medium
**Mitigation**:
- Add word boundary detection
- Allow users to mark false positives
- Machine learning to improve detection (future)
- Make unlinked mentions opt-in initially

### Risk 3: Complex UI
**Risk**: Too many options/filters confuse users
**Impact**: Medium
**Mitigation**:
- Start with sensible defaults
- Progressive disclosure (hide advanced filters)
- Onboarding tooltip
- User testing before full release

### Risk 4: Split View Complexity
**Risk**: Split view adds complexity to MainView component
**Impact**: Low-Medium
**Mitigation**:
- Keep split view logic isolated
- Consider separate SplitView component
- Extensive testing of edge cases
- Fallback to modal if split view fails

---

## Appendix

### A. Similar Feature Comparison

| Feature | Obsidian | Roam | LogSeq | NotePlan (Ours) |
|---------|----------|------|--------|-----------------|
| Linked References | ✅ | ✅ | ✅ | ✅ (Planned) |
| Unlinked Mentions | ✅ | ✅ | ✅ | ✅ (Planned) |
| Tag References | ✅ | ✅ | ✅ | ✅ (Planned) |
| Context Display | ✅ | ✅ | ✅ | ✅ (Planned) |
| Filtering | ⚠️ Limited | ⚠️ Limited | ✅ | ✅ (Planned) |
| Split View | ✅ | ✅ | ✅ | ✅ (Planned) |
| Reference Count | ✅ | ✅ | ✅ | ✅ (Planned) |
| Link Unlinked | ✅ | ✅ | ❌ | ✅ (Planned) |

### B. API Surface

```typescript
// referenceService.ts
export function findReferences(
  targetName: string,
  files: FileData[],
  options?: ReferenceOptions
): Promise<Reference[]>

export function parseTags(content: string, filePath: string): ParsedTag[]

export function findUnlinkedMentions(
  targetName: string,
  files: FileData[],
  excludeFiles?: string[]
): Promise<Reference[]>

export function linkMention(
  filePath: string,
  line: number,
  mentionText: string,
  linkType: 'wikilink' | 'tag'
): Promise<string>

export function buildReferenceIndex(
  files: FileData[],
  topNTags?: number
): Promise<Map<string, Reference[]>>

export function extractContext(
  content: string,
  lineNumber: number,
  contextLines?: number
): string[]
```

### C. Configuration Options

```typescript
interface ReferenceConfig {
  // Context lines before/after
  contextLines: number; // default: 2

  // Case sensitivity for unlinked mentions
  caseSensitive: boolean; // default: false

  // Enable unlinked mentions
  enableUnlinkedMentions: boolean; // default: true

  // Minimum word length for unlinked mentions
  minMentionLength: number; // default: 3

  // Index top N tags on startup
  indexTopTags: number; // default: 50

  // Cache TTL (ms)
  cacheTTL: number; // default: 300000 (5 min)

  // Default folder for new notes
  defaultNoteFolder: string; // default: 'Notes'

  // Split view default width
  splitViewRatio: number; // default: 0.5 (50/50)
}
```

---

## Conclusion

This PRP outlines a comprehensive References feature that will significantly enhance the app's knowledge management capabilities. By implementing this feature in 6 phases over ~6 weeks, we'll deliver a production-ready solution that helps users discover connections, navigate their knowledge graph, and strengthen their note-taking practice.

The hybrid performance approach ensures scalability, while the phased rollout allows for iterative improvement based on user feedback. The feature draws on best practices from Obsidian, Roam, and LogSeq while adding unique capabilities like advanced filtering and split-view navigation.

**Next Steps**:
1. Review and approve PRP
2. Set up project tracking (GitHub issues/milestones)
3. Begin Phase 1 implementation
4. Schedule weekly check-ins to review progress
