# Octopus v3: Diagnosis & Thesis

Date: 2026-06-15 · Author: Mythos (Team Victor) · Status: design, pre-build

## 1. What Octopus actually is today (cut the marketing): current-state map

Every real component, named and verifiable against the files in `/octopus`:

- **`octopus.md`** (~487 lines): the portable OS spec; the five roles, three orchestration modes,
  spawn templates, commands. The core file v3 supersedes.
- **`CLAUDE.md`** (~392 lines): the Claude Code runtime spec; greeting, principles, the v1.3
  coordination upgrades. The file v3 stops hijacking.
- **`.claude/agents/`** (5 files: researcher, designer, maker, marketer, manager): the subagent
  definitions with tool allowlists and per-agent model. v3 promotes these to the enforcement layer.
- **`octopus-team/`**: a tmux multi-terminal mode (each agent its own window, filesystem coordination).
- **`ifactory/`**: an autonomous venture pipeline prototype (launch.sh + purple-brain.sh), not wired into the CLI.
- **`metaskills/venture/`**: the venture metaskill (hunt/harvest), the seed of the paid vertical.
- **`pixel-agents/`**: the VS Code pixel-art visualizer integration (the delight layer).
- **`octopus-vision.md` + `octopus-vision-generic.md`**: strategic/architecture vision docs (not runtime).
- **`index.html`** (~57KB): the current landing page. Plus `install.sh`, the banner script, `versions/`.

In one line: a `CLAUDE.md` system prompt that asks one Opus instance to **roleplay** a "Purple
Manager" and spawn five colored subagents through prose, wrapped with a tmux mode, a venture
prototype, a metaskill, a visualizer, and a site. ~4,900 lines of Markdown + ~200 of shell. The
April 2026 "production-grade" upgrade (PROPOSED-CHANGES.md) **already shipped**: synthesis-before-
delegation, inherited context, risk protocol, completion signals, cache ordering. The low-hanging
fruit is gone. **What remains is architectural.**

## 2. The frontier gap: five capabilities that postdate Octopus's design

Each names a concrete mechanism and the exact Octopus change.

1. **The Workflow tool (deterministic JS orchestration).** `pipeline()` / `parallel()` with
   real barrier semantics, `schema`-validated handoffs, per-`agent()` `model` routing,
   `isolation:'worktree'`, token budgets, and caching/resume.
   → *Octopus change:* rewrite `sprint`/`team`/`review` from prose modes into actual Workflow
   scripts. Orchestration becomes executed code; intelligence stays in the leaf `agent()` calls.

2. **Tool-boundary enforcement via agent definitions.** The five `agentType`s already exist
   with real tool allowlists. → *Octopus change:* make scope *architectural* (the Researcher
   has no Write tool) instead of a prose plea ("Research only. Never build"). Delete the
   scope-policing paragraphs.

3. **Skills + Plugins / marketplaces.** Progressive-disclosure `SKILL.md`; plugins bundle
   agents+commands+skills+MCP, installed in one line, versioned, no config collision.
   → *Octopus change:* stop hijacking `CLAUDE.md` (global, always-on, collides with the user's
   own config: the project's own SAFETY note frets about this). Ship as a **plugin**.

4. **Per-role model routing.** June 2026 lineup: Fable 5 ($10/$50, frontier, 1M ctx),
   Opus 4.8 ($5/$25), Sonnet 4.6 ($3/$15), Haiku 4.5 ($1/$5). → *Octopus change:* Opus/Fable
   at the orchestration apex + final synthesis only; Sonnet for Maker/Designer; Haiku for wide
   fan-out (research sweeps, marketing variants). ~80% cost cut on fan-out stages, one word
   (`model:`) per stage.

5. **Crank's loop discipline as a native primitive (the verification gap).** sBs already runs
   frozen binary criteria → a *fresh cold verifier each round told to fail the work* →
   bet-weights confidence → irreversible-action STOP gates (crank, Imago, iFactory). Octopus
   self-evaluates by the builder whose context is compromised by intent. → *Octopus change:*
   a built-in `verify` stage (cold agent, sees criteria + artifacts, not the builder's
   reasoning) gates every pipeline's exit, and a `gate` primitive halts before anything
   irreversible/outward-facing.

(Full evidence: `.crank/` fleet reports; frontier sources cited there. Workflow tool is
research-preview: signatures provisional; the design must not hard-couple to them.)

## 3. The 10x reframe (one sentence)

**Octopus stops being a `CLAUDE.md` that asks one model to *roleplay* an orchestrator, and
becomes a versioned Claude Code *plugin*: an opinionated, self-verifying layer that sits on
top of the platform's native Workflow engine: typed (schema-validated) handoffs, per-role
model routing, worktree isolation, and an always-on cold-verifier + STOP-gate discipline:
while the five-color / pixel-agent identity stays as the human skin.**

Why structural, not a feature add: it moves orchestration *out of the token stream into
deterministic code*, changes the *distribution surface* (plugin, not CLAUDE.md hijack), and
makes *verification + safety* first-class instead of honor-system prose. A skeptical principal
engineer can verify each claim against a running script.

## 4. Crank as example, NOT dependency (C4)

Octopus absorbs the *discipline*, never the skill. Concretely, three things become Octopus
primitives so a user gets them with zero extra install:

- `octopus.criteria(...)`: freeze binary acceptance tests at the start of a run (BRIEF/CRITERIA pattern).
- a `verify` Workflow stage: a fresh cold agent each round, sees criteria + artifacts only,
  told to fail the work; its verdict gates the pipeline's exit. (Anthropic's own June 2026 loop
  experiments found a separate verifier beats self-critique.)
- a `gate` primitive: pauses before spend / send / publish / deploy / delete, writing the
  parked action to `PENDING-APPROVALS.md`. (Crank's checkpoint gates, generalized.)

None require `crank` to be installed. Crank is cited as the reference implementation in the
docs; Octopus ships its own minimal version. This keeps Octopus self-contained and portable.

## 5. Who pays for this, and how (Forge canon, C9)

Octopus is open-source distribution / reputation, not direct revenue: but it has a clear
money path through the **venture vertical**, which is the defensible part once the Workflow
tool commoditizes generic orchestration:

- **Tier 0 (free / open plugin):** the orchestration OS. Drives installs, GitHub stars, and
  inbound. This is the funnel, not the product.
- **Tier 1 (€): the Venture metaskill as a paid pack**: "Octopus Foundry": the hunt/harvest
  pipeline + Cloudflare/Stripe MCP wiring + portfolio memory, sold as a Skill pack or a
  done-with-you sprint. Aligns with the €1–10k MRR stage (digital products).
- **Tier 2 (€€): productised "ship a micro-tool in a weekend" cohort/consulting** using Octopus
  as the spine: the €10–50k stage.

The free OS earns attention; the opinionated vertical earns money. Stage-appropriate per canon.

## 6. The dissent that changed this design (see 02-EXPERT-PANEL.md)

Rian's challenge: "the Workflow tool *commoditizes* generic orchestration; rebuilding plumbing
Anthropic ships natively is a dead end": forced the sharpening above: **Octopus must not
re-implement orchestration primitives; it must *consume* them and differentiate on the
opinionated role model + verification discipline + venture vertical + delight.** v3 sits ON the
Workflow engine, it does not compete with it.
