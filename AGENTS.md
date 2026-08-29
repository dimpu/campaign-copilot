<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# AGENTS.md — Campaign Copilot

> Guidance for AI coding agents (Pi / Codex / Cursor / Claude / etc.) working in this repo.
> Read this file **first** before making changes.

---

## 1. Project Overview

**Campaign Copilot** is an AI-powered web app for TikTok Shop ops teams. Users describe affiliate
creator campaigns in plain English; an LLM fills out a complex multi-conditional form, generates
multi-language creator-facing copy, and runs a deterministic budget/reach/ROI simulation against
a synthetic creator database. The signature UX is a **split-pane layout**: AI chat on the left,
live campaign form on the right — both sync bidirectionally.

- **Status**: Solo hackathon project (GEC-B Full-Stack Demo Day, deadline **Sept 7, 2025**).
- **Human** reads `SPEC.md` for full product/architecture details. Agents should consult
  `SPEC.md` whenever they need behavioral specs, schema details, validation rules, or the
  milestone plan.

---

## 2. Tech Stack — Do Not Deviate

| Concern | Choice |
| --- | --- |
| Framework | **Next.js 15 (App Router)** + **React 19** + **TypeScript** (strict) |
| UI | **shadcn/ui** + **Radix** primitives + **Tailwind CSS v4** + **lucide-react** |
| Charts | **recharts** |
| Client state | **Zustand** (one store for draft config) + React 19 `useActionState` |
| Forms | **react-hook-form** + `@hookform/resolvers/zod` |
| Database | **libSQL / better-sqlite3** (dev, file DB) → PostgreSQL (prod); accessed via **Drizzle ORM** |
| Validation | **Zod 3.x** — single source of truth (LLM output, form, API, DB JSON column) |
| AI | **Vercel AI SDK v4** (`ai` + `@ai-sdk/openai`). `streamText` with tool calling; no LangChain |
| Auth | **NextAuth v5** (Auth.js) with email + 6-digit OTP (mock SSO for demo) |
| i18n | LLM generates copy directly in target locales (no Starling, no i18n framework) |
| Package manager | **bun** |
| Testing | **Vitest** |
| Deployment | `next start` or Docker (offline demo with pre-seeded `.db`) |

**Explicitly DO NOT introduce**: LangChain, Prisma, tRPC, Pages Router, Redux, a separate API
server, or any UI library outside shadcn/Radix/lucide. If you think you need something else,
flag it in the PR or ask the human first.

---

## 3. Project Layout (per SPEC §14)

```text
.
├── app/                        # Next.js App Router (root-level)
│   ├── layout.tsx              # Root: fonts, theme, toasts
│   ├── globals.css             # Tailwind + design tokens (purple-pink TikTok Shop accents)
│   ├── (auth)/login/           # Email + OTP login
│   ├── (app)/                  # Authenticated shell (sidebar + topbar)
│   │   ├── layout.tsx
│   │   ├── campaigns/          # list, new split-pane, [id] dashboard, [id]/edit
│   │   └── settings/
│   └── api/                    # Route handlers
│       ├── auth/               # request-code, verify-code, signout, nextauth
│       ├── chat/               # SSE streaming (streamText + 5 tools)
│       ├── campaigns/          # CRUD + publish + copy/regenerate + simulate
│       ├── creators/search/
│       ├── seed/               # Dev only
│       └── health/
├── components/
│   ├── ui/                     # shadcn primitives (auto-generated, edit sparingly)
│   ├── shell/                  # sidebar, topbar, user-nav
│   ├── chat/                   # chat-panel, message-bubble, stage-progress, reasoning-trace, quick-prompts, widgets/*
│   ├── campaign-form/          # form sections + diff-highlight + action bar
│   ├── campaign-list/          # table, status-badge, stats-strip
│   ├── campaign-dashboard/     # KPI cards, tier-donut, region-bar, timeline-gantt, copy-tab, matching-creators, audit-timeline
│   └── auth/                   # email-form, otp-form
├── lib/
│   ├── db/                     # Drizzle client, schema.ts, queries.ts
│   ├── ai/                     # provider, system-prompt, tools, copy-generator, mock-llm
│   ├── services/               # validator, simulator, campaigns, copy, audit (pure business logic)
│   ├── schemas/                # ★ campaign-config.ts (Zod SSoT), copy.ts, api.ts
│   ├── auth/                   # NextAuth config, otp
│   ├── store/draft-store.ts    # Zustand (only client store)
│   ├── hooks/                  # use-debounced-callback, use-copy-flash
│   ├── utils.ts                # cn(), dates, etc.
│   └── constants.ts
├── commands/                   # Shared server actions, command handlers (created when needed)
└── scripts/                    # seed.ts (20k creators via @faker-js/faker, seed 42), create-demo-campaign
```

**When adding new files**, follow this structure. Top-level folders are `app/`, `components/`,
`lib/`, `scripts/`, `public/`, and `tests/`. Prefer extending an existing module over creating
new top-level folders.

---

## 4. Build / Run / Test Commands

All scripts assume **bun**. Use `bun`, not `npm`/`yarn`/`pnpm`.

| Command | Purpose |
| --- | --- |
| `bun install` | Install deps |
| `bun dev` | Next dev server (default port 3000) |
| `bun build` | Production build |
| `bun start` | Run production build |
| `bun lint` | ESLint (next lint) — must pass before commit |
| `bun test` | Vitest run (add tests under `tests/` or colocate as `*.test.ts`) |
| `bun db:generate` | Drizzle-kit generate migration |
| `bun db:push` | Push schema to dev DB (no migration files; good for rapid iteration) |
| `bun db:seed` | Run `scripts/seed.ts` (deterministic, faker seed 42, ~20k creators) |

### Environment

Copy `.env.example` → `.env.local`. Key variables:

- `DATABASE_URL` — defaults to `file:./local.db` (gitignored)
- `OPENAI_API_KEY` — for real LLM; if unset, set `LLM_MODE=mock` to use deterministic fallback
- `LLM_MODE=mock` — **critical for offline demo day**: all LLM calls become canned-but-valid responses. Always test with this mode works.
- `AUTH_SECRET` — random string for NextAuth
- `NEXT_PUBLIC_APP_URL` — defaults to `http://localhost:3000`

### Quick sanity check after scaffold changes

```bash
bun install && bun lint && bun db:push && bun db:seed && bun test && bun build
```

---

## 5. Architecture Rules (Non-Negotiable)

1. **One Zod schema rules them all.** `CampaignConfigSchema` in `lib/schemas/campaign-config.ts`
   is the single source of truth for: LLM tool output, react-hook-form validation, the
   `campaigns.config` JSON column, and publish-time validation. If you add a field, add it here
   first, then propagate outward. Do NOT define parallel shapes.

2. **Chat and form share one Zustand draft store** (`lib/store/draft-store.ts`).
   - AI tool results (`set_config`) merge into the store → react-hook-form resets via subscription.
   - User typing → `watch()` → store updates → next `/api/chat` call includes the latest config.
   - Don't duplicate form/chat state in component state.

3. **Deterministic logic stays in code.** Budget math, eligibility filtering, and validation
   rules live in `lib/services/validator.ts` and `simulator.ts` as **pure functions**. The
   LLM interprets intent and writes copy — it does NOT estimate reach, compute CPA, or decide
   eligibility. These functions must be unit-testable without any LLM or DB mocks (they take
   plain objects and return plain objects).

4. **LLM access goes through Vercel AI SDK tools.** All model interaction is inside
   `lib/ai/`. The chat endpoint uses `streamText({ tools, maxSteps: 8 })` and lets the model
   plan its own tool sequence (`set_config → run_validation → generate_copy → run_simulation`).
   Do not hand-chain tool calls; do not dump JSON into chat text. The `set_config` tool always
   does a **partial merge** — never wholesale replace.

5. **Mock LLM must always work.** The `withLLMFallback` wrapper / `LLM_MODE=mock` path keeps
   the demo alive offline. If you change tool schemas or system prompts, update
   `lib/ai/mock-llm.ts` so the canned responses still produce valid `set_config` patches
   and exercise the stage strip end-to-end.

6. **Server Components by default; Client Components when needed.** List pages and dashboard
   shells are Server Components. The chat panel, form, and interactive charts are Client
   Components (annotated with `"use client"` at the top). Don't import client-only modules
   (zustand, react-hook-form, recharts) from server files.

7. **Route Handlers for API; Server Actions are OK** for form mutations, but the streaming
   `/api/chat` endpoint must remain a Route Handler (SSE).

8. **DB schema lives in one file** (`lib/db/schema.ts`). Relationships via Drizzle.
   Always re-run `bun db:push` (or generate a migration) after editing `schema.ts`.
   The seed script must remain idempotent-ish (wipes/creates a fixed seed; don't rely on
   existing data for dev).

9. **No secret/credential logging.** The system prompt and tool traces may include campaign
   config but never API keys or OTP codes. The OTP is shown in dev mode on the login screen
   (and logged server-side) but must never be streamed to chat.

---

## 6. Conventions

### TypeScript

- Strict mode on. Avoid `any`; use `unknown` + narrowing.
- Prefer `z.infer<typeof X>` for types derived from Zod schemas rather than redeclaring interfaces.
- Co-locate types with the module that owns them; don't build a giant `types/` folder.

### Styling

- Tailwind v4 (`@import "tailwindcss"` in `globals.css`). Use `cn()` from `@/lib/utils` for
  conditional classes.
- Design tokens: primary gradient `#6938FF → #FE2C55` (TikTok Shop purple-pink). Dark mode
  supported via `next-themes`.
- shadcn/ui components in `components/ui/` are generated; treat them like vendored code and
  prefer wrapping/composing over editing them directly.
- Use `lucide-react` icons.

### React & Frontend Coding Standards

- **One component per file**: Every React component must live in its own `.tsx` file. Group
  related components by feature in dedicated subfolders under `components/<feature>/`; use
  `index.ts` barrel exports only for public component APIs when needed.
- **State management**: Use Zustand for all global/shared client state (follow the existing
  draft store pattern). Do not introduce other state management libraries (Redux, global Context
  API, Jotai, etc.) without explicit approval.
- **No prop drilling**: Never pass props through 2+ levels of nested components. If state
  needs to be accessed by components deep in the tree, lift it to a Zustand store (for
  app-wide/feature-wide state) or scoped React Context (for tightly coupled component trees)
  instead of threading props through intermediate layers.
- **Utility functions**: Reusable pure JS/TS helper functions that are not tied to a single
  component or domain service belong in `lib/utils.ts` or dedicated util modules under
  `lib/utils/`. Only define helper functions inside component files if they are used
  exclusively within that single component.
- **Shared logic location**: Place cross-feature shared logic, server action handlers, and
  reusable command-style functions that do not fit in `lib/services` or `lib/utils` in the
  top-level `commands/` folder. Do not scatter shared logic across individual feature
  folders.
- **API standards**: All API endpoints in `app/api/` must use clear, RESTful, descriptive
  paths (e.g. `/api/campaigns/[id]/simulate`, not `/api/sim1`). Implement caching for both
  layers:
  - Backend: Use Next.js `cache()`, `unstable_cache`, or appropriate `Cache-Control` headers
    for non-mutating responses; tag cached data with `revalidateTag` for targeted invalidation.
  - Frontend: Leverage Next.js built-in fetch caching, deduplicate requests, and avoid redundant
    refetches; use `revalidatePath`/`revalidateTag` to refresh data after mutations.
- **Color system**: All colors must use the official TikTok Shop brand palette defined as
  Tailwind theme tokens (primary purple `#6938FF`, accent pink `#FE2C55`, plus supporting TikTok
  brand colors). Never hardcode raw hex/RGB values directly in class names; always use the
  semantic Tailwind color tokens (e.g. `bg-primary`, `text-accent-pink`) from the global theme.
- **No plain CSS**: All styling must be done with Tailwind CSS utility classes.
  - Do not create new `.css`/`.scss`/`.module.css` files outside of the root `app/globals.css`
    (which is reserved exclusively for Tailwind directives and theme token definitions).
  - Avoid inline `style` attributes unless absolutely necessary for dynamic values that cannot
    be expressed with Tailwind (e.g. dynamic position offsets based on runtime measurements).
  - Use the `cn()` utility from `@/lib/utils` to compose conditional Tailwind classes.

### Naming

- Files: `kebab-case.ts` for utilities/services, `kebab-case.tsx` for components.
- React components: `PascalCase`, default-exported from their file.
- Server actions / async fns: verb-led (`createCampaign`, `runSimulation`).
- Zustand store hook: `useDraftStore`. Selectors at usage site (don't export giant selectors
  unless it prevents rerenders).

### Forms & Validation

- Always use `react-hook-form` + `zodResolver(CampaignConfigSchema)` for any form touching
  campaign config. Custom forms (login, settings) also get Zod resolvers.
- Surface validation issues via `ValidationIssue` shape (`{level, code, message, field?, suggestion?}`),
  not ad-hoc strings.

### AI Tools

When adding a new tool (rare; check with human first):

1. Add the schema to `lib/schemas/campaign-config.ts` or `schemas/api.ts`.
2. Implement the executor as a pure function in `lib/services/`.
3. Register it in `lib/ai/tools.ts` with a clear description so the model knows when to
   call it.
4. Update the system prompt in `lib/ai/system-prompt.ts`.
5. Add a deterministic mock path in `lib/ai/mock-llm.ts`.
6. Update the stage strip in `stage-progress.tsx` if a new user-visible stage exists.

### Commit messages

- Prefix with area: `feat(chat):`, `fix(form):`, `chore(db):`, `ai:`, `ui:`, `seed:`.
- Keep subject ≤ 72 chars. Reference SPEC sections when relevant.

---

## 7. Testing Guidance

- **Pure functions first.** `validator.ts`, `simulator.ts`, config merge logic — these must
  have Vitest coverage. Budget math is mission-critical for the demo.
- Add tests under `tests/` or colocated as `*.test.ts` next to the module.
- For components, we're not doing heavy React Testing Library in this hack (UI is demo-day
  polish, not spec-grade). Focus smoke tests on the data layer.
- Before shipping a milestone (see SPEC §15), run at minimum:
  - `bun test`
  - `bun build`
  - A manual walkthrough of the demo script (SPEC §16) with `LLM_MODE=mock`.

---

## 8. Common Tasks (Recipes)

### Add a new field to the campaign config

1. Add it to `CampaignConfigSchema` in `lib/schemas/campaign-config.ts`, with sensible
   defaults/min/max.
2. If it affects eligibility, update `lib/services/simulator.ts` filter logic.
3. If it introduces a validation rule, add it to `lib/services/validator.ts` with a
   stable `code` string.
4. Add a form control in the appropriate `campaign-form/*-section.tsx`.
5. Mention the field in the system prompt so the LLM knows to fill it.
6. Update `mock-llm.ts` to return the field in canned responses.

### Add a new shadcn component

```bash
bun dlx shadcn@latest add <component-name>
```

Verify it drops into `components/ui/` and doesn't bloat `package.json` with unused deps.

### Reset the dev DB

```bash
rm -f local.db && bun db:push && bun db:seed
```

### Run entirely offline (demo mode)

In `.env.local`:

```
LLM_MODE=mock
DATABASE_URL=file:./local.db
```

`bun dev` will serve a fully deterministic experience with a pre-seeded DB. **Verify this
works before every demo.**

---

## 9. Demo Day Priorities (read before "polish" commits)

We're optimizing for a tight 3-minute live demo (SPEC §16). If a change doesn't move the
needle on that path, it's lower priority than:

1. **Reliability** of the chat → form → copy → simulate happy path, especially under
   `LLM_MODE=mock`. No crashes, no hanging streams.
2. **Visual polish**: dark mode, gradient accents, diff-flash on AI-updated fields, stage
   progress strip, confetti on publish, toasts.
3. **The demo script beats generality.** It's OK for the canned mock response to produce a
   good-looking "US beauty, $5k, micro-creators" result — that's what will be shown live.
4. **Responsive only down to ~768px**; ops users are on desktop. Don't spend time on mobile
   beyond stacking chat above form.

---

## 10. Where to Look When Something Breaks

| Symptom | First place to look |
| --- | --- |
| Form doesn't update after AI message | Zustand subscription / `mergeConfig` in `store/draft-store.ts`; or form `reset()` wiring |
| AI dumps JSON in chat instead of calling `set_config` | System prompt rules 1–3 in `ai/system-prompt.ts`; ensure tool descriptions are clear |
| Validation errors on a known-good config | Overly strict rule in `services/validator.ts` — check `issues[]` codes |
| Estimate numbers look wrong | Tier-based acceptance rates / conversion rates in `services/simulator.ts` |
| Streaming hangs mid-response | `api/chat/route.ts` — check `maxSteps`, tool error handling, SSE headers |
| Login OTP not working / infinite redirect | `auth/otp.ts`, NextAuth callbacks, middleware for protected routes |
| DB errors after schema change | Forgot to `bun db:push`, or seed uses old column names |
| Mock mode diverges from real mode | Update `ai/mock-llm.ts`; schema drift between real and mock is a bug |
| Tailwind classes not applying | Tailwind v4 config in `globals.css` / `postcss.config.mjs`; make sure no v3 cruft remains |

---

## 11. What Not To Do

- Don't auto-refactor large swathes of code "for cleanliness" within 3 days of demo day
  (Sept 5+). Small, targeted fixes only.
- Don't add new third-party UI libraries (MUI, Ant, Chakra, etc.) — shadcn/Radix/lucide is
  the stack.
- Don't use plain CSS, CSS modules, or CSS-in-JS libraries (styled-components, emotion, etc.) —
  all styling must use Tailwind CSS.
- Don't prop drill state across more than 1 intermediate component — use Zustand or scoped
  Context instead.
- Don't hardcode raw color values in class names — always use the TikTok brand Tailwind theme tokens.
- Don't change the Zod schema in a backward-incompatible way without a data migration for
  existing `campaigns.config` rows. (During the hack, wiping `local.db` is acceptable; note
  it in the commit.)
- Don't introduce environment-specific branches in component code (`if (process.env.NODE_ENV …)`
  in TSX). Use feature flags via env only in server code, or explicit dev toggles on the
  Settings page.
- Don't commit `.env.local`, `local.db`, or `node_modules`. `.gitignore` already handles them.

---

## 12. Ask the Human When…

- You're about to introduce a new production dependency not in `package.json`.
- You're unsure whether a behavior change matches the product vision (SPEC is authoritative,
  but edge cases aren't all spelled out).
- A change would meaningfully delay the current milestone (SPEC §15).
- You want to swap out a core choice (e.g., swap libSQL for Postgres locally, change AI SDK
  versions, add a new auth provider).

---

**Last updated**: 2025-08-26 (project init). Keep this file in sync as the codebase evolves.
