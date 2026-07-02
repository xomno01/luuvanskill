#!/usr/bin/env bash
# luuvanskill — Codex install script
# Copies skills to ~/.agents/skills/ and AGENTS.md to ~/.codex/AGENTS.md
# Usage: bash install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$HOME/.agents/skills"
CODEX_DIR="$HOME/.codex"

echo "=== luuvanskill Codex Install ==="

# Create target directories
mkdir -p "$AGENTS_DIR"
mkdir -p "$CODEX_DIR"

# Install AGENTS.md (global Codex instructions)
cp "$SCRIPT_DIR/AGENTS.md" "$CODEX_DIR/AGENTS.md"
echo "[OK] ~/.codex/AGENTS.md"

# Install each skill
for skill_dir in "$SCRIPT_DIR/skills"/*/; do
    skill_name=$(basename "$skill_dir")
    target="$AGENTS_DIR/$skill_name"
    mkdir -p "$target"
    cp "$skill_dir/SKILL.md" "$target/SKILL.md"
    echo "[OK] ~/.agents/skills/$skill_name/SKILL.md"
done

echo ""
echo "Done! $(ls "$SCRIPT_DIR/skills" | wc -l | tr -d ' ') skills installed."
echo "Invoke with: \$skill-name (e.g. \$ecc, \$senior-dev, \$debugger)"
echo ""
echo "To update later: git pull && bash codex/install.sh"
