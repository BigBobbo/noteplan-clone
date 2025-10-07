# NotePlan Clone - Project Summary

## Quick Overview

This project builds a self-hosted, web-based clone of NotePlan with local markdown storage.

**Total Estimated Time:** 10-14 weeks (100-140 hours)
**MVP Time (Phases 1-2):** 5-7 weeks (50-70 hours)

---

## Phase Summary

| Phase | Focus | Duration | Key Deliverables |
|-------|-------|----------|------------------|
| **Phase 1** | Backend & Markdown Engine | 2-3 weeks | File API, WebSocket, Markdown parsing |
| **Phase 2** | Web UI & Editor | 3-4 weeks | React app, 3-pane layout, Editor |
| **Phase 3** | Calendar & Daily Notes | 2-3 weeks | Calendar, Timeline, Date navigation |
| **Phase 4** | Advanced Features | 3-4 weeks | Tasks, Links, Search, Templates |

---

## Technology Stack

### Backend
- **Node.js + Express** (recommended) or Python + FastAPI
- WebSocket (socket.io)
- File system monitoring (chokidar)
- Markdown parsing (gray-matter, markdown-it)

### Frontend
- **React 18** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **TipTap** (markdown editor)
- **Zustand** (state management)

### Storage
- Local file system (markdown .txt files)
- Optional: SQLite for search indexing

---

## Feature Comparison

| Feature | NotePlan | This Clone | Phase |
|---------|----------|------------|-------|
| Markdown notes | ✅ | ✅ | 1, 2 |
| Local file storage | ✅ | ✅ | 1 |
| Three-pane UI | ✅ | ✅ | 2 |
| Dark mode | ✅ | ✅ | 2 |
| Daily notes | ✅ | ✅ | 3 |
| Calendar view | ✅ | ✅ | 3 |
| Time blocking | ✅ | ✅ | 3 |
| Timeline view | ✅ | ✅ | 3 |
| Task management | ✅ | ✅ | 4 |
| Wiki-style links | ✅ | ✅ | 4 |
| Backlinks | ✅ | ✅ | 4 |
| Full-text search | ✅ | ✅ | 4 |
| Templates | ✅ | ✅ | 4 |
| Command palette | ✅ | ✅ | 4 |
| iOS/Mac apps | ✅ | ❌ | Future |
| iCloud sync | ✅ | ❌ | Future |
| Plugin system | ✅ | ❌ | Future |
| AI features | ✅ | ❌ | Future |

**Feature Parity:** ~80% of core NotePlan functionality

---

## File Structure

Your notes will be stored exactly like NotePlan:

```
data/
├── Calendar/           # Daily notes (YYYYMMDD.txt)
│   ├── 20251007.txt
│   ├── 20251008.txt
│   └── ...
├── Notes/             # All other notes
│   ├── 10 - Projects/
│   ├── 20 - Areas/
│   ├── 30 - Resources/
│   ├── 40 - Archive/
│   └── @Templates/
└── Filters/           # (Future phase)
```

---

## Markdown Syntax Support

The clone will support NotePlan's markdown extensions:

### Tasks
```markdown
* Open task
* [x] Completed task
* [>] Scheduled task
* [-] Cancelled task
```

### Time Blocks
```markdown
+ 09:00-11:00 Deep work session
+ 14:00-15:30 Team meeting
```

### Links
```markdown
[[Other Note]]           # Wiki-style link
[[Note|Alias]]          # Link with custom text
```

### Special Syntax
```markdown
#tag                    # Hashtags
@person                 # Mentions
>2025-10-08            # Date reference
```

---

## Development Workflow

### Recommended Approach

1. **Start with Phase 1** (Backend)
   - Get the foundation right
   - Test thoroughly with Postman
   - Ensure file operations are rock-solid

2. **Move to Phase 2** (Frontend)
   - Build the UI
   - Connect to backend
   - Get a working app early

3. **Add Phase 3** (Calendar)
   - Enhance with calendar features
   - Daily notes make it feel like NotePlan

4. **Complete with Phase 4** (Advanced)
   - Power-user features
   - Polish and refinement

### Alternative: Parallel Development
If you have multiple developers or want faster progress:
- **Backend dev:** Phase 1
- **Frontend dev:** Phase 2 (using mocked API)
- Merge and continue with Phase 3 & 4

---

## Key Decisions Needed

Before starting Phase 1:

### 1. Programming Language
- **Node.js** (easier React integration)
- **Python** (better for AI features later)

### 2. Data Directory
- **New directory:** `/Users/robertocallaghan/Documents/notes`
- **Existing NotePlan:** Use current data (read-only mode?)

### 3. Deployment
- **Local only:** `localhost:3000`
- **Network accessible:** Available to other devices on LAN
- **Cloud deployment:** AWS, Vercel, etc.

### 4. Features to Skip
Any NotePlan features you DON'T need?
- Plugins?
- AI features?
- Mobile apps?

---

## MVP Definition

**Minimum Viable Product (Phases 1-2):**
- ✅ Read/write markdown files
- ✅ Browse folders and files
- ✅ Edit notes with markdown
- ✅ Auto-save
- ✅ Dark mode
- ✅ Real-time sync

This gives you a **functional note-taking app** in 5-7 weeks.

Then add calendar (Phase 3) and advanced features (Phase 4) incrementally.

---

## Success Metrics

### Phase 1 Complete When:
- [ ] Backend server runs
- [ ] Can CRUD files via API
- [ ] File changes broadcast via WebSocket
- [ ] Markdown parsing works

### Phase 2 Complete When:
- [ ] Can use app in browser
- [ ] Can create/edit/delete notes
- [ ] UI is responsive and intuitive
- [ ] Theme toggle works

### Phase 3 Complete When:
- [ ] Daily notes auto-create
- [ ] Calendar navigation works
- [ ] Timeline shows time blocks
- [ ] Can schedule tasks

### Phase 4 Complete When:
- [ ] Tasks toggle completion
- [ ] Links navigate between notes
- [ ] Search finds content
- [ ] Templates insert properly

---

## Risk Factors

### Technical Risks
1. **File system performance** with many files
   - Mitigation: Caching, indexing
2. **Real-time sync** conflicts
   - Mitigation: Conflict detection UI
3. **Markdown parsing** edge cases
   - Mitigation: Extensive testing

### Scope Risks
1. **Feature creep** - Wanting to add everything
   - Mitigation: Stick to phase boundaries
2. **Over-engineering** - Making it too complex
   - Mitigation: Build simplest thing first

---

## Next Steps

### Immediate Actions:
1. ✅ Review all PRP documents
2. ⏳ Answer key decision questions
3. ⏳ Choose Phase 1 technology (Node.js or Python)
4. ⏳ Set up development environment
5. ⏳ Create Phase 1 project structure
6. ⏳ Start implementing file service

### This Week:
- Read through Phase 1 PRP in detail
- Set up backend project
- Implement basic file operations
- Test with Postman

### This Month:
- Complete Phase 1 backend
- Start Phase 2 React app
- Get basic app working

---

## Resources Created

1. **MASTER-PRP.md** - Overall project plan
2. **PHASE-1-PRP.md** - Backend foundation (detailed)
3. **PHASE-2-PRP.md** - Web UI & editor (detailed)
4. **PHASE-3-PRP.md** - Calendar system (detailed)
5. **PHASE-4-PRP.md** - Advanced features (detailed)
6. **PROJECT-SUMMARY.md** - This document (quick reference)

---

## Questions?

Common questions answered:

**Q: Can I use my existing NotePlan files?**
A: Yes! The file format is identical. You can point the app at your NotePlan directory (recommend read-only initially).

**Q: Will this sync with NotePlan apps?**
A: Not directly. They both read/write markdown, but won't coordinate. You could use the same files but risk conflicts.

**Q: Can I deploy this to the cloud?**
A: Yes! After Phase 2, you can deploy frontend to Vercel and backend to any Node.js host. File storage would need to be cloud-based (S3, etc.).

**Q: How do I add custom features?**
A: The codebase is modular. Add new components, routes, and services following the existing patterns.

**Q: Is this legal?**
A: Yes! You're building your own app inspired by NotePlan's concepts. As long as you don't copy code/assets, it's perfectly legal.

---

## Contact & Support

For questions during development:
- Refer back to phase-specific PRPs
- Check NotePlan's docs for feature details
- Use Claude Code to help implement each phase

---

*Last Updated: 2025-10-07*
*Project: NotePlan Self-Hosted Clone*
*Status: Planning Complete - Ready to Start Development*
