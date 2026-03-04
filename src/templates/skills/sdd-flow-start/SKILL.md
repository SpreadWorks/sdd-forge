---
name: sdd-flow-start
description: Run the SDD workflow for any feature or fix request. Use for spec creation, gate check, implementation, and finalization.
---

# SDD Flow Start

Run this workflow for any feature or fix request.

## Required Sequence

1. Create or select spec.
   - If no spec exists, run `sdd-forge spec --title "<short-title>"` (with appropriate flags — see step 2).
   - Use the resulting `specs/NNN-xxx/spec.md`.
   - The spec path is saved to `.sdd-forge/current-spec`.

2. Choose branching strategy.
   - **Auto-detect**: Check if `.git` is a file (not directory) in the project root.
     - If yes → already in a worktree. Skip choice, use `--no-branch` automatically.
   - **User choice** (if not in a worktree): Present EXACTLY these 3 options:

     | # | Label | Description | Command |
     |---|---|---|---|
     | 1 | Branch（デフォルト） | `<current-branch>` から feature ブランチを作成して作業する | `sdd-forge spec --title "..." --base <current-branch>` |
     | 2 | Worktree | git worktree を作成して隔離環境で作業する（パスを追加質問） | `sdd-forge spec --title "..." --base <current-branch> --worktree <path>` |
     | 3 | Spec only | ブランチを作成せず spec ファイルのみ作成する | `sdd-forge spec --title "..." --no-branch` |

     - If user selects **Worktree**:
       - Compute default path: `../<repo-basename>-wt-<NNN-slug>` (e.g. `../sdd-forge-wt-003-add-dry-run`)
       - Ask: "Worktree パス: `<default>` でよいですか？（変更する場合は入力）"
       - Use the user's answer or the default.
   - Ask the user: "現在のブランチ (`<current-branch>`) から分岐してよいですか？" (skip for spec-only mode)
     - If yes → use `--base <current-branch>`.
     - If no → ask which branch to use as base and use `--base <user-specified-branch>`.
   - The base branch is automatically recorded in `.sdd-forge/current-spec` by `sdd-forge spec`.

3. Draft spec before coding.
   - Fill Goal, Scope, Out of Scope, Requirements, Acceptance Criteria.
   - Keep Open Questions only when clarification is still needed.

4. Get explicit user approval.
   - Summarize the spec and ask the user for confirmation.
   - Wait for approval before any implementation.
   - Update `## User Confirmation` with:
     - `- [x] User approved this spec`
     - Confirmation date and short note.

5. Run gate.
   - `sdd-forge gate --spec specs/NNN-xxx/spec.md`
   - If FAIL, resolve issues one by one via Q&A with the user.
   - If you cannot resolve an issue yourself, ask the user directly.
   - Do not proceed until PASS.

6. Implement changes.
   - Code only after gate PASS.

7. Ask user about finalization.
   - Ask: "実装内容に問題がなければ終了処理を行いますか？"
   - If approved, run `/sdd-flow-close`.
   - If the user wants changes, continue implementation.

## Hard Stops

- Do not implement before user approval.
- Do not implement when gate FAIL.
- Do not finalize without asking the user.

## Clarification Rule

When requirements are ambiguous, ask concise Q&A before step 5.
Record clarifications in `spec.md` under `## Clarifications (Q&A)` and `## Open Questions`.

## Commands

```bash
sdd-forge spec --title "<short-title>" --base <branch>
sdd-forge spec --title "<short-title>" --no-branch
sdd-forge spec --title "<short-title>" --base <branch> --worktree <path>
sdd-forge gate --spec specs/NNN-xxx/spec.md
```
