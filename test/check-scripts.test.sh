#!/usr/bin/env bash
# test/check-scripts.test.sh
#
# check スクリプト群が SDD_SOURCE_ROOT を正しく参照するかテストする。
# スクリプト位置（パッケージ内）とプロジェクトルートが異なる状況をシミュレート。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CHECKS_DIR="$REPO_ROOT/src/templates/checks"

passed=0
failed=0
total=0

run_test() {
  local name="$1"
  shift
  total=$((total + 1))
  echo -n "  $name ... "
  if "$@" > /dev/null 2>&1; then
    echo "PASS"
    passed=$((passed + 1))
  else
    echo "FAIL"
    failed=$((failed + 1))
  fi
}

run_test_expect_fail() {
  local name="$1"
  shift
  total=$((total + 1))
  echo -n "  $name ... "
  if "$@" > /dev/null 2>&1; then
    echo "FAIL (expected failure but got success)"
    failed=$((failed + 1))
  else
    echo "PASS"
    passed=$((passed + 1))
  fi
}

run_test_output_contains() {
  local name="$1"
  local pattern="$2"
  shift 2
  total=$((total + 1))
  echo -n "  $name ... "
  local output
  output=$("$@" 2>&1) || true
  if echo "$output" | grep -qF "$pattern"; then
    echo "PASS"
    passed=$((passed + 1))
  else
    echo "FAIL (pattern '$pattern' not found)"
    echo "    output: $output"
    failed=$((failed + 1))
  fi
}

# -----------------------------------------------------------------------
# ヘルパー: 30行のパディングを生成
# -----------------------------------------------------------------------
generate_padding() {
  local n="${1:-30}"
  for i in $(seq 1 "$n"); do
    echo "padding line $i"
  done
}

# -----------------------------------------------------------------------
# テスト用フェイクプロジェクトを作成
# -----------------------------------------------------------------------
FAKE_PROJECT="$(mktemp -d)"
trap 'rm -rf "$FAKE_PROJECT"' EXIT

mkdir -p "$FAKE_PROJECT/docs"
mkdir -p "$FAKE_PROJECT/app/Controller"
mkdir -p "$FAKE_PROJECT/app/Model"
mkdir -p "$FAKE_PROJECT/specs"
touch "$FAKE_PROJECT/README.md"

# -----------------------------------------------------------------------
# 1. check-controller-coverage.sh
# -----------------------------------------------------------------------
echo "## check-controller-coverage.sh"

# 1a: コントローラが docs に記載されていれば PASS
cat > "$FAKE_PROJECT/app/Controller/TitlesController.php" << 'PHP'
<?php class TitlesController extends AppController {}
PHP
cat > "$FAKE_PROJECT/app/Controller/AppController.php" << 'PHP'
<?php class AppController extends Controller {}
PHP
cat > "$FAKE_PROJECT/docs/08_controller_routes.md" << 'MD'
## Titles
TitlesController handles title management.
MD

run_test "PASS when controller covered" \
  env SDD_SOURCE_ROOT="$FAKE_PROJECT" bash "$CHECKS_DIR/check-controller-coverage.sh" "$FAKE_PROJECT/docs/08_controller_routes.md"

# 1b: コントローラが docs に記載されていなければ FAIL
cat > "$FAKE_PROJECT/app/Controller/UsersController.php" << 'PHP'
<?php class UsersController extends AppController {}
PHP

run_test_expect_fail "FAIL when controller missing from docs" \
  env SDD_SOURCE_ROOT="$FAKE_PROJECT" bash "$CHECKS_DIR/check-controller-coverage.sh" "$FAKE_PROJECT/docs/08_controller_routes.md"

run_test_output_contains "output shows MISS for uncovered controller" "[MISS] Users" \
  env SDD_SOURCE_ROOT="$FAKE_PROJECT" bash "$CHECKS_DIR/check-controller-coverage.sh" "$FAKE_PROJECT/docs/08_controller_routes.md"

# 1c: SDD_SOURCE_ROOT 未設定でも cwd から動作する
rm "$FAKE_PROJECT/app/Controller/UsersController.php"
run_test "PASS with cwd fallback (no SDD_SOURCE_ROOT)" \
  env -u SDD_SOURCE_ROOT bash -c "cd '$FAKE_PROJECT' && bash '$CHECKS_DIR/check-controller-coverage.sh' '$FAKE_PROJECT/docs/08_controller_routes.md'"

# -----------------------------------------------------------------------
# 2. check-db-coverage.sh
# -----------------------------------------------------------------------
echo "## check-db-coverage.sh"

# 2a: モデルのテーブルが docs に記載されていれば PASS
cat > "$FAKE_PROJECT/app/Model/Title.php" << 'PHP'
<?php class Title extends AppModel {}
PHP
cat > "$FAKE_PROJECT/app/Model/AppModel.php" << 'PHP'
<?php class AppModel extends Model {}
PHP
cat > "$FAKE_PROJECT/docs/07_db_tables.md" << 'MD'
## Tables
titles table stores title data.
MD

run_test "PASS when table covered" \
  env SDD_SOURCE_ROOT="$FAKE_PROJECT" bash "$CHECKS_DIR/check-db-coverage.sh" "$FAKE_PROJECT/docs/07_db_tables.md"

# 2b: モデルのテーブルが docs に記載されていなければ FAIL
cat > "$FAKE_PROJECT/app/Model/CastMember.php" << 'PHP'
<?php class CastMember extends AppModel {}
PHP

run_test_expect_fail "FAIL when table missing from docs" \
  env SDD_SOURCE_ROOT="$FAKE_PROJECT" bash "$CHECKS_DIR/check-db-coverage.sh" "$FAKE_PROJECT/docs/07_db_tables.md"

run_test_output_contains "output shows MISS for uncovered table" "[MISS] table cast_members" \
  env SDD_SOURCE_ROOT="$FAKE_PROJECT" bash "$CHECKS_DIR/check-db-coverage.sh" "$FAKE_PROJECT/docs/07_db_tables.md"

# 2c: $useTable が設定されているケース
cat > "$FAKE_PROJECT/app/Model/SpecialModel.php" << 'PHP'
<?php class SpecialModel extends AppModel {
  public $useTable = 'custom_table';
}
PHP
cat >> "$FAKE_PROJECT/docs/07_db_tables.md" << 'MD'
cast_members table.
custom_table for special data.
MD

run_test "PASS with useTable override" \
  env SDD_SOURCE_ROOT="$FAKE_PROJECT" bash "$CHECKS_DIR/check-db-coverage.sh" "$FAKE_PROJECT/docs/07_db_tables.md"

# -----------------------------------------------------------------------
# 3. check-temp-docs.sh
# -----------------------------------------------------------------------
echo "## check-temp-docs.sh"

# 3a: docs が存在しなければ FAIL
EMPTY_DIR="$(mktemp -d)"
run_test_expect_fail "FAIL when docs missing" \
  env SDD_SOURCE_ROOT="$FAKE_PROJECT" bash "$CHECKS_DIR/check-temp-docs.sh" "$EMPTY_DIR"
rm -rf "$EMPTY_DIR"

# 3b: 必要な php-mvc docs が揃い、セクションもあれば PASS
PADDING="$(generate_padding 30)"
for f in 01_architecture 02_stack_and_ops 03_project_structure 04_development \
         05_auth_and_session 06_database_architecture 07_db_tables \
         08_controller_routes 09_business_logic 10_batch_and_shell; do
  cat > "$FAKE_PROJECT/docs/${f}.md" << MD
# ${f}

## 説明

This is a description.

## 内容

フロントエンド エラーハンドリング bootstrap メール通知
Lib/ ヘルパー レイアウト
テスト構成 コントローラテスト
const.php SELECT_
docker-compose
AuthComponent セッション ACL
cms contents_staging contents
外部キー FK INDEX
routes.php Router
CSV/Excel CSV インポート
ACL 権限マトリクス ロール
erDiagram ER 図
Model/Logic JASRAC Crankin
TitlesGraphController Logic クラス構成
Shell Console Shell 実行フロー
Titles Users
titles cast_members custom_table

$PADDING
MD
done

run_test "PASS when all php-mvc docs present with required sections" \
  env SDD_SOURCE_ROOT="$FAKE_PROJECT" bash "$CHECKS_DIR/check-temp-docs.sh" "$FAKE_PROJECT/docs"

# -----------------------------------------------------------------------
# 4. self-review-temp-docs.sh (統合テスト)
# -----------------------------------------------------------------------
echo "## self-review-temp-docs.sh"

run_test "PASS self-review with SDD_SOURCE_ROOT" \
  env SDD_SOURCE_ROOT="$FAKE_PROJECT" bash "$CHECKS_DIR/self-review-temp-docs.sh" "$FAKE_PROJECT/docs"

# SDD_SOURCE_ROOT 未設定 + cwd がプロジェクトルート
run_test "PASS self-review with cwd fallback" \
  env -u SDD_SOURCE_ROOT bash -c "cd '$FAKE_PROJECT' && bash '$CHECKS_DIR/self-review-temp-docs.sh' '$FAKE_PROJECT/docs'"

# -----------------------------------------------------------------------
# 5. check-node-cli-docs.sh
# -----------------------------------------------------------------------
echo "## check-node-cli-docs.sh"

FAKE_CLI_PROJECT="$(mktemp -d)"
mkdir -p "$FAKE_CLI_PROJECT/docs"
touch "$FAKE_CLI_PROJECT/README.md"

CLI_PADDING="$(generate_padding 40)"
for f in 01_overview 02_cli_commands 03_configuration 04_internal_design 05_development; do
  cat > "$FAKE_CLI_PROJECT/docs/${f}.md" << MD
# ${f}

## 説明

Description here.

## 内容

mermaid flowchart graph
コンセプト 概念 用語
フロー 手順 ステップ
| command | desc |
オプション --help
終了コード exit
config.json 設定ファイル
環境変数 SDD_
依存 モジュール module

npm install link
テスト test
リリース publish バージョン

$CLI_PADDING
MD
done

run_test "PASS node-cli docs check with SDD_SOURCE_ROOT" \
  env SDD_SOURCE_ROOT="$FAKE_CLI_PROJECT" bash "$CHECKS_DIR/check-node-cli-docs.sh" "$FAKE_CLI_PROJECT/docs"

rm -rf "$FAKE_CLI_PROJECT"

# -----------------------------------------------------------------------
# 6. generate-change-log.sh
# -----------------------------------------------------------------------
echo "## generate-change-log.sh"

mkdir -p "$FAKE_PROJECT/specs/001-test-feature"
cat > "$FAKE_PROJECT/specs/001-test-feature/spec.md" << 'MD'
# Feature Specification: Test Feature

**Created**: 2026-03-01
**Status**: Draft
**Feature Branch**: `feat/test`

## Scope

- Add test feature
MD

CHANGELOG_OUT="$FAKE_PROJECT/docs/change_log.md"
run_test "PASS generate-change-log with SDD_SOURCE_ROOT" \
  env SDD_SOURCE_ROOT="$FAKE_PROJECT" bash "$CHECKS_DIR/generate-change-log.sh" "$CHANGELOG_OUT"

run_test_output_contains "changelog contains spec entry" "test-feature" \
  cat "$CHANGELOG_OUT"

# -----------------------------------------------------------------------
# 結果サマリ
# -----------------------------------------------------------------------
echo ""
echo "========================================="
echo "Results: $passed/$total passed, $failed failed"
echo "========================================="

if (( failed > 0 )); then
  exit 1
fi
