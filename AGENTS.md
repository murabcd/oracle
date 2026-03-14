# Repository Guidelines

## Project Structure & Module Organization
This repository is a Bun-based Next.js 16 app using the App Router. Route files live in `app/`, including API handlers in `app/api/*/route.ts`. Shared UI is split between `components/` and provider wrappers in `providers/`. Reusable logic, model metadata, and server/client helpers live in `lib/` and `hooks/`. Tests are kept in `tests/` and mirror the runtime surface with files such as `tests/api-chat-route.test.ts`. Repository scripts live in `scripts/`, and environment samples are defined in `.env.example`.

## Build, Test, and Development Commands
Use Bun for local work:

- `bun dev`: start the Next.js dev server on `localhost:3000`.
- `bun run build`: create a production build.
- `bun run start`: serve the production build locally.
- `bun run check`: run Ultracite/Biome checks.
- `bun run fix`: apply safe formatting and lint fixes.
- `bun run type-check`: run `tsc --noEmit`.
- `bun run test`: run the Vitest suite once.
- `bun run test:watch`: run Vitest in watch mode.

Husky enforces `bun run check` on pre-commit and `bun run type-check` plus `bun run test` on pre-push.

## Coding Style & Naming Conventions
Write TypeScript with `strict` mode assumptions and use the `@/*` path alias for intra-repo imports. Follow the existing 2-space indentation and prefer small, focused React components. Use `PascalCase` for components and providers, `camelCase` for hooks and helpers, and kebab-free route names that match Next.js conventions such as `app/api/upload/route.ts`. Generated or vendor-style UI under `components/ui`, `components/ai-elements`, and selected utility files are excluded from Biome rules, so avoid broad formatting churn there unless needed.

## Testing Guidelines
Vitest runs in `jsdom` with Testing Library setup from `tests/setup.ts`. Add tests as `tests/**/*.test.ts` or `tests/**/*.test.tsx`. Prefer route-level tests for `app/api` handlers and focused unit tests for `lib/` helpers. Run `bun run test` before pushing; new API behavior should ship with regression coverage.

## Commit & Pull Request Guidelines
Recent history uses short Conventional Commit prefixes such as `feat:`, `test:`, and `docs:`. Keep subjects imperative and scoped, for example `feat: add upload validation`. Pull requests should include a concise summary, linked issue when applicable, test evidence (`bun run test`, `bun run type-check`), and screenshots or recordings for UI changes.

## Security & Configuration Tips
Never commit `.env`. Required secrets currently include `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, and `BLOB_READ_WRITE_TOKEN`. When adding integrations, document new variables in `.env.example` and keep server-only secrets out of client components.
