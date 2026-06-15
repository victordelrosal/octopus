# Crank LEARNINGS: Octopus upgrade workspace

Distilled, verified rules for any future run touching Octopus. One line each.

- The April 2026 v1.3 upgrade (PROPOSED-CHANGES.md) already SHIPPED (commit 277c6c8): synthesis-
  before-delegation, inherited context, risk protocol, completion signals, cache ordering. Do not
  re-propose these as new. (verified: git log + file contents, round 1)
- The structural gap in Octopus is that orchestration is prose to a roleplaying Manager, not
  deterministic code. The platform's Workflow tool (pipeline/parallel/agent/schema/model/worktree)
  is the engine to CONSUME, not re-implement. (verified: frontier fleet report + Workflow tool docs)
- The Workflow tool is research-preview; primitive/option signatures are provisional. Any design
  must isolate Workflow calls behind an adapter, never hard-couple. (Theo, round 1)
- Rian's commoditization point is load-bearing: a v3 selling "deterministic orchestration" is a
  treadmill once the Workflow tool hits GA. The defensible value is the opinionated 5-role model +
  the verify/gate discipline turnkey + the Foundry venture vertical (the only piece with a price).
- Octopus's rarest asset is the no-hijack guarantee (no settings.json/hooks). Any plugin repackage
  must preserve it explicitly or it is a regression, not an upgrade. (Felix, round 1)
- Hard rule reminder: NO em dashes anywhere, including code comments and internal working docs.
  Both builder agents emitted them; caught only by an explicit grep. Grep every artifact before
  declaring done. (verified: grep, round 1)
