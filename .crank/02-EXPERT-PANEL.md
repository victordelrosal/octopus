# Team Victor Expert Panel: Octopus v3

Date: 2026-06-15 · Convened by Mythos · Four principals + one frontier mind.
Each critique below *changed* the design (the delta is named). One dissent is surfaced and resolved.

---

## Theo Garza: Principal Engineer

**Verdict: endorse the Workflow re-founding, but don't hard-couple to a preview API.**

The single highest-leverage move (orchestration as deterministic Workflow scripts) is right.
But the Workflow tool is *research-preview and unannounced*: the fleet flagged that primitive
names (`agent`/`parallel`/`pipeline`) and option keys (`schema`, `model`, `isolation`) are
provisional and may change at GA. Betting the whole repo on an unstable surface is how you ship
a thing that breaks on the next release.

**Design change forced:** introduce a thin **orchestration adapter** (`engine/`). Octopus
defines its `sprint`/`team`/`review` graphs in a tiny declarative form; one adapter compiles
them to Workflow scripts when the tool is present, and a second adapter degrades to the
prose-Manager + Agent-tool path when it isn't. This *also* preserves Octopus's portability
story (Codex CLI, Gemini CLI, OpenCode): those don't have the Workflow tool at all. Don't
throw the prose layer away; demote it to the fallback adapter.

---

## Rian Fitzgerald: Chief AI Officer (THE DISSENT)

**Verdict: the general orchestration OS is being commoditized under you. Don't rebuild plumbing.**

Hard truth: the moment the Workflow tool ships at GA, "tell five agents to run a pipeline" is a
native, free platform feature. A v3 whose pitch is "we do deterministic orchestration" is a
wrapper around something Anthropic gives away. That is not a 10x; that's a treadmill. The fleet's
own frontier report says the Workflow tool *is* the orchestrator now.

So what is actually defensible? Three things, none of which is plumbing: (1) the **opinionated
decomposition**: the five-role venture-shaped model is a *point of view*, not a primitive;
(2) the **verification + gate discipline** as a turnkey default a non-expert gets for free;
(3) the **venture vertical** (Foundry): the one piece with a price tag. Rian's push: lead with
the vertical and the discipline, treat orchestration as consumed infrastructure, and **do not
spend a single token re-implementing `pipeline()`.**

---

## Felix Marek: Lead Cybersecurity & AI Red Team

**Verdict: the no-hijack safety guarantee is the crown jewel. A plugin can shatter it. Protect it.**

Octopus's rarest property is "ships zero settings.json, zero hooks, never touches your config."
A *plugin* that bundles hooks + deploy-capable MCP + an autonomous loop running unattended in
worktrees is a materially larger attack surface: it inherits every prompt-injection hiding in
a connector description, and an autonomous Maker with Cloudflare/Stripe MCP can take irreversible
actions while no one watches.

**Design changes forced (non-negotiable):**
- The plugin must **preserve the no-hijack promise explicitly**: no global hook installation, no
  CLAUDE.md mutation; it adds capability, it does not seize the session.
- **Least privilege per `agentType`**: only the Maker gets deploy-capable MCP; Researcher gets
  read-only MCP; the verifier gets nothing but Read.
- The `verify` gate must include a **security pass** (secret scan + dependency audit) before any
  artifact is allowed to ship, per the crank "security tax."
- **Felix's veto:** do NOT ship autonomous distribution (auto-posting to social/PH). That is the
  R5 gap and it is an irreversible, reputational, outward-facing minefield. Octopus *drafts*
  distribution; a human sends. STOP-gate it, forever.

---

## Mythos: Resident Frontier Mind (Fable 5 logic)

**Verdict: the deepest 10x is that Octopus becomes self-verifying and self-gating. And name it.**

Everyone's arguing plumbing vs vertical. The real leap is *epistemic*: today Octopus cannot tell
whether its own output is good: it asks the builder. Absorbing Crank's discipline as a native
primitive (`criteria` → cold `verify` → `gate`) makes Octopus the first orchestration OS that
*grades itself with an independent context and refuses to ship past a failed gate*. That is the
thing no native Workflow primitive gives you for free, and it's the thing that makes autonomous
runs trustworthy. Build the discipline in; cite crank as the example; require nothing.

**Design change forced:** elevate `verify` and `gate` from "nice pattern" to **the two
load-bearing primitives** of v3, alongside the consumed Workflow engine. And give the release a
real name: this is a clean architectural break (plugin vs CLAUDE.md), worth a major version and
its own identity, not a `v2-pixel-agents` increment.

---

## Lars Mortensen: Professor (clarity & pedagogy)

**Verdict: consolidate the doctrine; the venture metaskill IS a Skill: formalize it.**

Octopus has good doctrine scattered across octopus.md, CLAUDE.md, two vision docs,
PROPOSED-CHANGES, and TASK-FORCE. A newcomer can't find the spine. v3 needs ONE canonical
`ARCHITECTURE.md`. And the "metaskills" concept Octopus invented maps almost exactly onto the
platform's Skills with progressive disclosure: stop calling it a bespoke thing, ship it as a
Skill. Teach the user the discipline in the docs, don't just encode it.

**Design change forced:** one canonical architecture doc; venture metaskill repackaged as a
proper progressive-disclosure Skill inside the plugin.

---

## The dissent, resolved

**Rian (commoditization) vs Theo + Mythos (the value was never the plumbing).**

Resolution, and it sharpened the whole thesis: Octopus's value was *never* the orchestration
primitives: it was (a) the opinionated five-role decomposition, (b) the verification + gate
discipline turnkey, and (c) the venture vertical with a price tag. The Workflow tool is the
**engine Octopus sits on, not a competitor.** So v3:

- **consumes** `pipeline()`/`parallel()` via Theo's adapter: re-implements nothing;
- **differentiates** on Mythos's self-verification + Felix's safety + the opinionated roles;
- **monetizes** through Rian's vertical (Foundry), with the free OS as the funnel.

This is a better design than the one we walked in with ("re-found Octopus as deterministic
orchestration"), which Rian correctly called a treadmill. The reframe in 01-§3 reflects the
resolved position: *opinionated, self-verifying vertical on top of the native engine.*

---

## Consensus build directives (what actually changes in v3)

1. Ship as a **plugin**, not a CLAUDE.md hijack: preserve the no-hijack guarantee explicitly. (Felix, Lars)
2. **Consume** the Workflow engine through a thin adapter with a prose-Manager fallback. (Theo, Rian)
3. Make `verify` (cold) and `gate` (STOP) the two load-bearing native primitives. (Mythos)
4. **Per-role model routing** baked into the agent definitions. (Theo, Rian)
5. **Least privilege MCP** per agentType; security pass in the verify gate; **no autonomous distribution.** (Felix)
6. One canonical `ARCHITECTURE.md`; venture metaskill → a real Skill (**Foundry**, the paid vertical). (Lars, Rian)
7. Real name + major version + fresh-repo decision. (Mythos)
