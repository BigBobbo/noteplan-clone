# Task Details Format Guide

## Critical Rules

1. **Tasks ALWAYS use `*` or `+` markers**
   - Example: `* Task name` or `+ Task name`
   - The editor will NOT convert these

2. **Bullets in task details MUST use `-` (hyphen)**
   - Example: `    - Bullet point`
   - You must type `-` manually for bullets

3. **DO NOT use `*` for bullets in task details**
   - The parser will think it's a child task and stop parsing
   - Details will be cut off

## Why This Matters

The task parser looks for `*` and `+` to identify tasks. If you use `*` for bullets inside task details at the wrong indentation level, the parser gets confused.

## Correct Format

```
* Plan Q4 Product Launch #project
    Project overview and timeline.

    Key Requirements:
    - Finalize feature list by Oct 15      ← USE HYPHEN
    - Create marketing materials           ← USE HYPHEN
    - Schedule launch event                ← USE HYPHEN

    Budget: $50,000
```

## Incorrect Format (DO NOT DO THIS)

```
* Plan Q4 Product Launch #project
    Project overview and timeline.

    Key Requirements:
    * Finalize feature list    ← WRONG! Parser stops here
    * Create marketing         ← This won't be parsed
```

## Indentation Rules

For a root-level task (0 spaces):
```
* Task name                    ← Task marker (0 spaces)
    Detail text                ← Details (4 spaces)
    - Bullet point             ← Bullet in details (4 spaces, use -)
        - Sub-bullet           ← Nested bullet (8 spaces, use -)
    * Child task               ← Child task (4 spaces, use *)
        Child detail           ← Child task details (8 spaces)
```

## Examples

### Simple List

```
* Shopping task #personal
    Remember to bring reusable bags.

    Items to buy:
    - Milk
    - Bread
    - Eggs
    - Coffee
```

### Nested Lists

```
* Research project #work
    Investigate new framework options.

    Evaluation criteria:
    - Performance
        - Load time < 2s
        - Memory usage < 100MB
    - Developer experience
        - Good documentation
        - Active community
```

### Rich Formatting

```
* Write documentation #work
    Complete the API documentation for v2.0 release.

    Sections to cover:
    - Getting Started
    - Authentication
    - API Endpoints

    **Important:** Include code examples for each endpoint.

    Timeline: Complete by end of week
```

## Quick Reference

| Element | Marker | Indentation | Example |
|---------|--------|-------------|---------|
| Root task | `*` or `+` | 0 spaces | `* Task name` |
| Task details | none | 4 spaces | `    Detail text` |
| Bullet in details | `-` | 4 spaces | `    - Bullet` |
| Sub-bullet | `-` | 8 spaces | `        - Sub` |
| Child task | `*` or `+` | 4 spaces | `    * Subtask` |

## Remember

- ✅ **Tasks** → Use `*` or `+`
- ✅ **Bullets in details** → Use `-` (hyphen)
- ❌ **Never** → Use `*` for bullets in details (will break parsing)

---

**Last Updated:** October 10, 2025
