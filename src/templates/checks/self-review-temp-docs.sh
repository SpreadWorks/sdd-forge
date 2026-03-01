#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_ROOT="${SDD_SOURCE_ROOT:-$(pwd)}"
TARGET_DIR="${1:-$SOURCE_ROOT/docs}"

echo "# self-review start"

bash "$SCRIPT_DIR/check-temp-docs.sh" "$TARGET_DIR"
bash "$SCRIPT_DIR/check-controller-coverage.sh" "$TARGET_DIR/08_controller_routes.md"
bash "$SCRIPT_DIR/check-db-coverage.sh" "$TARGET_DIR/07_db_tables.md"

# README.md 存在チェック（WARN のみ、FAIL にはしない）
if [ ! -f "$SOURCE_ROOT/README.md" ]; then
  echo "WARN: README.md not found. Run 'sdd-forge readme' to generate."
fi

echo "self-review: PASSED"
