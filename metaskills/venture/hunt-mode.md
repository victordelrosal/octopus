# Hunt Mode — Fixed Commercial Recipe

> This is the step-by-step pipeline for discovering, building, and launching a new MICRO_TOOL candidate.
> The Purple Manager executes this as a fixed recipe. It does NOT reason about the pipeline from scratch.
> It follows these steps in order, checking gates between phases.

---

## Trigger

```
cycle hunt [niche]
```

Example: `cycle hunt "freelancers"`, `cycle hunt "job seekers"`, `cycle hunt "small business owners"`

If no niche is specified, the Manager checks `.octopus/intelligence/niche-scores.md` and selects the highest-performing niche from prior cycles. If no prior data exists, the Manager asks the Chairman to pick a niche.

---

## Phase 1: DISCOVER (Yellow Researcher)

**Duration target:** 30 to 60 minutes

**Spawn template addition:**
```
You are the Yellow Researcher agent in HUNT MODE.

ACTIVE RECIPE: MICRO_TOOL (single-page calculator/checker/generator)
TARGET NICHE: [niche from cycle command]

YOUR TASK: Find 10 candidate pain points in this niche that could be solved
by a single-page web tool. For each candidate, provide structured evidence.

RESEARCH METHOD:
1. Search for "[niche] frustrations site:reddit.com"
2. Search for "[niche] wish there was a tool"
3. Search for "[niche] annoying to calculate" / "[niche] tedious manual process"
4. For each pain point found, search for existing competing tools
5. For each competitor, visit their pricing page (WebFetch)
6. Search for "[tool type] free online" to estimate search intent

OUTPUT FORMAT: For each candidate, produce this JSON:
{
  "candidate": "descriptive name",
  "pain_description": "what the user is struggling with",
  "evidence_sources": ["url1", "url2"],
  "competitors": [{"name": "X", "price": "$Y/mo", "url": "..."}],
  "target_query": "the SEO query this tool would target",
  "one_sentence_value_prop": "what the tool does in one sentence"
}

Then score each candidate (see scoring model below).

CRITICAL HONESTY RULE: You are generating HYPOTHESES, not validated business plans.
You cannot verify actual revenue, precise search volume, or conversion rates.
Be honest about confidence levels. Flag where evidence is weak.
```

**Scoring model (weighted):**

| Factor | Weight | 1 (weak) | 3 (moderate) | 5 (strong) |
|--------|--------|----------|--------------|------------|
| Spending signal | x2 | No paid competitors found | Competitors exist but pricing unclear | Multiple competitors with visible pricing $10+ |
| Distribution feasibility | x2 | No obvious search query | Generic query, high competition | Specific tool-intent query with reasonable competition |
| Monetization simplicity | x2 | Unclear what to charge for | Value exists but hard to gate | Obvious free/paid split (limited vs full) |
| Build simplicity | x1.5 | Needs backend or complex logic | Moderate JS, doable in 4hrs | Simple input to output, 1-2 hours |
| Support burden (inverse) | x1.5 | Users will have questions | Some edge cases | Completely self-explanatory |
| Pain intensity | x1 | Mild inconvenience | Real frustration, posted about | Blocking pain, multiple threads |
| Demand signal | x1 | Few mentions | Recurring topic | Hundreds of complaints/requests |

**Maximum score:** 55 (all 5s with weights)
**Minimum threshold to proceed:** 30

**Falsification checklist (all must be TRUE):**
- [ ] Repeated pain: multiple independent sources mention this problem
- [ ] Existing spending: at least one paid competitor or adjacent paid product exists
- [ ] Fits MICRO_TOOL: solvable as single-page calculator/checker/generator
- [ ] Buildable under 4 hours: Maker can ship this as one HTML file
- [ ] Simple monetization: obvious free-limited / paid-full split
- [ ] Discoverable channel: a plausible tool-intent search query exists
- [ ] Near-zero support: self-service, no explanation needed beyond landing page
- [ ] One-sentence value prop: can be stated clearly in one sentence

**Any FALSE: KILL the candidate.**

**Phase 1 output:** Ranked opportunity ledger saved to `.octopus/venture/opportunities/[date]-[niche].json`

**Gate:** At least 1 candidate scores >= 30 AND passes all falsification checks. If zero survive, report to Chairman and suggest a different niche.

---

## Phase 1.5: CHAIRMAN REVIEW (mandatory in first 10 cycles)

**The Manager presents the top 3 surviving candidates to the Chairman with:**
- One-sentence value prop for each
- Score breakdown
- Confidence assessment (where is evidence strong vs weak?)
- The Manager's recommendation

**MANAGER HONESTY RULE:** Do not present scored candidates as validated opportunities. Present them as ranked hypotheses with explicit evidence strength. The Chairman makes the commercial judgment call. You provide honest signal.

**Chairman picks one or rejects all.**

After cycle 10, this step can become auto-approve if score > 35 AND the niche has prior successful launches.

---

## Phase 2: SPEC (Red-Orange Designer, ~30 min)

**Spawn template addition:**
```
You are the Red-Orange Designer agent in HUNT MODE.

APPROVED CANDIDATE: [from Phase 1.5]
RECIPE: MICRO_TOOL

YOUR TASK: Create a one-page design spec for this tool.

SPEC MUST INCLUDE:
1. Page layout (what's above the fold, what's below)
2. Input fields (what the user provides)
3. Output display (what the user sees)
4. Free limitation (what's gated: e.g., "shows 3 of 10 results")
5. Paid unlock (what full access includes)
6. Price recommendation ($5 to $19 one-time, justify the choice)
7. H1 / title tag / meta description (targeting the identified query)
8. FAQ section topics (3-5 long-tail keyword targets)

CONSTRAINTS:
- Single HTML page, inline CSS + JS
- No backend, no database, no auth
- Tool must be immediately usable above the fold
- Payment via Lemon Squeezy checkout URL (button below truncated results)
- Unlock via URL parameter from Lemon Squeezy success redirect (simplest path)

OUTPUT: design-spec.md saved to .octopus/venture/specs/
```

**Gate:** Spec is buildable in < 4 hours. If the Maker reviews and says no, send back to Designer with specific constraints.

---

## Phase 3: BUILD + COPY (Blue Maker + Green Marketer, parallel, ~2-3 hrs)

**Maker and Marketer run in parallel.** No dependency between them. Manager dispatches both simultaneously.

**Maker spawn template addition:**
```
You are the Blue Maker agent in HUNT MODE.

RECIPE: MICRO_TOOL
SPEC: [from Phase 2]

YOUR TASK: Build the tool as a single HTML file with inline CSS and JS.

BUILD RULES:
- ONE file: index.html (inline <style> and <script>)
- Zero npm dependencies. CDN libraries only if essential.
- Mobile-responsive. Works on phone and desktop.
- Semantic HTML. Visible focus states.

MONETIZATION IMPLEMENTATION (one pattern, no variations):
- User runs tool freely. Results are visibly truncated.
- Below truncated results: button "Unlock Full Results — $[X]"
- Button opens Lemon Squeezy checkout URL in new tab
- Lemon Squeezy redirects back with success parameter in URL
- JS reads URL param and shows full results for that session
- That's it. No accounts. No email. No custom billing code.

ALSO BUILD:
- sitemap.xml and robots.txt in deploy directory
- JSON-LD structured data (WebApplication type)

DEPLOY: wrangler pages deploy ./dist --project-name=[name]

OUTPUT: Deployed live URL + source files in .octopus/venture/builds/[name]/
```

**Marketer spawn template addition (runs parallel with Maker):**
```
You are the Green Marketer agent in HUNT MODE.

RECIPE: MICRO_TOOL
CANDIDATE: [from Phase 1.5]
DOMAIN CONTEXT: [injected from Researcher output: who complained, where,
  what language they used, what competitors they mentioned]

YOUR TASK: Prepare all distribution assets.

PRIMARY (SEO, this is the real distribution):
- Finalize H1, title tag, meta description (from Designer spec)
- Write FAQ section (5 questions targeting long-tail query variants)
- Write "How to use [tool]" section (natural language, keyword-rich)
- Write "Why this matters" section (speaks to the pain using language
  from actual user complaints found by Researcher)
- Suggest 3 internal link opportunities if other Octopus products exist

SECONDARY (one-shot community post):
- Write ONE Reddit/forum post for the community where pain was discovered
- Tone: helpful, not promotional. "I built this because I had the same problem."
- Do NOT post. Save to distribution-assets/ for Chairman review.

DO NOT:
- Write Twitter threads
- Plan Product Hunt launches
- Suggest paid advertising
- Create email sequences (no list exists)
- Suggest any distribution channel that requires an existing audience
- Use marketing jargon anywhere

OUTPUT: distribution-assets/ directory in .octopus/venture/builds/[name]/
```

**Gate:** Live URL returns 200. Lemon Squeezy checkout link is functional. Landing page loads in < 3 seconds. Tool works as specified.

---

## Phase 4: LAUNCH (~15 min)

**Manager actions:**
1. Verify live URL works
2. Submit URL to Google Search Console for indexing (if access configured)
3. If Chairman has approved the community post, flag for Chairman to post manually
4. Create launch record:

```json
// .octopus/venture/launches/[name].json
{
  "name": "tool-name",
  "niche": "job seekers",
  "url": "https://tool-name.pages.dev",
  "launched": "2026-03-11",
  "product_type": "MICRO_TOOL",
  "price": 9,
  "checkout_url": "https://lemonsqueezy.com/checkout/...",
  "target_query": "resume keyword checker free online",
  "score": 34,
  "eval_schedule": {
    "signal_check": "2026-03-14",
    "visibility_check": "2026-03-18",
    "funnel_diagnosis": "2026-03-25",
    "kill_or_harvest": "2026-04-10"
  }
}
```

---

## Phase 5: EVALUATE (scheduled checks)

**Day 3: Signal Check (Analyst agent, ~15 min):**
```
Check:
- Is the page indexed? (search "site:[url]")
- Any organic impressions? (Search Console if available)
- Community post engagement? (if posted)
- Any visits? (analytics if configured, or Cloudflare analytics)

Output: signal-check.json in .octopus/venture/evals/[name]/
Action: If not indexed, submit to Search Console again. No other action needed.
```

**Day 7: Visibility Check (Analyst agent, ~30 min):**
```
Check:
- Visits to page
- Tool completions (if trackable)
- Payment link clicks
- Any purchases
- Community post results

Diagnosis:
- No visits: SEO targeting failure or no demand. Consider title/query change.
- Visits, no tool use: UX problem. Page isn't compelling above fold.
- Tool use, no payment clicks: Limitation too generous or value unclear.
- Payment clicks, no purchase: Price too high or checkout friction.

Action: If diagnosed, one iteration is allowed. Flag to Chairman.
Output: visibility-check.json
```

**Day 14: Funnel Diagnosis (Analyst agent, ~30 min):**
```
Check all above metrics plus trend direction.

Diagnosis: identify weakest funnel step with evidence.
- If an iteration was made at Day 7, assess its impact.

Action: If fixable issue identified, one more iteration allowed. Flag to Chairman.
Output: funnel-diagnosis.json
```

**Day 30: Kill or Harvest (Analyst agent, ~30 min):**
```
Check all metrics plus:
- Total purchases
- Revenue
- Trend direction (improving, flat, declining)
- Comparison to kill criteria in product-types.md

Decision (exactly one):
- KILL: < 3 purchases or declining trend. Log to intelligence. Move on.
- ITERATE: Some signal but fixable issue identified. One more 14-day window (final chance).
- HARVEST: >= 3 purchases with positive trend. Switch to HARVEST MODE.

Output: verdict.json in .octopus/venture/evals/[name]/
Update: .octopus/intelligence/ files with learnings from this cycle.
```

---

## Intelligence Update (after every cycle, regardless of outcome)

**Append one entry to `.octopus/intelligence/observations.jsonl`:**

```json
{"cycle": 1, "date": "2026-03-11", "niche": "job seekers", "product": "resume-keyword-checker", "product_type": "MICRO_TOOL", "score_at_launch": 34, "outcome": "harvest", "days_to_first_visit": 2, "days_to_first_purchase": 8, "total_revenue_at_eval": 45, "price": 9, "target_query": "resume keyword checker free online", "primary_failure_mode": "none", "lesson": "Job seeker tools with clear before/after output convert well at $9"}
```

**Also update these prose files in `.octopus/intelligence/`:**

- **patterns.md** — what worked (if anything)
- **anti-patterns.md** — what failed and why
- **niche-scores.md** — updated niche performance data
- **channel-performance.md** — which queries/communities drove traffic
- **pricing-insights.md** — what price points were attempted and results

Format: semi-structured entries, not free prose:

```
## Cycle [N] — [date] — [niche] — [candidate name]
- Product type: MICRO_TOOL
- Score: [N]
- Outcome: KILL / ITERATE / HARVEST
- Days to first visit: [N]
- Days to first purchase: [N] or "none"
- Price: $[N]
- Target query: "[query]"
- Lesson: [one sentence]
```

The canonical source of truth is `observations.jsonl`. The prose files are human-readable summaries that the Researcher reads at the start of every future cycle.
