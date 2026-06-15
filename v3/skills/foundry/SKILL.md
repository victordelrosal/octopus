# Foundry Skill

**skill_id:** octopus/foundry
**activation:** `claude skill enable octopus/foundry`
**tier:** paid
**always_loaded:** false

**Use when:** "cycle hunt [niche]", "cycle harvest [product]", "cycle status",
"launch a micro-tool", "find a passive income opportunity", "ship a micro-tool this weekend",
"create a new venture", "use the venture metaskill". This is the paid vertical.

Foundry turns the Octopus five-agent stack into a constrained revenue engine: discover,
build, price, and ship single-page micro-tools for passive income.

One recipe. Two modes. One compounding intelligence loop.


## Always-loaded overview

### The one recipe: MICRO_TOOL

A single HTML file. Inline CSS and JS. No backend, no auth, no database, no framework.
Builds in under 4 hours. Priced $5 to $19 one-time via Lemon Squeezy.
Deployed to Cloudflare Pages. Distributed via tool-intent SEO.

If it cannot ship as a single static file, it is too complex for v1.

Fits the recipe: calculators, scorers, pass/fail checkers, generators with short outputs.

Does not fit: anything needing accounts, a database, OAuth, API keys from the user,
multi-page workflows, Chrome extensions, mobile apps, or integrations requiring support.

### Two modes

`cycle hunt [niche]`: discover and launch a new candidate.
- Phase 1: Yellow Researcher discovers 10 candidates, scores and falsifies.
- Phase 1.5: Chairman review (mandatory in first 10 cycles). You pick one or reject all.
- Phase 2: Red-Orange Designer creates a one-page spec.
- Phase 3: Blue Maker and Green Marketer run in parallel (build and copy).
- Phase 4: Launch (deploy gate required, community post for Chairman to send manually).
- Phase 5: Scheduled evaluation checks at Day 3, 7, 14, 30.

`cycle harvest [product]`: compound a winner.
- Sprint 1: SEO expansion (Researcher and Marketer).
- Sprint 2: Conversion optimization (Designer and Maker, one change at a time).
- Sprint 3: Variant expansion (conditional, only if the tool has more than 20 purchases).
- Sprint 4: Bundle or upsell (conditional, only if 2 or more products exist in the same niche).

`cycle status`: portfolio dashboard across all active products.

### Kill criteria (non-negotiable)

The system kills a candidate if:
- Day 7: page not indexed despite resubmission to Search Console.
- Day 14: zero visits.
- Day 30: fewer than 3 purchases (unless trend is clearly and measurably accelerating).
- Any time: support burden emerges (users emailing questions = landing page is failing).

Kill fast. Most candidates die in falsification. Most launches get killed by Day 30.
That is the design. The machine works because it runs cycles, not because any single cycle succeeds.

### The intelligence loop

Every cycle writes structured learnings to `.octopus/intelligence/`. The Researcher reads
all prior learnings before discovering candidates. By cycle 10, the system has data on what
converts, which queries drive traffic, and what price points work. Candidate quality improves
each cycle. This compounding effect is the real competitive advantage.

### Pricing tiers

- Base plugin (Octopus v3): free, open-source. Funnel for attention.
- Foundry skill (this): paid, approximately EUR 49 one-time. Aligns with the EUR 1-10k MRR
  stage (digital products and course).
- Cohort: "ship a micro-tool in a weekend" using Foundry as the spine. Productised
  consulting. Aligns with the EUR 10-50k MRR stage.

No build without a price tag (Forge canon, 2026-04-26).


## Before the first cycle: one-time setup required

Walk the user through this if not already complete:

1. Cloudflare account: create a free account, install Wrangler CLI (`npm install -g wrangler`),
   run `wrangler login`.
2. Lemon Squeezy account: create an account, create a Store, generate an API key under
   Settings > API.
3. Configure `.octopus/.env` (this file is gitignored):
   ```
   LEMONSQUEEZY_API_KEY=your_key_here
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   ```

Do not start a hunt cycle without confirming setup is complete.


## Loaded on demand when running a cycle

Read these files before executing any cycle command. Do not guess their contents.

Hunt pipeline (step-by-step phases, scoring model, falsification checklist, gate conditions):
`metaskills/venture/hunt-mode.md`

Harvest pipeline (SEO expansion, conversion optimization, variant creation, bundle):
`metaskills/venture/harvest-mode.md`

Product type registry (build constraints, monetization pattern, deployment, distribution,
evaluation timeline, kill criteria, queued recipes):
`metaskills/venture/product-types.md`

Venture-mode agent spawn templates (additions to base Octopus templates, not replacements):
`metaskills/venture/spawn-templates.md`

These files contain the full fixed recipe. The Manager executes them as-is. It does not
reason about the pipeline from scratch or improvise around the constraints.
