# Octopus Venture Engine

> The first Octopus metaskill. Turns Octopus into a constrained autonomous revenue engine.
> One recipe, two modes, one compounding intelligence loop.

---

## What this is

Five files that add a commercial venture capability to Octopus:

| File | Purpose |
|------|---------|
| `product-types.md` | Defines what Octopus is allowed to build, how it monetizes, distributes, and when it kills. v1 = one recipe only (MICRO_TOOL). |
| `hunt-mode.md` | Fixed pipeline for discovering and launching new candidates. 5 phases, hard gates, structured scoring. |
| `harvest-mode.md` | Fixed pipeline for compounding winners. SEO expansion, conversion optimization, variant creation, bundling. |
| `spawn-templates.md` | Revised agent templates for venture mode. Additions to existing Octopus contracts, not replacements. |
| `README.md` | This file. |

## What this is NOT

- Not a rewrite of Octopus core
- Not a new agent framework
- Not infrastructure (no database, no services, no npm)
- Not a general business platform

## Relationship to Octopus

**Octopus** is the operating system: 5 agents, contracts, handoffs, parallel/sequential/review flows, filesystem truth, context discipline.

**Venture** is a metaskill: a mission-specific overlay that adds doctrine, a workflow recipe, a scoring model, specialized files, constraints, and success metrics. It runs on top of Octopus without modifying the core.

Other metaskills could follow the same pattern: course creation, grant writing, content systems, client delivery. Each adds its own doctrine without bloating the OS.

---

## Philosophy

**One recipe.** v1 ships with MICRO_TOOL only: single-page web tools (calculators, checkers, generators). Earn the next recipe by proving this one generates revenue.

**Two modes.** Hunt mode finds and launches candidates. Harvest mode compounds winners. Both are fixed recipes: the Manager executes, it doesn't improvise.

**Honest research.** The Researcher generates evidence-ranked hypotheses, not validated business plans. It cannot verify private revenue, precise search volume, or conversion rates. Chairman review is mandatory in early cycles.

**Kill aggressively.** Most candidates die in falsification. Most launches get killed by Day 30. That's the design. The machine works because it runs cycles, not because any single cycle succeeds.

**Compound learnings.** Every cycle writes to `.octopus/intelligence/`. By cycle 10, the Researcher has structured data on what actually converts. That's the real competitive advantage.

---

## Why these specific constraints

**Why single-page HTML, not React/Next.js?**
A calculator doesn't need a framework. HTML/CSS/JS ships in one file, deploys instantly, loads fast, has zero build step. When the tool makes enough money to justify complexity, revisit.

**Why Lemon Squeezy, not Stripe?**
Stripe requires building a checkout flow. Lemon Squeezy gives you a hosted checkout URL. One link vs. custom billing code. For v1 micro-tools, externalized checkout is the right tradeoff.

**Why Cloudflare Pages, not Vercel/Netlify?**
Free tier with unlimited sites. Simple CLI deployment. Good performance. One less decision to make.

**Why SEO-first, not social?**
SEO compounds. Social posts die in hours. An agent cannot build you an audience, but it can build a page that ranks for a tool-intent query. That's the only distribution channel that works without an existing following.

**Why weighted scoring?**
Spending signal and distribution feasibility matter more than raw pain intensity. People complain about many things they won't pay to solve. The scoring overweights commercial viability, not emotional resonance.

**Why mandatory Chairman review?**
The Researcher generates hypotheses, not validated business plans. In early cycles, the Chairman's commercial intuition is the highest-value input. Auto-approval is earned after the scoring model proves it correlates with revenue.

**Why kill at Day 30?**
Long evaluation windows waste time. If a single-page tool hasn't shown payment intent in 30 days with SEO indexing and a community post, the hypothesis was wrong. Kill fast, learn, move on.

---

## Prerequisites (one-time setup)

Before running the first cycle:

### 1. Cloudflare account
- Create free account at cloudflare.com
- Install Wrangler CLI: `npm install -g wrangler`
- Run `wrangler login` to authenticate
- Deployment is to Cloudflare Pages (free tier, unlimited sites)

### 2. Lemon Squeezy account
- Create account at lemonsqueezy.com
- Create a Store
- Generate API key: Settings, API, Create Key

### 3. Configure Octopus

Create `.octopus/.env` (gitignored):
```
LEMONSQUEEZY_API_KEY=your_key_here
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### 4. Directory structure

Create these directories:
```
.octopus/
  venture/
    product-types.md      <- copy from this metaskill
    opportunities/        <- Researcher writes here
    specs/                <- Designer writes here
    builds/               <- Maker writes here
    launches/             <- launch records
    evals/                <- Analyst writes here
  intelligence/           <- compounding learnings
    observations.jsonl    <- canonical structured data (one line per eval)
    patterns.md           <- what converts
    anti-patterns.md      <- what fails
    niche-scores.md       <- niche performance
    channel-performance.md <- query/community traffic data
    pricing-insights.md   <- price point results
```

---

## Usage

### Run a hunt cycle
```
cycle hunt "freelancers"
```

The Manager follows hunt-mode.md step by step:
1. Researcher discovers 10 candidates, scores and falsifies
2. Chairman reviews top survivors and picks one
3. Designer creates spec
4. Maker builds + Marketer writes copy (parallel)
5. Deploy to Cloudflare Pages
6. Schedule evaluation checks (Day 3, 7, 14, 30)

### Check on active products
```
cycle status
```

### Run a harvest sprint on a winner
```
cycle harvest resume-keyword-checker
```

### The rhythm

```
Week 1:  Hunt: launch candidate A
Week 2:  Hunt: launch candidate B
Week 3:  Evaluate A and B: kill losers, harvest winners
Week 4:  Harvest winner(s) + hunt if capacity allows
Repeat.
```

---

## How the intelligence loop works

**Cycle 1:** Intelligence files are empty. Researcher works from scratch. Chairman review is essential.

**Cycle 5:** Intelligence contains: 3 kills with reasons, 1 harvest, pricing data from 4 launches, niche performance for 2-3 niches. Researcher reads all of this before discovering candidates. Quality of candidates improves.

**Cycle 10:** Intelligence contains: statistical patterns on what converts, which queries drive traffic, what price points work, which niches are exhausted, what failure modes to watch for. The system is measurably better at picking winners than it was at cycle 1.

**This is the money machine.** Not any single product. The compounding intelligence that makes each cycle more commercially effective than the last.

---

## Success metric

The venture engine is working when:
- At least 1 product has entered harvest mode after 5-10 hunt cycles
- Intelligence files contain structured learnings from kills and wins
- The Researcher's candidate quality is visibly improving (higher scores, more accurate predictions)
- Monthly passive revenue > $0 and growing

The venture engine has succeeded when:
- A portfolio of 3-5 micro-tools generates consistent monthly revenue
- New hunt cycles produce candidates faster and with higher hit rates
- The Chairman spends < 30 minutes per week on the entire operation

---

*Octopus Venture Engine by Victor del Rosal / fiveinnolabs / March 2026*
*First metaskill for Octopus: github.com/victordelrosal/octopus*
