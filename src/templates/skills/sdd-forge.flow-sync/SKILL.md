---
name: sdd-forge.flow-sync
description: Sync documentation with code. Use for docs generation, review, and commit.
---

# SDD Flow Sync

Sync documentation with the current codebase. Can be invoked from flow-finalize or run standalone.

## Behavior

- **When invoked from flow-finalize**: Updates documentation and records progress in the spec's flow.json.
- **When run standalone**: Updates documentation only. No flow.json updates.

## Required Sequence

1. Ensure on the correct branch.
   - `git rev-parse --abbrev-ref HEAD` — confirm on the expected branch.
   - If not, `git checkout <baseBranch>`.

2. Generate documentation.
   - Display: "ドキュメントを更新しています..."
   - Run `sdd-forge build`.

3. Review documentation.
   - `sdd-forge review`
   - If FAIL, fix issues and re-run. Do not proceed until PASS.

4. Commit docs changes.
   - `git add docs/ AGENTS.md CLAUDE.md` (and other generated files).
   - `git commit -m "docs: sync documentation"`

## Hard Stops

- Do not commit if `sdd-forge review` FAIL.

## Commands

```bash
sdd-forge build
sdd-forge review
```
