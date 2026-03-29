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

**STOP. Do NOT proceed to any other step. You MUST present the options below and wait for the user's response before doing anything else. Do NOT read files, run commands, or take any action until the user selects an option.**

```
──────────────────────────────────────────────────────────
  Choose the scope of finalization.
──────────────────────────────────────────────────────────

  [1] Run all steps
  [2] Choose individually

```

**After presenting this choice, output NOTHING else. Wait for the user to reply with their selection number.**

## Behavior per Option

- **Option 1 (Run all steps)**: Execute steps 1–7 in order without asking for each step.
  - For step 4 (merge strategy), run `sdd-forge flow run merge --auto` (auto-detects PR vs squash from config).
  - For step 6 (documentation sync), auto-invoke for merge/squash routes, skip for PR route.
- **Option 2 (Choose individually)**: Ask about all optional steps (3–7) upfront before executing any of them.
  1. Present a single checklist for steps 3–7:
     ```
     ──────────────────────────────────────────────────────────
       Select steps to execute.
       Enter numbers separated by commas (e.g., 3,4,5)
     ──────────────────────────────────────────────────────────

       [3] Commit
       [4] Merge / PR creation
       [5] Branch cleanup
       [6] Documentation sync
       [7] Save work record

     ```
  2. Wait for the user's response.
  3. Execute only the selected steps in order. Mark unselected steps as `skipped`.

## Required Sequence

1. Load context.
   - Read `specs/NNN/flow.json` (resolved via `.sdd-forge/.active-flow` pointer) to get spec path, base branch, worktree info, and progress.
   - Read `.sdd-forge/config.json` to get `commands.gh` and `flow.push.remote` settings.
   - Run `sdd-forge flow get status` to display current state.

2. Check current state.
   - `git rev-parse --abbrev-ref HEAD` — confirm on feature branch.
   - `git status --short` — check uncommitted changes.
   - If `worktree: true` in flow.json, confirm working in worktree directory.
   - **Check `gh` availability**: If `commands.gh` is `"enable"` in config, run `gh --version`.
     - If `gh` is available, PR route is offered.
     - If `gh` is NOT available, display warning: `⚠ commands.gh is enabled but gh command is not found. PR route is unavailable.`

3. Commit all changes on feature branch.
   - **On start**: `sdd-forge flow set step commit in_progress`
   - Stage relevant files with `git add`.
   - Commit with a clear message describing the changes.
   - **On complete**: `sdd-forge flow set step commit done`
   - **If skipped**: `sdd-forge flow set step commit skipped`

4. Merge or create PR.
   Determine strategy based on user choice and `gh` availability:

   - **If `gh` is available**, present:
     ```
     ──────────────────────────────────────────────────────────
       Choose merge method.
     ──────────────────────────────────────────────────────────

       [1] merge
       [2] squash merge
       [3] pull request (create PR to `<baseBranch>`)

     ```
   - **If `gh` is NOT available**, present:
     ```
     ──────────────────────────────────────────────────────────
       Choose merge method.
     ──────────────────────────────────────────────────────────

       [1] merge
       [2] squash merge

     ```

   **4a. merge route**:
   - **On start**: `sdd-forge flow set step merge in_progress`
   - Record strategy: `sdd-forge flow set note "merge: merge"`
   - Determine approach based on flow.json state:
     - **Worktree** (`worktree: true`):
       - From the main repository: `git checkout <base-branch>` then `git merge <feature-branch>`.
     - **Branch** (`featureBranch != baseBranch`, no worktree):
       - `git checkout <base-branch>`
       - `git merge <feature-branch>`
     - **Spec-only** (`featureBranch == baseBranch`):
       - Skip merge (already on the correct branch).
   - Update flow.json: set `mergeStrategy` to `"merge"`.
   - **On complete**: `sdd-forge flow set step merge done`
   - Mark `push` and `pr-create` as `skipped`.

   **4b. squash merge route**:
   - **On start**: `sdd-forge flow set step merge in_progress`
   - Record strategy: `sdd-forge flow set note "merge: squash merge"`
   - Determine approach based on flow.json state:
     - **Worktree** (`worktree: true`):
       - Run `sdd-forge flow run merge` (auto-detects worktree paths at runtime).
     - **Branch** (`featureBranch != baseBranch`, no worktree):
       - `git checkout <base-branch>`
       - `git merge --squash <feature-branch>`
       - `git commit`
     - **Spec-only** (`featureBranch == baseBranch`):
       - Skip merge (already on the correct branch).
   - Update flow.json: set `mergeStrategy` to `"squash"`.
   - **On complete**: `sdd-forge flow set step merge done`
   - Mark `push` and `pr-create` as `skipped`.

   **4c. PR route** (when user chooses pull request):
   - **Push**: `sdd-forge flow set step push in_progress`
     - Determine remote from config: `flow.push.remote` (default: `"origin"`).
     - Run `sdd-forge flow run merge --pr --dry-run` to preview, then `sdd-forge flow run merge --pr` to execute.
     - `sdd-forge flow set step push done`
   - **PR create**: `sdd-forge flow set step pr-create in_progress`
     - PR is created by `sdd-forge flow run merge --pr`.
     - `sdd-forge flow set step pr-create done`
   - Update flow.json: set `mergeStrategy` to `"pr"`.
   - Record: `sdd-forge flow set note "merge: PR route"`
   - Mark `merge` as `skipped`.

5. Clean up.
   - **On start**: `sdd-forge flow set step branch-cleanup in_progress`
   - **If PR route was used**: Skip cleanup.
     - `sdd-forge flow set step branch-cleanup skipped`
     - Inform user: "Branch cleanup is not performed for pull requests."
   - **If merge/squash merge route**:
     Determine cleanup strategy based on flow.json state:
     - **Worktree** (`worktree: true`):
       - Present:
         ```
         ──────────────────────────────────────────────────────────
           Remove worktree?
         ──────────────────────────────────────────────────────────

           [1] Remove
           [2] Keep
           [3] Other

         ```
         - 1 → Run `sdd-forge flow run cleanup`.
         - 2 → Skip deletion.
     - **Branch** (`featureBranch != baseBranch`):
       - Delete with `git branch -D <featureBranch>`.
     - **Spec-only**:
       - No branch/worktree cleanup needed.
   - **On complete**: `sdd-forge flow set step branch-cleanup done`
   - **If skipped**: `sdd-forge flow set step branch-cleanup skipped`

6. Documentation sync.
   - **If PR route was used**: Skip documentation sync.
   - **If merge/squash merge route**:
     - Present:
       ```
       ──────────────────────────────────────────────────────────
         Sync documentation?
       ──────────────────────────────────────────────────────────

         [1] Yes
         [2] Skip

       ```
     - 1 → Invoke `/sdd-forge.flow-sync` using the Skill tool.
     - 2 → Skip.

7. Final verification.
   - `git status --short` — confirm tree is clean.
   - Report result to user.
   - If PR route was used, display:
     ```
     After PR merge, run the following:
     - Delete branch: git branch -D <featureBranch>
     - Sync documentation: sdd-forge build or /sdd-forge.flow-sync
     ```

## Worktree Mode

<!-- include("@templates/partials/worktree-mode.md") -->
- Before cleanup, `cd` to the main repository first to avoid cwd invalidation.
- `sdd-forge flow run cleanup` handles missing worktrees gracefully (no double-delete errors).

## Hard Stops

- Do not merge if working tree is not clean.
- Do not use destructive git commands (`reset --hard`, `push --force`).
- Do not proceed to next step without user confirmation.

## Commands

```bash
sdd-forge flow get status
sdd-forge flow set step <id> <val>
sdd-forge flow set note "<text>"
sdd-forge flow run merge
sdd-forge flow run merge --auto
sdd-forge flow run merge --pr
sdd-forge flow run merge --pr --dry-run
sdd-forge flow run cleanup
```
