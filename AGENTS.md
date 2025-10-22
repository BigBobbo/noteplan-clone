# Repository Guidelines

## Project Structure & Module Organization
- The backend lives at `src/`, with configuration in `src/config`, request validation in `src/middleware`, domain logic in `src/services`, and Express routers under `src/routes`. WebSocket coordination sits in `src/websocket`.
- Local markdown content is stored in `data/` (mirroring NotePlan folders such as `Calendar/` and `Notes/10 - Projects/`). Test fixtures under `tests/` and `test-results/` should be treated as generated artifacts.
- The React client is isolated in `frontend/` (Vite + TypeScript). Shared UI elements are under `frontend/src/components`, state modules in `frontend/src/store`, and editor extensions in `frontend/src/extensions`.

## Build, Test, and Development Commands
- Backend: run `npm install` once, then `npm run dev` for the API with hot reload, or `npm start` for production mode. Use `node test-api.sh` for a scripted smoke of all REST endpoints (requires the server to be running).
- Frontend: from `frontend/`, run `npm install`, then `npm run dev` (defaults to `http://localhost:5173`). Use `npm run build` to generate assets in `frontend/dist` and `npm run preview` to verify the build.
- End-to-end checks rely on Playwright specs (`test-*.spec.js`). With both servers running, execute `npx playwright test` from the repository root to run them headlessly.

## Coding Style & Naming Conventions
- JavaScript files use 2-space indentation, `camelCase` for functions/utilities, and `PascalCase` for classes. Keep modules cohesive: one service per file and export explicit APIs.
- React components and hooks live in their respective folders (`components`, `hooks`) and follow `PascalCase` filenames (e.g., `DailyNotePanel.tsx`). Shared utilities remain in `frontend/src/utils`.
- ESLint is configured via `frontend/eslint.config.js`; run `npm run lint` before committing UI changes. For backend files, match existing formatting and include concise inline comments only when clarifying non-obvious logic.

## Testing Guidelines
- Backend unit tests sit in `tests/*.test.js` and use Jest. Run `npm test` with the API stopped; Jest auto-discovers files ending in `.test.js`.
- Playwright specs expect the frontend on port 5173 and the API on 3001. Keep new specs co-located with existing `test-*.spec.js` files, naming them after the feature under test (`test-timeblock.spec.js`).
- When adding parsers or file operations, extend `tests/markdownService.test.js` or introduce targeted fixtures to maintain coverage of NotePlan syntax (tasks, time blocks, wiki links).

## Commit & Pull Request Guidelines
- Follow the existing history: short, imperative subject lines (`Add timeline drop positioning`). Prefix with a conventional type (`feat:`, `fix:`) when introducing user-facing behavior to aid changelog generation.
- Each pull request should summarize scope, reference relevant PRDs (e.g., `PHASE-3-PRP.md` for calendar changes), and include verification steps. Attach screenshots or clips for UI work, and note any new commands or migrations.

## Configuration & Security Notes
- Define runtime settings in `.env` (see `GETTING-STARTED.md`). Avoid hardcoding paths; read from `config.js` instead.
- File APIs must be path-safe. When touching file or watcher logic, ensure tests covering traversal prevention (`test-api.sh`, security section) continue to pass.
