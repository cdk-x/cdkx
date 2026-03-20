#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Guards ───────────────────────────────────────────────────────────────────
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "Error: .sandcastle/.env not found. Copy .env.exmaple and fill in the tokens."
  exit 1
fi

if ! grep -q "CLAUDE_CODE_OAUTH_TOKEN=." "$SCRIPT_DIR/.env"; then
  echo "Error: CLAUDE_CODE_OAUTH_TOKEN is empty in .sandcastle/.env"
  exit 1
fi

# ── Gather context ────────────────────────────────────────────────────────────
echo "→ Fetching open GitHub issues..."
ISSUES=$(gh issue list \
  --state open \
  --json number,title,body,comments,labels \
  --limit 100)

echo "→ Fetching recent RALPH commits..."
RALPH_COMMITS=$(git -C "$REPO_ROOT" log \
  --format="%H %ai %s" \
  --max-count=10 \
  --grep="Agent: ralph" 2>/dev/null || true)
if [ -z "$RALPH_COMMITS" ]; then
  RALPH_COMMITS="(no RALPH commits yet)"
fi

# ── Build image ───────────────────────────────────────────────────────────────
echo "→ Building Docker image..."
docker build --quiet -t cdkx-ralph "$SCRIPT_DIR"

# ── Assemble full prompt ──────────────────────────────────────────────────────
PROMPT_FILE=$(mktemp /tmp/ralph-prompt-XXXXXX)
trap 'rm -f "$PROMPT_FILE"' EXIT

cat > "$PROMPT_FILE" <<PROMPT
## Issues JSON

\`\`\`json
$ISSUES
\`\`\`

## Recent RALPH commits (last 10)

\`\`\`
$RALPH_COMMITS
\`\`\`

$(cat "$SCRIPT_DIR/prompt.md")
PROMPT

# ── Run container ─────────────────────────────────────────────────────────────
echo "→ Starting RALPH agent..."
docker run --rm \
  --entrypoint bash \
  --env-file "$SCRIPT_DIR/.env" \
  -v "$REPO_ROOT:/home/agent/repos/cdkx" \
  -v "$PROMPT_FILE:/tmp/ralph-prompt:ro" \
  -v "$HOME/.gitconfig:/tmp/host-gitconfig:ro" \
  -w /home/agent/repos/cdkx \
  cdkx-ralph \
  -c '
    cp /tmp/host-gitconfig /home/agent/.gitconfig
    git config --global --add safe.directory /home/agent/repos/cdkx
    git config --global credential.helper "!gh auth git-credential"
    claude -p "$(cat /tmp/ralph-prompt)" --dangerously-skip-permissions
  '
