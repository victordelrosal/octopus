#!/bin/bash
# Octopus ASCII Banner - 5-color display for multi-agent orchestration OS
# Each line uses the agent color: Yellow, Red-Orange, Blue, Green, Purple

# Yellow (Researcher)
printf '\e[38;2;255;193;7m'
printf ' ████   ████  ██████  ████  █████  ██  ██ ██████\n'

# Red-Orange (Designer)
printf '\e[38;2;255;87;34m'
printf '██  ██ ██       ██   ██  ██ ██  ██ ██  ██ ██\n'

# Blue (Maker)
printf '\e[38;2;66;133;244m'
printf '██  ██ ██       ██   ██  ██ █████  ██  ██ ██████\n'

# Green (Marketer)
printf '\e[38;2;76;175;80m'
printf '██  ██ ██       ██   ██  ██ ██     ██  ██     ██\n'

# Purple (Manager)
printf '\e[38;2;156;39;176m'
printf ' ████   ████    ██    ████  ██      ████  ██████\n'

# Tagline in purple
printf '\e[38;2;156;39;176m'
printf '\n Multi-Agent Orchestration OS\n'
printf ' Five agents. One orchestrator. Ship anything.\n'

# Reset
printf '\e[0m\n'
