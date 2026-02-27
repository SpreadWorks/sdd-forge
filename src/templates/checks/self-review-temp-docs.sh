#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
TARGET_DIR="${1:-$ROOT_DIR/docs}"

echo "# self-review start"

bash "$ROOT_DIR/sdd-forge/templates/checks/check-temp-docs.sh" "$TARGET_DIR"
bash "$ROOT_DIR/sdd-forge/templates/checks/check-controller-coverage.sh" "$TARGET_DIR/08_controller_routes.md"
bash "$ROOT_DIR/sdd-forge/templates/checks/check-db-coverage.sh" "$TARGET_DIR/07_db_tables.md"

# README.md 存在チェック（WARN のみ、FAIL にはしない）
if [ ! -f "$ROOT_DIR/README.md" ]; then
  echo "WARN: README.md not found. Run 'npm run sdd:readme' to generate."
fi

echo "self-review: PASSED"
