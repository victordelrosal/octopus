# Harvest Mode — Fixed Recipe for Compounding Winners

> A product enters Harvest Mode when it reaches >= 3 purchases with a positive trend (per kill criteria in product-types.md).
> Harvest Mode is about compounding a working asset, NOT building new things.
> The Manager switches from hunt to harvest for this specific product.

---

## Trigger

```
cycle harvest [product-name]
```

Example: `cycle harvest resume-keyword-checker`

The Manager reads the product's launch record and all evaluation data from `.octopus/venture/evals/[name]/`.

---

## Harvest Mode Principles

1. **Do not redesign.** The product is working. Resist the urge to rebuild.
2. **Do not add features.** Features add support burden. Improve what exists.
3. **Compound the distribution.** More keywords, better page, stronger SEO.
4. **Improve the conversion funnel.** More tool completions, more payment clicks, more purchases.
5. **One change at a time.** Every change must be measurable. No changes "because it seems better."
6. **Do not change the monetization pattern.** Lemon Squeezy checkout with truncated-to-full unlock. That's it.

---

## Harvest Sprint 1: SEO Expansion (Researcher + Marketer, ~2 hrs)

**Researcher task:**
```
The tool [name] is live at [url] and generating purchases.
Target query: [original query]

YOUR TASK: Find adjacent keyword opportunities.

1. Search for variations of the original query:
   - "[tool type] free"
   - "[tool type] online"
   - "[related task] tool"
   - "[audience] [task] calculator"
   - "how to [task the tool solves]"
   - "[competitor name] alternative free"

2. For each promising query, assess:
   - Is it distinct enough to warrant content? (not just a synonym)
   - Does it represent a different user intent?
   - Can the existing tool serve this query, or does the page need a new section?

OUTPUT: keyword-expansion.md with ranked list of new query targets
```

**Marketer task (after Researcher):**
```
Based on keyword-expansion.md, update the landing page:

1. Add FAQ entries targeting new long-tail queries
2. Add "Use Cases" section if different audiences exist
3. Add "How [tool] helps with [new query intent]" paragraphs
4. Update meta description if a broader value prop is clearer
5. Add comparison content if "[competitor] alternative" is viable
6. Ensure every new section uses natural language, not keyword stuffing

DO NOT:
- Change the H1 (it targets the primary query)
- Move the tool below the fold
- Add new pages (keep it single-page for now)
- Change the price or checkout flow
- Change the monetization pattern

OUTPUT: Updated index.html with new content sections
```

**Gate:** Redeploy. Verify page still loads < 3 seconds with new content.

---

## Harvest Sprint 2: Conversion Optimization (Designer + Maker, ~2 hrs)

**Designer task:**
```
The tool [name] has [N] visits, [M] tool completions, [P] payment clicks, [Q] purchases.

Conversion funnel:
- Visit to Tool completion: [M/N]%
- Tool completion to Payment click: [P/M]%
- Payment click to Purchase: [Q/P]%

YOUR TASK: Identify the weakest step and propose ONE change to improve it.

IF Visit to Completion is low:
- Is the tool visible above the fold?
- Is the input clear? Does the user know what to type/paste?
- Is there a visible example or demo state?

IF Completion to Payment click is low:
- Is the free limitation visible and obvious?
- Does the user see enough value to want more?
- Is the unlock offer clear? ("Get full results for $X")
- Is the payment button prominent?

IF Payment click to Purchase is low:
- Is the price right? (try $5 if currently $15, or vice versa)
- Is there a trust signal? (what they get, instant access, no account needed)
- Is checkout friction too high?

PROPOSE: One specific change. Not three. Not a redesign. One change.
OUTPUT: harvest-change-spec.md
```

**Maker task (after Designer):**
```
Implement the ONE change from harvest-change-spec.md.
Do not change anything else.
Redeploy.
```

**Gate:** Change is live. Set 7-day measurement window. Compare same metrics.

---

## Harvest Sprint 3: Variant Expansion (conditional, Researcher + Maker, ~3 hrs)

**Only if the tool has > 20 purchases and the niche shows depth.**

**Researcher task:**
```
The tool [name] is working in [niche].

YOUR TASK: Identify 1-2 closely related tool variants that serve the same
audience but address an adjacent task.

Example: If the winning tool is "Resume Keyword Checker":
- "Cover Letter Tone Analyzer"
- "LinkedIn Profile Optimizer"
- "Interview Question Generator for [job title]"

Each variant must:
- Be buildable as a MICRO_TOOL (same constraints)
- Serve the same audience (can cross-link)
- Have its own tool-intent search query
- NOT cannibalize the original tool's traffic

OUTPUT: variant-candidates.md with scoring (same model as hunt mode)
```

**If a variant scores >= 30:** Treat it as a new hunt-mode candidate but with a head start: it can link to/from the existing winner. The Chairman decides whether to run a full hunt cycle or an abbreviated build.

---

## Harvest Sprint 4: Bundle / Upsell (conditional, Designer + Marketer, ~2 hrs)

**Only if 2+ products exist in the same niche.**

**Designer task:**
```
We now have [N] tools serving [niche]:
- [Tool 1]: [url], [price], [purchases]
- [Tool 2]: [url], [price], [purchases]

YOUR TASK: Design a bundle offer.

Options to evaluate:
1. Bundle page: "Get all [N] tools for $[discount]" via single Lemon Squeezy product
2. Cross-promotion: Each tool's payment confirmation page links to the others at a discount
3. "Pro pack": All tools unlocked for one price, sold as a separate Lemon Squeezy product

Pick the simplest option that increases average revenue per customer.
OUTPUT: bundle-spec.md
```

---

## Harvest Mode Evaluation

**Every 14 days while in Harvest Mode, the Analyst runs:**

```json
{
  "product": "[name]",
  "period": "[date range]",
  "metrics": {
    "visits": 0,
    "tool_completions": 0,
    "payment_clicks": 0,
    "purchases": 0,
    "revenue": 0,
    "conversion_rate_visit_to_purchase": 0.0
  },
  "trend": "improving / flat / declining",
  "changes_made_this_period": ["description of change"],
  "impact_of_changes": "measurable effect or too early to tell",
  "recommendation": "continue_harvest / pause_harvest / exit_to_maintenance"
}
```

**Exit conditions:**
- **Continue harvest:** Metrics improving or change still being measured
- **Pause harvest:** Metrics flat for 2 consecutive periods. Product is in maintenance mode (no active work, just collecting revenue).
- **Exit:** Metrics declining despite optimization attempts. Log learnings. Product stays live but receives no more investment.

---

## Maintenance Mode

Products that exit active harvest enter maintenance:
- Stay deployed and collecting payments
- No active agent work
- Analyst checks metrics monthly (5-minute automated review)
- Re-enter harvest if a metric suddenly spikes (e.g., seasonal demand, algorithm change)

This is the goal state: products that make money while Octopus hunts for the next one.

---

## The Two-Mode Rhythm

The Chairman's operating cadence:

```
Week 1:  Hunt cycle: launch new candidate
Week 2:  Hunt cycle: launch another candidate
Week 3:  Evaluate both: KILL losers, HARVEST winners
Week 4:  Harvest sprint on winner(s) + Hunt cycle if capacity allows

Repeat.

Over time:
- Portfolio of 2-5 active tools generating passive revenue
- Intelligence layer improving candidate selection each cycle
- Harvest mode compounding winners while hunt mode feeds the pipeline
```

This is the money machine: parallel tracks of hunting for new revenue and compounding existing revenue.
