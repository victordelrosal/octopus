# Acceptance Criteria: Octopus v3 upgrade (frozen at FRAME, 2026-06-15)

Binary. Cold verifier scores each pass/fail/partial with evidence.

C1. **Grounded diagnosis.** A written current-state map of Octopus exists naming every
    real component (octopus.md, CLAUDE.md, .claude/agents, octopus-team, ifactory, metaskills,
    pixel-agents, vision docs) and what each does: verifiable against the actual files. [env]

C2. **Frontier-gap thesis.** A document names ≥5 specific platform capabilities that postdate
    Octopus's design (e.g. Workflow tool, schemas/structured output, plugins/marketplace,
    per-role model routing, Crank's cold-verifier loop) and, for each, states exactly what
    Octopus should absorb. No vague "use AI better". [judge: rubric = each gap names a concrete
    mechanism + a concrete Octopus change]

C3. **The 10x reframe is named in one sentence** and is genuinely structural (changes the
    foundation, not a feature add): defensible to a skeptical principal engineer. [judge]

C4. **Crank-as-example, not dependency.** The design shows how Octopus absorbs Crank's
    discipline (self-set criteria, cold verifier gate, bet-weights confidence, STOP gates)
    WITHOUT requiring the crank skill to be installed. Explicitly stated. [judge]

C5. **Expert panel ran for real.** Lars, Theo, Rian, Felix each delivered a distinct,
    substantive critique that changed the design (not rubber-stamp), captured in writing with
    at least one dissent surfaced and resolved. [env: file exists with 4 named critiques + ≥1 dissent]

C6. **Working OS draft exists.** A new/upgraded OS spec file (v3) exists on disk that a builder
    could actually run: concrete orchestration patterns, not just prose theory. Includes at
    least one real Workflow-style script example. [env]

C7. **Landing page is world-class and real.** A new index/landing HTML exists, opens clean,
    follows the world-class-frontend / web-design-standard bar (one obsessive concept, motion,
    not AI-slop), and accurately sells v3. Renders without console errors. [env+judge]

C8. **Fresh-repo decision is made with reasons.** A clear recommendation on new repo vs evolve
    existing, with the naming + structure if new, staged locally: and the actual public push /
    deploy left as a surfaced gate for Victor, not executed. [env]

C9. **SmallBets-honest.** Per Forge canon, the upgrade answers "who pays for this and how" in
    one short section: not hand-waved. [judge]

C10. **No regression / no harm.** The upgrade preserves Octopus's safety guarantee (no
     settings.json/hooks hijack) and doesn't break the existing repo; existing files untouched
     unless deliberately versioned. [env]
