#!/bin/bash
# Octopus startup banner — per-letter colored ASCII art
# OPTIONAL: This script is NOT auto-loaded. Run manually: bash .claude/octopus-banner.sh
# Or add to your own hooks if you want it on session start.
# Letters: O C (Yellow) | T O (Red-Orange) | P (Blue) | U (Green) | S (Purple)

# Colors
Y='\033[1;33m'   # Yellow (O, C)
R='\033[1;31m'   # Red-Orange (T, O)
B='\033[1;34m'   # Blue (P)
G='\033[1;32m'   # Green (U)
P='\033[1;35m'   # Purple (S)
W='\033[1;37m'   # White (bold)
D='\033[0;90m'   # Dim
N='\033[0m'      # Reset

echo ""
echo -e "${Y} ████   ████ ${N} ${R}██████  ████ ${N} ${B}█████ ${N} ${G}██  ██${N} ${P}██████${N}"
echo -e "${Y}██  ██ ██    ${N} ${R}  ██   ██  ██${N} ${B}██  ██${N} ${G}██  ██${N} ${P}██    ${N}"
echo -e "${Y}██  ██ ██    ${N} ${R}  ██   ██  ██${N} ${B}█████ ${N} ${G}██  ██${N} ${P}██████${N}"
echo -e "${Y}██  ██ ██    ${N} ${R}  ██   ██  ██${N} ${B}██    ${N} ${G}██  ██${N} ${P}    ██${N}"
echo -e "${Y} ████   ████ ${N} ${R}  ██    ████ ${N} ${B}██    ${N} ${G} ████ ${N} ${P}██████${N}"
echo ""
echo -e "${W} Multi-Agent Orchestration OS${N}"
echo -e "${D} Five agents. One orchestrator. Ship anything.${N}"
echo ""
echo -e " ${Y}Yellow${N} Researcher  ${R}Red-Orange${N} Designer  ${B}Blue${N} Maker  ${G}Green${N} Marketer  ${P}Purple${N} Manager"
echo ""
