# OCTOPUS

**Multi-Agent Orchestration OS**

Five agents. One orchestrator. Ship anything.

```
   ___   ____ _____ ___  ____  _   _ ____
  / _ \ / ___|_   _/ _ \|  _ \| | | / ___|
 | | | | |     | || | | | |_) | | | \___ \
 | |_| | |___  | || |_| |  __/| |_| |___) |
  \___/ \____| |_| \___/|_|    \___/|____/
```

## What is Octopus?

Octopus turns your AI coding terminal into a five-agent team. You are the Purple Manager: the orchestrator. You delegate to four specialist agents (Researcher, Designer, Maker, Marketer), coordinate their work, and synthesize results.

| Agent | Color | Role |
|-------|-------|------|
| Researcher | Yellow | Intelligence and analysis |
| Designer | Red-Orange | Solutions and architecture |
| Maker | Blue | Building and deployment |
| Marketer | Green | Distribution and growth |
| Manager | Purple | Orchestration (the Octopus) |

## Install

### Option A: Terminal command (recommended)

Install `octopus` as a global command. Works from any directory.

```bash
git clone https://github.com/victordelrosal/octopus
cd octopus && bash install.sh
source ~/.zshrc
octopus
```

The installer copies two files to `~/.claude/` and appends a shell function to `~/.zshrc`. That's it. Nothing else is touched.

```
octopus              # Interactive model selection
octopus --opus       # Use Opus directly
octopus --sonnet     # Use Sonnet directly
octopus --haiku      # Use Haiku directly
```

### Option B: Project mode (Claude Code)

```bash
git clone https://github.com/victordelrosal/octopus
cd octopus && claude
```

CLAUDE.md and agent definitions load automatically. No hooks, no settings.json, no config changes. Your existing setup stays untouched.

### Option C: Any LLM terminal tool

Add [`octopus.md`](octopus.md) to your system prompt or project context. Works with Codex CLI, Gemini CLI, OpenCode, or any terminal with tool use.

### Option D: Let AI do it

Already in Claude Code? Just tell it:

```
Clone https://github.com/victordelrosal/octopus and set it up for me
```

**Web:** [victordelrosal.com/octopus](https://victordelrosal.com/octopus/)

**Safety:** Octopus never touches your system config beyond what the installer explicitly does (append to `.zshrc` with clear markers, copy two files to `~/.claude/`). No settings.json, no hooks, no surprises.

## Commands

Type these naturally in an Octopus session:

| Command | What Happens |
|---------|-------------|
| `research [topic]` | Spawn Yellow Researcher agent |
| `design [brief]` | Spawn Red-Orange Designer agent |
| `build [spec]` | Spawn Blue Maker agent |
| `market [product]` | Spawn Green Marketer agent |
| `sprint [goal]` | Full pipeline: research > design > build > market |
| `team [tasks]` | Parallel fan-out to multiple agents |
| `review [work]` | Iterative review loop between two agents |
| `help` | Show available agents and commands |

## How It Works

1. The **Purple Manager** (you or the lead agent) receives a task
2. It decomposes the task into stages assigned to specialist agents
3. Agents execute in **sequential pipelines**, **parallel fan-outs**, or **review loops**
4. The Manager enforces quality gates between stages
5. Results are synthesized and delivered

## What's Here

| File | Purpose |
|------|---------|
| [`octopus.md`](octopus.md) | **The OS.** System prompt with agent definitions, orchestration patterns, spawn templates, and commands. |
| [`install.sh`](install.sh) | Terminal command installer. Copies files to `~/.claude/`, adds `octopus()` to `.zshrc`. |
| [`octopus-banner.sh`](octopus-banner.sh) | 5-color ASCII banner script (one color per agent). |
| [`.claude/agents/`](.claude/agents/) | Claude Code subagent definitions for all five agent types. |
| [`octopus-concept.md`](octopus-concept.md) | Conceptual paper: orchestration theory, security models, anti-patterns. |
| [`octopus-concept-generic.md`](octopus-concept-generic.md) | Platform-agnostic version of the conceptual paper. |

## Uninstall

1. Remove the `# >>> octopus-cli >>>` block from `~/.zshrc`
2. Delete: `rm ~/.claude/octopus-banner.sh ~/.claude/octopus.md`

## Sources

Built on frameworks from Google DeepMind (Intelligent AI Delegation), Claude Code (Agent Teams), and the Five Innovators model.

## Author

Victor del Rosal / [fiveinnolabs](https://fiveinnolabs.com) / March 2026

## License

Open. Use it to ship faster.
