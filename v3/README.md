# Octopus 3.0 (in development)

Status: foundation-complete draft, not yet a shipped release. Built 2026-06-15.

## What v3 is

Octopus stops being a `CLAUDE.md` that asks one model to *roleplay* an orchestrator, and becomes
a versioned Claude Code **plugin**: an opinionated, self-verifying layer that sits on top of the
platform's native Workflow engine. Typed (schema-validated) handoffs, per-role model routing,
worktree isolation, and an always-on cold-verifier + STOP-gate discipline. The five-color and
pixel-agent identity stays as the human skin.

The full reasoning, the expert panel, and the dissent that reshaped the thesis are in
`../.crank/` (01-DIAGNOSIS-AND-THESIS, 02-EXPERT-PANEL, 03-REPO-DECISION, INTEGRATION).

## Layout

```
ARCHITECTURE.md        the one canonical doctrine doc (read this first)
plugin.json            the plugin manifest (install surface), no-hijack guarantee encoded
agents/                the 5 agent definitions: real tool boundaries + per-role models
workflows/             sprint / team / review as real Workflow scripts
engine/                graph.js (one declarative source of truth) + two adapters:
                         workflow-adapter.js (the ONLY file touching the Workflow API)
                         prose-adapter.js   (fallback for Codex / Gemini CLI / older hosts)
skills/foundry/        the venture vertical (Foundry) as a paid progressive-disclosure Skill
index.html             the v3 landing page
DONE.md                build notes + criteria mapping
```

## How the two adapters work

Both compile the SAME declarative graph (`engine/graph.js`) two ways. When the Workflow tool is
present, `workflow-adapter.js` runs it as native `pipeline()` / `parallel()` with schema-validated
handoffs and caching. When it is not (Codex CLI, Gemini CLI, pre-GA Claude Code),
`prose-adapter.js` runs the same graph as ordered Manager + Agent-tool steps. Same execution
order, same verify and gate semantics, different substrate. This keeps Octopus portable and means
a Workflow API change has a one-file blast radius.

## Verify it

```bash
for f in workflows/*.js engine/*.js; do node --check "$f"; done
node -e "JSON.parse(require('fs').readFileSync('plugin.json','utf8'))"
node -e "const g=require('./engine/graph'),p=require('./engine/prose-adapter');console.log(p.summarize(p.compile(g.sprint,{goal:'x'})))"
open index.html
```

## What is NOT done yet

- The Workflow API is research-preview; signatures are provisional and the full native path is
  not yet exercised end-to-end.
- Promotion to repo root, archiving v2 into `versions/`, tagging `v3.0.0`, and deploying the
  landing page are deliberately deferred (they restructure or overwrite live surfaces).
- A dedicated craft audit of the landing page is still open.

## Safety

Preserved from every prior version: no `settings.json`, no hooks, no mutation of the user's
`CLAUDE.md`. The plugin adds capability; it does not seize the session.
