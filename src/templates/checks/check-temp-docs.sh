#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="${SDD_SOURCE_ROOT:-$(pwd)}"
TARGET_DIR="${1:-$SOURCE_ROOT/docs}"

required_files=(
  "01_architecture.md"
  "02_stack_and_ops.md"
  "03_project_structure.md"
  "04_development.md"
  "05_auth_and_session.md"
  "06_database_architecture.md"
  "07_db_tables.md"
  "08_controller_routes.md"
  "09_business_logic.md"
  "10_batch_and_shell.md"
)

fail=0

for f in "${required_files[@]}"; do
  path="$TARGET_DIR/$f"
  if [[ ! -f "$path" ]]; then
    echo "[FAIL] missing file: $path"
    fail=1
    continue
  fi
  if ! grep -qE '^## 説明' "$path"; then
    echo "[FAIL] missing section '## 説明': $path"
    fail=1
  fi
  if ! grep -qE '^## 内容' "$path"; then
    echo "[FAIL] missing section '## 内容': $path"
    fail=1
  fi
done

change_log="$TARGET_DIR/change_log.md"
if [[ ! -f "$change_log" ]]; then
  echo "[WARN] missing file: $change_log (skipped)"
else
  if ! grep -qE '^<!-- AUTO-GEN:START -->' "$change_log"; then
    echo "[FAIL] missing AUTO-GEN start marker: $change_log"
    fail=1
  fi
  if ! grep -qE '^<!-- MANUAL:START -->' "$change_log"; then
    echo "[FAIL] missing MANUAL start marker: $change_log"
    fail=1
  fi
  if ! grep -qE 'シリーズ最新インデックス' "$change_log"; then
    echo "[FAIL] missing series index section: $change_log"
    fail=1
  fi
fi

check_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if ! grep -qE "$pattern" "$TARGET_DIR/$file"; then
    echo "[FAIL] $file: missing $label"
    fail=1
  fi
}

# CakePHP 固有キーワードチェック
check_contains "02_stack_and_ops.md" "フロントエンド|エラーハンドリング|bootstrap|メール通知" "frontend/error/bootstrap/email sections"
check_contains "03_project_structure.md" "Lib/|ヘルパー|レイアウト" "lib/helper/layout sections"
check_contains "04_development.md" "テスト構成|コントローラテスト" "test structure"
check_contains "04_development.md" "const.php|SELECT_" "constants reference"
check_contains "04_development.md" "docker-compose|make up|Makefile" "development operations"
check_contains "05_auth_and_session.md" "AuthComponent|セッション|ACL" "auth/session note"
check_contains "06_database_architecture.md" "cms|contents_staging|contents" "multi-db config"
check_contains "07_db_tables.md" "外部キー|FK|INDEX" "foreign key section"
check_contains "08_controller_routes.md" "routes.php|Router" "routing config"
check_contains "08_controller_routes.md" "CSV/Excel|CSV インポート" "csv operations"
check_contains "05_auth_and_session.md" "ACL 権限マトリクス|ロール" "acl matrix"
check_contains "06_database_architecture.md" "erDiagram|ER 図" "ER diagram"
check_contains "09_business_logic.md" "Model/Logic|JASRAC|Crankin" "business logic note"
check_contains "09_business_logic.md" "TitlesGraphController|Logic クラス構成" "logic methods/mapping"
check_contains "10_batch_and_shell.md" "Shell|Console|Shell 実行フロー" "batch/shell note"

min_lines=20
for f in "${required_files[@]}"; do
  path="$TARGET_DIR/$f"
  [[ -f "$path" ]] || continue
  lines=$(wc -l < "$path")
  if (( lines < min_lines )); then
    echo "[FAIL] too short ($lines lines): $path"
    fail=1
  fi
done

if (( fail != 0 )); then
  echo "docs quality check: FAILED"
  exit 1
fi

echo "docs quality check: PASSED"
