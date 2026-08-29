# Creator Campaign Copilot — Technical Specification

> **GEC-B Full-Stack Demo Day** | Solo project | Deadline: Sept 7, 2025

---

## 1. Problem Statement

Operations teams at TikTok Shop spend 15–30 minutes filling complex, multi-conditional forms to create
affiliate creator campaigns (tasks, competitions, commission boosts). Every field has conditional logic based
on task type, region, seller type, and reward structure. New ops members need weeks of training.
Misconfigurations (budget too small, wrong region-language pairing, missing Starling keys) are common and
caught late.

**What if you could just describe the campaign in plain English and get a complete, validated configuration + multi-language copy + budget estimate in 30 seconds?**

---

## 2. Product Overview

Creator Campaign Copilot is an AI-powered web app where ops staff:

1. **Describe** a campaign in natural language (chat interface)
2. **Get** a fully structured campaign configuration auto-filled by an LLM
3. **See** creator-facing marketing copy auto-generated in all target languages
4. **Review** a budget/reach/ROI simulation against a mock creator database
5. **Edit** either via follow-up chat prompts or directly in a traditional form (side-by-side)
6. **Publish** the campaign with one click

The signature UX is a **split-pane layout**: AI chat on the left, live form on the right. Changes in either pane instantly sync to the other.

---

## 3. Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| **Framework** | Next.js 15 (App Router) + React 19 + TypeScript | Single deploy target, Server Components for list/detail pages, Route Handlers for API. No CORS, shared types by default. |
| **UI** | shadcn/ui + Radix + Tailwind CSS v4 + lucide-react | Copy-paste components, infinite visual flexibility, fast iteration. |
| **Charts** | recharts | Simple API, React 19 compatible. |
| **State** | Zustand (one store for draft config sync) + React 19 `useActionState` | No Redux. Minimal client state — just the draft campaign and chat anchor. |
| **Forms** | react-hook-form + Zod resolver | Large form with conditional fields, uncontrolled = fast. |
| **Database** | libSQL (Turso) in local file mode (dev) → PostgreSQL (prod) | Zero infra to start (file in repo gitignored). Drizzle supports both. |
| **ORM** | Drizzle ORM | End-to-end type safety, great SQLite support, lightweight. |
| **Validation** | Zod 3.x | Single source of truth: DB seed, API, LLM output, form validation. |
| **AI SDK** | Vercel AI SDK v4 (`ai` + `@ai-sdk/openai`) | `streamText`, `streamObject`, `useChat`, tool calling — all built in. No LangChain needed. |
| **Auth** | NextAuth v5 with email + OTP credentials provider | No external OAuth. Mock SSO for demo. |
| **Streaming** | AI SDK SSE via `streamText` → `useChat` hook | Native, zero-config streaming. |
| **i18n / Translation** | LLM generates copy directly in all required languages | No Starling, no Google Translate. In-LLM translation IS the product feature. |
| **Package manager** | pnpm | Fast, strict. |
| **Deployment** | `next start` on laptop OR Docker on intranet host | Pre-seeded `.db` file works offline. |

**Explicitly NOT used:** LangChain, Prisma, tRPC, Pages Router, separate API server.

---

## 4. Architecture

```text
┌───────────────────────────────────────────────────────────────┐
│                    BROWSER (Next.js client)                    │
│                                                               │
│  /campaigns/new  ┌──────────────┬──────────────────────┐      │
│                  │  ChatPanel   │  CampaignForm        │      │
│                  │  (useChat)   │  (react-hook-form)   │      │
│                  │              │                      │      │
│                  │  Stage strip │  Live Estimate card  │      │
│                  │  Reasoning   │  Diff highlighting   │      │
│                  └──────┬───────┴──────────┬───────────┘      │
│                         │ SSE              │ Server Action     │
│                         ▼                  ▼                   │
├─────────────────────────┼──────────────────┼──────────────────┤
│                NEXT.JS SERVER (Node)                           │
│                                                               │
│  /api/chat ─────► CopilotAgent (streamText + tools)           │
│                      │                                        │
│                      ├── set_config (merge + validate)        │
│                      ├── run_validation (deterministic)       │
│                      ├── generate_copy (LLM generateObject)   │
│                      ├── run_simulation (SQL query + math)    │
│                      └── ask_user (clarification)             │
│                                                               │
│  /api/campaigns ──► CRUD (Server Actions / Route Handlers)    │
│  /api/auth ───────► Auth.js (email + OTP)                    │
│                                                               │
│  ┌──────────┐    ┌──────────────────────────┐                 │
│  │  Drizzle │◄───┤  AI Provider              │                │
│  │  (libSQL)│    │  (OpenAI-compatible)      │                │
│  └──────────┘    │  + mock fallback          │                │
│       │          └──────────────────────────┘                 │
│       ▼                                                       │
│  local.db (20k synthetic creators)                            │
└───────────────────────────────────────────────────────────────┘
```

**Key design rules:**

1. **One Zod schema** (`CampaignConfigSchema`) is the single source of truth for LLM output, form validation, DB config column, and publish-time validation.
2. **Chat and form both drive a single Zustand draft config** on the client. Chat streams patches; form edits directly. Changes in one pane instantly reflect in the other.
3. **Deterministic where possible**: budget estimates and eligibility matching run as code (not LLM calls). The LLM provides understanding + copy; code provides math.
4. **Mock LLM fallback**: if the API is unreachable, deterministic canned responses keep the demo working.

---

## 5. Database Schema

### 5.1 Tables

**users** — Ops staff

| Column | Type | Notes |
| --- | --- | --- |
| id | text PK | UUID |
| email | text UNIQUE | ByteDance email |
| name | text | Display name |
| avatarUrl | text? | |
| role | text | "ops" \| "admin" |
| createdAt | integer | Unix ms |
| lastLoginAt | integer? | |

**otp_codes** — Mock SSO

| Column | Type | Notes |
| --- | --- | --- |
| id | text PK | UUID |
| email | text | |
| code | text | 6-digit |
| expiresAt | integer | 10-min TTL |
| consumedAt | integer? | |

**campaigns** — Core entity

| Column | Type | Notes |
| --- | --- | --- |
| id | text PK | UUID |
| slug | text UNIQUE | URL-friendly |
| name | text | Campaign name |
| description | text? | Original NL brief |
| createdBy | text FK→users | |
| status | text | draft \| validating \| ready \| published \| paused \| archived |
| config | text (JSON) | Full structured config, Zod-validated on write |
| estimatedReach | integer? | From simulator |
| estimatedCost | real? | |
| estimatedCpa | real? | |
| estimatedRoi | real? | |
| eligibleCreatorCount | integer? | |
| validationIssues | text (JSON)? | `[{level, code, message, field, suggestion}]` |
| reasoningTrace | text (JSON)? | `[{step, input, output, ts}]` |
| publishedAt | integer? | |
| createdAt | integer | |
| updatedAt | integer | |

**generated_copy** — One row per locale per campaign

| Column | Type | Notes |
| --- | --- | --- |
| id | text PK | UUID |
| campaignId | text FK→campaigns | CASCADE |
| locale | text | "en", "id", "th", "vi", "ms", "tl", "es", "pt-BR" |
| variant | integer | A/B variant index |
| subject | text? | Push/email subject |
| title | text | Creator-facing card title |
| body | text | Markdown body |
| ctaText | text | CTA button text |
| hashtags | text (JSON)? | string[] |
| tone | text? | LLM-echoed tone label |
| model | text? | Which LLM |
| createdAt | integer | |

**conversation_messages** — Chat history

| Column | Type | Notes |
| --- | --- | --- |
| id | text PK | UUID |
| campaignId | text FK→campaigns | CASCADE |
| role | text | user \| assistant \| system \| tool |
| content | text | |
| payload | text (JSON)? | `{configPatch?, copyDelta?, stage?}` |
| createdAt | integer | |

**creator_profiles** — Synthetic seed (~20k rows)

| Column | Type | Notes |
| --- | --- | --- |
| id | text PK | "cr_xxxxxxxx" |
| handle | text UNIQUE | @handle |
| displayName | text | |
| avatarColor | text? | Hex, for placeholder avatars |
| region | text | US, GB, ID, TH, VN, MY, PH, BR, MX, SG |
| primaryCategory | text | fashion, beauty, tech, food, gaming, home, fitness, parenting, pets, automotive |
| categories | text (JSON) | string[] |
| followerTier | text | nano \| micro \| mid \| macro \| mega |
| followerCount | integer | |
| avgViews | integer | |
| engagementRate | real | 0..1 |
| gmv90d | real | USD |
| avgOrderValue | real | |
| pastCampaignCount | integer | Default 0 |
| lastCampaignAt | integer? | |
| preferredLanguages | text (JSON) | string[] |
| isVerified | integer (boolean) | Default false |
| isAffiliate | integer (boolean) | Default true |
| createdAt | integer | |

#### audit_log

| Column | Type | Notes |
| --- | --- | --- |
| id | text PK | UUID |
| campaignId | text FK→campaigns | |
| userId | text FK→users | |
| action | text | create \| update \| publish \| regenerate_copy \| chat_followup |
| delta | text (JSON)? | |
| createdAt | integer | |

### 5.2 Indexes

- `campaigns.createdBy` — user's campaign list
- `campaigns.status` — filtered list views
- `generated_copy.campaignId` — copy lookup
- `conversation_messages.campaignId` — chat history
- `creator_profiles(region, primaryCategory, followerTier)` — eligibility query (the hot path for simulation)
- `creator_profiles.followerCount` — range queries
- `creator_profiles.gmv90d` — sort by GMV

---

## 6. Campaign Config Schema (Zod — Single Source of Truth)

```typescript
import { z } from "zod";

// ── Enums ──
export const LocaleSchema = z.enum(["en","id","th","vi","ms","tl","es","pt-BR"]);
export type Locale = z.infer<typeof LocaleSchema>;

export const RegionSchema = z.enum(["US","GB","ID","TH","VN","MY","PH","BR","MX","SG"]);

export const TaskTypeSchema = z.enum([
  "open_collab",          // Open collaboration
  "targeted_invite",      // Targeted invitation
  "free_sample",          // Free product sample
  "commission_boost",     // Commission rate boost
  "hashtag_challenge",    // Hashtag challenge
  "live_showcase",        // Live stream showcase
  "short_video_review",   // Short video review
]);

export const FollowerTierSchema = z.enum(["nano","micro","mid","macro","mega"]);

// ── Sub-schemas ──
export const RewardSchema = z.object({
  type: z.enum(["flat_fee","commission","tiered_commission","free_product","mixed"]),
  flatFeeUsd: z.number().min(0).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  commissionBoostBps: z.number().int().min(0).max(5000).optional(),
  freeProductBudgetUsd: z.number().min(0).optional(),
  performanceBonusUsd: z.number().min(0).optional(),
});

export const EligibilitySchema = z.object({
  regions: z.array(RegionSchema).min(1),
  followerTiers: z.array(FollowerTierSchema).min(1),
  categories: z.array(z.string()).min(1),
  minEngagementRate: z.number().min(0).max(1).optional(),
  minGmv90dUsd: z.number().min(0).optional(),
  minFollowers: z.number().int().min(0).optional(),
  maxFollowers: z.number().int().min(0).optional(),
  verifiedOnly: z.boolean().default(false),
  affiliateOnly: z.boolean().default(true),
  excludePastCampaignIds: z.array(z.string()).default([]),
});

export const TimelineSchema = z.object({
  applicationStart: z.coerce.date(),
  applicationEnd:   z.coerce.date(),
  contentDeadline:  z.coerce.date(),
  goLiveDate:       z.coerce.date(),
  campaignEnd:      z.coerce.date(),
});

export const BudgetSchema = z.object({
  totalBudgetUsd:     z.number().min(0),
  targetCreatorCount: z.number().int().min(1),
  allocation: z.enum(["reward_first","sample_first","balanced"]).default("balanced"),
  reservePct: z.number().min(0).max(0.5).default(0.1),
});

export const ContentRequirementSchema = z.object({
  formats: z.array(z.enum(["short_video","live","photo_post","story"])).min(1),
  minVideoSec: z.number().int().min(5).max(600).optional(),
  requiredHashtags: z.array(z.string()).default([]),
  mustMentionBrand: z.boolean().default(true),
  reviewRequired: z.boolean().default(true),
  productShipRequired: z.boolean().default(false),
});

// ── Root ──
export const CampaignConfigSchema = z.object({
  campaignName: z.string().min(3).max(120),
  taskType: TaskTypeSchema,
  productCategory: z.string().min(1),
  brandName: z.string().optional(),
  campaignObjective: z.enum(["awareness","conversion","gmv_launch","new_product","retention"]),

  eligibility: EligibilitySchema,
  reward: RewardSchema,
  budget: BudgetSchema,
  timeline: TimelineSchema,
  contentRequirements: ContentRequirementSchema,

  targetLocales: z.array(LocaleSchema).min(1).default(["en"]),
  tone: z.enum(["playful","professional","urgent","luxury","casual"]).default("casual"),

  trackingCode: z.string().optional(),
  internalNotes: z.string().optional(),
});

export type CampaignConfig = z.infer<typeof CampaignConfigSchema>;

// ── Validation issue ──
export const ValidationIssueSchema = z.object({
  level:   z.enum(["error","warning","info"]),
  code:    z.string(),
  message: z.string(),
  field:   z.string().optional(),
  suggestion: z.string().optional(),
});
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
```

---

## 7. Backend API Design

### Auth

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/api/auth/request-code` | `{ email }` | `{ ok: true, devCode? }` (devCode in dev mode) |
| POST | `/api/auth/verify-code` | `{ email, code }` | Sets session cookie, redirect to `/campaigns` |
| POST | `/api/auth/signout` | — | Clears cookie |

### Campaigns

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET | `/api/campaigns` | `?status=&q=&page=1&pageSize=20` | `{ items, total, page, pageSize }` |
| POST | `/api/campaigns` | `{ description }` or `{ config, description? }` | `{ id, status, config, issues }` |
| GET | `/api/campaigns/:id` | — | `{ campaign, copy, messages }` |
| PATCH | `/api/campaigns/:id` | `{ config?, name?, status? }` | `{ campaign, issues }` |
| POST | `/api/campaigns/:id/publish` | — | `{ ok, publishedAt }` |
| DELETE | `/api/campaigns/:id` | — | `{ ok }` |

### AI (streaming + tools)

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/api/chat` | `{ campaignId?, messages, currentConfig }` | SSE stream: text deltas + config patches + stage markers |
| POST | `/api/campaigns/:id/copy/regenerate` | `{ locales, tone? }` | `{ ok, copy[] }` |
| POST | `/api/campaigns/:id/simulate` | `{ config }` | `{ estimatedReach, estimatedCost, estimatedCpa, estimatedRoi, eligibleCreatorCount, issues, eligibleSample[] }` |
| GET | `/api/creators/search` | `?region=&category=&tier=&q=&limit=20` | `{ creators[] }` |

### Utility

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/seed` | Dev only — re-seed 20k creators + demo user |
| GET | `/api/health` | Liveness + LLM ping status |

---

## 8. AI / LLM Integration Design

### 8.1 Agent Architecture

A single `streamText` call drives a multi-step agent using Vercel AI SDK tool calling. The model autonomously calls tools in sequence:

```text
User message → streamText(maxSteps: 8, tools)
  → model calls set_config        → config filled, merged
  → model calls run_validation    → issues returned
  → model calls generate_copy     → multi-lang copy generated
  → model calls run_simulation    → budget/reach/ROI computed
  → model writes summary in chat
```

No manual step-chaining. The model plans the steps itself.

### 8.2 System Prompt

```text
You are Campaign Copilot, an expert TikTok Shop affiliate-campaign designer for operations teams.

Your job: turn an ops teammate's plain-English brief into a complete, valid campaign configuration plus creator-facing copy.

RULES:
1. Always use the 'set_config' tool to propose config. Do NOT dump JSON into chat.
2. When the user describes a change, call 'set_config' with the patched fields.
3. After setting config, call 'run_validation'. Address any issues in chat.
4. After config is valid, call 'generate_copy' for each target locale.
5. Finally call 'run_simulation' and summarize projected reach/cost/ROI.
6. Be concise. Surface validation errors plainly and suggest fixes.
7. Use realistic numbers for TikTok Shop (CPM $5–25, commission 5–25%, nano = free product, macro = flat fees).
8. If critical info is missing (region, budget, timeline), ask ONE focused question before filling defaults.
9. Use today's date — generate a timeline 2 weeks out by default.
10. Say "projected" / "estimated" — never claim to have run the campaign.

TONE: upbeat, expert, operator-to-operator. Direct about problems.
```

### 8.3 Tools

| Tool | Purpose | Returns |
| --- | --- | --- |
| `set_config` | Create or update campaign config (partial merge) | `{ ok, merged, issues, reasoning }` |
| `run_validation` | Validate current config against business rules | `{ issues[] }` |
| `generate_copy` | Generate multi-locale creator-facing copy (inner LLM call) | `{ ok, localesGenerated[] }` |
| `run_simulation` | Run deterministic budget/reach/ROI simulation | `{ estimatedReach, estimatedCost, estimatedCpa, estimatedRoi, eligibleCreatorCount, eligibleSample[] }` |
| `ask_user` | Ask a clarifying question when info is missing | `{ question, missingFields[] }` |

### 8.4 Copy Generation Schema

```typescript
export const CopyVariantSchema = z.object({
  locale: LocaleSchema,
  subject: z.string().max(80),
  title: z.string().max(60),
  body: z.string().max(800),
  ctaText: z.string().max(20),
  hashtags: z.array(z.string().max(30)).max(5),
  smsVariant: z.string().max(120),
});

export const MultiLangCopySchema = z.object({
  variants: z.record(LocaleSchema, CopyVariantSchema),
  toneRationale: z.string().max(200),
});
```

Called via `generateObject({ model, schema: MultiLangCopySchema, prompt })` inside the `generate_copy` tool.

### 8.5 Streaming UX

`/api/chat` uses `streamText` → SSE consumed by `useChat` hook. Custom stage events emitted via `onStepFinish` so the UI shows a progress strip:

```text
⏳ Parsing intent… → ✅ Config filled → ✅ Validating → ✅ Writing EN copy → ✅ Writing ID copy → ✅ Running simulation → Done
```

### 8.6 Follow-up / Correction Loop

Every turn, the client sends the current config from the Zustand store (reflecting any manual form edits). The system prompt prepends:

```text
--- CURRENT DRAFT CONFIG ---
{JSON.stringify(currentConfig)}
--- END DRAFT ---
```

When `set_config` returns, the client merges the patch into Zustand → react-hook-form subscribes via `reset(mergedValues)`. The AI respects user-typed values because they're sent as the current state.

### 8.7 Mock LLM Fallback

A `withLLMFallback` wrapper detects API failures/timeouts and switches to deterministic canned responses that:

- Parse keywords from user message ("beauty", "US", "$5000", etc.)
- Generate a plausible config matching those keywords
- Use pre-written copy templates in 6 languages
- Produce valid SSE chunks so streaming UX is identical

Triggered via `LLM_MODE=mock` env var. Essential for offline demo day.

---

## 9. Validation Rules (Deterministic)

Implemented as pure functions, testable, callable from both server and client:

| Rule | Level | Check |
| --- | --- | --- |
| Application window sanity | error | `applicationEnd > applicationStart` |
| Content deadline before app close | warning | `contentDeadline >= applicationEnd` |
| Campaign end after go-live | error | `campaignEnd > goLiveDate` |
| Budget vs. reward | error | `minReward × targetCount ≤ budget × (1 - reservePct)` |
| Small budget | warning | `budget < $50` |
| Eligibility reach < target | warning | `eligibleCount < targetCreatorCount` |
| Commission rate high | warning | `commissionRate > 30%` |
| Region-language mismatch | info | Region has no matching locale in `targetLocales` |

---

## 10. Budget / Reach / ROI Simulator

Queries `creator_profiles` with eligibility filters, then computes:

| Metric | Calculation |
| --- | --- |
| `eligibleCreatorCount` | `COUNT(*)` with eligibility WHERE |
| `estimatedAcceptanceRate` | Tier-based: nano 45%, micro 35%, mid 25%, macro 15%, mega 5% — modulated by reward size |
| `actualCreators` | `min(target, eligible × acceptanceRate)` |
| `estimatedCost` | flat fees + product budget + projected commission + reserve |
| `estimatedReach` | `Σ followerCount × (avgViews / followerCount) × 0.4` |
| `estimatedCpa` | `cost / projectedConversions` (conversions = reach × 0.008) |
| `estimatedRoi` | `(projectedGmv × 0.15 margin - cost) / cost` |

Returns top 12 eligible creators by GMV for UI preview.

---

## 11. Frontend Pages & Routes

```text
app/
  (auth)/login/page.tsx              → Email + OTP login
  (app)/layout.tsx                   → Sidebar + topbar shell
  (app)/campaigns/page.tsx           → Campaign list with filters
  (app)/campaigns/new/page.tsx       → ★ Chat + Form split view
  (app)/campaigns/[id]/page.tsx      → Dashboard (Overview, Copy, Creators, Audit tabs)
  (app)/campaigns/[id]/edit/page.tsx → Edit (reuses chat+form)
  (app)/settings/page.tsx            → Profile, LLM model picker, dev toggles
```

### 11.1 The Signature UI: Chat + Form Side-by-Side

#### Left pane — ChatPanel

- Message bubbles (user right, assistant left) with markdown rendering
- Inline stage-progress chips: `Parsing ✓ → Config ✓ → Validating ✓ → Copy ✓ → Simulate ✓`
- Embedded cards inside chat: validation-issue cards (red/yellow), estimate-summary card, copy-preview card (tabbed by locale)
- Collapsible "Show AI reasoning" block per assistant turn
- Input bar: autosizing textarea, Send, quick-prompt chips (e.g., "US beauty micro-creators, $5k")
- ⌘K shortcut focuses input

#### Right pane — CampaignForm

- react-hook-form + Zod resolver with `CampaignConfigSchema`
- Sections: Basics, Eligibility, Reward, Budget+Timeline, Content, Copy Languages+Tone
- **Diff highlighting**: 1.2s yellow flash on changed inputs when AI updates a field
- **Live Estimate card** (sticky right rail): updates in real-time as user edits (debounced 400ms)
- Bottom action bar: Save Draft, Regenerate Copy, Validate, Publish

**Sync**: AI `set_config` → merge into Zustand → `reset(formValues)`. User typing → `watch()` → Zustand → next chat turn includes latest config.

### 11.2 Campaign List

Server Component. Table columns: Name, Status (pill), Region (flags), Target creators, Est. reach, Est. cost, Owner, Updated. Top bar: "+ New campaign" CTA, search, status filter chips, stats strip.

### 11.3 Campaign Dashboard

Tabs:

- **Overview**: KPI cards (reach, cost, CPA, ROI, eligible count), donut chart by tier, bar chart by region, timeline Gantt, validation issues
- **Copy**: Tabbed by locale, title/body/CTA/hashtags with copy-to-clipboard + regenerate
- **Matching Creators**: Top 20 eligible creators table (avatar, handle, followers, GMV, engagement)
- **Audit Log**: Timeline of all mutations

### 11.4 Login

Dark card with purple-pink gradient. Email input → "Send code" → 6-digit OTP input → verify. In dev: code shown on-screen. In "prod": code printed to server log.

---

## 12. Zustand Store (Only Client Store)

```typescript
interface DraftState {
  campaignId: string | null;
  config: CampaignConfig | null;
  issues: ValidationIssue[];
  estimate: SimulationResult | null;
  stage: "idle" | "parsing" | "config-filling" | "validating"
       | "copy-gen" | "estimating" | "done" | "error";
  lastAiPatchAt: Record<string, number>;  // for diff-flash
  mergeConfig: (patch: Partial<CampaignConfig>, source: "ai" | "user") => void;
  setIssues: (issues: ValidationIssue[]) => void;
  setEstimate: (e: SimulationResult | null) => void;
  setStage: (s: DraftState["stage"]) => void;
  reset: () => void;
}
```

---

## 13. Synthetic Seed Data Plan

Deterministic script using `@faker-js/faker` with fixed seed (`faker.seed(42)`):

- **20,000 creators** distributed:
  - Regions: ID 25%, US 15%, TH 12%, VN 12%, BR 10%, MX 8%, MY 6%, PH 6%, GB 4%, SG 2%
  - Tiers: nano (1k–10k) 50%, micro (10k–50k) 28%, mid (50k–200k) 14%, macro (200k–1M) 6%, mega (1M+) 2%
  - Categories: fashion 22%, beauty 18%, food 13%, tech 10%, home 9%, fitness 8%, parenting 7%, gaming 6%, pets 4%, automotive 3%
  - Engagement rate: inversely correlated with followers (nano avg 7%, mega avg 1.2%) + Beta noise
  - GMV 90d: log-normal, scaled by tier (nano ~$200, mega ~$80k)
  - Languages: 1–3 per creator based on region (e.g., ID → id+en)

- **1 demo user**: `demo@bytedance.com`
- Bulk insert in a single SQLite transaction (~1 second)
- Run via `pnpm db:seed`

---

## 14. Project File Structure

```text
campaign-copilot/
├── package.json
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
├── postcss.config.mjs
├── Dockerfile
├── .env.example
├── .gitignore
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # Root: fonts, theme, toast
│   │   ├── globals.css                         # Tailwind + design tokens
│   │   │
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   │
│   │   ├── (app)/
│   │   │   ├── layout.tsx                      # Sidebar + topbar
│   │   │   ├── campaigns/
│   │   │   │   ├── page.tsx                    # List (server component)
│   │   │   │   ├── new/page.tsx                # ★ Chat + form split
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx                # Dashboard
│   │   │   │       ├── edit/page.tsx           # Edit (chat+form)
│   │   │   │       └── loading.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── auth/request-code/route.ts
│   │       ├── auth/verify-code/route.ts
│   │       ├── chat/route.ts                   # Streaming
│   │       ├── campaigns/
│   │       │   ├── route.ts                    # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts                # GET, PATCH, DELETE
│   │       │       ├── publish/route.ts
│   │       │       ├── copy/regenerate/route.ts
│   │       │       └── simulate/route.ts
│   │       ├── creators/search/route.ts
│   │       ├── seed/route.ts                   # Dev only
│   │       └── health/route.ts
│   │
│   ├── components/
│   │   ├── ui/                                 # shadcn primitives
│   │   ├── shell/                              # sidebar, topbar, user-nav
│   │   ├── chat/
│   │   │   ├── chat-panel.tsx
│   │   │   ├── message-bubble.tsx
│   │   │   ├── message-input.tsx
│   │   │   ├── stage-progress.tsx
│   │   │   ├── reasoning-trace.tsx
│   │   │   ├── quick-prompts.tsx
│   │   │   └── widgets/
│   │   │       ├── issues-card.tsx
│   │   │       ├── estimate-card.tsx
│   │   │       └── copy-preview-card.tsx
│   │   ├── campaign-form/
│   │   │   ├── campaign-form.tsx
│   │   │   ├── basics-section.tsx
│   │   │   ├── eligibility-section.tsx
│   │   │   ├── reward-section.tsx
│   │   │   ├── budget-timeline-section.tsx
│   │   │   ├── content-section.tsx
│   │   │   ├── copy-section.tsx
│   │   │   ├── diff-highlight-input.tsx
│   │   │   └── action-bar.tsx
│   │   ├── campaign-list/
│   │   │   ├── campaigns-table.tsx
│   │   │   ├── status-badge.tsx
│   │   │   └── stats-strip.tsx
│   │   ├── campaign-dashboard/
│   │   │   ├── kpi-cards.tsx
│   │   │   ├── tier-donut.tsx
│   │   │   ├── region-bar.tsx
│   │   │   ├── timeline-gantt.tsx
│   │   │   ├── copy-tab.tsx
│   │   │   ├── matching-creators-table.tsx
│   │   │   └── audit-timeline.tsx
│   │   └── auth/
│   │       ├── email-form.tsx
│   │       └── otp-form.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts                        # Drizzle client
│   │   │   ├── schema.ts                       # All tables
│   │   │   └── queries.ts                      # Typed query helpers
│   │   ├── ai/
│   │   │   ├── provider.ts                     # buildModel() + mock fallback
│   │   │   ├── system-prompt.ts
│   │   │   ├── tools.ts                        # 5 tools
│   │   │   ├── copy-generator.ts               # generateObject for copy
│   │   │   └── mock-llm.ts                     # Deterministic fallback
│   │   ├── services/
│   │   │   ├── validator.ts                    # Business rules
│   │   │   ├── simulator.ts                    # Budget/reach/ROI
│   │   │   ├── campaigns.ts                    # CRUD
│   │   │   ├── copy.ts                         # Copy CRUD
│   │   │   └── audit.ts
│   │   ├── schemas/
│   │   │   ├── campaign-config.ts              # ★ Zod schemas (SSoT)
│   │   │   ├── copy.ts
│   │   │   └── api.ts
│   │   ├── auth/
│   │   │   ├── auth.ts                         # NextAuth config
│   │   │   └── otp.ts                          # Generate/consume codes
│   │   ├── store/
│   │   │   └── draft-store.ts                  # Zustand
│   │   ├── hooks/
│   │   │   ├── use-debounced-callback.ts
│   │   │   └── use-copy-flash.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   └── scripts/
│       ├── seed.ts                             # Faker-based 20k creators
│       └── create-demo-campaign.ts
│
├── public/
│   └── (logo, og image)
│
└── tests/
    └── simulator.test.ts                       # Vitest smoke
```

---

## 15. Development Milestones

**Deadline: Sept 7** | Feature complete by Sept 4, polish Sept 5–7.

### Week 1 — Foundation + Core Loop (Aug 26 – Sept 1)

| Day | Deliverable |
| --- | --- |
| **Day 1** | Project scaffold, deps install, Tailwind + shadcn setup, Drizzle schema + migration, Zod schemas |
| **Day 2** | Auth (NextAuth + OTP), login page, middleware, user auto-creation |
| **Day 3** | Seed script (20k creators), app shell (sidebar + topbar), campaign list page (server component) |
| **Day 4** | Chat + Form split-pane layout (static UI), chat panel with `useChat`, form with all sections |
| **Day 5** | `/api/chat` route handler with `streamText` + `set_config` tool, Zustand draft store, basic config→form sync |
| **Day 6** | Remaining tools: `run_validation`, `run_simulation`, `generate_copy`. End-to-end: describe campaign → see config + copy + estimate |
| **Day 7** | Buffer / polish day. Diff highlighting on form fields. Quick-prompt chips. Mock LLM fallback. |

### Week 2 — Dashboard + Polish (Sept 2 – Sept 4)

| Day | Deliverable |
| --- | --- |
| **Day 8** | Campaign detail/dashboard page: KPI cards, tier donut, region bar chart |
| **Day 9** | Copy tab (locale tabs, copy-to-clipboard, regenerate), matching creators table, audit log |
| **Day 10** | Publish flow + mock "live metrics", campaign edit page (reuse chat+form), settings page |
| **Day 11** | Validation issue cards in chat, estimate-summary card in chat, copy-preview card in chat |
| **Day 12** | Dark mode, loading skeletons, empty states, error boundaries, toast notifications |

### Week 3 — Demo Polish (Sept 5 – Sept 7)

| Day | Deliverable |
| --- | --- |
| **Sept 5** | End-to-end QA pass, fix bugs, confetti on publish, keyboard shortcuts (⌘K) |
| **Sept 6** | Record demo video, write README with screenshots, prepare Docker setup |
| **Sept 7** | Final polish, submit |

---

## 16. Demo Script (3-minute live demo)

```text
[0:00] "I'm going to create a TikTok Shop affiliate campaign from scratch."
       Open /campaigns/new. Empty chat + empty form side-by-side.

[0:05] Type: "Run a 7-day US-only video campaign for new beauty creators
       under 10k followers, tiered commission starting at 10%,
       $5,000 budget, launching next Monday"

[0:10] Watch the stage strip animate:
       Parsing ✓ → Config ✓ → Validating ✓ → Copy ✓ → Simulate ✓

[0:25] Form auto-fills on the right — every field populates with
       diff-highlight flash. Chat shows:
       "✅ Campaign configured! 4,230 US beauty nano/micro creators eligible.
        Projected reach: 1.2M impressions, cost: ~$4,850, ROI: 2.3x.
        Copy generated in EN and ES. ⚠️ Budget is tight — reserve only covers
        8% overage. Consider raising to $5,500."

[0:40] Click "Show reasoning" — see the AI's tool call trace.

[0:45] Type: "Add Indonesia and Thailand, make the tone playful,
       and regenerate copy"

[0:55] Form updates: regions add ID+TH, locale tabs add ID/TH,
       new copy appears. Chat: "Added ID+TH. 6,810 eligible creators
       now. ID copy uses 'Gaek!' CTA, TH uses 'มาสร้างกัน!' 😄"

[1:05] Manually tweak budget in the form to $3,000.
       Estimate card updates instantly.
       Chat doesn't interrupt — but the next AI turn respects the $3,000.

[1:10] Type: "Is $3,000 enough?"
       AI: "⚠️ At $3,000 with 6,810 eligible creators targeting 500,
           you can only offer free product (avg $6) + 5% commission.
           I'd suggest either: (a) reduce target to 200 creators, or
           (b) raise budget to $4,000. Want me to adjust?"

[1:25] "Reduce target to 200 and optimize for GMV."
       Form updates. New estimate appears.

[1:35] Switch to Copy tab. Show EN, ID, TH tabs. Copy-to-clipboard.

[1:40] Click "Validate" — green checkmark, no errors.

[1:45] Click "Publish" — confetti 🎉, redirect to dashboard.

[1:50] Dashboard shows: KPI cards, tier donut, region bar,
       timeline Gantt, matching creators table.

[2:00] "From natural language to a published, validated, multi-language
       campaign with budget simulation — in under 2 minutes.
       What used to take 30 minutes of form-filling now takes a conversation."
```

---

## 17. Stretch Features (if time permits)

| Feature | Effort | Impact | Priority |
| --- | --- | --- | --- |
| Confetti animation on publish | 1h | Wow factor | P0 |
| ⌘K command palette | 3h | Power-user feel | P1 |
| Campaign template library ("Flash Sale", "New Product Launch", "Creator Retention") | 4h | Reduces repetitive briefs | P1 |
| Side-by-side copy diff (before/after when regenerating) | 3h | Trust in AI edits | P2 |
| Export campaign config as JSON / PDF brief | 2h | Sharing with stakeholders | P2 |
| Voice input (Web Speech API) | 4h | Demo wow, not practical | P3 |
| Real-time collaboration cursor (yjs) | 8h | Overkill for hack | P4 |

---

## 18. UX Polish Details (for community vote)

- **Dark mode** with TikTok Shop purple-pink gradient accents (`#6938FF` → `#FE2C55`)
- **Loading skeletons** on every list/dashboard load
- **Empty states** with illustrations and CTAs ("Create your first campaign →")
- **Toast notifications** for save/publish/validation events
- **Smooth transitions** on form section expand/collapse
- **Responsive**: optimize for 1280px+ desktop (ops teams don't use mobile for this). Below 768px, stack chat above form.
- **Keyboard shortcuts**: ⌘K focus chat, ⌘S save draft, ⌘Enter publish
- **Confetti** on campaign publish (canvas-confetti, 2s burst)
- **Stage progress strip** with animated checkmarks
- **Diff flash** (CSS keyframe: yellow → transparent 1.2s) on form fields when AI updates them
