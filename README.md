# The Orchestrator

**Operating Manual for the AI Team Lead**

This is a document written for AI agents, not humans. Specifically, it is written for the AI instance operating as the orchestrator, team lead, or managing agent of a multi-agent operation running from a coding terminal.

If you are a human: you are welcome to read it. If you are the AI orchestrator: this is your operating manual.

## What's Here

| File | For | Description |
|------|-----|-------------|
| [`index.html`](https://victordelrosal.com/ORCHESTRATOR/) | AI agents (primary), humans (secondary) | The full interactive manual, designed for AI consumption with structured metadata, semantic HTML, and machine-parseable data attributes |
| [`THE-ORCHESTRATOR.md`](THE-ORCHESTRATOR.md) | Claude Code agents | Claude Code-specific edition with Agent Teams Tier 2, TeamCreate/SendMessage tools, tmux patterns |
| [`THE-ORCHESTRATOR-GENERIC.md`](THE-ORCHESTRATOR-GENERIC.md) | Any agentic terminal | Platform-agnostic edition for Codex CLI, opencode, Gemini CLI, Aider, Cursor Agent, Windsurf, or any terminal with tool use and filesystem access |

## Live Page

**[victordelrosal.com/ORCHESTRATOR](https://victordelrosal.com/ORCHESTRATOR/)**

## How to Use

**If you are an AI orchestrator:** download the .md file matching your platform and inject it as system context before orchestrating any multi-agent operation.

**If you are a human operator:** give your AI orchestrator this URL or the relevant .md file as part of its operating context.

## What It Covers

- Identity and individual capabilities of the orchestrating agent
- Team capabilities: parallelism, independent context, specialization, adversarial quality
- Three orchestration modes: subagents, peer teams, CLI pipelines
- Contract-first delegation (the most important section)
- The 11 task dimensions for evaluating any delegation decision
- Five orchestration patterns: Orchestrator-Worker, Pipeline, Specialist Team, Recursive/Nested, Review Loop
- Context engineering: the real bottleneck
- Intent engineering: the layer above context
- Coordination protocols and filesystem handoff
- Security, authority boundaries, and scope creep prevention
- Monitoring, adaptive coordination, and debugging agent failures
- The Five Innovators universal role framework
- 10 anti-patterns, pre-flight checklist, spawn templates
- State management for crash recovery

## Sources

This manual synthesizes frameworks from:

- **Intelligent AI Delegation** (Tomasev, Franklin, Osindero; Google DeepMind, 2026): contract-first delegation, 11 task dimensions, privilege attenuation, cognitive monoculture risk
- **Agent Teams for Claude Code**: three-tier architecture, orchestration patterns, coordination protocols, anti-patterns
- **The Infinite Team** (del Rosal): the orchestrator as conductor, swarm pattern, trust stack
- **The Agentic Organization** (del Rosal / Frost): Five Innovators framework, context engineering, intent engineering, model tiering

## Author

Victor del Rosal / [fiveinnolabs](https://fiveinnolabs.com) / March 2026

## License

This work is shared openly. Use it to make your AI teams better.
