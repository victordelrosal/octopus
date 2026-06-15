# Octopus v3: Build Complete

Date: 2026-06-15 · Builder: Blue Maker (Octopus v3)

---

## What was built

A working draft of the Octopus v3 plugin architecture: one canonical architecture doc,
three Workflow scripts (the reference pipeline plus team and review), and five agent
definition files with real tool boundaries and per-role model routing.

---

## Files created

| File | Description |
|------|-------------|
| `v3/ARCHITECTURE.md` | Single canonical architecture doc (9 sections). Consolidates all doctrine into one place (Lars directive). |
| `v3/workflows/sprint.workflow.js` | Reference pipeline: research > design > build > cold verify > gate > market > synthesis. Includes typed handoff schemas for every stage transition, per-role model routing, worktree isolation on the build stage, a cold verifier with security pass, and a permanent gate on distribution. |
| `v3/workflows/team.workflow.js` | Parallel fan-out: dispatches independent tasks to multiple agents simultaneously via `parallel()`, then synthesizes with Opus. |
| `v3/workflows/review.workflow.js` | Adversarial review loop: builder revises until a cold verifier passes or the round budget is exhausted. Fresh verifier each round. Escalates to Manager after max rounds. |
| `v3/agents/researcher.md` | Yellow Researcher: model claude-haiku-4-5, tools Read/WebSearch/WebFetch/Bash (read-only), no MCP, two modes (Scout/Evaluate). |
| `v3/agents/designer.md` | Red-Orange Designer: model claude-sonnet-4-6, tools Read/Write/Edit, no Bash, no MCP. |
| `v3/agents/maker.md` | Blue Maker: model claude-sonnet-4-6, full tool set, deploy-capable MCP (cloudflare-pages, stripe), worktree isolation, risk protocol. |
| `v3/agents/marketer.md` | Green Marketer: model claude-haiku-4-5, tools Read/Write only, no MCP, drafts-only with permanent distribution gate. |
| `v3/agents/manager.md` | Purple Manager: model claude-opus-4-8, tools Read/Write, orchestration-only, synthesis and escalation handling. |

---

## How to verify

**Architecture doc is internally consistent:**
Read `v3/ARCHITECTURE.md` sections (a) through (i). Cross-check that:
- Section (d) model routing matches the `model:` frontmatter in each agent file.
- Section (f) MCP allowlist matches the `mcp:` frontmatter in each agent file.
- Section (e) verify protocol matches the cold verifier stage in `sprint.workflow.js`.
- Section (g) no-autonomous-distribution matches the permanent gate in `sprint.workflow.js`
  and the Marketer agent definition.

**Workflow scripts parse correctly:**
```bash
node --input-type=module < v3/workflows/sprint.workflow.js 2>&1 | head -5
node --input-type=module < v3/workflows/team.workflow.js 2>&1 | head -5
node --input-type=module < v3/workflows/review.workflow.js 2>&1 | head -5
```
These will error on `pipeline`/`parallel`/`phase`/`agent`/`log` not being defined (they
are Workflow engine globals injected at runtime), but the scripts must parse without syntax
errors. Expected output: `ReferenceError: pipeline is not defined` or similar, not a
SyntaxError.

**Agent files have valid frontmatter:**
Each agent file has `name`, `description`, `model`, `tools` (array), `mcp` (array).
Cross-check: only `maker.md` has non-empty `mcp`. All others have `mcp: []`.

---

## Mapping to criteria (C6 from the thesis)

| Criterion | Where implemented |
|-----------|------------------|
| C1: Plugin packaging, no-hijack guarantee | ARCHITECTURE.md §(b); manager.md invariants |
| C2: Orchestration adapter (Workflow + prose fallback) | ARCHITECTURE.md §(c) |
| C3: Five agentTypes with real tool boundaries | agents/*.md frontmatter; ARCHITECTURE.md §(d) |
| C4: crank discipline absorbed, no crank install required | ARCHITECTURE.md §(e); sprint.workflow.js verify stage and gate() |
| C5: Per-role model routing | agents/*.md `model:` field; sprint.workflow.js `model:` per phase |
| C6: Cold verify with security pass; gate primitive | sprint.workflow.js; review.workflow.js; ARCHITECTURE.md §(e) |
| C7: Least-privilege MCP | agents/*.md `mcp:` field; ARCHITECTURE.md §(f) |
| C8: No autonomous distribution | ARCHITECTURE.md §(g); marketer.md; sprint.workflow.js gate on publish |
| C9: Foundry as paid progressive-disclosure Skill | ARCHITECTURE.md §(h) |
| C10: Migration note from v2 | ARCHITECTURE.md §(i) |

---

## Known limitations

- `v3/engine/workflow-adapter.js` and `v3/engine/prose-adapter.js` are referenced in
  ARCHITECTURE.md §(c) but not implemented here. They are the abstraction layer between
  the declarative graph definitions and the runtime execution. Building them requires the
  Workflow tool's GA signatures, which are provisional as of June 2026.
- `v3/plugin.json` (the plugin manifest) is not implemented. It would declare the five
  agentTypes, three Workflow scripts, and the Foundry Skill for the `claude plugin install`
  command.
- The Foundry Skill (`v3/skills/foundry/`) is described in ARCHITECTURE.md §(h) but not
  built. It is the paid vertical and a separate build task.
- The pixel-agents visualizer integration from v2 is not re-wired in v3. It remains a v2
  feature; wiring it to v3's plugin structure is a follow-on task.
- Workflow API signatures are provisional (research-preview). When the tool reaches GA,
  the workflow scripts may need updates. All Workflow calls are isolated in the workflow
  scripts themselves, which limits the blast radius of any API change.

---

## Files NOT modified

No files outside `v3/` were created or modified. The existing `CLAUDE.md`, `octopus.md`,
`octopus-vision.md`, and all v2 files are untouched.
