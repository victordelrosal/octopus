#!/bin/bash
# Octopus Installer
# Installs the `octopus` terminal command for Claude Code.
# Safe: idempotent, append-only, never touches existing config.

set -e

# Colors
PURPLE='\033[1;35m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
RED='\033[1;31m'
DIM='\033[0;90m'
RESET='\033[0m'

echo ""
echo -e "${PURPLE}  Octopus Installer${RESET}"
echo -e "${PURPLE}  Multi-Agent Orchestration OS${RESET}"
echo ""

# Resolve script directory (where octopus repo files live)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Verify required files exist
if [[ ! -f "$SCRIPT_DIR/octopus-banner.sh" ]]; then
  echo -e "${RED}  Error: octopus-banner.sh not found in $SCRIPT_DIR${RESET}"
  echo -e "${RED}  Run this script from the octopus project directory.${RESET}"
  exit 1
fi

if [[ ! -f "$SCRIPT_DIR/octopus.md" ]]; then
  echo -e "${RED}  Error: octopus.md not found in $SCRIPT_DIR${RESET}"
  echo -e "${RED}  Run this script from the octopus project directory.${RESET}"
  exit 1
fi

# Step 1: Ensure ~/.claude/ exists
echo -e "${BLUE}  [1/3]${RESET} Copying files to ~/.claude/"
mkdir -p ~/.claude

# Copy banner script
cp "$SCRIPT_DIR/octopus-banner.sh" ~/.claude/octopus-banner.sh
chmod +x ~/.claude/octopus-banner.sh
echo -e "${DIM}        ~/.claude/octopus-banner.sh${RESET}"

# Copy octopus.md (the system prompt)
cp "$SCRIPT_DIR/octopus.md" ~/.claude/octopus.md
echo -e "${DIM}        ~/.claude/octopus.md${RESET}"

# Step 2: Append octopus() function to ~/.zshrc (guarded)
echo -e "${BLUE}  [2/3]${RESET} Adding octopus() to ~/.zshrc"

MARKER="# >>> octopus-cli >>>"
if grep -qF "$MARKER" ~/.zshrc 2>/dev/null; then
  echo -e "${YELLOW}        Already present in ~/.zshrc (skipping)${RESET}"
  echo -e "${DIM}        To update, remove the octopus block from ~/.zshrc and re-run.${RESET}"
else
  cat >> ~/.zshrc << 'ZSHRC_BLOCK'

# >>> octopus-cli >>>
# Octopus - Multi-Agent Orchestration OS for Claude Code
# https://github.com/victordelrosal/octopus
octopus() {
  # Show the 5-color ASCII banner
  ~/.claude/octopus-banner.sh

  # Model selection
  local model_name=""
  if [[ "$1" == "--sonnet" ]]; then
    shift
    model_name="sonnet"
    echo -e "\033[1;36m  Sonnet selected\033[0m"
  elif [[ "$1" == "--opus" ]]; then
    shift
    model_name="opus"
    echo -e "\033[1;35m  Opus selected\033[0m"
  elif [[ "$1" == "--haiku" ]]; then
    shift
    model_name="haiku"
    echo -e "\033[1;33m  Haiku selected\033[0m"
  else
    # Interactive model selection
    echo ""
    echo -e "\033[1;33m  Which model?\033[0m"
    echo -e "    \033[1;35m[1]\033[0m Opus    (full power)"
    echo -e "    \033[1;36m[2]\033[0m Sonnet  (balanced)"
    echo -e "    \033[1;33m[3]\033[0m Haiku   (fast + cheap)"
    echo ""
    read -k 1 "model_choice?  > "
    echo ""
    if [[ "$model_choice" == "2" || "$model_choice" == "s" || "$model_choice" == "S" ]]; then
      model_name="sonnet"
      echo -e "\033[1;36m  Sonnet selected\033[0m"
    elif [[ "$model_choice" == "3" || "$model_choice" == "h" || "$model_choice" == "H" ]]; then
      model_name="haiku"
      echo -e "\033[1;33m  Haiku selected\033[0m"
    else
      model_name="opus"
      echo -e "\033[1;35m  Opus selected\033[0m"
    fi
    echo ""
  fi

  # Launch Claude Code with Octopus system prompt injected
  claude --dangerously-skip-permissions --model "$model_name" \
    --append-system-prompt "$(cat ~/.claude/octopus.md)" "$@"
}
# <<< octopus-cli <<<
ZSHRC_BLOCK
  echo -e "${GREEN}        Added to ~/.zshrc${RESET}"
fi

# Step 3: Done
echo -e "${BLUE}  [3/3]${RESET} Verifying installation"
echo ""
echo -e "${GREEN}  Done! Octopus is installed.${RESET}"
echo ""
echo -e "  ${YELLOW}Next steps:${RESET}"
echo -e "    1. Run: ${PURPLE}source ~/.zshrc${RESET}"
echo -e "    2. Type: ${PURPLE}octopus${RESET} from any directory"
echo ""
echo -e "  ${YELLOW}Usage:${RESET}"
echo -e "    ${DIM}octopus${RESET}            Interactive model selection"
echo -e "    ${DIM}octopus --opus${RESET}      Use Opus directly"
echo -e "    ${DIM}octopus --sonnet${RESET}    Use Sonnet directly"
echo -e "    ${DIM}octopus --haiku${RESET}     Use Haiku directly"
echo ""
echo -e "  ${YELLOW}Uninstall:${RESET}"
echo -e "    1. Remove the ${DIM}# >>> octopus-cli >>>${RESET} block from ~/.zshrc"
echo -e "    2. Delete: ${DIM}rm ~/.claude/octopus-banner.sh ~/.claude/octopus.md${RESET}"
echo ""
