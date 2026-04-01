# Octopus Venture Engine — Product Type Registry

> This file is read by the Purple Manager at the start of every `cycle` command.
> It defines what Octopus is allowed to build, how it monetizes, how it distributes, and when it kills.
>
> v1 ships with ONE recipe. Earn the next recipe by proving this one generates revenue.

---

## Active Recipe: MICRO_TOOL

**What it is:** A single-page web tool (calculator, checker, generator, converter, validator, estimator) that solves one specific task for one specific audience.

**Form factor:** One HTML file with embedded CSS/JS. No backend. No auth. No database. No framework. If it can't ship as a single static file, it's too complex for v1.

**First 5 cycles: keep it embarrassingly simple.** Only build:
- Calculators (input numbers, get a result)
- Scorers (input text/data, get a score with breakdown)
- Pass/fail checkers (input something, get pass/fail with details)
- Generators with short outputs (input parameters, get text/list output)

Do NOT attempt: complex visualizations, multi-step workflows, tools requiring large datasets, or anything with state management. Earn complexity after the loop is proven.

**Examples of what fits:**
- Resume keyword checker (paste resume + job description, see missing keywords)
- Freelance rate calculator (inputs, get suggested hourly/project rate)
- Business name generator (niche + style, get name candidates)
- Color contrast checker (two hex codes, get WCAG pass/fail + ratio)
- Email subject line scorer (input, get score + suggestions)
- Invoice late fee calculator (amount + terms + days late, get fee)

**Examples of what does NOT fit:**
- Anything requiring user accounts or login
- Anything needing a database or persistent storage
- Anything requiring API keys from the end user
- Anything needing OAuth or third-party auth flows
- Chrome extensions, mobile apps, Shopify apps
- Multi-page workflows or wizards
- Anything requiring ongoing content updates or curation
- Anything requiring complex auth flows
- Anything with mobile app store dependencies
- Anything needing heavy integrations or customer success/support
- Anything involving manual sales or regulated workflows
- Multi-sided marketplace models

---

### Build Constraints

| Dimension | Constraint |
|-----------|-----------|
| Files | 1 HTML file (inline CSS + JS). Maximum 2 files if a small JSON data file is needed. |
| Backend | None. All logic runs client-side. |
| Dependencies | Zero npm packages. CDN-hosted libraries only if essential (e.g., Chart.js for visualization). |
| Build time | < 4 hours from spec to deployed. If the Maker estimates more, KILL the candidate. |
| Accessibility | Semantic HTML. Visible focus states. Works without JS for core content (progressive enhancement where possible). |

### Monetization

| Dimension | Constraint |
|-----------|-----------|
| Platform | **Lemon Squeezy only.** No Stripe. No Gumroad. No PayPal. One platform, no choice. |
| Pattern | **Free preview with truncated results, then Lemon Squeezy checkout, then full access.** This is the only pattern. No variations in v1. |
| How it works | User runs the tool for free. Results are visibly truncated (e.g., "Showing 3 of 12 results"). A prominent button opens a Lemon Squeezy checkout URL. After purchase, user receives full results. |
| Unlock mechanism | Simplest viable: URL parameter from Lemon Squeezy success redirect unlocks the page for that session. No accounts. No email verification. No custom code beyond reading a URL param. |
| Price point | $5 to $19 one-time. Do not experiment with subscriptions in v1. |
| Bootstrap requirement | User must have a Lemon Squeezy account, store, and API key configured in `.octopus/.env` before first cycle. |

### Deployment

| Dimension | Constraint |
|-----------|-----------|
| Platform | Cloudflare Pages. No alternatives in v1. |
| Method | `wrangler pages deploy ./dist --project-name=[project]` |
| Domain | Cloudflare-provided subdomain for v1 (e.g., `tool-name.pages.dev`). Custom domain optional, not required. |
| Bootstrap requirement | User must have Cloudflare account + API token in `.octopus/.env`. |

### Distribution

| Dimension | Constraint |
|-----------|-----------|
| Primary channel | **Tool-intent SEO.** The landing page IS the distribution. |
| Target queries | `"free online [tool]"`, `"[task] calculator"`, `"[task] checker"`, `"[task] generator"` |
| Page structure | H1 = exact target query. Tool immediately visible above fold. Below: explanation, FAQ (targeting long-tail variants), related use cases. |
| Meta | Title tag = `[Tool Name] — Free Online [Task] [Type]`. Meta description = value prop + "free" + "instant". OG image with tool screenshot or result preview. |
| Secondary | One post in the most relevant niche community (Reddit, IndieHackers, relevant forum) where the pain was discovered. NOT the primary channel. A bonus, not the strategy. |
| What is NOT distribution | Cold tweets. Product Hunt submissions. Email blasts to no list. Paid ads. None of these in v1. |

### Evaluation Timeline

| Day | Check | Action |
|-----|-------|--------|
| Day 3 | **Signal check.** Is page indexed? Any impressions? Community post engagement? | If not indexed, submit to Search Console again. No other action. |
| Day 7 | **Visibility check.** Any organic visits? Tool completions? Payment link clicks? | If zero visits, diagnose SEO targeting. One title/query change allowed. |
| Day 14 | **Funnel diagnosis.** Visits but no clicks? Clicks but no purchases? | Diagnose weakest funnel step. One iteration allowed. Flag to Chairman. |
| Day 30 | **Kill or harvest.** Total purchases? Revenue? Trend direction? | < 3 purchases: KILL. 3+ with positive trend: HARVEST MODE. |

### Kill Criteria

The system MUST kill a candidate if:
- Day 7: page not indexed despite resubmission
- Day 14: zero visits (SEO targeting was wrong or demand doesn't exist)
- Day 30: < 3 purchases (unless trend is clearly accelerating)
- Any time: support burden emerges (users emailing with questions = landing page is failing)

### Support Burden

**Target: zero.** The tool is self-service. No email support. No account management. No refund process beyond Lemon Squeezy's built-in system. If the product requires explaining, the landing page copy is failing, not the product.

---

## Queued Recipes (NOT active: earn these by proving MICRO_TOOL works)

- `INFO_PRODUCT` — PDF guide / template / checklist sold via Lemon Squeezy
- `DIRECTORY` — Static curated list with paid featured listings
- `EMAIL_PRODUCT` — Paid email course or newsletter via Buttondown
- `API_WRAPPER` — Developer-facing usage-based micro-API

Each will be defined with the same structure (build, monetize, deploy, distribute, kill, support) when activated.

---

## How the Manager Uses This File

1. At the start of a `cycle` command, read this file.
2. Confirm the active recipe (currently: MICRO_TOOL).
3. All downstream agent spawn templates inherit these constraints.
4. The Researcher hunts ONLY for pain solvable by this product form.
5. The Maker builds ONLY within these build constraints.
6. The Marketer distributes ONLY through these channels.
7. The Analyst evaluates ONLY against these kill criteria and timeline.
8. No agent may deviate from the active recipe without Chairman approval.
