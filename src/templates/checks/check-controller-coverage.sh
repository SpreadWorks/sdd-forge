#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
DOC_FILE="${1:-$ROOT_DIR/docs/08_controller_routes.md}"
CONTROLLER_DIR="$ROOT_DIR/app/Controller"

if [[ ! -f "$DOC_FILE" ]]; then
  echo "[FAIL] missing doc file: $DOC_FILE"
  exit 1
fi

if [[ ! -d "$CONTROLLER_DIR" ]]; then
  echo "[FAIL] missing controller dir: $CONTROLLER_DIR"
  exit 1
fi

missing=0
total=0

for file in "$CONTROLLER_DIR"/*Controller.php; do
  [[ -f "$file" ]] || continue
  base=$(basename "$file" .php)
  controller_name="${base%Controller}"

  # AppController は除外
  if [[ "$controller_name" == "App" ]]; then
    continue
  fi

  total=$((total+1))
  if ! grep -Fq "$controller_name" "$DOC_FILE"; then
    echo "[MISS] $controller_name"
    missing=$((missing+1))
  fi
done

covered=$((total-missing))
echo "Controller coverage: $covered/$total"

if (( missing > 0 )); then
  echo "controller coverage check: FAILED"
  exit 1
fi

echo "controller coverage check: PASSED"
