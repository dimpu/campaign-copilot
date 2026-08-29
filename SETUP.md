# SETUP.md — Campaign Copilot

> Step-by-step guide to go from zero to a running Campaign Copilot instance.
> Last updated: 2025-08-27

---

## 1. Prerequisites

| Tool | Minimum Version | Check |
|---|---|---|
| **Node.js** | 18+ | `node --version` |
| **pnpm** | 9+ | `pnpm --version` |
| **Git** | any | `git --version` |

**Node.js 22** is recommended (the project was built on it). Install via `nvm`, `fnm`, or [nodejs.org](https://nodejs.org).

**pnpm** is the required package manager. Install with:

```bash
corepack enable pnpm
# or
npm install -g pnpm
```

---

## 2. First-Time Setup (5 minutes)

### 2.1 Clone & Install

```bash
cd campaign-copilot
pnpm install
```

If `better-sqlite3` fails to compile (native addon), you may need build tools:

```bash
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt-get install build-essential python3
```

### 2.2 Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and configure:

```env
# ── Required ──
AUTH_SECRET=dev-secret-change-in-production

# ── Database (default is fine for dev) ──
DATABASE_URL=file:./local.db

# ── AI / LLM ──
# For demo/offline: uncomment the next line
LLM_MODE=mock

# For real AI: set your API key and leave LLM_MODE commented out
# OPENAI_API_KEY=sk-...
```

### 2.3 Create the Database

```bash
pnpm db:push
```

This creates `local.db` in the project root with all 8 tables, indexes, and foreign keys.

**Output:**
```
[✓] Pulling schema from database...
[✓] Changes applied
```

### 2.4 Seed the Database

```bash
pnpm db:seed
```

This generates 20,000 synthetic creator profiles (deterministic, `faker.seed(42)`) plus a demo user.

**Output:**
```
🌱 Seeding Campaign Copilot database...
  Clearing existing data...
  Creating demo user...
  Generating 20,000 creator profiles...
    ... 1,000/20,000 creators
    ... 2,000/20,000 creators
    ...
    ... 20,000/20,000 creators
✅ Seed complete! Created 20,000 creators + 1 demo user.
   Demo login: demo@bytedance.com (OTP shown on screen in dev mode)
```

### 2.5 Start the Dev Server

```bash
pnpm dev
```

Open **http://localhost:3000** in your browser.

### 2.6 Log In

1. Enter `demo@bytedance.com` on the login page
2. Click **Send Code**
3. In dev mode, the 6-digit OTP is shown on screen — enter it
4. Click **Verify** → redirected to `/campaigns`

---

## 3. Quick Sanity Check

Run all checks in one command:

```bash
pnpm test && pnpm build
```

| Check | What it verifies |
|---|---|
| `pnpm test` | 6 Vitest tests — validator business rules |
| `pnpm build` | TypeScript compilation, all pages, all API routes |

Expected output:
```
✓ tests/validator.test.ts (6 tests) 15ms
✓ Test Files  1 passed (1)
✓ Tests       6 passed (6)

✓ Compiled successfully
✓ Generating static pages (14/14)
```

---

## 4. Database Reference

### 4.1 Overview

| Property | Value |
|---|---|
| Engine | SQLite via `better-sqlite3` |
| ORM | Drizzle ORM |
| File | `local.db` (gitignored) |
| WAL mode | Enabled (`PRAGMA journal_mode = WAL`) |
| Foreign keys | Enabled (`PRAGMA foreign_keys = ON`) |

### 4.2 Schema Location

```
src/lib/db/
├── schema.ts    # 8 table definitions + indexes
├── index.ts     # Drizzle client (db, schema exports)
└── queries.ts   # Typed query helpers
```

### 4.3 Tables

| Table | Rows after seed | Purpose |
|---|---|---|
| `users` | 1 | `demo@bytedance.com` (ops role) |
| `otp_codes` | 0 | Ephemeral 6-digit codes, 10-min TTL |
| `campaigns` | 0 | Campaign drafts, config as JSON |
| `generated_copy` | 0 | Per-locale creator-facing copy |
| `conversation_messages` | 0 | Full chat history |
| `creator_profiles` | 20,000 | Synthetic creators for simulation |
| `audit_log` | 0 | Immutable mutation trail |

### 4.4 Useful DB Commands

```bash
# Reset the database (wipe everything and re-seed)
rm -f local.db && pnpm db:push && pnpm db:seed

# Open SQLite shell to inspect data
sqlite3 local.db

# Common queries inside sqlite3:
.tables                          # List all tables
.schema creator_profiles         # Show table schema
SELECT COUNT(*) FROM creator_profiles;  # Should be 20000
SELECT region, COUNT(*) FROM creator_profiles GROUP BY region ORDER BY COUNT(*) DESC;
SELECT follower_tier, COUNT(*) FROM creator_profiles GROUP BY follower_tier;
SELECT * FROM users;
SELECT * FROM campaigns;
SELECT id, locale, title FROM generated_copy;
.quit

# Check DB file size
ls -lh local.db                  # ~20–30 MB after seed
```

### 4.5 Drizzle Workflow

```bash
# After editing schema.ts, push changes to the database:
pnpm db:push

# Generate a migration file (for production):
pnpm db:generate
# → creates files in drizzle/ directory

# In development, db:push is sufficient.
# Migrations are not tracked in this hackathon project.
```

### 4.6 JSON Columns

SQLite has no native JSON type. The following columns store JSON as text:

| Column | Parse with |
|---|---|
| `campaigns.config` | `JSON.parse()` |
| `campaigns.validationIssues` | `JSON.parse()` |
| `generated_copy.hashtags` | `JSON.parse()` |
| `creator_profiles.categories` | `JSON.parse()` |
| `creator_profiles.preferredLanguages` | `JSON.parse()` |

The `queries.ts` helpers handle serialization/deserialization for most paths. When reading raw rows, you must parse these fields yourself.

---

## 5. Environment Variables Reference

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | No | `file:./local.db` | SQLite database file path |
| `AUTH_SECRET` | **Yes** | — | NextAuth JWT signing secret. Use any random string in dev. |
| `AUTH_URL` | No | `http://localhost:3000` | NextAuth base URL |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Public-facing app URL |
| `OPENAI_API_KEY` | No | — | OpenAI API key for real LLM. If unset → mock mode. |
| `LLM_MODE` | No | — | Set to `mock` for deterministic offline responses. |

### 5.1 LLM_MODE Explained

| Mode | `LLM_MODE` | `OPENAI_API_KEY` | Behavior |
|---|---|---|---|
| **Mock** (offline demo) | `mock` | (any) | `mockProcessMessage()` parses keywords from user text, returns deterministic responses. No network calls. All streaming, SSE, and DB persistence work identically. |
| **Real** | (not set) | set | `streamText()` with `gpt-4o` via Vercel AI SDK. The model autonomously calls 5 tools. |
| **Fallback** | (not set) | not set | Falls back to mock mode automatically. |

### 5.2 Generating a Secure AUTH_SECRET

```bash
openssl rand -base64 32
```

Or in Node:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 6. AI / LLM Setup

### 6.1 Mock Mode (Recommended for Demo)

No setup required. Just set `LLM_MODE=mock` in `.env.local`.

The mock LLM parses these keywords from user messages:

| User says | Mock infers |
|---|---|
| "US", "ID", "TH", "VN", "BR" | Regions |
| "beauty", "fashion", "tech", "food" | Product category |
| "nano", "micro", "mid", "1k", "10k" | Follower tiers |
| "$5000", "5k", "$3,000" | Budget |
| "commission", "flat fee", "free sample" | Reward type |
| "video", "live" | Task type + content formats |

### 6.2 Real LLM Mode

1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-...
   # Remove or comment out LLM_MODE=mock
   ```
3. The model used is `gpt-4o` (configurable in `src/lib/ai/provider.ts`)

### 6.3 Changing the Model

Edit `src/lib/ai/provider.ts`:

```typescript
// Change this line:
return openai("gpt-4o");

// To another model, e.g.:
return openai("gpt-4o-mini");
return openai("gpt-4-turbo");
```

---

## 7. Project Configuration Files

| File | Purpose |
|---|---|
| `package.json` | Dependencies, scripts, metadata |
| `tsconfig.json` | TypeScript config (strict, paths alias `@/` → `src/`) |
| `next.config.ts` | Next.js config (external packages: better-sqlite3) |
| `drizzle.config.ts` | Drizzle ORM config (SQLite dialect, schema path) |
| `postcss.config.mjs` | PostCSS + Tailwind v4 plugin |
| `.env.example` | Environment variable template |
| `.env.local` | Your local env (gitignored) |
| `.gitignore` | Ignored files (node_modules, .next, local.db, .env) |
| `.markdownlint.json` | Markdown lint rules |

---

## 8. Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `pnpm dev` | Start Next.js dev server (hot reload, port 3000) |
| `build` | `pnpm build` | Production build (type-checks + compiles) |
| `start` | `pnpm start` | Run production build |
| `lint` | `pnpm lint` | ESLint |
| `test` | `pnpm test` | Vitest (6 tests) |
| `db:push` | `pnpm db:push` | Push Drizzle schema to `local.db` |
| `db:generate` | `pnpm db:generate` | Generate migration files |
| `db:seed` | `pnpm db:seed` | Seed 20,000 creators + demo user |

---

## 9. Common Workflows

### 9.1 Start Fresh (Wipe DB)

```bash
rm -f local.db local.db-wal local.db-shm
pnpm db:push
pnpm db:seed
pnpm dev
```

### 9.2 Add a New Dependency

```bash
pnpm add <package-name>
# or for dev dependencies:
pnpm add -D <package-name>
```

### 9.3 After Pulling New Changes

```bash
pnpm install        # New deps may have been added
pnpm db:push        # Schema may have changed
pnpm db:seed        # Re-seed (idempotent)
pnpm test           # Verify nothing broke
pnpm dev            # Start
```

### 9.4 Prepare for Demo

```bash
# 1. Ensure mock mode is on
echo "LLM_MODE=mock" >> .env.local

# 2. Fresh database
rm -f local.db && pnpm db:push && pnpm db:seed

# 3. Verify build
pnpm build

# 4. Start
pnpm dev
```

### 9.5 Run on a Different Port

```bash
pnpm dev --port 3001
# or
PORT=3001 pnpm dev
```

---

## 10. Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.5 |
| UI Library | React | 19.1 |
| Language | TypeScript (strict) | 5.9 |
| Styling | Tailwind CSS | 4.3 |
| Components | shadcn/ui + Radix | various |
| Icons | lucide-react | 0.511 |
| Charts | recharts | 2.15 |
| Forms | react-hook-form + Zod | 7.56 / 3.25 |
| State | Zustand | 5.0 |
| Database | better-sqlite3 + Drizzle ORM | 11.10 / 0.44 |
| Auth | NextAuth v5 (Auth.js) | 5.0-beta |
| AI | Vercel AI SDK + OpenAI | 4.3 / 1.3 |
| Testing | Vitest | 3.2 |
| Seed | @faker-js/faker | 9.8 |
| Package Manager | pnpm | 9+ |

---

## 11. Troubleshooting

### `pnpm install` fails with "No matching version"

The ByteDance internal registry (`bnpm.byted.org`) may not have the latest versions of some packages. Solutions:

1. Switch to the public npm registry temporarily:
   ```bash
   pnpm config set registry https://registry.npmjs.org/
   pnpm install
   pnpm config delete registry
   ```

2. Or use the `--registry` flag:
   ```bash
   pnpm install --registry https://registry.npmjs.org/
   ```

### `better-sqlite3` fails to compile

This is a native addon. You need C++ build tools:

**macOS:**
```bash
xcode-select --install
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install build-essential python3
```

**Windows:**
```bash
npm install --global windows-build-tools
```

### `pnpm db:push` fails

Make sure `local.db` is not locked by another process. If needed:

```bash
rm -f local.db local.db-wal local.db-shm
pnpm db:push
```

### `pnpm dev` fails with port in use

```bash
# Kill whatever is on port 3000
lsof -ti:3000 | xargs kill -9
# Then restart
pnpm dev
```

### Login OTP not working

In dev mode, the OTP is shown on screen. Check:
- The OTP is 10 minutes valid — if expired, request a new one
- The `AUTH_SECRET` is set in `.env.local`
- `AUTH_URL` matches your dev server URL

### Mock mode produces unexpected results

The mock LLM (`src/lib/ai/mock-llm.ts`) uses keyword matching. Try including keywords like region names ("US", "ID"), categories ("beauty", "fashion"), follower tiers ("nano", "micro"), and budget amounts ("$5000") in your message.

### Build fails with type errors

```bash
# Get the full error list
pnpm build 2>&1 | grep "Type error"

# Common causes:
# 1. Schema change without db:push
# 2. Missing import after rebase
# 3. Drizzle inference issue with enum columns
```

### `pnpm test` fails

Make sure `vitest` is installed:
```bash
pnpm install
pnpm test
```

---

## 12. Demo Script

The intended 3-minute demo flow (see `SPEC.md` §16):

```
[0:00] Open /campaigns/new → empty chat + empty form
[0:05] Type: "US beauty nano creators, tiered commission, $5,000"
[0:25] Watch stage strip animate + form auto-fill + estimate card
[0:40] Click "Show reasoning" → see AI tool call trace
[0:45] Type: "Add Indonesia and Thailand, make tone playful"
[1:05] Manually tweak budget → estimate updates in real-time
[1:10] Type: "Is $3,000 enough?" → AI suggests adjustments
[1:35] Switch to Copy tab → EN, ID, TH copy preview
[1:45] Click "Publish" → confetti 🎉 → dashboard
[2:00] Dashboard: KPI cards, charts, copy, creators
```

---

## 13. Where to Get Help

| Resource | Path |
|---|---|
| Product spec | `SPEC.md` |
| Architecture doc | `ARCHITECTURE.md` |
| Agent coding guide | `AGENTS.md` |
| Demo day rules | `GEC-B_Full-Stack_Demo_Day.md` |
| Environment template | `.env.example` |
| Drizzle schema | `src/lib/db/schema.ts` |
| AI tools | `src/lib/ai/tools.ts` |
| Mock LLM | `src/lib/ai/mock-llm.ts` |