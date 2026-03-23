---
name: sdd-forge.flow-plan
description: Run the SDD planning workflow. Use for spec creation, gate check, and test writing. Covers approach through test phases.
---

# SDD Flow Plan

Run this workflow for any feature or fix request. This skill covers the planning phase: from requirements gathering through test writing.

## Core Principle

**Confirm with the user before proceeding to the next action at every step of the SDD flow.**
The AI must not advance to the next step on its own.

## Flow Progress Tracking

**MUST: Run `sdd-forge flow status --step <id> --status <val>` upon completion of each step to record flow progress.**

Available step IDs (this skill): `approach`, `branch`, `spec`, `draft`, `fill-spec`, `approval`, `gate`, `test`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## Context Recording (Compaction Resilience)

**MUST: Record the user's original request and key decisions for compaction recovery.**

- After flow.json is created (step 3), record the request: `sdd-forge flow status --request "<user's original request>"`
- After each user choice, record: `sdd-forge flow status --note "<step>: <choice summary>"`

## Choice Format

Present choices in the following format:
```
──────────────────────────────────────────────────────────
  Description (question or situation)
──────────────────────────────────────────────────────────

  [1] Label
  [2] Label
  [3] Other

```
- Do not combine the description and choices into one sentence. Description goes inside the lines, choices go outside.
- Add blank lines before and after the choices.

## Required Sequence

1. Choose approach.
   - **Note**: `flow.json` does not exist yet at this point. Do NOT run `flow status --step` commands until after step 3.
   - Present:
     ```
     ──────────────────────────────────────────────────────────
       Choose how to create the spec.
     ──────────────────────────────────────────────────────────

       [1] Organize requirements through Q&A before writing the spec
       [2] Write the spec

     ```
   - Remember the choice for later. Proceed to step 2 regardless.

2. Choose work environment.
   - **Auto-detect**: Check if `.git` is a file (not directory) in the project root.
     - If yes → already in a worktree. Skip choice, use `--no-branch` automatically.
   - **User choice** (if not in a worktree):
     ```
     ──────────────────────────────────────────────────────────
       Choose a work environment.
     ──────────────────────────────────────────────────────────

       [1] Git worktree (work in an isolated environment)
       [2] Branch (create a feature branch)
       [3] No branch

     ```
   - For options 1 and 2:
     ```
     ──────────────────────────────────────────────────────────
       Branch from current branch (`<current-branch>`).
     ──────────────────────────────────────────────────────────

       [1] Yes
       [2] Specify a branch
       [3] Other

     ```
     - 1 → use `--base <current-branch>`.
     - 2 → ask which branch and use `--base <user-specified-branch>`.
   - Commands:
     - Worktree: `sdd-forge spec init --title "..." --base <branch> --worktree`
     - Branch: `sdd-forge spec init --title "..." --base <branch>`
     - No branch: `sdd-forge spec init --title "..." --no-branch`

3. Create or select spec.
   - **Before running spec init**, check for uncommitted changes: `git status --short`
     - If dirty, ask the user to commit or stash before proceeding.
     - Do not run `sdd-forge spec init` on a dirty worktree.
   - If no spec exists, run `sdd-forge spec init --title "<short-title>"` (with appropriate flags from step 2).
   - This creates the branch, `specs/NNN-xxx/` directory, `spec.md` skeleton, and `specs/NNN-xxx/flow.json`.
   - The base branch is automatically recorded by `sdd-forge spec init`.
   - **After flow.json is created**, mark steps 1-3 as done:
     - `sdd-forge flow status --step approach --status done`
     - `sdd-forge flow status --step branch --status done`
     - `sdd-forge flow status --step spec --status done`
   - **If a GitHub Issue number was provided** (e.g. user said "#17" or "issue 17"):
     - Run `sdd-forge flow status --issue <number>` to save it in flow.json.

4. Draft phase (if step 1 chose option 1).
   - **On start**: `sdd-forge flow status --step draft --status in_progress`
   - **If skipped** (step 1 chose option 2): `sdd-forge flow status --step draft --status skipped`
   - **Before starting draft discussion**:
     1. **If a GitHub Issue number is linked** (saved in flow.json via `--issue`):
        Fetch the issue content with `gh issue view <number>` and display the title and body before the first question.
        Use the issue content as context for the draft discussion.
     2. Check docs freshness: compare mtime of `docs/*.md` vs source files.
        If source is newer, suggest `sdd-forge build` to the user and wait for approval.
     3. Load guardrail articles for the draft phase: `sdd-forge spec guardrail show --phase draft`.
        If output is non-empty, consider these principles as constraints when asking questions and making proposals.
     4. Read relevant `docs/` chapters based on the user's request keywords.
        Use chapter titles and AGENTS.md structure to identify related files.
        This provides project context that improves question quality and draft accuracy.
   - Create `specs/NNN-xxx/draft.md` in the spec directory created in step 3.
   - AI presents choices/proposals → user selects with short answers.
   - Ask ONE question at a time (do not batch questions, do not self-answer).
   - If a question leads to digression:
     1. Try to resolve in ONE exchange.
     2. If unresolved, record in Open Questions and move on.
     3. Open Questions are resolved during spec filling or implementation.
   - When requirements are sufficiently defined, ask the user for approval.
   - Update draft.md with `- [x] User approved this draft` and confirmation date.
   - Transfer Q&A and decisions to spec (step 5).
   - Keep `draft.md` in `specs/` (do not delete).
   - **On complete**: `sdd-forge flow status --step draft --status done`

5. Fill spec before coding.
   - **On start**: `sdd-forge flow status --step fill-spec --status in_progress`
   - **Before writing spec**: Re-read relevant `docs/` chapters identified in step 4.
     If draft was skipped, identify relevant chapters now (same method as step 4).
   - Fill Goal, Scope, Out of Scope, Requirements, Acceptance Criteria.
   - If draft phase was done, reflect draft Q&A and decisions in spec.md.
   - Include "why this approach" rationale.
   - Keep Open Questions only when clarification is still needed.
   - **On complete**: `sdd-forge flow status --step fill-spec --status done`

6. Get explicit user approval.
   - **On start**: `sdd-forge flow status --step approval --status in_progress`
   - Summarize the spec and ask the user for confirmation.
   - Wait for approval before any implementation.
   - Present:
     ```
     ──────────────────────────────────────────────────────────
       Review the spec and approve it.
     ──────────────────────────────────────────────────────────

       [1] Approve
       [2] Revise
       [3] Other

     ```
   - Update `## User Confirmation` with:
     - `- [x] User approved this spec`
     - Confirmation date and short note.
   - **On complete**: Save requirements list and mark step done:
     - Extract Requirements from spec.md and run: `sdd-forge flow status --summary '["req 1", "req 2", ...]'`
     - `sdd-forge flow status --step approval --status done`

7. Run gate.
   - **On start**: `sdd-forge flow status --step gate --status in_progress`
   - `sdd-forge spec gate --spec specs/NNN-xxx/spec.md`
   - If FAIL, resolve issues one by one via Q&A with the user.
   - If you cannot resolve an issue yourself, ask the user directly.
   - Do not proceed until PASS.
   - **On complete**: `sdd-forge flow status --step gate --status done`

8. Test phase (after gate PASS).
   - **On start**: `sdd-forge flow status --step test --status in_progress`
   - **Auto-detect test environment** from analysis.json:
     - Check `extras.packageDeps.devDependencies` for test frameworks (jest, mocha, vitest, phpunit, etc.)
     - Check `extras.packageScripts.test` for test command
     - Use `detectTestEnvironment()` from `src/docs/lib/test-env-detection.js`
   - **If test environment exists**:
     1. Present:
        ```
        ──────────────────────────────────────────────────────────
          Choose test type.
        ──────────────────────────────────────────────────────────

          [1] Write tests based on the spec
          [2] Unit tests
          [3] E2E tests
          [4] Unit tests + E2E

        ```
     2. Present test content (medium granularity — what to verify, not how):
        ```
        The following test content will be used:
        1. <item 1>
        2. <item 2>
        3. <item 3>
        ```
        Then present:
        ```
        ──────────────────────────────────────────────────────────
          Proceeding with the above test content.
        ──────────────────────────────────────────────────────────

          [1] Yes
          [2] Modify

        ```
     3. If 2, iterate until approved.
     4. Write test code (tests should fail initially).
   - **If no test environment**:
     - AI performs spec-implementation alignment check after coding.
     - Compare spec Requirements against actual code changes.
   - **If test environment needs to be set up**:
     - Treat as a separate spec (out of scope for current feature spec).
   - **On complete**: `sdd-forge flow status --step test --status done`
   - **After test step is done**:
     ```
     ──────────────────────────────────────────────────────────
       Planning phase is complete.
       Choose next action.
     ──────────────────────────────────────────────────────────

       [1] Proceed to implementation
       [2] Review the plan
       [3] Other

     ```

## Worktree Mode

When `worktree: true` in flow.json:
- **All file operations (editing, creating, reading) MUST be done inside the worktree directory.** Do not edit files in the main repository.
- Run `sdd-forge flow status` to see the worktree path. Use absolute paths if needed.
- The worktree is an isolated copy — changes in the main repo are NOT visible in the worktree and vice versa.
- Before merge, consider running `git rebase <baseBranch>` in the worktree to incorporate upstream changes and avoid post-merge test failures.

## Hard Stops

- Do not implement before user approval.
- Do not implement when gate FAIL.
- Do not skip test content review when test environment exists.
- Do not proceed to next step without user confirmation.

## Clarification Rule

When requirements are ambiguous, ask concise Q&A before step 7.
Record clarifications in `spec.md` under `## Clarifications (Q&A)` and `## Open Questions`.

## Test Maintenance

- If new tests break existing tests, inform the user and ask how to proceed.
- Do not modify or delete existing tests without user approval.
- If past tests become irrelevant due to feature changes, flag them to the user.

## Commands

```bash
sdd-forge spec init --title "<short-title>" --base <branch>
sdd-forge spec init --title "<short-title>" --no-branch
sdd-forge spec init --title "<short-title>" --base <branch> --worktree
sdd-forge spec guardrail show --phase <draft|spec|impl|lint>
sdd-forge spec gate --spec specs/NNN-xxx/spec.md
sdd-forge flow status
sdd-forge flow status --step <id> --status <val>
sdd-forge flow status --summary '<JSON array>'
sdd-forge flow status --req <index> --status <val>
sdd-forge flow status --request "<text>"
sdd-forge flow status --note "<text>"
sdd-forge flow status --issue <number>
sdd-forge snapshot check
```
