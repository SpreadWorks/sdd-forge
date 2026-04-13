---
name: sdd-forge.flow-finalize
description: Finalize the SDD workflow after implementation is complete. Use for commit, merge or PR creation, and cleanup.
---

# SDD Flow Finalize

Use this skill when implementation is complete and the user approved finalization.

## Flow Progress Tracking

<!-- include("@templates/partials/flow-tracking.md") -->

Available step IDs (this skill): `commit`, `push`, `merge`, `pr-create`, `branch-cleanup`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## Context Recording (Compaction Resilience)

<!-- include("@templates/partials/context-recording.md") -->

## Choice Format

<!-- include("@templates/partials/choice-format.md") -->

## CRITICAL: Step 0 — Present Options FIRST

**STOP. Do NOT proceed to any other step. You MUST present the prompt below and wait for the user's response before doing anything else. Do NOT read files, run commands, or take any action until the user selects an option.**

- Run `sdd-forge flow get prompt finalize.mode` and present the `description` and `choices` using the Choice Format. Each choice has a `description` field — display it below the label.

**After presenting this choice, output NOTHING else. Wait for the user to reply with their selection number.**

## Required Sequence

1. Resolve context.
   - Run `sdd-forge flow get resolve-context` to get JSON with:
     - `mainRepoPath`, `worktreePath`, `activeFlow`, `flowJsonPath`
     - `spec`, `baseBranch`, `featureBranch`, `worktree`
     - `dirty`, `dirtyFiles`, `currentBranch`, `ghAvailable`

2. Present mode choice.
   - The mode was already selected in Step 0.

3. **If "all"** (Option 1):
   - Run `sdd-forge flow run finalize --mode all`.
   - Merge strategy is auto-detected: `commands.gh=enable` AND `gh` available → PR, else squash merge.
   - The pipeline executes 4 steps:
     - **Step 1 (commit)**: Commits implementation changes. After commit, retro (AI evaluation) and report (report.json) are automatically generated as post-commit operations.
     - **Step 2 (merge)**: Squash merge or PR creation.
     - **Step 3 (sync)**: Docs build on main repo after merge (skipped for PR route).
     - **Step 4 (cleanup)**: Worktree/branch deletion and flow state cleanup.
   - Display the JSON result to the user.
   - If the result shows sync was skipped (PR route), display the reminder from step 5.

4. **If "select"** (Option 2):
   - Run `sdd-forge flow get prompt finalize.steps` and present the step choices. Wait for user selection.
   - Available steps: 1=commit(+retro+report), 2=merge, 3=sync, 4=cleanup.
   - If the user selected the merge step (2), run `sdd-forge flow get prompt finalize.merge-strategy` and present the choices.
   - Run `sdd-forge flow run finalize --mode select --steps <selected> [--merge-strategy <choice>]`.
   - Display the JSON result to the user.

5. Post-finalize.
   - If the result shows sync was skipped (PR route), display:
     ```
     PR マージ後に以下を実行してください:
     - ドキュメントの同期: sdd-forge build または /sdd-forge.flow-sync
     ```
   - If the result includes `steps.retro`, display the retro summary or failure message. Retro runs automatically as part of the commit step (step 1) — no separate call is needed.
   - **If step 1 was not included** (select mode without commit), retro was not run automatically. Run it manually: `sdd-forge flow run retro`. If retro.json already exists, use `--force` to overwrite. Use `--dry-run` to preview without writing.
   - **MUST: If `steps.report.text` exists in the result, display it as-is.** The report text is pre-formatted by the command — do not reformat, summarize, or interpret it. Just output the text directly.
   - Sync result (if available) should also be displayed: show `steps.sync.diffSummary` for the list of changed docs files.

## Worktree Mode

<!-- include("@templates/partials/worktree-mode.md") -->
- Before merge, consider running `git rebase <baseBranch>` in the worktree to incorporate upstream changes and avoid merge conflicts.
- `sdd-forge flow run finalize` handles worktree detection, merge, and cleanup internally.
- Docs sync (step 3) runs on the main repository after merge, before worktree cleanup (step 4).
- **MUST: Do NOT run `sdd-forge flow run finalize` in background.** Run it in the foreground and wait for it to complete before proceeding.
- **MUST: After `sdd-forge flow run finalize` completes in worktree mode**, the worktree directory is deleted by cleanup, invalidating the shell's cwd. Immediately run `cd <mainRepoPath>` to restore a valid working directory. Get `mainRepoPath` from `sdd-forge flow get resolve-context` (run this BEFORE finalize).

## Hard Stops

- Do not run `sdd-forge flow run finalize` if resolve-context reports `dirty: true` and commit step is not included.
- Do not proceed to next step without user confirmation.
- **NEVER chain or background `sdd-forge` commands.** Each `sdd-forge` command must be run as a separate, foreground Bash invocation. Do not use `&&`, `||`, `;`, pipes, or `run_in_background`. If a command nevertheless ends up in the background (e.g., due to tool behavior), wait for its completion notification before proceeding — do not treat it as complete or advance to the next step until the command's result has been received and read.

**autoApprove exception:** When `autoApprove: true`, the rule "do not proceed to next step without user confirmation" does NOT apply. All other hard stops remain in effect.

## Issue Log Recording

<!-- include("@templates/partials/issue-log-recording.md") -->

**MUST: If worktree, merge, or commit operations fail**, record the issue in issue-log (`sdd-forge flow set issue-log --step finalize --reason "..."`) before applying a workaround or retrying with different options.

## Commands

```bash
sdd-forge flow get status
sdd-forge flow get resolve-context
sdd-forge flow get prompt <kind>
sdd-forge flow set step <id> <val>
sdd-forge flow set note "<text>"
sdd-forge flow run finalize --mode all|select [--steps 1,2,3,4] [--merge-strategy squash|pr]
sdd-forge flow run retro [--force] [--dry-run]
sdd-forge flow run report [--dry-run]
```
