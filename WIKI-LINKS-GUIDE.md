# Wiki Links & Backlinks Guide

## How Wiki Links Work

### Creating Links

1. **Basic Link Syntax**
   ```markdown
   [[Health]]
   ```
   This creates a link to a note named "Health.txt"

2. **Link with Alias**
   ```markdown
   [[Health|My Health Notes]]
   ```
   This displays "My Health Notes" but links to "Health.txt"

### Link Resolution

The system resolves links in this order:
1. **Exact match** - `[[Health]]` → `Health.txt`
2. **With extension** - Automatically adds `.txt`
3. **Case-insensitive** - `[[health]]` → `Health.txt`
4. **Fuzzy match** - Closest matching filename

### Visual Appearance

- Wiki links appear in **blue** (`text-blue-600`)
- Links are **clickable** - click to navigate
- Links show **underline on hover**
- Unresolved links appear as plain text

## How to Use Wiki Links

### Example Workflow

1. **Create a note** called "Health.txt" in the Notes folder

2. **In another note**, reference it:
   ```markdown
   # My Daily Log

   Today I need to update my [[Health]] notes.

   See also:
   - [[Health|Health Tracking]]
   - [[Exercise]]
   - [[Diet]]
   ```

3. **Click the link** in the editor to navigate to that note

4. **View backlinks** - Switch to the "Links" tab in the sidebar to see all notes that link to the current file

## Backlinks Panel

### What are Backlinks?

Backlinks show you **all other notes that link to the current note**. This creates a bi-directional knowledge graph.

### How to View Backlinks

1. Open a note (e.g., "Health.txt")
2. Click the **"Links"** tab in the sidebar (🔗 icon)
3. See all notes that contain `[[Health]]`

### Backlink Display

Each backlink shows:
- **Source file name** - The note containing the link
- **Context** - Text around the link (2 lines before and after)
- **Click to navigate** - Click to open the source note

### Example

If you have:
- **Daily Log.txt**: "Need to update [[Health]] notes"
- **Goals.txt**: "Track [[Health]] metrics weekly"
- **Health.txt**: (current file)

The backlinks panel for "Health.txt" will show:
```
Linked Mentions (2)

📄 Daily Log.txt
  Need to update [[Health]] notes

📄 Goals.txt
  Track [[Health]] metrics weekly
```

## Technical Details

### Link Parsing

- Uses regex: `/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g`
- Parses on every file load
- Scans all files to find backlinks

### Performance

- Backlinks are computed on-demand
- Files are loaded asynchronously
- Shows loading indicator while scanning

### File Matching

Links match files in any folder:
- `[[Health]]` can match `Notes/Health.txt`
- `[[2025-10-08]]` can match `Calendar/2025-10-08.txt`

## Common Patterns

### 1. Note References
```markdown
See [[Project Planning]] for details.
```

### 2. Daily Note Links
```markdown
Continued from [[2025-10-07]]
```

### 3. Topic Clustering
```markdown
Related topics:
- [[Health]]
- [[Fitness]]
- [[Nutrition]]
```

### 4. Meeting References
```markdown
Action items from [[Weekly Standup 2025-10-08]]
```

## Troubleshooting

### Link Not Working?

1. **Check file exists**
   - Look in the Files tab for the target note
   - File names are case-sensitive on some systems

2. **Check syntax**
   - Use double brackets: `[[Note]]`
   - No spaces around the name: `[[Health]]` not `[[ Health ]]`

3. **Refresh the page**
   - Sometimes the editor needs to reload

### Backlinks Not Showing?

1. **Wait for scan to complete**
   - Backlinks need to scan all files
   - You'll see "Finding backlinks..." while loading

2. **Check link format**
   - Links must use wiki syntax: `[[Health]]`
   - Regular markdown links `[text](url)` are not scanned

3. **Save the linking file**
   - Make sure the file with the link is saved

## Advanced Usage

### Creating a Knowledge Graph

1. Create an index note:
   ```markdown
   # Index

   ## Topics
   - [[Health]]
   - [[Work]]
   - [[Personal]]
   ```

2. From each topic, link to related notes:
   ```markdown
   # Health

   Related:
   - [[Exercise Routine]]
   - [[Diet Plan]]
   - [[Health Metrics]]
   ```

3. Use backlinks to discover connections:
   - Open "Exercise Routine"
   - See all notes that reference it

### Daily Note Linking

Create a chain of daily notes:
```markdown
# 2025-10-08

Previous: [[2025-10-07]]
Next: [[2025-10-09]]

## Tasks
- Update [[Project X]]
- Review [[Meeting Notes]]
```

## Keyboard Shortcuts

- **Cmd+K** - Open command palette, search for notes
- **Click link** - Navigate to linked note
- **Tab to Links** - View backlinks for current note

## Implementation Notes

### TipTap Extension

The wiki links are implemented as a custom TipTap extension:
- `src/extensions/WikiLink.ts`
- Decorates `[[...]]` syntax with clickable spans
- Handles click events to navigate

### Link Service

Backend logic in `src/services/linkService.ts`:
- `parseWikiLinks()` - Extract all links from content
- `resolveLink()` - Find target file for link
- `findBacklinks()` - Scan files for references
- `extractContext()` - Get text around link

### Stores

- `linkStore.ts` - Manages backlinks state
- `useLinks.ts` - Hook for link operations

## Future Enhancements

- 🔮 Link graph visualization
- 🔮 Orphaned notes detection (no links)
- 🔮 Link autocomplete while typing
- 🔮 Broken link detection
- 🔮 Bulk rename with link updates

---

**Enjoy building your personal knowledge graph!** 🌐
