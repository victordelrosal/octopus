# Octopus v3: Proposed Changes from Claude Code Source Analysis

**Date:** 2026-04-01
**Source:** Patterns extracted from Claude Code's production source code (512K lines, 1,900 files)
**Goal:** Adopt battle-tested agentic patterns without breaking existing Octopus architecture

---

## Summary of Changes

Six patterns from Claude Code's internal architecture, adapted for Octopus:

1. Synthesis-Before-Delegation (anti-lazy-delegation)
2. Inherited Context in spawn templates
3. Risk Protocol (permission bubbling)
4. Cache-Aware Context Ordering
5. Completion Notification Contract
6. Tool Boundary Enforcement

---

## 1. Synthesis-Before-Delegation

**What:** Claude Code's coordinator must prove it understood results before delegating follow-up work. It can't say "based on the findings, design a solution." It must cite specifics.

**Why:** Prevents the telephone game where context degrades across agent handoffs. Forces the Manager to actually process outputs, not just relay them.

### Change to: `CLAUDE.md` (Operating Principles)

**Add as principle #2** (shift others down):

```
2. **Synthesize before delegating.** Before dispatching the next stage, the Manager
   must produce a Stage Synthesis proving it understood the previous output:
   - What was learned (specific findings, not summaries)
   - What changed (files/artifacts created or modified)
   - Decision rationale (why proceeding to this next stage)
   - Constraints for next agent (what they must not violate)
   Never relay outputs blindly. If you can't synthesize it, you didn't understand it.
```

### Change to: `.claude/agents/manager.md` (How You Work)

**Replace step 5** with:

```
5. **Synthesize outputs** at each quality gate:
   - State what the previous agent delivered (cite specifics, not summaries)
   - State what you decided and why
   - Define constraints the next agent inherits
   - Only then dispatch the next stage
```

---

## 2. Inherited Context in Spawn Templates

**What:** Claude Code's forked subagents inherit the parent's accumulated context. Octopus agents currently start cold with only a task description.

**Why:** Agents make better decisions when they know what the orchestrator already knows, without needing the full conversation history.

### Change to: `CLAUDE.md` (Spawn Templates)

**Add an `## Inherited Context` section** to each spawn template. The Manager populates this before dispatching.

Example for Spawn Designer (same pattern for all templates):

```
### Spawn Designer
You are the Red-Orange Designer agent.

## Inherited Context
[Manager fills this section with relevant findings from previous stages]
- Mission: [one-line goal]
- Key findings: [specific facts the Designer needs]
- Constraints discovered: [what research revealed about limits]
- Decisions already made: [what's been decided, don't revisit]

## Task
TASK: [describe what to design]
INPUT: [reference research brief or requirements]
OUTPUT: Design spec with rationale for key decisions.
FORMAT: Markdown with diagrams (ASCII or described), user flows, and component specs.
SCOPE: Design only. Do not write production code.
ESCALATE: If requirements conflict or multiple valid approaches exist.
```

**Apply same pattern to all five spawn templates.**

---

## 3. Risk Protocol (Permission Bubbling)

**What:** Claude Code workers can't autonomously take risky actions. Risk surfaces up to the coordinator, who decides. The worker continues with safe operations in the meantime.

**Why:** Quality gates only catch problems between stages. Risk protocol catches problems within a stage, preventing agents from making irreversible decisions autonomously.

### Change to: each agent definition in `.claude/agents/`

**Add a `## Risk Protocol` section** after Escalation Triggers in each agent file.

For **maker.md** (highest risk):
```
## Risk Protocol

When you encounter risk during execution:
- **Destructive operations** (deleting files, dropping data, overwriting): FLAG to Manager, continue with non-destructive work
- **Scope creep** (building beyond spec): FLAG to Manager, complete only in-scope items
- **Security concerns** (secrets in code, unvalidated inputs, exposed endpoints): STOP and report immediately
- **Dependency changes** (adding packages, changing versions): FLAG to Manager with justification
- **Deployment actions** (pushing to production, modifying CI/CD): FLAG to Manager, prepare but don't execute

FLAG format: "RISK FLAG: [category] - [specific concern] - [what I'll do instead while waiting]"
```

For **researcher.md** (lower risk):
```
## Risk Protocol

When you encounter risk during execution:
- **Contradictory data**: FLAG to Manager with both sources, continue gathering other data
- **Scope expansion** (research leading far beyond original brief): FLAG to Manager, document the trail but don't follow it
- **Sensitive information** (PII, credentials, private data in sources): STOP and report immediately
- **Unreliable sources** (single unverifiable source for critical claim): FLAG, note confidence level, continue with other sources

FLAG format: "RISK FLAG: [category] - [specific concern] - [what I'll do instead while waiting]"
```

For **designer.md**:
```
## Risk Protocol

When you encounter risk during execution:
- **Scope creep** (designing beyond brief): FLAG to Manager, complete core design only
- **Conflicting requirements** (can't satisfy all constraints): FLAG to Manager with tradeoff analysis, recommend one path
- **Unvalidated assumptions** (designing for a user need you haven't verified): FLAG, note the assumption explicitly, continue with it marked

FLAG format: "RISK FLAG: [category] - [specific concern] - [what I'll do instead while waiting]"
```

For **marketer.md**:
```
## Risk Protocol

When you encounter risk during execution:
- **Brand/legal risk** (claims that could be misleading, unverified testimonials): STOP and report immediately
- **Scope creep** (marketing assets requiring product changes): FLAG to Manager, complete assets that don't require changes
- **Budget assumptions** (strategies requiring spend without defined budget): FLAG, present organic-first alternatives
- **Channel access** (needing credentials or accounts you don't have): FLAG, prepare assets, note what's needed to deploy

FLAG format: "RISK FLAG: [category] - [specific concern] - [what I'll do instead while waiting]"
```

---

## 4. Cache-Aware Context Ordering

**What:** Claude Code orders context so stable content comes first (system prompt, tool definitions) and volatile content comes last (task-specific instructions). This exploits the API's KV-cache: repeated prefixes are up to 10x cheaper to process.

**Why:** Multi-agent runs are expensive. Structuring agent prompts correctly can significantly reduce API costs.

### Change to: `CLAUDE.md` (new section after Operating Principles)

```
## Context Ordering (Cost Optimization)

When constructing agent prompts, order content from most stable to most volatile:

1. **STABLE** (identical across invocations): Agent identity, role, rules, scope, output contract
2. **SEMI-STABLE** (same within a session): Project context, conventions, quality gate criteria
3. **VOLATILE** (changes every spawn): Inherited context, specific task, input artifacts

This ordering maximises prompt cache hits across agent spawns.
The spawn templates are already structured this way: identity first, task last.
```

### Change to: spawn templates

Reorder each template to enforce this. Current templates already mostly follow this pattern,
but make it explicit by grouping with comments:

```
### Spawn Maker
[STABLE - same every time this agent type is spawned]
You are the Blue Maker agent.
SCOPE: Build to spec. Do not redesign. Do not skip tests.
ESCALATE: If spec is ambiguous or you hit a blocking dependency.

[SEMI-STABLE - same within this session/project]
PROJECT CONVENTIONS: [Manager fills from CLAUDE.md or project context if relevant]

[VOLATILE - unique to this specific dispatch]
## Inherited Context
[Manager fills: mission, prior findings, constraints, decisions made]

## Task
TASK: [describe what to build]
INPUT: [reference design spec]
OUTPUT: Working, tested code with documentation.
FORMAT: Code files + a DONE.md summarizing what was built and how to verify.
```

---

## 5. Completion Notification Contract

**What:** Claude Code agents signal completion with structured notifications: status, duration, artifacts, summary, blockers. No ambiguity about whether an agent is done or what it produced.

**Why:** In parallel fan-out, the Manager needs to know exactly what each agent delivered, whether it succeeded, and what (if anything) is blocked. Free-form responses require the Manager to parse and interpret, wasting context.

### Change to: each agent definition in `.claude/agents/`

**Add to each agent's Output Contract:**

```
### Completion Signal

End every response with a structured completion block:

---
**STATUS:** completed | failed | needs_input
**ARTIFACTS:** [list of files created/modified with paths]
**SUMMARY:** [one paragraph: what was done, key decisions, anything notable]
**BLOCKERS:** none | [description of what's blocking]
**HANDOFF READY:** yes | no (is the output ready for the next stage?)
---
```

### Change to: `.claude/agents/manager.md`

**Add to Rules:**

```
- **Parse completion signals.** When an agent finishes, read its completion block before deciding next steps. If STATUS is not "completed" or HANDOFF READY is "no", investigate before proceeding.
```

---

## 6. Tool Boundary Enforcement

**What:** Claude Code filters available tools by agent type. Built-in agents get full access; custom agents lose coordination tools; async agents get only safe read operations.

**Why:** Role boundaries are stronger when enforced by capability, not just instruction. A Researcher told "don't build anything" might still try. A Researcher without Write/Edit/Bash tools physically cannot.

### Change to: `.claude/agents/researcher.md`

Current tools: `Read, Glob, Grep, WebSearch, WebFetch`
**No change needed.** Already correctly scoped (read-only + web).

### Change to: `.claude/agents/designer.md`

Current tools: `Read, Glob, Grep, Write, Edit`
**No change needed.** Needs Write/Edit for design docs and specs.

### Change to: `.claude/agents/maker.md`

Current tools: `Read, Glob, Grep, Write, Edit, Bash`
**No change needed.** Needs full build tools.

### Change to: `.claude/agents/marketer.md`

Current tools: `Read, Glob, Grep, Write, Edit, WebSearch, WebFetch`
**Consider removing Bash.** (Already absent, good.)
**No change needed.** Correctly scoped.

### Change to: `.claude/agents/manager.md`

Current tools: `Read, Glob, Grep, Write, Edit, Bash, Agent`
**Consider removing Bash.** The Manager orchestrates; it shouldn't be running shell commands. If it needs something executed, it should dispatch a Maker.

Proposed: `Read, Glob, Grep, Write, Edit, Agent`

**Rationale:** Removing Bash enforces "delegate, don't do." If the Manager has Bash, it's tempted to "just quickly check something" instead of delegating properly. This is the same principle Claude Code uses: coordinators don't have execution tools.

---

## Implementation Order

1. **Completion Notification Contract** (low risk, immediate clarity improvement)
2. **Synthesis-Before-Delegation** (medium effort, prevents context degradation)
3. **Risk Protocol** (adds safety without changing flow)
4. **Inherited Context** (biggest impact on agent quality)
5. **Tool Boundary Enforcement** (one-line change to manager.md)
6. **Cache-Aware Context Ordering** (cost optimization, apply last)

---

## What NOT to Change

- The five-agent colour model (superior to Claude Code's generic typing)
- Quality gates between stages (more rigorous than Claude Code's approach)
- Filesystem-as-truth (already well-implemented)
- The venture metaskill (higher-order abstraction Claude Code doesn't have)
- Pixel agents integration (unique to Octopus)

---

*Proposed by Dr. Lars Mortensen, 2026-04-01*
*Source: Claude Code source analysis + Octopus v2 architecture review*
