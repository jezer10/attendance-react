# Repository Guidelines

## Project Structure & Module Organization
The Vite bootstrap lives at the repository root with `index.html`, `vite.config.ts`, and TypeScript configs (`tsconfig*.json`). Application code resides in `src/`: `main.tsx` mounts the React tree and applies `src/index.css`, while `App.tsx`/`App.css` host the base layout. Group new features inside descriptive folders such as `src/attendance/` or `src/hooks/` so UI, hooks, and styles stay co-located. Bundle-ready assets belong in `src/assets/`; static files served as-is should sit in `public/`.

## Build, Test, and Development Commands
- `pnpm install` aligns dependencies with `pnpm-lock.yaml`; stick to pnpm to avoid version drift.
- `pnpm dev` launches the Vite dev server with hot module reload for rapid UI iteration.
- `pnpm build` runs `tsc -b` for type safety and emits the production bundle to `dist/`.
- `pnpm preview` serves the build locally for final smoke tests.
- `pnpm lint` executes ESLint via `eslint.config.js`; run it before pushing to catch style and correctness issues early.

## Coding Style & Naming Conventions
Favor TypeScript-first functional components and hooks, keeping logic pure and side effects inside `useEffect`. Use 2-space indentation, double quotes in JSX, and trailing commas where TS allows—these match the ESLint defaults already configured. Name components in PascalCase (`AttendanceGrid.tsx`), hooks/utilities in camelCase (`useAttendanceStore.ts`), and CSS files alongside the component they style. Promote widely reused rules into `src/index.css` with a short comment on scope.

## Testing Guidelines
Vitest and React Testing Library are not installed yet; introduce them when adding meaningful logic. Place tests next to their targets (e.g., `src/attendance/AttendanceGrid.test.tsx`) and stub browser APIs with `@vitest/browser` helpers. Until automated tests exist, rely on `pnpm dev` for manual walkthroughs plus `pnpm lint` for static checks; document manual scenarios in PR descriptions.

## Commit & Pull Request Guidelines
Follow Conventional Commits such as `feat: add attendance grid` or `chore: run lint` to keep history searchable. Squash work into focused commits, reference issue IDs in the body, and describe user-facing impact. Pull requests should include a succinct summary, screenshots or GIFs for UI updates, a checklist of manual tests, and call outs for new dependencies or environment steps so reviewers can validate quickly.

## Security & Configuration Tips
Use Vite environment variables (`.env.local`) for secrets and keep those files untracked. Avoid mixing package managers; pnpm’s workspace lock must remain the source of truth. When configuring APIs or auth, add redacted examples to `README.md` instead of embedding secrets in source.
