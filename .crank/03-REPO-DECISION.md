# Fresh repo vs evolve-in-place: decision

Date: 2026-06-15 · Decision owner: Victor (this doc recommends; the push is gated)

## Recommendation: EVOLVE the existing repo into a v3 major release. Do NOT spin a fresh repo.

### Why

Git history is independent of code architecture. A clean architectural break (plugin vs
CLAUDE.md hijack) does NOT require a new repository: it requires a new major version tag and a
restructured tree, both of which the existing repo does cleanly.

A fresh repo would throw away, for zero architectural gain:
- the accumulated commit history and provenance (5+ feature commits, the v1.3 production work),
- any GitHub stars / forks / inbound links already pointing at `victordelrosal/octopus`,
- the canonical landing URL `victordelrosal.com/octopus`,
- the install instructions already circulating (`git clone .../octopus`).

Fragmenting into a second repo splits attention and SEO across two surfaces and invites the
"which one is current?" confusion. Major-versioning in place is the standard, lower-risk move.

### The one real case for a fresh repo

If the **paid vertical** (Foundry) is to be a separate commercial product with its own brand and
licensing, it can warrant its own repo later. That is a business-packaging decision, not an
architecture one, and it is not needed now. Keep the OS open in `octopus`; carve out Foundry only
when it has a buyer.

### Proposed structure for the v3 major release (in the existing repo)

```
octopus/
  README.md              # rewritten for v3 (plugin-first)
  plugin.json            # NEW: the plugin manifest (install surface)
  agents/                # the 5 agent definitions (promoted from .claude/agents)
  workflows/             # sprint / team / review Workflow scripts
  engine/                # the orchestration adapter (Workflow + prose fallback)
  skills/foundry/        # the venture vertical as a progressive-disclosure Skill
  ARCHITECTURE.md        # the canonical doctrine (from v3/)
  index.html             # the new landing page
  versions/v2-pixel-agents/   # v2 archived (already the pattern in versions/)
  CHANGELOG.md           # v3.0.0 entry
```

The current `v3/` working draft maps directly onto this. Promotion = move v3/ contents up,
archive v2 into versions/ (the repo already uses this versioning pattern), tag `v3.0.0`.

### Naming

Keep the product name **Octopus**. The release is **Octopus 3.0**. If a codename is wanted, the
panel liked the architectural-break framing; "Octopus 3.0" alone is clean and needs no codename.
The paid vertical is **Foundry** (already the venture metaskill's spirit).

### What is GATED (not done in this run, awaiting Victor)

1. Any `git push` to a remote.
2. Creating any new public GitHub repo.
3. Deploying the new landing page to `victordelrosal.com/octopus` (overwrites the live page).
4. Promoting v3/ to repo root / archiving v2 / tagging a release.

All of the above are outward-facing or overwrite live/published surfaces. Per the Crank
checkpoint gates and Victor's stated "your call," these wait for an explicit go-ahead.
The build is complete and reversible on disk; the publish is one human decision away.
