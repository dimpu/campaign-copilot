# ARCHITECTURE.md — Campaign Copilot

> **Full-stack architecture reference** | Last updated: 2025-08-27
>
> Companion to `SPEC.md` (product/behaviour spec) and `AGENTS.md` (agent coding conventions).
> This document describes _how_ the system is built, not _what_ it should do.

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     BROWSER (Next.js Client)                      │
│                                                                  │
│  ┌──────────────────────┐   ┌──────────────────────────────────┐ │
│  │   ChatPanel          │   │   CampaignForm                   │ │
│  │   useChat (ai/react) │   │   react-hook-form + Zod          │ │
│  │   SSE via fetch()    │   │   watch() → Zustand              │ │
│  │   AI message → store │   │   store ← reset() → form         │ │
│  └────────┬─────────────┘   └───────────────┬──────────────────┘ │
│           │            Zustand Draft Store   │                    │
│           └──────────────┬──────────────────┘                    │
│                          │                                       │
├──────────────────────────┼───────────────────────────────────────┤
│               NEXT.JS SERVER (Node.js)                            │
│                          │                                       │
│  ┌───────────────────────┼───────────────────────────────────┐   │
│  │  /api/chat ──► streamText() ──► 5 AI tools                │   │
│  │  /api/campaigns ──► Drizzle queries                       │   │
│  │  /api/auth ──► NextAuth v5 (credentials + OTP)            │   │
│  └───────────────────────┼───────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────┼───────────────────────────────────┐   │
│  │  lib/services/  ──► validator.ts  (pure functions)        │   │
│  │                 ──► simulator.ts  (SQL + math)            │   │
│  │                 ──► campaigns.ts  (publish workflow)      │   │
│  │                 ──► copy.ts       (copy CRUD)             │   │
│  │                 ──► audit.ts      (audit log)             │   │
│  └───────────────────────┼───────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────┼───────────────────────────────────┐   │
│  │  lib/db/  ──► Drizzle ORM + better-sqlite3                │   │
│  │           ──► local.db  (20 000 synthetic creators)       │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **One Zod schema is the single source of truth** — `CampaignConfigSchema` drives LLM tool output, form validation, API request validation, and the DB JSON column.
2. **Chat and form share one Zustand store** — bidirectional sync without prop drilling.
3. **Deterministic logic stays in pure functions** — validator, simulator, and budget math live in `lib/services/` and are testable without DB or LLM mocks.
4. **LLM access goes through Vercel AI SDK tool calling** — `streamText({ tools, maxSteps: 8 })` lets the model plan its own tool sequence.
5. **Mock LLM fallback keeps the demo alive offline** — `LLM_MODE=mock` produces deterministic-but-plausible responses.

---

## 2. Directory Map

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root: fonts, theme, toasts
│   ├── globals.css               # Tailwind v4 + design tokens
│   ├── (auth)/login/             # Email + OTP login page
│   ├── (app)/                    # Authenticated shell
│   │   ├── layout.tsx            # Sidebar + topbar + SessionProvider
│   │   ├── campaigns/
│   │   │   ├── page.tsx          # List (server component)
│   │   │   ├── new/page.tsx      # ★ Split-pane chat + form
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Dashboard (server component)
│   │   │       └── edit/page.tsx # Edit (reuses chat+form)
│   │   └── settings/page.tsx     # Profile, LLM mode, dev tools
│   └── api/                      # Route Handlers (12 endpoints)
│       ├── auth/[...nextauth]/   # NextAuth handler
│       ├── auth/request-code/    # POST generate OTP
│       ├── auth/verify-code/     # POST verify OTP + signIn
│       ├── chat/                 # ★ POST SSE streaming (core AI loop)
│       ├── campaigns/            # GET list, POST create
│       ├── campaigns/[id]/       # GET, PATCH, DELETE
│       ├── campaigns/[id]/publish/     # POST publish
│       ├── campaigns/[id]/copy/regenerate/ # POST regenerate copy
│       ├── campaigns/[id]/simulate/      # POST run simulation
│       ├── creators/search/      # GET creator search
│       ├── seed/                 # POST re-seed DB (dev only)
│       └── health/               # GET liveness check
│
├── components/
│   ├── ui/                       # 15+ shadcn-style primitives
│   ├── shell/                    # sidebar, topbar, user-nav
│   ├── auth/                     # email-form, otp-form
│   ├── chat/                     # chat-panel, message-bubble, input, stage, reasoning, quick-prompts, widgets/
│   ├── campaign-form/            # campaign-form, 6 sections, diff-highlight, action-bar, estimate-card
│   ├── campaign-list/            # campaigns-table, status-badge, stats-strip
│   └── campaign-dashboard/       # kpi-cards, tier-donut, region-bar, timeline-gantt, copy-tab, matching-creators, audit-timeline
│
├── lib/
│   ├── db/                       # Drizzle client, schema.ts (8 tables), queries.ts (typed helpers)
│   ├── ai/                       # provider, system-prompt, tools (5 tools), mock-llm, copy-generator
│   ├── services/                 # validator, simulator, campaigns, copy, audit (pure business logic)
│   ├── schemas/                  # ★ campaign-config.ts (Zod SSoT), copy.ts, api.ts
│   ├── auth/                     # NextAuth config, otp.ts (generate/verify)
│   ├── store/draft-store.ts      # Zustand (only client store)
│   ├── hooks/                    # use-debounced-callback, use-copy-flash
│   ├── utils.ts                  # cn(), formatCurrency, formatNumber, slugify, generateId, now
│   └── constants.ts              # Enums, region/locale/category/tier lists, simulation defaults
│
├── scripts/
│   └── seed.ts                   # Deterministic 20k creator seed (faker seed 42)
│
└── tests/
    └── validator.test.ts         # 6 Vitest tests for business rules
```

---

## 3. Database Schema

**Engine**: SQLite via `better-sqlite3` + Drizzle ORM.  
**Dev file**: `local.db` (gitignored, created by `pnpm db:push`).  
**Prod target**: PostgreSQL (Drizzle supports both dialects).

### 3.1 Entity Relationship Diagram

```
users ──1:N──► campaigns ──1:N──► generated_copy
  │                 │
  │                 ├──1:N──► conversation_messages
  │                 │
  │                 └──1:N──► audit_log
  │
  └──1:N──► otp_codes

creator_profiles  (standalone, 20k seed rows, no FK)
```

### 3.2 Tables

| Table | Rows | Purpose |
|---|---|---|
| `users` | 1–N | Ops staff (demo user seeded) |
| `otp_codes` | transient | 6-digit OTPs, 10-min TTL, consumed flag |
| `campaigns` | 1–N | Core entity. `config` column is JSON — Zod-validated on write. |
| `generated_copy` | 0–N per campaign | One row per locale per campaign. Cascade delete. |
| `conversation_messages` | 0–N per campaign | Full chat history. `payload` column holds `{configPatch, stage, toolResults}`. |
| `creator_profiles` | 20 000 | Synthetic seed. Used by simulator for eligibility queries. |
| `audit_log` | 0–N per campaign | Immutable audit trail of all mutations. |

### 3.3 Key Indexes

- `creator_profiles(region, primaryCategory, followerTier)` — **hot path** for simulator eligibility `COUNT(*)` and `SELECT ... LIMIT 12`
- `creator_profiles.followerCount` — range queries (min/max followers)
- `creator_profiles.gmv90d` — sort by GMV for top-creator sample
- `campaigns.createdBy` — user's campaign list
- `campaigns.status` — filtered list views
- `generated_copy.campaignId` — copy lookup
- `conversation_messages.campaignId` — chat history

### 3.4 JSON Columns

Two columns store structured JSON as text (no native JSON type in SQLite):

| Column | Schema | Serialized by |
|---|---|---|
| `campaigns.config` | `CampaignConfig` (Zod) | `JSON.stringify()` on write, `JSON.parse()` on read |
| `campaigns.validationIssues` | `ValidationIssue[]` | `JSON.stringify()` |
| `campaigns.reasoningTrace` | `{step, input, output, ts}[]` | `JSON.stringify()` |
| `generated_copy.hashtags` | `string[]` | `JSON.stringify()` |
| `conversation_messages.payload` | `{configPatch?, stage?, toolResults?}` | `JSON.stringify()` |
| `creator_profiles.categories` | `string[]` | `JSON.stringify()` |
| `creator_profiles.preferredLanguages` | `string[]` | `JSON.stringify()` |
| `audit_log.delta` | arbitrary object | `JSON.stringify()` |

---

## 4. The Zod Single Source of Truth

`src/lib/schemas/campaign-config.ts` defines `CampaignConfigSchema` and all sub-schemas. This one file is the canonical shape for:

| Consumer | How |
|---|---|
| **LLM tool output** | `set_config` tool parameter is `CampaignConfigSchema.partial()` |
| **react-hook-form** | `zodResolver(CampaignConfigSchema)` in `CampaignForm` |
| **API validation** | `ChatRequestSchema`, `UpdateCampaignRequestSchema` in `schemas/api.ts` |
| **DB JSON column** | `JSON.parse(campaign.config)` typed as `CampaignConfig` |
| **Publish-time validation** | `validateCampaign(config: CampaignConfig)` |

### Sub-schemas

```
CampaignConfigSchema
├── EligibilitySchema    (regions, tiers, categories, filters)
├── RewardSchema         (type, flatFee, commission, freeProduct, bonus)
├── BudgetSchema         (totalBudget, targetCount, allocation, reserve)
├── TimelineSchema       (5 date fields)
├── ContentRequirementSchema (formats, hashtags, flags)
└── top-level: campaignName, taskType, productCategory, tone, targetLocales, etc.
```

### Key Enums

| Enum | Values |
|---|---|
| `Region` | US, GB, ID, TH, VN, MY, PH, BR, MX, SG |
| `Locale` | en, id, th, vi, ms, tl, es, pt-BR |
| `TaskType` | open_collab, targeted_invite, free_sample, commission_boost, hashtag_challenge, live_showcase, short_video_review |
| `FollowerTier` | nano, micro, mid, macro, mega |
| `CampaignStatus` | draft, validating, ready, published, paused, archived |

---

## 5. AI / LLM Pipeline

### 5.1 Dual-Mode Architecture

```
POST /api/chat
    │
    ├── LLM_MODE=mock or no API key?
    │       │
    │       └──► handleMockStream()
    │               ├── mockProcessMessage() parses keywords from user text
    │               ├── Builds deterministic config patch
    │               ├── Returns pre-computed tool results
    │               ├── Streams SSE chunks with simulated delays
    │               └── Saves everything to DB identically to real path
    │
    └── Has API key?
            │
            └──► handleRealStream()
                    ├── streamText({ model, system, tools, maxSteps: 8 })
                    ├── onStepFinish → stream tool results as SSE
                    ├── onFinish → save message + process side effects
                    └── mergeIntoDataStream() for SSE
```

### 5.2 The Five AI Tools

The model autonomously decides the tool-calling sequence. No hand-chaining.

| # | Tool | Trigger | Executor | Side Effects |
|---|---|---|---|---|
| 1 | `set_config` | User describes campaign | Merges partial config | Saved to DB via `onFinish` |
| 2 | `run_validation` | After config changes | `validateCampaign()` pure function | Issues returned in chat |
| 3 | `generate_copy` | After config is valid | Server-side `generateObject` / `getMockCopyForLocales()` | Copy saved to `generated_copy` table |
| 4 | `run_simulation` | Final step | `runSimulation()` — SQL query + math | Simulation results saved to campaign |
| 5 | `ask_user` | Missing critical info | Returns question + missing fields | Clarification shown in chat |

### 5.3 Tool Execution Flow

```
User: "US beauty nano creators, $5k budget, tiered commission"
    │
    ▼
Model calls set_config({ eligibility: { regions: ["US"], ... }, ... })
    │ tool returns { ok, merged, issues? }
    ▼
Model calls run_validation({ config })
    │ tool returns { ok, issues[], summary }
    ▼
Model calls generate_copy({ locales: ["en"], tone: "casual", ... })
    │ server-side: getMockCopyForLocales(["en"], "short_video_review")
    │ saves CopyVariant rows to generated_copy table
    ▼
Model calls run_simulation({ config })
    │ tool calls runSimulation(config) — pure function
    │ queries creator_profiles with eligibility filters
    │ computes reach, cost, CPA, ROI
    │ returns { estimatedReach: 1200000, estimatedCost: 4250, ... }
    ▼
Model writes summary in chat:
    "✅ Campaign configured! 4,230 eligible creators, projected 1.2M reach,
     $4,250 est. cost, 2.3x ROI. Copy generated in EN."
```

### 5.4 Mock LLM (Deterministic Fallback)

`src/lib/ai/mock-llm.ts` — `mockProcessMessage(userMessage, currentConfig?)`

Parses keywords from the user message:

| Keyword | Effect |
|---|---|
| "US", "ID", "TH", etc. | Sets `eligibility.regions` |
| "beauty", "fashion", "tech" | Sets `eligibility.categories` |
| "nano", "micro", "mid", "1k", "10k" | Sets `eligibility.followerTiers` |
| "$5000", "5k", "$3,000" | Sets `budget.totalBudgetUsd` |
| "commission", "flat fee", "free sample" | Sets `reward.type` |
| "video", "live" | Sets `taskType` and `contentRequirements.formats` |

Returns:
- `messages[]` — markdown chat response
- `toolCalls[]` — all 4 tool results (set_config, run_validation, generate_copy, run_simulation)
- `finalConfig` — fully merged campaign config
- `stageSequence[]` — `["parsing", "config-filling", "validating", "copy-gen", "estimating", "done"]`

### 5.5 Copy Generation

`src/lib/ai/copy-generator.ts` — `getMockCopyForLocales(locales, taskType)`

Pre-written templates for EN, ID, TH, VI. Each template:

```typescript
{
  locale: "en",
  subject: "🎥 Create & earn with us!",
  title: "Show off your style & get rewarded",
  body: "...",
  ctaText: "Apply Now",
  hashtags: ["#TikTokShop", "#CreatorCollab", "#GetPaid"],
  tone: "casual"
}
```

In real LLM mode, the `generate_copy` tool returns `_requiresRealLLM: true` and the route handler calls `generateObject()` with `MultiLangCopySchema`. The mock path bypasses this entirely.

---

## 6. Bidirectional Chat-Form Sync

### 6.1 The Zustand Draft Store

`src/lib/store/draft-store.ts` — the single source of client truth.

```typescript
interface DraftState {
  campaignId: string | null;
  config: CampaignConfig | null;       // The live draft
  issues: ValidationIssue[];           // From validator
  estimate: SimulationResult | null;   // From simulator
  stage: DraftStage;                   // "idle" → ... → "done"
  lastAiPatchAt: Record<string, number>; // Timestamps for diff-flash
  isLoading: boolean;

  mergeConfig(patch, source: "ai" | "user"): void;  // Deep merge
  // ... other setters, reset()
}
```

### 6.2 Sync Flow

```
┌─────────────────────────────────────────────────────────────┐
│  AI sends set_config patch                                  │
│       │                                                     │
│       ▼                                                     │
│  ChatPanel receives SSE tool-result event                   │
│       │                                                     │
│       ▼                                                     │
│  useDraftStore.mergeConfig(patch, "ai")                     │
│       │                                                     │
│       ├──► deepMergeConfig(current, patch)                  │
│       ├──► Records timestamps in lastAiPatchAt              │
│       └──► Updates config in store                          │
│               │                                             │
│               ▼                                             │
│  CampaignForm subscribes to store.config                    │
│       │                                                     │
│       ▼                                                     │
│  form.reset(mergedConfig) — react-hook-form updates         │
│       │                                                     │
│       ▼                                                     │
│  DiffHighlightInput reads lastAiPatchAt[fieldName]          │
│       │                                                     │
│       ▼                                                     │
│  CSS animation diff-flash (yellow → transparent, 1.2s)      │
│                                                             │
│  ───────────────────────────────────────────────────────    │
│                                                             │
│  User types in form                                         │
│       │                                                     │
│       ▼                                                     │
│  react-hook-form watch() fires                              │
│       │                                                     │
│       ▼                                                     │
│  useDraftStore.mergeConfig(watchedValues, "user")           │
│       │                                                     │
│       ▼                                                     │
│  Store updated (no timestamp — no flash)                    │
│       │                                                     │
│       ▼                                                     │
│  Next /api/chat call includes currentConfig from store      │
│       │                                                     │
│       ▼                                                     │
│  System prompt prepends "--- CURRENT DRAFT CONFIG ---"      │
│  AI respects user-typed values                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Deep Merge Strategy

`deepMergeConfig()` in the store:
- Top-level scalars: replace
- Nested objects (eligibility, reward, budget, etc.): shallow merge
- Arrays (regions, categories, tiers): replace entirely
- `Date` objects: replace

This ensures partial patches from the AI don't wipe out nested fields the AI didn't mention.

---

## 7. Validation Engine

`src/lib/services/validator.ts` — `validateCampaign(config: CampaignConfig): ValidationIssue[]`

Pure function. No DB access, no side effects. Returns a flat array of issues.

### 7.1 Rules

| Rule | Level | Code | Field |
|---|---|---|---|
| `applicationEnd > applicationStart` | error | `TIMELINE_APP_WINDOW` | `timeline.applicationEnd` |
| `contentDeadline >= applicationEnd` | warning | `TIMELINE_CONTENT_DEADLINE` | `timeline.contentDeadline` |
| `campaignEnd > goLiveDate` | error | `TIMELINE_CAMPAIGN_END` | `timeline.campaignEnd` |
| `goLiveDate > contentDeadline` | warning | `TIMELINE_GO_LIVE` | `timeline.goLiveDate` |
| `minReward × targetCount ≤ budget × (1 − reserve)` | error | `BUDGET_INSUFFICIENT` | `budget.totalBudgetUsd` |
| `budget < $50` | warning | `BUDGET_TOO_SMALL` | `budget.totalBudgetUsd` |
| `commissionRate > 30%` | warning | `COMMISSION_HIGH` | `reward.commissionRate` |
| Region has no matching locale | info | `REGION_LOCALE_MISMATCH` | `targetLocales` |
| `campaignName.length < 3` | error | `NAME_TOO_SHORT` | `campaignName` |
| `productCategory` is empty | error | `MISSING_CATEGORY` | `productCategory` |

### 7.2 Issue Shape

```typescript
interface ValidationIssue {
  level: "error" | "warning" | "info";
  code: string;          // Machine-readable, stable
  message: string;       // Human-readable
  field?: string;        // Dot-notation path to the offending field
  suggestion?: string;   // Actionable fix
}
```

---

## 8. Budget / Reach / ROI Simulator

`src/lib/services/simulator.ts` — `runSimulation(config: CampaignConfig): SimulationResult`

### 8.1 Algorithm

```
1. Build SQL WHERE clause from eligibility filters
   ├── regions IN (...)
   ├── followerTiers IN (...)
   ├── primaryCategory IN (...)
   ├── followerCount BETWEEN min AND max
   ├── engagementRate >= min
   ├── gmv90d >= min
   └── verified/affiliate flags

2. Query creator_profiles
   ├── COUNT(*) → eligibleCreatorCount
   └── SELECT ... ORDER BY gmv90d DESC LIMIT 12 → eligibleSample

3. Compute acceptance rate
   ├── Tier-based weights: nano=45%, micro=35%, mid=25%, macro=15%, mega=5%
   ├── Average across selected tiers
   └── Boost by up to 15% for high flat fees (>$500)

4. actualCreators = min(target, eligible × acceptanceRate)

5. Cost = Σ(reward costs) + reserve
   ├── flatFee × actualCreators
   ├── commissionRate × projectedGmvPerCreator × actualCreators
   ├── freeProductBudget × actualCreators
   └── performanceBonus × (actualCreators × 20%)

6. Reach = avgFollowers × actualCreators × 0.4 (impression ratio)

7. CPA = estimatedCost / (estimatedReach × 0.008 conversion rate)

8. ROI = (projectedGmv × 0.15 margin − cost) / cost
```

### 8.2 Constants

```typescript
const SIMULATION_DEFAULTS = {
  cpmLow: 5, cpmHigh: 25,
  commissionMin: 0.05, commissionMax: 0.25,
  conversionRate: 0.008,       // 0.8% of impressions convert
  marginRate: 0.15,            // 15% profit margin
  impressionRatio: 0.4,        // 40% of followers see content
  acceptanceRates: {
    nano: 0.45, micro: 0.35, mid: 0.25, macro: 0.15, mega: 0.05,
  },
};
```

### 8.3 Post-Simulation Warnings

The simulator also runs `validateCampaign()` and adds two simulation-specific warnings:

| Warning | Condition |
|---|---|
| `ELIGIBILITY_REACH_LOW` | `eligibleCreatorCount < targetCreatorCount` |
| `BUDGET_OVERRUN` | `estimatedCost > totalBudgetUsd` |

---

## 9. Auth Flow

### 9.1 Stack

- **NextAuth v5** (Auth.js) with `CredentialsProvider`
- **Email + 6-digit OTP** (mock SSO — no external identity provider)
- **JWT session strategy** (no DB sessions)

### 9.2 Login Flow

```
1. User enters email on /login
       │
       ▼
2. POST /api/auth/request-code { email }
       │
       ├── generateOtp(email) → 6-digit code, 10-min TTL
       ├── Insert into otp_codes table
       └── Return { ok: true, devCode? }  (devCode shown on screen in dev)
       │
       ▼
3. User enters 6-digit code
       │
       ▼
4. POST /api/auth/verify-code + signIn("credentials", { email, code })
       │
       ├── verifyOtp(email, code)
       │   ├── Look up otp_codes WHERE email, code, NOT consumed, NOT expired
       │   ├── Mark consumed
       │   └── Return true/false
       │
       ├── If valid: find or create user in users table
       │   └── Update lastLoginAt
       │
       └── Return JWT session → redirect to /campaigns
```

### 9.3 Session Shape

```typescript
session.user = {
  id: string;       // UUID from users table
  email: string;    // ByteDance email
  name: string;     // Display name
  role: "ops" | "admin";
}
```

### 9.4 Route Protection

- `(app)/layout.tsx` wraps `SessionProvider` from next-auth
- `(auth)/login/page.tsx` is the only unauthenticated page
- API routes call `auth()` and return 401 if no session

---

## 10. API Route Reference

### 10.1 Auth

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | No | NextAuth handler |
| POST | `/api/auth/request-code` | No | Generate OTP, return `{devCode}` |
| POST | `/api/auth/verify-code` | No | Verify OTP + signIn |

### 10.2 Campaigns

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/campaigns` | Yes | List with `?status=&q=&page=&pageSize=` |
| POST | `/api/campaigns` | Yes | Create from `{description, config?}` |
| GET | `/api/campaigns/[id]` | Yes | Get campaign + copy + messages |
| PATCH | `/api/campaigns/[id]` | Yes | Update config/name/status |
| DELETE | `/api/campaigns/[id]` | Yes | Delete campaign (cascade) |
| POST | `/api/campaigns/[id]/publish` | Yes | Validate + publish + audit log |
| POST | `/api/campaigns/[id]/copy/regenerate` | Yes | Regenerate copy for `{locales[], tone?}` |
| POST | `/api/campaigns/[id]/simulate` | Yes | Run simulation, update campaign stats |

### 10.3 AI

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/chat` | Yes | **SSE streaming** — `{campaignId?, messages, currentConfig}` |

### 10.4 Utility

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/creators/search` | Yes | Search creators `?region=&category=&tier=&q=&limit=` |
| POST | `/api/seed` | Yes | Dev only — re-seed 20k creators |
| GET | `/api/health` | Yes | Liveness check + uptime |

---

## 11. Frontend Component Tree

### 11.1 The Signature Split-Pane (`/campaigns/new`)

```
NewCampaignPage (client)
├── Top bar (back button, title)
└── PanelGroup (react-resizable-panels)
    ├── Panel (left, 45%)
    │   └── ChatPanel
    │       ├── StageProgress (animated strip)
    │       ├── MessageBubble[] (user right, assistant left)
    │       │   ├── react-markdown (markdown rendering)
    │       │   ├── ReasoningTrace (collapsible)
    │       │   └── Widgets:
    │       │       ├── IssuesCard (red/yellow/blue)
    │       │       ├── EstimateCard (5 KPI mini-cards)
    │       │       └── CopyPreviewCard (tabbed by locale)
    │       ├── QuickPrompts (4 prompt chips)
    │       └── MessageInput (autosizing textarea, ⌘K)
    │
    ├── PanelResizeHandle (1px, gradient on hover)
    │
    └── Panel (right, 55%)
        └── CampaignForm
            ├── BasicsSection (name, taskType, category, brand, objective)
            ├── EligibilitySection (regions, categories, tiers, filters)
            ├── RewardSection (type, flatFee, commission, freeProduct, bonus)
            ├── BudgetTimelineSection (budget, target, allocation, 5 dates)
            ├── ContentSection (formats, hashtags, flags)
            ├── CopySection (locales, tone)
            │
            ├── EstimateCard (sticky, updates in real-time)
            └── ActionBar (Save Draft, Validate, Publish)
```

### 11.2 Campaign Dashboard (`/campaigns/[id]`)

```
CampaignDetailPage (server component)
├── Header (name, status, created date, Edit button)
├── KpiCards (6 cards: eligible, reach, cost, CPA, ROI, budget)
├── Charts row (3 cards)
│   ├── TierDonut (recharts PieChart)
│   ├── RegionBar (recharts BarChart)
│   └── TimelineGantt (custom CSS bar chart)
└── DashboardTabs
    ├── CopyTab (tabbed by locale, copy-to-clipboard)
    ├── MatchingCreatorsTable (avatar, handle, followers, GMV, engagement)
    └── AuditTimeline (vertical timeline with action icons)
```

### 11.3 Campaign List (`/campaigns`)

```
CampaignListPage (server component)
├── Header ("Campaigns" + "New Campaign" button)
├── StatsStrip (4 cards: total, draft, published, active)
├── Search + status filter chips
└── CampaignsTable (sortable, clickable rows → /campaigns/[id])
    └── StatusBadge (color-coded pill)
```

---

## 12. State Management Strategy

| State | Where | Why |
|---|---|---|
| **Draft campaign config** | Zustand `useDraftStore` | Shared between chat and form, bidirectional sync |
| **Form field values** | react-hook-form `useForm()` | Performance (uncontrolled), Zod validation |
| **Chat messages** | `useChat()` from `ai/react` | SSE streaming, auto-scroll, loading state |
| **Auth session** | NextAuth `SessionProvider` | JWT, available server-side via `auth()` |
| **UI state** (theme, sidebar) | next-themes + local state | Not shared, no need for global store |
| **Route params** | Next.js `useParams()` / `params` | Server Components access params directly |

### No Prop Drilling

- Zustand store is the only cross-component state channel
- No Redux, no global Context API (except `SessionProvider` and `FormProvider`)
- `FormProvider` from react-hook-form is scoped to the form component tree

---

## 13. Streaming Architecture

### 13.1 SSE Protocol

The `/api/chat` endpoint uses Vercel AI SDK's `createDataStreamResponse` which produces SSE events:

```
data: {"type":"text-delta","textDelta":"✅ **Campaign "}
data: {"type":"text-delta","textDelta":"configured!** Here's "}
data: {"type":"tool-result","toolCallId":"...","toolName":"set_config","result":{...}}
data: {"type":"text-delta","textDelta":"what I've set up:\n\n"}
data: {"type":"finish","finishReason":"stop"}
```

### 13.2 Client-Side Consumption

`useChat()` from `ai/react` handles:
- SSE event parsing
- Message accumulation
- Loading/error state
- `body` — sends `currentConfig` from Zustand on each request

### 13.3 Mock Mode Streaming

`handleMockStream()` simulates the same SSE protocol:
- Writes stage markers with 150ms delays
- Writes tool results with 100ms delays
- Writes text deltas in 40-character chunks with 30ms delays
- Saves everything to DB identically to the real path

The client cannot distinguish mock from real — the streaming UX is identical.

---

## 14. Seed Data Strategy

### 14.1 Deterministic Seed

`src/scripts/seed.ts` — `faker.seed(42)` ensures every run produces identical data.

Run via: `pnpm db:seed` (or `POST /api/seed` in dev)

### 14.2 Creator Distribution

| Region | Share | Languages |
|---|---|---|
| ID | 25% | id, en |
| US | 15% | en |
| TH | 12% | th |
| VN | 12% | vi |
| BR | 10% | pt-BR |
| MX | 8% | es |
| MY | 6% | ms, en |
| PH | 6% | tl, en |
| GB | 4% | en |
| SG | 2% | en |

| Tier | Share | Follower Range | Engagement Rate |
|---|---|---|---|
| Nano | 50% | 1K–10K | 3–10% |
| Micro | 28% | 10K–50K | 2–7% |
| Mid | 14% | 50K–200K | 1.5–5% |
| Macro | 6% | 200K–1M | 1–3% |
| Mega | 2% | 1M–5M | 0.5–2% |

| Category | Share |
|---|---|
| Fashion | 22% |
| Beauty | 18% |
| Food | 13% |
| Tech | 10% |
| Home | 9% |
| Fitness | 8% |
| Parenting | 7% |
| Gaming | 6% |
| Pets | 4% |
| Automotive | 3% |

### 14.3 Data Characteristics

- **Engagement rate**: inversely correlated with follower count (Beta distribution noise)
- **GMV 90d**: log-normal, scaled by tier (nano ~$200, mega ~$80k)
- **Avg views**: 5–40% of follower count
- **AOV**: $8–$80
- **Past campaigns**: 0–15, 70% have no `lastCampaignAt`
- **Verified**: 15% of creators
- **Affiliate**: 90% of creators
- **Languages**: 1–2 per creator based on region

---

## 15. Styling System

### 15.1 Design Tokens

```css
@theme {
  --color-primary: #6938FF;        /* TikTok Shop purple */
  --color-accent: #FE2C55;         /* TikTok Shop pink */
  --color-bg-dark: #0a0a0f;        /* Page background */
  --color-bg-card: #14141f;        /* Card/surface background */
  --color-bg-card-hover: #1a1a2e;  /* Hover state */
  --color-border: #2a2a3a;         /* Borders, dividers */
  --color-text-primary: #ffffff;   /* Primary text */
  --color-text-secondary: #9ca3af; /* Secondary text */
  --color-text-muted: #6b7280;     /* Muted/placeholder text */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

### 15.2 Utility Classes

| Class | Effect |
|---|---|
| `gradient-primary` | Linear gradient `#6938FF → #FE2C55` background |
| `gradient-primary-text` | Gradient text (clipped to text) |
| `diff-flash` | CSS animation: yellow highlight → transparent, 1.2s |

### 15.3 Rules

- **Tailwind v4** with `@import "tailwindcss"` in `globals.css`
- **No plain CSS files** outside `globals.css`
- **No inline `style` attributes** unless dynamic values (e.g. runtime measurements)
- **`cn()` utility** from `@/lib/utils` for conditional classes
- **Dark mode only** (optimized for demo; light mode is stretch)

---

## 16. Build & Deploy

### 16.1 Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server (port 3000) |
| `pnpm build` | Production build → `.next/` |
| `pnpm start` | Run production build |
| `pnpm db:push` | Push Drizzle schema to `local.db` |
| `pnpm db:seed` | Seed 20 000 creators + demo user |
| `pnpm test` | Vitest (6 tests) |
| `pnpm lint` | ESLint |

### 16.2 Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | No | `file:./local.db` | SQLite file path |
| `OPENAI_API_KEY` | No | — | Real LLM; if unset → mock mode |
| `LLM_MODE` | No | — | Set to `mock` for offline demo |
| `AUTH_SECRET` | Yes | — | NextAuth JWT signing secret |
| `AUTH_URL` | No | `http://localhost:3000` | NextAuth base URL |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Public app URL |

### 16.3 Offline Demo Mode

```bash
# .env.local
LLM_MODE=mock
DATABASE_URL=file:./local.db

pnpm db:push && pnpm db:seed && pnpm dev
```

All AI features work deterministically without any network access. The mock LLM parses keywords from user messages and produces the same streaming SSE experience as the real LLM.

---

## 17. Key Design Decisions

| Decision | Rationale |
|---|---|
| **SQLite for dev, not PostgreSQL** | Zero infra. File in repo (gitignored). Drizzle supports both, so migration is a config change. |
| **No LangChain** | Vercel AI SDK's `streamText` + tool calling is simpler and sufficient. No chain abstraction needed. |
| **No tRPC** | Route Handlers are simpler for this scale. Shared types via Zod imports achieve the same end-to-end safety. |
| **No Redux** | Zustand is 1 KB, no boilerplate. One store is enough. |
| **No CSS modules** | Tailwind v4 utility classes cover everything. `globals.css` is only for theme tokens and animation keyframes. |
| **Mock LLM is not an afterthought** | Built from day one. Both paths share the same SSE protocol and DB persistence. Demo day must work offline. |
| **JSON columns in SQLite** | No native JSON type. `JSON.stringify()` on write, `JSON.parse()` on read. Acceptable for a hackathon; migrate to PostgreSQL `jsonb` for production. |
| **Deterministic seed** | `faker.seed(42)` ensures every dev has the same 20 000 creators. Makes simulation results reproducible. |

---

## 18. File Count & Metrics

| Category | Files | Lines (approx.) |
|---|---|---|
| App Router (pages + API) | 20 | ~2 800 |
| UI Components | 15 | ~1 200 |
| Feature Components | 30 | ~9 000 |
| Lib (DB, AI, services, schemas, auth, store, hooks, utils) | 21 | ~5 500 |
| Scripts | 1 | ~200 |
| Tests | 1 | ~90 |
| Config files | 7 | ~100 |
| **Total** | **95** | **~18 900** |

---

## 19. Testing Strategy

### 19.1 What's Tested

| Layer | Tool | Coverage |
|---|---|---|
| `validator.ts` | Vitest | 6 tests — valid config, missing name, invalid timeline, budget insufficient, high commission |
| `simulator.ts` | (planned) | Budget math, acceptance rate, reach/ROI formulas |
| `mock-llm.ts` | (planned) | Keyword parsing, config patch generation |

### 19.2 What's NOT Tested (by design)

- **React components** — Demo-day polish, not spec-grade. Manual walkthrough of the demo script (SPEC §16) is the acceptance test.
- **API routes** — Covered by the manual demo walkthrough and `pnpm build` type-checking.
- **Real LLM integration** — Tested manually with `OPENAI_API_KEY`. Mock mode is the programmatic fallback.

### 19.3 Pre-Ship Checklist

```bash
pnpm test          # All tests pass
pnpm build         # Zero type errors, zero lint errors
pnpm db:push       # Schema is in sync
pnpm db:seed       # 20 000 creators seeded
# Manual: walk through SPEC §16 demo script with LLM_MODE=mock
```