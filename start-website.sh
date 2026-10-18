#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Node.js is required. Install a current Node.js LTS release from https://nodejs.org/en/download, then run this launcher again.' >&2
  exit 1
fi

if ! node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 12) ? 0 : 1)'; then
  printf '%s\n' 'This website requires Node.js 22.12 or newer. Install a current LTS release from https://nodejs.org/en/download, then run this launcher again.' >&2
  exit 1
fi

exec node "$PROJECT_DIR/scripts/start-local.mjs" "$@"
