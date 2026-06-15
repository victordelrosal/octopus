# Octopus v3: Architecture

Version: 3.0.0 · Status: working draft · Date: 2026-06-15

---

## (a) What changed and why

v2 was a `CLAUDE.md` that asked one Opus instance to roleplay a Purple Manager and spawn
five colored subagents through prose. The orchestration logic lived in the token stream:
no barrier semantics, no schema validation, self-critique by the builder whose context is
compromised by intent, and a global CLAUDE.md install that collided with the user's own
config. v3 is a versioned Claude Code plugin: orchestration moves into deterministic
Workflow scripts that consume `pipeline()` and `parallel()` natively (re-implementing
nothing), typed handoffs replace prose contracts, per-role model routing cuts fan-out cost
by ~80%, a cold verifier with independent context grades every pipeline exit, and a `gate`
primitive halts before any irreversible action. The five-color / pixel-agent identity and
the no-hijack safety promise stay intact. The opinionated role model, the verification
discipline, and the Foundry venture vertical are the defensible layer; orchestration
plumbing is consumed infrastructure.

---

## (b) Plugin packaging and the no-hijack safety guarantee

Octopus v3 ships as a Claude Code plugin installed under `~/.claude/plugins/octopus/`.
It adds capability; it does not seize the session.

**What the plugin does:**
- Registers five `agentType` definitions with tool allowlists and model routing.
- Registers three Workflow scripts (`sprint`, `team`, `review`) that the platform executes
  natively when the Workflow tool is present.
- Registers the `Foundry` Skill for progressive disclosure on the venture vertical.
- Exposes the `octopus` command palette in the host session.

**What the plugin never does (the no-hijack guarantee, preserved from v2):**
- Does not install global hooks.
- Does not mutate `CLAUDE.md` at any path.
- Does not modify `settings.json` or any existing user config.
- Does not auto-run on session start without user invocation.
- Does not touch system files outside `~/.claude/plugins/octopus/`.

This guarantee satisfies Felix's security requirement: the plugin's install surface is
isolated and auditable. Users can `rm -rf ~/.claude/plugins/octopus/` to completely
remove it with no residual side effects.

**Install:**
```bash
claude plugin install octopus
# or, from source:
bash v3/install.sh
```

**Uninstall:**
```bash
claude plugin remove octopus
```

---

## (c) Orchestration adapter

Octopus does not own orchestration primitives. It defines graphs declaratively; an adapter
layer compiles them to the right execution form.

**Two adapters, selected at runtime:**

| Adapter | When it activates | How it runs |
|---------|-------------------|-------------|
| `workflow` | Workflow tool is present in the host session | Compiles the graph to a native Workflow script (`sprint.workflow.js`, etc.) and hands off to the platform's execution engine. Barrier semantics, schema validation, token budgets, and caching/resume are platform-native. |
| `prose` | Workflow tool is absent (Codex CLI, Gemini CLI, OpenCode, or pre-GA Claude Code) | Falls back to the v2 prose-Manager + Agent-tool path. The Manager spawns agents via the Agent tool with full typed-handoff prompts. No platform primitives required. |

**How the adapter is selected:**
```js
// engine/adapter.js (excerpt)
const adapter = typeof pipeline === 'function'
  ? require('./workflow-adapter')
  : require('./prose-adapter');
export default adapter;
```

Octopus's graphs stay identical regardless of adapter. A `sprint` run on Codex CLI today
upgrades to native barrier semantics automatically when the user moves to a Workflow-capable
host, with zero config change.

This design also satisfies Theo's directive: the repo never hard-couples to provisional
Workflow API signatures. All Workflow calls are isolated inside `workflow-adapter.js`.
If primitive names change at GA, one file changes.

---

## (d) The five agentTypes: tool boundaries and model routing

Tool boundaries are architectural, not prose-plea. An agent that lacks a tool cannot use it,
regardless of what the prompt says.

| Agent | Color | Model | Tools (allowlist) | MCP tier |
|-------|-------|-------|-------------------|----------|
| **Researcher** | Yellow | `claude-haiku-4-5` | Read, WebSearch, WebFetch, Bash (read-only: grep/find/curl) | Read-only (no write MCP) |
| **Designer** | Red-Orange | `claude-sonnet-4-6` | Read, Write, Edit | None (no MCP) |
| **Maker** | Blue | `claude-sonnet-4-6` | Read, Write, Edit, Bash, Glob, Grep | Deploy-capable (Cloudflare, Stripe) |
| **Marketer** | Green | `claude-haiku-4-5` (drafts) / `claude-sonnet-4-6` (final) | Read, Write | None (no MCP; no publish action) |
| **Manager** | Purple | `claude-opus-4-8` (synthesis, gates) | All (orchestration only; delegates execution) | Read-only + approval |
| **Verifier** | (cold) | `claude-sonnet-4-6` | Read | None; isolated context |

**Model routing rationale:**
- Opus 4.8 at the orchestration apex and final synthesis: highest judgment, lowest frequency
  of invocation ($5/$25 per MTok).
- Sonnet 4.6 for Maker, Designer, and verification passes: strong code and design reasoning
  at moderate cost ($3/$15 per MTok).
- Haiku 4.5 for Researcher fan-out and Marketer variant generation: fast, cheap, wide
  ($1/$5 per MTok). Research sweeps and copy variants are high-volume, low-depth tasks.

On a typical `sprint` run this routing reduces token cost by ~75-80% versus running every
stage at Opus.

---

## (e) The two load-bearing native primitives

These are v3's differentiating layer. The Workflow tool gives you `pipeline()` and
`parallel()`; Octopus gives you `verify` and `gate`. Neither requires crank installed.
Crank is cited as the reference implementation; Octopus ships its own minimal version.

### `verify`: the cold independent verifier

**Purpose:** Grade every pipeline's exit with a fresh agent whose context contains only
frozen criteria and the artifact list, never the builder's reasoning or session history.
This eliminates self-critique bias (Anthropic's own June 2026 loop experiments found a
separate verifier beats self-critique).

**Protocol:**
1. At pipeline start, `octopus.criteria([...])` freezes a list of binary acceptance tests.
   Each criterion is pass/fail; no partial credit.
2. After the build stage completes, a cold `verify` agent is spawned with:
   - The frozen criteria (verbatim).
   - Read-only access to the artifacts directory.
   - No access to the builder's session, reasoning, or prior conversation.
   - An explicit system instruction: "Your job is to find failures. Approve only if every
     criterion passes without interpretation."
3. The verifier produces a `verify.json` verdict: `{ pass: boolean, scores: [...], blockers: [...] }`.
4. If `pass: false`, the pipeline **halts**. The builder is given the blocker list and
   must address each item before a new verify round begins.
5. Every verify round is a **new cold agent**. Accumulated context from failed rounds
   does not carry forward.

**Security pass (Felix's requirement):** The verify stage always includes, before content
criteria, two fixed security checks:
- Secret scan: scan all staged files for tokens, API keys, passwords, `.env` contents.
  Any hit = automatic fail, pipeline halts.
- Dependency audit: for any `package.json` / `requirements.txt` / `go.mod` in the artifacts,
  run `npm audit --audit-level=high` (or equivalent). Critical vulnerabilities = fail.

These two checks cannot be disabled by user-defined criteria.

### `gate`: the irreversible-action STOP primitive

**Purpose:** Halt before any action that is irreversible, outward-facing, or involves real
spend. This covers: deploy, publish, send (email/social), purchase, delete.

**Protocol:**
1. Any workflow stage that would trigger a gated action calls `gate(action, context)`.
2. `gate` writes the pending action to `.octopus/PENDING-APPROVALS.md` with full context
   (what, where, cost estimate, reversibility note).
3. Execution pauses. The terminal prints:
   ```
   GATE: deploy to cloudflare-pages [octopus-demo]: approve? (y/n)
   ```
4. On `y`, the action proceeds and the approval is logged with timestamp.
5. On `n` or timeout (default 60s), the action is cancelled and logged.

**Felix's veto is encoded here:** Marketer distribution actions (social post, PH launch,
email blast) are permanently gated. There is no flag to bypass them. Octopus *drafts*
distribution; a human sends. The gate cannot be disabled for these action types.

---

## (f) Least-privilege MCP per agentType

MCP connectors grant real-world reach (deploy, publish, charge). They follow the same
principle as tool allowlists: minimum capability for the role.

| Agent | MCP connectors | Rationale |
|-------|---------------|-----------|
| Researcher | None (WebSearch/WebFetch built-in) | Read-only web access via native tools; no write surface |
| Designer | None | Design output is files; no deployment surface needed |
| Maker | Cloudflare Pages (deploy), Stripe (product create/update, not charge) | Production build and deploy; deploy-capable, not payment-execution |
| Marketer | None | Drafts only; no publish action (gate enforces this) |
| Manager | None (orchestration only) | Delegates all execution; no direct tool calls on artifacts |
| Verifier | None | Read tool via allowlist; no MCP; isolated context |

Any MCP connector added to the plugin must be declared in `v3/plugin.json` and is subject
to `gate` for any write/deploy/publish action.

---

## (g) No autonomous distribution

Octopus does not post, publish, email, or broadcast on your behalf, ever.

The Marketer agent drafts: it produces copy, campaign briefs, social post drafts, and
email sequences as files. It does not send them. Every outward-facing distribution action
is permanently gated (see `gate` above). The gate on distribution action types cannot be
disabled via config or by any agent instruction.

This is not a configuration option. It is a design invariant encoded in the gate's action
type list. Felix's veto is permanent.

---

## (h) Foundry: the paid venture vertical as a progressive-disclosure Skill

Foundry is the money path. It is a Skill (progressive-disclosure, opt-in) bundled with
the plugin but not active by default.

**What Foundry adds on top of the base plugin:**
- `cycle hunt [niche]`: the full discovery-to-launch pipeline for a micro-tool: niche
  research (Haiku fan-out) > opportunity scoring > spec > build > price > Stripe checkout.
- `cycle harvest [product]`: compound a winning product: metrics pull, A/B copy variants,
  upsell design, cohort email sequence.
- `cycle status`: portfolio dashboard across all active products.
- Pre-wired Cloudflare Pages + Stripe MCP for the Maker stage (deploy-capable, gated).
- Portfolio memory in `.octopus/foundry/portfolio.json`: persists across runs.

**Activation:**
```bash
claude skill enable octopus/foundry
```

**Pricing intent (Forge canon: no build without a price tag):**
- Tier 0 (base plugin): free, open-source. Funnel for attention.
- Tier 1 (Foundry Skill): paid pack, ~€49 one-time or monthly. Aligns with €1-10k MRR
  stage (digital products + course).
- Tier 2: productised "ship a micro-tool in a weekend" cohort using Foundry as the spine.
  Aligns with €10-50k MRR stage (cohort + consulting).

---

## (i) Migration from v2

| v2 | v3 |
|----|-----|
| CLAUDE.md defines Purple Manager + five spawn templates | plugin.json + five agent definition files under `v3/agents/` |
| Orchestration modes described in prose | Workflow scripts under `v3/workflows/`; prose-Manager fallback via adapter |
| Scope enforced by prose ("Research only. Never build.") | Tool allowlists in agent definitions; architectural enforcement |
| No model routing (all runs at session default) | Per-role model field in every agent definition |
| Metaskills as bespoke Markdown convention | Foundry Skill, progressive-disclosure, opt-in activation |
| No verification primitive | `verify` stage in every pipeline; cold agent; security pass mandatory |
| No gate primitive | `gate` on all irreversible/outward actions; distribution permanently gated |
| CLAUDE.md install collides with user config | Plugin install; isolated; no-hijack guarantee explicit |

**For existing v2 users:** the five-color identity, the command vocabulary (`sprint`,
`team`, `review`, `research`, `design`, `build`, `market`), and the pixel-agent
visualizer integration are unchanged. v3 is a drop-in upgrade in terms of user-facing
commands. The internals are different.

**v2 files are NOT deleted.** v3 lives under `v3/`; the root CLAUDE.md and octopus.md
remain untouched during the migration period. Cut-over is a single plugin install.
