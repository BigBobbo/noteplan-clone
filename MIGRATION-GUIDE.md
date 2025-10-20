# Task Format Migration Guide

## Important: Task Format Update

We've updated the NotePlan clone to use the industry-standard GitHub Flavored Markdown (GFM) task format. This improves compatibility with other markdown tools and simplifies the codebase.

## What's Changed

### Old Format
```markdown
[] Open task
[x] Completed task
    Task details with 4-space indent
```

### New Format (GFM)
```markdown
- [ ] Open task
- [x] Completed task
  Task details with 2-space indent
```

## Key Changes

1. **Task Prefix**: All tasks now require `- ` before the brackets
2. **Indentation**: Changed from 4-space to 2-space indentation
3. **Better Standards**: Compatible with GitHub, Obsidian, and other markdown tools

## Migration Process

### Automatic Migration

The application includes an automatic migration utility that will:
- Add `- ` prefix to all tasks
- Convert 4-space indentation to 2-space
- Preserve all your task states and details

### Manual Migration

If you prefer to manually update your files:

1. Add `- ` before all task checkboxes:
   - Change `[ ] Task` to `- [ ] Task`
   - Change `[x] Done` to `- [x] Done`

2. Update indentation:
   - Replace 4 spaces with 2 spaces for nested content
   - Task details should be indented with 2 spaces

## Task States (Unchanged)

The NotePlan-specific task states remain the same:
- `- [ ]` Open task
- `- [x]` Completed task
- `- [-]` Cancelled task
- `- [>]` Scheduled/forwarded task
- `- [!]` Important/priority task

## Examples

### Before (Old Format)
```markdown
[] Project planning
    Need to plan Q4 launch

    Requirements:
    * Feature list
    * Marketing materials

    [] Research phase
    [x] Design phase
```

### After (New Format)
```markdown
- [ ] Project planning
  Need to plan Q4 launch

  Requirements:
  - Feature list
  - Marketing materials

  - [ ] Research phase
  - [x] Design phase
```

## Benefits of the New Format

1. **Industry Standard**: Works with GitHub, GitLab, Obsidian, and other tools
2. **Cleaner Code**: Removed complex workarounds and escape sequences
3. **Better Performance**: Simpler parsing logic means faster task detection
4. **Future Proof**: Aligned with markdown community standards

## FAQ

**Q: Will my existing notes be automatically converted?**
A: Yes, the application includes a migration utility that can convert your notes automatically.

**Q: Can I still use the old format?**
A: No, the old format is no longer supported. Please migrate to the new GFM format.

**Q: What about my task details and nested tasks?**
A: All task details, nested tasks, and hierarchy are preserved with the new 2-space indentation.

**Q: Do I need to update all files at once?**
A: We recommend migrating all files to ensure consistency, but you can update them gradually.

## Need Help?

If you encounter any issues during migration:
1. Backup your notes before migration
2. Use the built-in migration utility
3. Check the test file `gfm-task-test.txt` for examples

---

**Migration Date**: October 11, 2025
**Version**: 2.0.0