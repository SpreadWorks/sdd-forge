---
name: sdd-forge.flow-finalize
description: 実装完了後の SDD 終了処理。コミット、マージまたは PR 作成、クリーンアップを実行。
---

# SDD Flow Finalize

Use this skill when implementation is complete and the user approved finalization.

## Flow Progress Tracking

**MUST: Run `sdd-forge flow status --step <id> --status <val>` upon completion of each step to record flow progress.**

Available step IDs (this skill): `commit`, `push`, `merge`, `pr-create`, `branch-cleanup`, `archive`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## Context Recording (Compaction Resilience)

**MUST: Record key decisions for compaction recovery.**

- After each user choice, record: `sdd-forge flow status --note "<step>: <choice summary>"`

## Choice Format

選択肢は以下の形式で表示すること:
```
──────────────────────────────────────────────────────────
  説明文（質問や状況の説明）
──────────────────────────────────────────────────────────

  [1] ラベル
  [2] ラベル
  [3] その他

```
- Do not combine the description and choices into one sentence. Description goes inside the lines, choices go outside.
- Add blank lines before and after the choices.

## CRITICAL: Step 0 — Present Options FIRST

**STOP. Do NOT proceed to any other step. You MUST present the options below and wait for the user's response before doing anything else. Do NOT read files, run commands, or take any action until the user selects an option.**

```
──────────────────────────────────────────────────────────
  終了処理の範囲を選択してください。
──────────────────────────────────────────────────────────

  [1] すべて実行
  [2] 個別に選択する

```

**After presenting this choice, output NOTHING else. Wait for the user to reply with their selection number.**

## Behavior per Option

- **Option 1 (すべて実行)**: Execute steps 1–7 in order without asking for each step.
  - For step 4 (merge strategy), auto-detect: if `commands.gh` is `"enable"` in config AND `gh` command is available, use PR route. Otherwise use squash merge.
  - For step 6 (documentation sync), auto-invoke for merge/squash routes, skip for PR route.
- **Option 2 (個別に選択する)**: Ask about all optional steps (3–7) upfront before executing any of them.
  1. Present a single checklist for steps 3–7:
     ```
     ──────────────────────────────────────────────────────────
       実行するステップを選択してください。
       番号をカンマ区切りで入力（例: 3,4,5）
     ──────────────────────────────────────────────────────────

       [3] コミット
       [4] マージ / PR 作成
       [5] ブランチ削除
       [6] ドキュメント同期
       [7] 作業の記録を保存

     ```
  2. Wait for the user's response.
  3. Execute only the selected steps in order. Mark unselected steps as `skipped`.

## Required Sequence

1. Load context.
   - Read `.sdd-forge/flow.json` to get spec path, base branch, worktree info, and progress.
   - Read `.sdd-forge/config.json` to get `commands.gh` and `flow.push.remote` settings.
   - Run `sdd-forge flow status` to display current state.

2. Check current state.
   - `git rev-parse --abbrev-ref HEAD` — confirm on feature branch.
   - `git status --short` — check uncommitted changes.
   - If `worktree: true` in flow.json, confirm working in worktree directory.
   - **Check `gh` availability**: If `commands.gh` is `"enable"` in config, run `gh --version`.
     - If `gh` is available, PR route is offered.
     - If `gh` is NOT available, display warning: `⚠ commands.gh is enabled but gh command is not found. PR route is unavailable.`

3. Commit all changes on feature branch.
   - **On start**: `sdd-forge flow status --step commit --status in_progress`
   - Stage relevant files with `git add`.
   - Commit with a clear message describing the changes.
   - **On complete**: `sdd-forge flow status --step commit --status done`
   - **If skipped**: `sdd-forge flow status --step commit --status skipped`

4. Merge or create PR.
   Determine strategy based on user choice and `gh` availability:

   - **If `gh` is available**, present:
     ```
     ──────────────────────────────────────────────────────────
       マージ方法を選択してください。
     ──────────────────────────────────────────────────────────

       [1] merge
       [2] squash merge
       [3] pull request（`<baseBranch>` に PR 作成）

     ```
   - **If `gh` is NOT available**, present:
     ```
     ──────────────────────────────────────────────────────────
       マージ方法を選択してください。
     ──────────────────────────────────────────────────────────

       [1] merge
       [2] squash merge

     ```

   **4a. merge route**:
   - **On start**: `sdd-forge flow status --step merge --status in_progress`
   - Record strategy: `sdd-forge flow status --note "merge: merge"`
   - Determine approach based on flow.json state:
     - **Worktree** (`worktree: true`):
       - From the main repository: `git checkout <base-branch>` then `git merge <feature-branch>`.
     - **Branch** (`featureBranch != baseBranch`, no worktree):
       - `git checkout <base-branch>`
       - `git merge <feature-branch>`
     - **Spec-only** (`featureBranch == baseBranch`):
       - Skip merge (already on the correct branch).
   - Update flow.json: set `mergeStrategy` to `"merge"`.
   - **On complete**: `sdd-forge flow status --step merge --status done`
   - Mark `push` and `pr-create` as `skipped`.

   **4b. squash merge route**:
   - **On start**: `sdd-forge flow status --step merge --status in_progress`
   - Record strategy: `sdd-forge flow status --note "merge: squash merge"`
   - Determine approach based on flow.json state:
     - **Worktree** (`worktree: true`):
       - Run `sdd-forge flow merge` (auto-detects worktree paths at runtime).
     - **Branch** (`featureBranch != baseBranch`, no worktree):
       - `git checkout <base-branch>`
       - `git merge --squash <feature-branch>`
       - `git commit`
     - **Spec-only** (`featureBranch == baseBranch`):
       - Skip merge (already on the correct branch).
   - Update flow.json: set `mergeStrategy` to `"squash"`.
   - **On complete**: `sdd-forge flow status --step merge --status done`
   - Mark `push` and `pr-create` as `skipped`.

   **4c. PR route** (when user chooses pull request):
   - **Push**: `sdd-forge flow status --step push --status in_progress`
     - Determine remote from config: `flow.push.remote` (default: `"origin"`).
     - Run `sdd-forge flow merge --pr --dry-run` to preview, then `sdd-forge flow merge --pr` to execute.
     - `sdd-forge flow status --step push --status done`
   - **PR create**: `sdd-forge flow status --step pr-create --status in_progress`
     - PR is created by `sdd-forge flow merge --pr`.
     - `sdd-forge flow status --step pr-create --status done`
   - Update flow.json: set `mergeStrategy` to `"pr"`.
   - Record: `sdd-forge flow status --note "merge: PR route"`
   - Mark `merge` as `skipped`.

5. Clean up.
   - **On start**: `sdd-forge flow status --step branch-cleanup --status in_progress`
   - **If PR route was used**: Skip cleanup.
     - `sdd-forge flow status --step branch-cleanup --status skipped`
     - Inform user: "pull request の場合、ブランチの削除は行いません。"
   - **If merge/squash merge route**:
     Determine cleanup strategy based on flow.json state:
     - **Worktree** (`worktree: true`):
       - Present:
         ```
         ──────────────────────────────────────────────────────────
           worktree を削除しますか？
         ──────────────────────────────────────────────────────────

           [1] 削除する
           [2] 残す
           [3] その他

         ```
         - 1 → Run `sdd-forge flow cleanup`.
         - 2 → Skip deletion.
     - **Branch** (`featureBranch != baseBranch`):
       - Delete with `git branch -D <featureBranch>`.
     - **Spec-only**:
       - No branch/worktree cleanup needed.
   - **On complete**: `sdd-forge flow status --step branch-cleanup --status done`
   - **If skipped**: `sdd-forge flow status --step branch-cleanup --status skipped`

6. Documentation sync.
   - **If PR route was used**: Skip documentation sync.
   - **If merge/squash merge route**:
     - Present:
       ```
       ──────────────────────────────────────────────────────────
         ドキュメントを同期しますか？
       ──────────────────────────────────────────────────────────

         [1] はい
         [2] スキップ

       ```
     - 1 → Invoke `/sdd-forge.flow-sync` using the Skill tool.
     - 2 → Skip.

7. Save work record & final verification.
   - **On start**: `sdd-forge flow status --step archive --status in_progress`
   - **Archive flow.json**: Run `sdd-forge flow status --archive` to move `.sdd-forge/flow.json` to the spec directory for historical record.
   - `git status --short` — confirm tree is clean.
   - Report result to user.
   - If PR route was used, display:
     ```
     PR マージ後に以下を実行してください:
     - ブランチの削除: git branch -D <featureBranch>
     - ドキュメントの同期: sdd-forge build または /sdd-forge.flow-sync
     ```
   - **On complete**: Step is marked done by `--archive` command.

## Worktree Mode

When `worktree: true` in flow.json:
- **All file operations (editing, creating, reading) MUST be done inside the worktree directory.** Do not edit files in the main repository.
- Run `sdd-forge flow status` to see the worktree path. Use absolute paths if needed.
- The worktree is an isolated copy — changes in the main repo are NOT visible in the worktree and vice versa.
- Before cleanup, `cd` to the main repository first to avoid cwd invalidation.
- `sdd-forge flow cleanup` handles missing worktrees gracefully (no double-delete errors).

## Hard Stops

- Do not merge if working tree is not clean.
- Do not use destructive git commands (`reset --hard`, `push --force`).
- Do not proceed to next step without user confirmation.

## Commands

```bash
sdd-forge flow status
sdd-forge flow status --step <id> --status <val>
sdd-forge flow status --note "<text>"
sdd-forge flow status --archive
sdd-forge flow merge
sdd-forge flow merge --pr
sdd-forge flow merge --pr --dry-run
sdd-forge flow cleanup
```
