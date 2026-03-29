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

**MUST: Run `sdd-forge flow set step <id> <status>` upon completion of each step to record flow progress.**

Available step IDs (this skill): `approach`, `branch`, `prepare-spec`, `draft`, `spec`, `gate`, `approval`, `test`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## Context Recording (Compaction Resilience)

**MUST: Record the user's original request and key decisions for compaction recovery.**

- After flow.json is created (step 3), record the request: `sdd-forge flow set request "<user's original request>"`
- After each user choice, record: `sdd-forge flow set note "<step>: <choice summary>"`

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
   - **Note**: `flow.json` does not exist yet at this point. Do NOT run `sdd-forge flow set` commands until after step 3.
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

3. Create or select spec (`prepare-spec`).
   - **Before running prepare-spec**, check for uncommitted changes: `git status --short`
     - If dirty, ask the user to commit or stash before proceeding.
     - Do not run `sdd-forge flow run prepare-spec` on a dirty worktree.
   - Commands (based on step 2 choice):
     - Worktree: `sdd-forge flow run prepare-spec --title "..." --base <branch> --worktree`
     - Branch: `sdd-forge flow run prepare-spec --title "..." --base <branch>`
     - No branch: `sdd-forge flow run prepare-spec --title "..." --no-branch`
   - This creates the branch, `specs/NNN-xxx/` directory, `spec.md` skeleton, and `specs/NNN-xxx/flow.json`.
   - The base branch is automatically recorded.
   - **After flow.json is created**, mark steps 1-3 as done:
     - `sdd-forge flow set step approach done`
     - `sdd-forge flow set step branch done`
     - `sdd-forge flow set step prepare-spec done`
   - **If a GitHub Issue number was provided** (e.g. user said "#17" or "issue 17"):
     - Run `sdd-forge flow set issue <number>` to save it in flow.json.

4. Draft phase (if step 1 chose option 1).
   - **On start**: `sdd-forge flow set step draft in_progress`
   - **If skipped** (step 1 chose option 2): `sdd-forge flow set step draft skipped`

   **Communication rules for the draft phase:**
   - **ALL turns MUST end with a question.** The AI must never end a turn without asking the user something.
   - Add progress display `(n/N)` at the start of each question. Get `n` from `sdd-forge flow get qa-count`. `N` is the AI's estimate of remaining questions.
   - After each question: `sdd-forge flow set metric draft question`
   - Present recommendations every turn — concise, with the recommended choice first.
   - Use selection-based questions as default (not free-form). Provide options the user can pick from.
   - For each question, provide your recommended answer with reasoning. Base recommendations on: (1) project docs/, (2) guardrail principles, (3) existing code patterns. State which basis you used.
   - When a decision has obvious related implications, proactively raise them. Do not wait for the user to notice gaps.
   - If a question can be answered by reading docs/ or exploring the codebase, do so first rather than asking the user.
   - Before critiquing a decision, confirm whether the user is brainstorming or deciding. Do not evaluate brainstorming ideas as final decisions.
   - When a discussion digresses, capture key insights and decisions in draft.md before returning to the main thread.
   - **Requirements category checklist** (AI uses internally to check coverage):
     1. Goal & Scope — Is the goal clear? Is scope bounded?
     2. Impact on existing — What existing features/code/tests are affected?
     3. Constraints — Non-functional requirements, guardrails, project rules?
     4. Edge cases — Boundary conditions, error cases?
     5. Test strategy — What to test and how?
   - Draft is RFP/requirements level only. No implementation details or function-level design.
   - **Before starting draft discussion**:
     1. **If a GitHub Issue number is linked** (saved in flow.json via `--issue`):
        Fetch the issue content with `gh issue view <number>` and display the title and body before the first question.
        Use the issue content as context for the draft discussion.
     2. Check docs freshness: compare mtime of `docs/*.md` vs source files.
        If source is newer, suggest `sdd-forge build` to the user and wait for approval.
     3. Load guardrail articles for the draft phase: `sdd-forge flow get guardrail draft`.
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
   - **On complete**: `sdd-forge flow set step draft done`

5. Fill spec (`spec`).
   - **On start**: `sdd-forge flow set step spec in_progress`
   - **Before writing spec**:
     - Read draft (if exists), linked GitHub issue content, analysis.json, and relevant `docs/` chapters.
     - If `docs/` is missing or stale, read existing source code directly.
   - Fill Goal, Scope, Out of Scope, Requirements, Acceptance Criteria.
   - If draft phase was done, reflect draft Q&A and decisions in spec.md.
   - Don't just copy draft — organize and abstract (but don't invent).
   - Unresolved points → Open Questions. Do not fabricate answers.
   - Include "why this approach" rationale.
   - **On complete**: `sdd-forge flow set step spec done`

6. Run gate (BEFORE approval).
   - **On start**: `sdd-forge flow set step gate in_progress`
   - `sdd-forge flow run gate`
   - If FAIL: show ALL failures at once (no per-item user approval needed).
   - AI fixes issues and re-runs gate until PASS. No user confirmation needed per fix — just fix and re-run.
   - Do not proceed until PASS.
   - **On complete**: `sdd-forge flow set step gate done`

7. Get explicit user approval (AFTER gate PASS).
   - **On start**: `sdd-forge flow set step approval in_progress`
   - Present the FULL spec text (the gate-PASS version) to the user.
   - The user reads the gate-passed final spec and approves.
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
     - Extract Requirements from spec.md and run: `sdd-forge flow set summary '["req 1", "req 2", ...]'`
     - `sdd-forge flow set step approval done`

8. Test phase (after approval).
   - **On start**: `sdd-forge flow set step test in_progress`
   - Present:
     ```
     ──────────────────────────────────────────────────────────
       Choose test approach.
     ──────────────────────────────────────────────────────────

       [1] Write test code
       [2] Skip test creation
       [3] Other

     ```
   - If code changes exist, implementation verification test is required in principle.
   - AI decides the appropriate test type based on the project's test infrastructure (no separate test-type selection).
   - AI shares briefly which test framework will be used and what will be verified (not a separate approval gate).
   - If tests can't fit in the project's formal test structure, place them in `specs/<spec>/tests/`.
   - `specs/<spec>/tests/` are kept as history, not maintained long-term.
   - Write test code (tests should fail initially).
   - **If no test environment**:
     - AI performs spec-implementation alignment check after coding.
     - Compare spec Requirements against actual code changes.
   - **If test environment needs to be set up**:
     - Treat as a separate spec (out of scope for current feature spec).
   - **On complete**: `sdd-forge flow set step test done`
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
- Run `sdd-forge flow get status` to see the worktree path. Use absolute paths if needed.
- The worktree is an isolated copy — changes in the main repo are NOT visible in the worktree and vice versa.
- Before merge, consider running `git rebase <baseBranch>` in the worktree to incorporate upstream changes and avoid post-merge test failures.

## Hard Stops

- Do not implement before user approval.
- Do not implement when gate FAIL.
- Do not advance to approval before gate PASS.
- Do not skip implementation verification when code changes exist.
- In draft phase, do not end a turn without a question.
- Do not proceed to next step without user confirmation.

## Clarification Rule

When requirements are ambiguous, ask concise Q&A before step 6.
Record clarifications in `spec.md` under `## Clarifications (Q&A)` and `## Open Questions`.

## Test Maintenance

- If new tests break existing tests, inform the user and ask how to proceed.
- Do not modify or delete existing tests without user approval.
- If past tests become irrelevant due to feature changes, flag them to the user.

## Commands

```bash
sdd-forge flow get status
sdd-forge flow get check <target>
sdd-forge flow get guardrail <phase>
sdd-forge flow get prompt <kind>
sdd-forge flow get qa-count
sdd-forge flow set step <id> <status>
sdd-forge flow set summary '<JSON array>'
sdd-forge flow set req <index> <status>
sdd-forge flow set request "<text>"
sdd-forge flow set note "<text>"
sdd-forge flow set issue <number>
sdd-forge flow set metric <phase> <counter>
sdd-forge flow run prepare-spec --title "..." [--base branch] [--worktree] [--no-branch]
sdd-forge flow run gate
sdd-forge snapshot check
```
