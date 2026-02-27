#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
SPECS_DIR="$ROOT_DIR/specs"
OUT_FILE="${1:-$ROOT_DIR/docs/change_log.md}"

mkdir -p "$(dirname "$OUT_FILE")"

manual_block=""
if [[ -f "$OUT_FILE" ]]; then
  manual_block="$(sed -n '/<!-- MANUAL:START -->/,/<!-- MANUAL:END -->/p' "$OUT_FILE")"
fi
if [[ -z "$manual_block" ]]; then
  manual_block=$'<!-- MANUAL:START -->\n<!-- MANUAL:END -->'
fi

tmp_tsv="$(mktemp)"
tmp_latest="$(mktemp)"
trap 'rm -f "$tmp_tsv" "$tmp_latest"' EXIT

sanitize_text() {
  printf '%s' "$1" \
    | tr '\t\r\n' '   ' \
    | sed -E 's/[[:space:]]+/ /g; s/^\s+//; s/\s+$//; s/\|/\\|/g'
}

for spec_file in "$SPECS_DIR"/*/spec.md; do
  [[ -f "$spec_file" ]] || continue
  dir_abs="$(dirname "$spec_file")"
  dir_name="$(basename "$dir_abs")"

  is_backup="no"
  number=""
  series="$dir_name"
  if [[ "$dir_name" =~ ^([0-9]{3})[-_](.+)$ ]]; then
    number="${BASH_REMATCH[1]}"
    series="${BASH_REMATCH[2]}"
  elif [[ "$dir_name" =~ ^bak\.([0-9]{3})[-_](.+)$ ]]; then
    number="${BASH_REMATCH[1]}"
    series="${BASH_REMATCH[2]}"
    is_backup="yes"
  else
    continue
  fi

  title="$(sed -n 's/^# \(.*\)$/\1/p' "$spec_file" | head -n 1)"
  title="${title#Feature Specification: }"
  if [[ -z "$title" ]]; then
    title="$(awk 'NF{print;exit}' "$spec_file")"
  fi
  if [[ -z "$title" || "$title" == "yaml" ]]; then
    title="$dir_name"
  fi

  created="$(sed -n 's/^\*\*Created\*\*:[[:space:]]*//p' "$spec_file" | head -n 1 | sed 's/[[:space:]]*$//')"
  status="$(sed -n 's/^\*\*Status\*\*:[[:space:]]*//p' "$spec_file" | head -n 1 | sed 's/[[:space:]]*$//')"
  branch="$(sed -n 's/^\*\*Feature Branch\*\*:[[:space:]]*//p' "$spec_file" | head -n 1 | tr -d '`' | sed 's/[[:space:]]*$//')"
  input_line="$(sed -n 's/^\*\*Input\*\*:[[:space:]]*//p' "$spec_file" | head -n 1 | sed 's/[[:space:]]*$//')"
  if [[ -z "$input_line" ]]; then
    input_line="$(awk '/^## Scope/{in_scope=1;next} /^## /{if(in_scope) exit} in_scope && /^- /{sub(/^- /,""); print; exit}' "$spec_file")"
  fi

  links="$(find "$dir_abs" -maxdepth 1 -type f -name '*.md' -printf '%f\n' | sort | paste -sd ',' -)"

  title="$(sanitize_text "$title")"
  created="$(sanitize_text "${created:-n/a}")"
  status="$(sanitize_text "${status:-n/a}")"
  branch="$(sanitize_text "${branch:-n/a}")"
  input_line="$(sanitize_text "${input_line:-n/a}")"

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$dir_name" "$series" "${number:-0}" "$is_backup" "$title" "$created" "$status" "$branch" "$input_line" "$links" >> "$tmp_tsv"
done

awk -F'\t' '
  $4 != "yes" {
    key=$2
    n=$3+0
    if (!(key in best_n) || n > best_n[key]) {
      best_n[key]=n
      best_line[key]=$0
    }
  }
  END {
    for (k in best_line) print best_line[k]
  }
' "$tmp_tsv" | sort -t $'\t' -k2,2 > "$tmp_latest"

{
  echo "<!-- AUTO-GEN:START -->"
  echo "# Change Log"
  echo
  echo "## 説明"
  echo
  echo "\`specs/\` を一次情報として、仕様のインデックスと概要を記録する。"
  echo "本ファイルは \`npm run sdd:init\` で自動更新される。"
  echo
  echo "## 内容"
  echo
  echo "### 更新日時"
  echo
  echo "- generated_at: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo
  echo "### シリーズ最新インデックス"
  echo
  echo "| series | latest | status | created | spec |"
  echo "| --- | --- | --- | --- | --- |"
  while IFS=$'\t' read -r dir_name series number is_backup title created status branch input_line links; do
    [[ -n "$series" ]] || continue
    printf '| `%s` | `%s` | %s | %s | [spec](../specs/%s/spec.md) |\n' \
      "$series" "$dir_name" "$status" "$created" "$dir_name"
  done < "$tmp_latest"
  echo
  echo "### 全spec一覧"
  echo
  echo "| dir | status | created | title | summary | files |"
  echo "| --- | --- | --- | --- | --- | --- |"
  while IFS=$'\t' read -r dir_name series number is_backup title created status branch input_line links; do
    if [[ "$links" == *","* ]]; then
      file_links=""
      IFS=',' read -ra arr <<< "$links"
      for f in "${arr[@]}"; do
        [[ -n "$f" ]] || continue
        if [[ -n "$file_links" ]]; then
          file_links="$file_links, "
        fi
        file_links="$file_links[$f](../specs/$dir_name/$f)"
      done
    else
      file_links="[${links:-spec.md}](../specs/$dir_name/${links:-spec.md})"
    fi

    printf '| `%s` | %s | %s | %s | %s | %s |\n' \
      "$dir_name" "$status" "$created" "$title" "$input_line" "$file_links"
  done < <(sort -t $'\t' -k1,1 "$tmp_tsv")
  echo "<!-- AUTO-GEN:END -->"
  echo
  printf '%s\n' "$manual_block"
} > "$OUT_FILE"

echo "generated change log: $OUT_FILE"
