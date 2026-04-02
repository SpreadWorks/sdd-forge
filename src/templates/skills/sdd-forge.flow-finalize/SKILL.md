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
   - Display the JSON result to the user.
   - If the result shows sync was skipped (PR route), display the reminder from step 5.

4. **If "select"** (Option 2):
   - Run `sdd-forge flow get prompt finalize.steps` and present the step choices. Wait for user selection.
   - If the user selected the merge step (2), run `sdd-forge flow get prompt finalize.merge-strategy` and present the choices.
   - Run `sdd-forge flow run finalize --mode select --steps <selected> [--merge-strategy <choice>]`.
   - Display the JSON result to the user.

5. Post-finalize.
   - If the result shows sync was skipped (PR route), display:
     ```
     PR マージ後に以下を実行してください:
     - ドキュメントの同期: sdd-forge build または /sdd-forge.flow-sync
     ```
   - If the result includes `steps.retro`, display the retro summary or failure message.
   - Note: retro is now part of the finalize pipeline (step 3) and runs automatically before cleanup. No separate `sdd-forge flow run retro` call is needed.

## Worktree Mode

<!-- include("@templates/partials/worktree-mode.md") -->
- `sdd-forge flow run finalize` handles worktree detection, merge, and cleanup internally.
- Docs sync (step 4) runs on the main repository after merge and retro, before worktree cleanup.
- **MUST: Do NOT run `sdd-forge flow run finalize` in background.** Run it in the foreground and wait for it to complete before proceeding.
- **MUST: After `sdd-forge flow run finalize` completes in worktree mode**, the worktree directory is deleted by cleanup, invalidating the shell's cwd. Immediately run `cd <mainRepoPath>` to restore a valid working directory. Get `mainRepoPath` from `sdd-forge flow get resolve-context` (run this BEFORE finalize).

## Hard Stops

- Do not run `sdd-forge flow run finalize` if resolve-context reports `dirty: true` and commit step is not included.
- Do not proceed to next step without user confirmation.
- **NEVER chain or background `sdd-forge` commands.** Each `sdd-forge` command must be run as a separate, foreground Bash invocation. Do not use `&&`, `||`, `;`, pipes, or `run_in_background`. Every command's result determines the next action, so it must complete and be read before proceeding.

**autoApprove exception:** When `autoApprove: true`, the rule "do not proceed to next step without user confirmation" does NOT apply. All other hard stops remain in effect.

## Redo Recording

<!-- include("@templates/partials/redo-recording.md") -->

**MUST: If worktree, merge, or commit operations fail**, record the issue in redolog (`sdd-forge flow set redo --step finalize --reason "..."`) before applying a workaround or retrying with different options.

## Commands

```bash
sdd-forge flow get status
sdd-forge flow get resolve-context
sdd-forge flow get prompt <kind>
sdd-forge flow set step <id> <val>
sdd-forge flow set note "<text>"
sdd-forge flow run retro [--force] [--dry-run]
sdd-forge flow run finalize --mode all|select [--steps N,N] [--merge-strategy squash|pr]
```
