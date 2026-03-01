#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="${SDD_SOURCE_ROOT:-$(pwd)}"
DB_DOC="${1:-$SOURCE_ROOT/docs/07_db_tables.md}"
MODEL_DIR="$SOURCE_ROOT/app/Model"

if [[ ! -f "$DB_DOC" ]]; then
  echo "[FAIL] missing db doc: $DB_DOC"
  exit 1
fi

if [[ ! -d "$MODEL_DIR" ]]; then
  echo "[FAIL] missing model dir: $MODEL_DIR"
  exit 1
fi

tmp_tables=$(mktemp)
trap 'rm -f "$tmp_tables"' EXIT

# CamelCase → snake_case 変換
camel_to_snake() {
  echo "$1" | sed -E 's/([A-Z])/_\L\1/g' | sed 's/^_//'
}

# CakePHP 規約: ModelName → model_names (snake_case 複数形)
# 簡易的な複数形変換
pluralize() {
  local word="$1"
  if [[ "$word" =~ y$ ]]; then
    echo "${word%y}ies"
  elif [[ "$word" =~ s$ ]] || [[ "$word" =~ x$ ]] || [[ "$word" =~ ch$ ]] || [[ "$word" =~ sh$ ]]; then
    echo "${word}es"
  else
    echo "${word}s"
  fi
}

for file in "$MODEL_DIR"/*.php; do
  [[ -f "$file" ]] || continue
  base=$(basename "$file" .php)

  # AppModel は除外
  if [[ "$base" == "AppModel" ]]; then
    continue
  fi

  # Fe*, FeStaging* モデルは除外（フロントエンド用キャッシュモデル）
  if [[ "$base" =~ ^Fe[A-Z] ]] || [[ "$base" =~ ^FeStaging ]]; then
    continue
  fi

  # $useTable を探す
  use_table=$(grep -oP '\$useTable\s*=\s*['\''"]([^'\''"]*)' "$file" | head -n1 | sed -E "s/.*['\"]//" || true)

  if [[ -n "$use_table" ]]; then
    echo "$use_table" >> "$tmp_tables"
  else
    # CakePHP 規約でテーブル名を推定
    snake=$(camel_to_snake "$base")
    table=$(pluralize "$snake")
    echo "$table" >> "$tmp_tables"
  fi
done

sort -u "$tmp_tables" -o "$tmp_tables"

missing=0
total=0
while IFS= read -r t; do
  [[ -z "$t" ]] && continue
  total=$((total+1))
  if ! grep -Fq "$t" "$DB_DOC"; then
    echo "[MISS] table $t"
    missing=$((missing+1))
  fi
done < "$tmp_tables"

covered=$((total-missing))
echo "DB table coverage: $covered/$total"

if (( missing > 0 )); then
  echo "db coverage check: FAILED"
  exit 1
fi

echo "db coverage check: PASSED"
