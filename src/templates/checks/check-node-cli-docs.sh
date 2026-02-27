#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
TARGET_DIR="${1:-$ROOT_DIR/docs}"

echo "# check-node-cli-docs start"

required_files=(
  "01_overview.md"
  "02_cli_commands.md"
  "03_configuration.md"
  "04_internal_design.md"
  "05_development.md"
)

fail=0

# -----------------------------------------------------------------------
# 1. ファイル存在・必須セクションチェック
# -----------------------------------------------------------------------
for f in "${required_files[@]}"; do
  fpath="$TARGET_DIR/$f"
  if [[ ! -f "$fpath" ]]; then
    echo "[FAIL] missing file: $fpath"
    fail=1
    continue
  fi
  if ! grep -qE '^## 説明' "$fpath"; then
    echo "[FAIL] missing section '## 説明': $fpath"
    fail=1
  fi
  if ! grep -qE '^## 内容' "$fpath"; then
    echo "[FAIL] missing section '## 内容': $fpath"
    fail=1
  fi
done

# -----------------------------------------------------------------------
# 2. 未解決 @text-fill ディレクティブ チェック
#    ディレクティブ行の直後に（空行を挟んで）コンテンツがなければ unfilled と判定
# -----------------------------------------------------------------------
for f in "${required_files[@]}"; do
  fpath="$TARGET_DIR/$f"
  [[ -f "$fpath" ]] || continue

  while IFS= read -r line_num; do
    # ディレクティブ行の次から最初の非空行を探す
    next_nonempty=$(awk -v start="$((line_num + 1))" \
      'NR >= start && /[^ \t]/ {print; exit}' "$fpath")
    # 次の非空行が「## 」レベル2見出し・別のディレクティブ・または空ならば unfilled
    # （####等のAI生成サブセクション見出しはfilled扱い）
    if [[ -z "$next_nonempty" ]] || \
       echo "$next_nonempty" | grep -qE '^(## |<!-- @(text|data)-fill:)'; then
      echo "[FAIL] unfilled @text-fill directive in $f (line $line_num)"
      fail=1
    fi
  done < <(grep -n '<!-- @text-fill:' "$fpath" | cut -d: -f1)
done

# -----------------------------------------------------------------------
# 3. 最小行数チェック（各ファイル 30 行以上）
# -----------------------------------------------------------------------
min_lines=30
for f in "${required_files[@]}"; do
  fpath="$TARGET_DIR/$f"
  [[ -f "$fpath" ]] || continue
  lines=$(wc -l < "$fpath")
  if (( lines < min_lines )); then
    echo "[FAIL] too short ($lines lines, min $min_lines): $f"
    fail=1
  fi
done

# -----------------------------------------------------------------------
# 4. 内容品質チェック（章ごとのキーワード）
# -----------------------------------------------------------------------
check_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  local fpath="$TARGET_DIR/$file"
  [[ -f "$fpath" ]] || return 0
  if ! grep -qE "$pattern" "$fpath"; then
    echo "[FAIL] $file: missing $label"
    fail=1
  fi
}

# 01: ツール概要
check_contains "01_overview.md" "mermaid|flowchart|graph" "architecture diagram"
check_contains "01_overview.md" "コンセプト|概念|用語" "key concepts"
check_contains "01_overview.md" "フロー|手順|ステップ" "typical flow"

# 02: CLI コマンドリファレンス
check_contains "02_cli_commands.md" "\| .* \|" "command table"
check_contains "02_cli_commands.md" "オプション|--" "options"
check_contains "02_cli_commands.md" "終了コード|exit" "exit codes"

# 03: 設定とカスタマイズ
check_contains "03_configuration.md" "config\.json|設定ファイル" "config file"
check_contains "03_configuration.md" "環境変数|SDD_" "environment variables"

# 04: 内部設計
check_contains "04_internal_design.md" "mermaid|graph|依存" "dependency diagram"
check_contains "04_internal_design.md" "モジュール|module" "module list"

# 05: 開発・テスト・配布
check_contains "05_development.md" "npm|install|link" "setup steps"
check_contains "05_development.md" "テスト|test" "testing"
check_contains "05_development.md" "リリース|publish|バージョン" "release"

# -----------------------------------------------------------------------
# 5. README.md 存在チェック（WARN のみ）
# -----------------------------------------------------------------------
if [[ ! -f "$ROOT_DIR/README.md" ]]; then
  echo "WARN: README.md not found. Run 'sdd-forge readme' to generate."
fi

if (( fail != 0 )); then
  echo "docs quality check: FAILED"
  exit 1
fi

echo "docs quality check: PASSED"
