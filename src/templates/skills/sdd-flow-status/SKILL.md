---
name: sdd-flow-status
description: Show the current SDD flow status including branch, worktree, spec summary, and commit state.
---

# SDD Flow Status

Display the current state of the SDD workflow.

## Procedure

1. Load flow state.
   - Read `.sdd-forge/current-spec`.
   - If it does not exist, report "No active SDD flow." and stop.

2. Gather information and display all of the following:

   ### Branch & Worktree
   - Current branch: `git rev-parse --abbrev-ref HEAD`
   - Base branch: from `current-spec` → `baseBranch`
   - Feature branch: from `current-spec` → `featureBranch`
   - Worktree: from `current-spec` → `worktree` (true/false)
     - If worktree: show `worktreePath` and `mainRepoPath`
   - Mode: determine from state:
     - `worktree: true` → "Worktree"
     - `featureBranch != baseBranch` → "Branch"
     - `featureBranch == baseBranch` → "Spec only"

   ### Spec Summary
   - Spec path: from `current-spec` → `spec`
   - Read the spec file and extract:
     - Title (first `# ` heading)
     - Goal (`## Goal` section — first 3 lines)
     - User Confirmation status (`- [x]` or `- [ ]`)

   ### Commit & Working Tree
   - Uncommitted changes: `git status --short` (show file count and list)
   - Commits ahead of base: `git log <baseBranch>..<featureBranch> --oneline` (count and list)
     - Skip if spec-only mode (same branch)
   - Last commit: `git log -1 --oneline`

3. Format output.
   - Use a clear, structured format with section headers.
   - Example:

   ```
   ## SDD Flow Status

   | Item | Value |
   |------|-------|
   | Mode | Branch |
   | Feature branch | feature/025-xxx |
   | Base branch | main |
   | Spec | specs/025-xxx/spec.md |
   | Title | Unify lang config |
   | User approved | Yes |

   ### Commits (3 ahead of main)
   - abc1234 feat: implement xxx
   - def5678 fix: yyy
   - ghi9012 test: zzz

   ### Uncommitted Changes (2 files)
   - M src/lib/config.js
   - M tests/lib/config.test.js
   ```

## Notes

- This skill is read-only. It does not modify any files or state.
- If the spec file is missing or unreadable, show the path but note it cannot be read.
