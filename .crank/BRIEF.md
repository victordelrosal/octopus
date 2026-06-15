# Crank Brief: Octopus order-of-magnitude upgrade

Date: 2026-06-15 (Mon) · Director: Mythos (w/ Lars, Theo, Rian, Felix)

WHAT:         An order-of-magnitude upgrade to Octopus (the multi-agent orchestration OS),
              shipped as: (1) a re-founded OS spec, (2) a world-class landing page,
              (3) a staged fresh-repo structure: built locally, public repo + deploy GATED.
WHY:          Octopus was designed Mar 2026 against the agentic world as it then was. Since
              then: the Workflow tool (deterministic orchestration), the skills/plugin
              ecosystem, Crank (self-directing verified loops), frontier models (Fable 5,
              Mythos-class) with per-role routing. Octopus's "Manager pretends to manage via
              prose" is now a weak version of what the platform can do natively. Victor wants
              the upgrade that reflects what we've learned and what's now possible.
WHO:          (a) Victor: owner, wants leverage + a shippable SmallBets artifact with a price
              path. (b) Builders in the Claude Code / agentic ecosystem who install Octopus.
CRITERIA:     See CRITERIA.md (frozen at FRAME).
PRD:          no: this is a strategy+build hybrid; BRIEF + CRITERIA + design doc suffice.
FLEET:        R1 sBs-learnings scanner · R2 octopus-internals mapper · R3 frontier-platform
              scanner · then synthesis + Team Victor expert panel (Lars/Theo/Rian/Felix/Mythos)
              · then builder · then cold verifier each round.
LOOP BUDGET:  3 rounds. Vision-heavy → direction checkpoint after round 1 (present thesis +
              sample to Victor before building the full repo; public repo/deploy is a hard gate).
EXIT:         A concrete v3 thesis + design doc Victor endorses, a working local draft of the
              new OS + landing page, and a clear go/no-go on the fresh repo.
DOWNGRADES:   Public GitHub repo creation and any deploy are STOP-gated (irreversible/outward).
              If Victor is absent, build locally and queue the gate; do not push.
