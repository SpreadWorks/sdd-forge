#!/usr/bin/env bash
set -euo pipefail

# Generic docs quality check script.
# Dynamically discovers chapter files (NN_*.md) and validates basic structure.

SOURCE_ROOT="${SDD_SOURCE_ROOT:-$(pwd)}"
WORK_ROOT="${SDD_WORK_ROOT:-$(pwd)}"
TARGET_DIR="${1:-$WORK_ROOT/docs}"

fail=0

# Discover chapter files (NN_*.md)
chapter_files=()
if [[ -d "$TARGET_DIR" ]]; then
  while IFS= read -r -d '' file; do
    chapter_files+=("$(basename "$file")")
  done < <(find "$TARGET_DIR" -maxdepth 1 -name '[0-9][0-9]_*.md' -print0 | sort -z)
fi

if [[ ${#chapter_files[@]} -eq 0 ]]; then
  echo "[FAIL] no chapter files found in $TARGET_DIR"
  exit 1
fi

echo "Found ${#chapter_files[@]} chapter file(s)"

min_lines=15

for f in "${chapter_files[@]}"; do
  path="$TARGET_DIR/$f"
  if [[ ! -f "$path" ]]; then
    echo "[FAIL] missing file: $path"
    fail=1
    continue
  fi

  lines=$(wc -l < "$path")
  if (( lines < min_lines )); then
    echo "[FAIL] too short ($lines lines): $f"
    fail=1
  fi

  # Must have at least one H1 heading
  if ! grep -qE '^# ' "$path"; then
    echo "[FAIL] missing H1 heading: $f"
    fail=1
  fi

  # Warn about unfilled @text directives (directive with no content after it)
  unfilled=0
  while IFS= read -r line_num; do
    next_line=$((line_num + 1))
    next_content=$(sed -n "${next_line}p" "$path" | tr -d '[:space:]')
    if [[ -z "$next_content" ]]; then
      unfilled=$((unfilled + 1))
    fi
  done < <(grep -nE '^\s*<!-- @text' "$path" | cut -d: -f1)

  if (( unfilled > 0 )); then
    echo "[WARN] $unfilled unfilled @text directive(s): $f"
  fi
done

# README.md check (warn only)
if [[ ! -f "$WORK_ROOT/README.md" ]]; then
  echo "[WARN] README.md not found. Run 'sdd-forge readme' to generate."
fi

if (( fail != 0 )); then
  echo "docs quality check: FAILED"
  exit 1
fi

echo "docs quality check: PASSED"
