# Task Format Guide

## Overview

Tasks use **checkbox format** `[ ]` to distinguish them from regular bullet points.

## Task Markers

| Format | Status | Description |
|--------|--------|-------------|
| `[ ]` | Open | Not started |
| `[x]` | Completed | Done |
| `[>]` | Scheduled | Scheduled/In Progress |
| `[-]` | Cancelled | Cancelled |
| `[!]` | Important | High priority |

## Basic Format

```
[ ] Task name
[x] Completed task
[>] Task in progress
[-] Cancelled task
[!] Important task
```

## Tasks with Details

Add details by indenting 4 spaces under the task:

```
[ ] Task name
    This is a description.
    More details here.

    Bullet points in details:
    - Use hyphens
    - Not asterisks
    - Like this
```

## Nested Tasks

Child tasks are indented 4 spaces:

```
[ ] Parent task
    Parent task description

    [ ] Child task 1
        Child details
    [ ] Child task 2
        Child details
```

## Bullet Points vs Tasks

**KEY DIFFERENCE:**
- **Tasks** use checkboxes: `[ ]`, `[x]`, etc.
- **Bullets in details** use hyphens: `-`

```
[ ] Deploy to production
    Pre-deployment checklist:
    - Run all tests          ← Bullet point (hyphen)
    - Backup database        ← Bullet point (hyphen)
    - Review rollback plan   ← Bullet point (hyphen)

    [ ] Notify team          ← Child task (checkbox)
```

## Why This Format?

1. **No conflicts**: Checkboxes `[ ]` vs bullets `-` are completely different
2. **No conversion**: Editor won't convert between them
3. **Clear intent**: Checkboxes clearly indicate tasks
4. **GitHub compatible**: Similar to GitHub-flavored markdown tasks

## Editor Behavior

- ✅ **Checkboxes** `[ ]` stay as checkboxes
- ✅ **Hyphens** `-` stay as hyphens
- ✅ **No auto-conversion** between characters
- ✅ **Preserved on save** exactly as typed

## Examples

### Simple Task List

```
[ ] Buy groceries
[ ] Call dentist
[x] Pay bills
[ ] Gym workout
```

### Task with Rich Details

```
[ ] Write quarterly report #work #p2
    Q4 financial summary and goals for Q1.

    Sections to include:
    - Executive Summary
    - Revenue Analysis
    - Expense Breakdown
    - Q1 Projections

    Due date: January 15, 2026
    Recipients: Board members, department heads
```

### Project with Subtasks

```
[ ] Launch new feature #project
    Major feature launch for Q4.

    Launch checklist:
    - Marketing materials ready
    - Documentation complete
    - Support team trained

    [ ] Code review
        Review all changes
    [ ] QA testing
        Full regression test
    [x] Design approval
        Approved by design team
```

## Quick Reference

| Element | Format | Example |
|---------|--------|---------|
| Open task | `[ ]` | `[ ] Task name` |
| Completed | `[x]` | `[x] Done task` |
| Scheduled | `[>]` | `[>] In progress` |
| Cancelled | `[-]` | `[-] Cancelled` |
| Important | `[!]` | `[!] Urgent` |
| Task details | 4 spaces | `    Detail text` |
| Bullet point | `- ` | `    - Bullet` |
| Child task | `[ ]` + 4 spaces | `    [ ] Subtask` |

---

**Last Updated:** October 10, 2025
**Format:** Checkbox-style tasks with hyphen bullets
