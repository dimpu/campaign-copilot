---
name: frontend-design
description: >
  Guidance for distinctive, intentional visual design when building new UI or reshaping existing UI
  in Campaign Copilot. Helps with aesthetic direction, typography, layout, and making choices that
  feel crafted rather than templated. Use whenever designing new components, pages, sections, or
  polishing existing UI — especially hero areas, empty states, dashboards, and the chat/form
  split-pane. Triggers on: design this, make it look good, polish the UI, build a [component] page,
  design system, visual design, improve the aesthetics, hero section, landing page, dashboard layout.
---

# Frontend Design (Campaign Copilot)

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. The product is **Campaign Copilot** — an AI-powered TikTok Shop affiliate campaign builder. The brand palette is anchored in TikTok Shop's purple-pink gradient (`#6938FF → #FE2C55`), the UI is built with **shadcn/ui + Radix + Tailwind CSS v4**, and the target user is an ops professional on desktop (≥768px). This skill augments — never overrides — the rules in `AGENTS.md` and `SPEC.md`.

## Ground it in the subject

Before designing, state (in your thinking, not necessarily to the user):

1. **The concrete subject**: what screen/component is this, and what single job does it do for an ops user?
2. **The audience**: TikTok Shop campaign managers — time-pressured, data-literate, likely switching between multiple tabs.
3. **The context**: where does this sit in the flow (chat → form → dashboard → publish)? What did the user just see, and what do they do next?

Campaign Copilot's own world — affiliate creators, TikTok's bold visual language, live campaigns, budget math, AI streaming, confetti moments — is where distinctive choices come from. Build with real content (sample campaign data, real creator tiers, actual KPI numbers from the simulator) throughout, never lorem ipsum.

## Non-negotiable tech constraints (from AGENTS.md)

- **Tailwind CSS v4 only.** No plain CSS, no CSS modules, no styled-components, no emotion, no `.css` files beyond `src/app/globals.css`.
- **Use semantic theme tokens**, never raw hex in class names: `bg-primary`, `text-accent-pink`, `bg-gradient-primary`, etc. The TikTok brand palette is already defined in `globals.css` — reference it.
- **shadcn/ui + Radix + lucide-react** is the component stack. Wrap/compose shadcn primitives; don't reinvent buttons, dialogs, dropdowns from scratch.
- **Dark mode must work.** All designs should look intentional in both light and dark themes via `dark:` variants.
- **Responsive down to ~768px only.** Desktop-first; mobile beyond basic stacking is not a priority.
- **`cn()` from `@/lib/utils`** is how you compose conditional classes.

## Design principles

**The hero is a thesis.** Open every major surface with the most characteristic thing in that flow: for the new-campaign page it's the split-pane chat+form in medias res; for the dashboard it's a KPI that immediately tells you whether the campaign will perform. A big number + small label + gradient accent is the template answer — only use it if that's truly the best option (and for the dashboard KPIs, it usually is, but earn it with a subtle signature twist).

**Typography carries personality.** The project uses a modern sans stack; use weights and tracking deliberately. Display moments (hero headlines, stat numbers) should feel confident and tight; body copy should breathe at comfortable line-heights. Don't reach for a serif or a display font without checking first — this is a professional ops tool, not a marketing site. Make type treatment a memorable part of the design through weight contrast, size, and spacing, not through exotic families.

**Structure is information.** Eyebrows, dividers, numbered markers, and badges should encode something true about the content. The campaign form already uses numbered stages (Setup → Budget → Creators → Copy → Review) — respect that sequence; don't add arbitrary `01 / 02 / 03` decoration on content that isn't actually sequential. Section dividers should separate logical groups, not just fill space.

**Leverage motion deliberately.** AI streaming is the product's signature motion — lean into that. Use:
- Diff-flash on AI-updated form fields (already specified in AGENTS.md).
- Stage-progress strip advancing as tools run.
- Confetti on publish.
- Subtle hover/active micro-interactions on buttons, table rows, and KPI cards.
- Respect `prefers-reduced-motion` — gate anything decorative behind it.

One orchestrated moment beats scattered effects. The streaming/tool-calling sequence is the core animation story of the product; make it feel satisfying and orchestrated, not noisy.

**Match complexity to the vision.** The split-pane chat+form should feel dense but legible (ops users scan quickly); the dashboard should feel celebratory and confident (this is the payoff moment). Minimalist directions need precision in spacing and alignment; data-heavy views need clear hierarchy and breathing room. Elegance is executing the chosen vision well.

**Written content is design material.** Copy in the UI is never filler:
- Name things by what the user controls, never by how the system is built.
- Use active, specific labels: "Publish campaign", not "Submit". An action keeps the same name through its whole flow.
- Errors don't apologize and are never vague — say what went wrong and how to fix it.
- Empty states are invitations to act (e.g., "Start by describing your campaign — e.g., 'Run a $5k US beauty push with micro-creators for 2 weeks'").
- Keep the register conversational but professional — ops users, not consumers.

## Process: brainstorm → critique → build → critique

1. **Plan in your thinking first.** Before writing code, briefly articulate:
   - **Palette**: which theme tokens, how they're used (primary gradient for CTAs/signature moments, neutrals for surfaces, accent pink for highlights/validation).
   - **Type hierarchy**: what sizes/weights for the H1, section heads, body, captions, data numerals.
   - **Layout concept**: spacing rhythm (pick a consistent scale — multiples of 4/8), grid, container widths, gutters. Include a quick ASCII wireframe if non-trivial.
   - **Signature**: the single unique element this view will be remembered for (e.g., the streaming stage-progress strip, a glowing live-AI indicator, the KPI donut with tiered breakdown).
2. **Self-critique the plan.** Is any element just the generic Tailwind/shadcn default (centered max-w-2xl hero, muted gray card, rounded-lg shadow)? Is it here because it fits this specific brief, or because it's what gets generated by default? Revise the default parts. **Within this project, the TikTok purple-pink gradient should be used sparingly and with intent** — if every surface is gradient-drenched, nothing stands out.
3. **Build, following the plan exactly.** Derive every color and spacing decision from the plan. Don't improvise ad-hoc values.
4. **Critique the result.** Before declaring done, mentally (or via screenshot if the environment supports it):
   - Scan at 200ms — what's the first thing you see? Is it the right thing?
   - Check spacing rhythm — do elements align to a consistent scale?
   - Check dark mode — does it hold up, or did you ship light-only colors?
   - Cut one thing. Chanel's rule: before you leave the mirror, remove one accessory. If there are three decorative elements, ask whether two would be stronger.

## Restraint

Spend your boldness in **one place per view**. The campaign builder's signature is the live-updating form during streaming; the dashboard's signature is the confetti payoff and the tier donut; the list view's signature is the status pill + progress bar. Keep everything else quiet, disciplined, and in service of the ops workflow.

Never sacrifice the quality floor to chase flair:
- Visible keyboard focus rings on every interactive element.
- `prefers-reduced-motion: reduce` respected for all non-essential motion.
- Text meets WCAG AA contrast in both themes.
- Tables and dense data views have comfortable hit targets (≥32px row height) and clear alignment (numbers right-aligned, text left-aligned).

## Common pitfalls to avoid in this codebase

- ❌ Hardcoding hex colors in className (use theme tokens).
- ❌ Adding new `.css` files or inline `<style>` blocks.
- ❌ Wrapping shadcn primitives unnecessarily — prefer composing them directly.
- ❌ Gradient-bathing every surface (reserve the primary gradient for CTAs, brand moments, and the signature AI streaming indicator).
- ❌ Over-animating: the AI streaming is already a motion-rich experience; don't compete with it on every card hover.
- ❌ Ignoring dark mode because "it looks fine in light" — test both.
- ❌ Using lorem ipsum — seed with real campaign/creator/copy data.
- ❌ Introducing new third-party UI libraries — shadcn/Radix/lucide is the stack.

## Remember

The demo script (SPEC §16) runs through: login → new campaign (chat fills form) → validate → generate copy → simulate → dashboard → publish → confetti. Any design work that lands on this path should prioritize **reliability and polish on that happy path**. It's better for one moment to feel truly crafted than for every surface to have a half-baked flourish.
