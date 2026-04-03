---
name: sdd-forge.flow-plan
description: Run the SDD planning workflow. Use for spec creation, gate check, and test writing. Covers approach through test phases.
---

# SDD Flow Plan

Run this workflow for any feature or fix request. This skill covers the planning phase: from requirements gathering through test writing.

## Core Principle

<!-- include("@templates/partials/core-principle.md") -->

## Flow Progress Tracking

<!-- include("@templates/partials/flow-tracking.md") -->

Available step IDs (this skill): `approach`, `branch`, `prepare-spec`, `draft`, `gate-draft`, `spec`, `gate`, `approval`, `test`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## Context Recording (Compaction Resilience)

<!-- include("@templates/partials/context-recording.md") -->
- After flow.json is created (step 3), record the request: `sdd-forge flow set request "<user's original request>"`

## Metric Recording (Read Tool)

**MUST: When reading files directly with the Read tool (not via `sdd-forge flow get context`), record the metric:**
- After reading `docs/` files: `sdd-forge flow set metric <current-phase> docsRead`
- After reading `src/` files: `sdd-forge flow set metric <current-phase> srcRead`

The current phase can be determined from the step you are working on (e.g. `draft`, `spec`, `gate`, `test`).
Note: `sdd-forge flow get context` automatically records these metrics via hooks — manual recording is only needed for direct Read tool usage.

## Choice Format

<!-- include("@templates/partials/choice-format.md") -->

## Required Sequence

1. Choose approach.
   - **Note**: `flow.json` does not exist yet at this point. Do NOT run `sdd-forge flow set` commands until after step 3.
   - Run `sdd-forge flow get prompt plan.approach` and present the `description` and `choices` from the response using the Choice Format.
   - Remember the choice for later. Proceed to step 2 regardless.

2. Choose work environment.
   - **Auto-detect**: Check if `.git` is a file (not directory) in the project root.
     - If yes → already in a worktree. Skip choice, use `--no-branch` automatically.
   - **User choice** (if not in a worktree):
     - Run `sdd-forge flow get prompt plan.work-environment` and present the choices.
   - For options 1 and 2:
     - Run `sdd-forge flow get prompt plan.base-branch` and present the choices. Append `` (`<current-branch>`) `` to the description.
     - 1 → use `--base <current-branch>`.
     - 2 → ask which branch and use `--base <user-specified-branch>`.

3. Create or select spec (`prepare-spec`).
   - Run `sdd-forge flow prepare`. If it returns `{ok: false, code: "DIRTY_WORKTREE"}`, run `sdd-forge flow get prompt plan.dirty-worktree` and present the choices. Do not retry until the worktree is clean.
   - The `--title` value becomes the spec directory name and branch name. Keep it short: **max 30 characters**, lowercase English, hyphen-separated (e.g. "fix-scan-parser-bugs", "add-preset-datasources").
   - Commands (based on step 2 choice). Add `--issue <number>` if a GitHub Issue was provided, and `--request "<text>"` with the user's original request:
     - Worktree: `sdd-forge flow prepare --title "..." --base <branch> --worktree [--issue N] [--request "..."]`
     - Branch: `sdd-forge flow prepare --title "..." --base <branch> [--issue N] [--request "..."]`
     - No branch: `sdd-forge flow prepare --title "..." --no-branch [--issue N] [--request "..."]`
   - This creates the branch, `specs/NNN-xxx/` directory, `spec.md` skeleton, and `specs/NNN-xxx/flow.json`.
   - The base branch, issue number, and request are automatically recorded in flow.json.
   - Steps approach/branch/prepare-spec are automatically set to done by prepare-spec.

4. Draft phase (if step 1 chose option 1).
   - **On start**: `sdd-forge flow set step draft in_progress`
   - **If skipped** (step 1 chose option 2): `sdd-forge flow set step draft skipped`

   **autoApprove mode — self-Q&A draft:**
   When `autoApprove: true`, the AI conducts the draft phase autonomously:
   - Do NOT ask the user questions. Instead, answer them yourself.
   - Use Issue content (if linked), `docs/` chapters, guardrail articles, and source code as input.
   - Work through the requirements checklist systematically:
     1. Goal & Scope — Is the goal clear? Is scope bounded?
     2. Impact on existing — What existing features/code/tests are affected?
     3. Constraints — Non-functional requirements, guardrails, project rules?
     4. Edge cases — Boundary conditions, error cases?
     5. Test strategy — What to test and how?
   - Write the completed draft to `draft.md` and proceed to spec.
   - Mark draft as approved: `- [x] User approved this draft (autoApprove)`

   **Communication rules for the draft phase (when NOT autoApprove):**
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
        Fetch the issue content with `sdd-forge flow get issue <number>` and display the title and body before the first question.
        Use the issue content as context for the draft discussion.
     2. Run `sdd-forge flow run scan` to ensure analysis.json is up to date.
     3. Run `sdd-forge flow get context --raw` to understand the project structure. Use this output to identify relevant files and modules.
     4. Run `sdd-forge flow get context --search "<request text or issue title>" --raw` to retrieve related entries with detail. Use the request text or issue title as the search query.
     5. Load guardrail articles for the draft phase: `sdd-forge flow get guardrail draft`.
        If output is non-empty, consider these principles as constraints when asking questions and making proposals.
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

5. Run gate draft (after draft approval, BEFORE spec).
   - **Skip condition**: If step 1 chose option 2 (skip draft), skip this step: `sdd-forge flow set step gate-draft skipped`
   - `sdd-forge flow run gate --phase draft` (step status is automatically managed by hooks: pre sets gate-draft to in_progress, post sets done on PASS)
   - Checks draft.md for: Q&A section, user approval, development type, goal + guardrail AI compliance.
   - If FAIL (`data.result === "fail"`): show ALL failures from `data.artifacts.issues` and `data.artifacts.reasons`. AI fixes draft.md and re-runs gate.
   - **Retry limit: 10 attempts.** If gate does not PASS after 10 fix-and-rerun cycles, STOP and return control to the user.
   - Do not proceed until PASS (`data.result === "pass"`).

6. Fill spec (`spec`).
   - **On start**: `sdd-forge flow set step spec in_progress`
   - **Before writing spec**:
     - Read draft (if exists) and linked GitHub issue content.
     - Run `sdd-forge flow get context --raw` to understand the project structure.
     - Run `sdd-forge flow get context --search "<request text or issue title>" --raw` to retrieve related entries with detail.
     - For files needing deeper understanding, use `sdd-forge flow get context <path> --raw` to read them.
     - Load guardrail articles for the spec phase: `sdd-forge flow get guardrail spec`.
       If output is non-empty, follow these principles when writing the spec.
   - Fill Goal, Scope, Out of Scope, Requirements, Acceptance Criteria.
   - If draft phase was done, reflect draft Q&A and decisions in spec.md.
   - Don't just copy draft — organize and abstract (but don't invent).
   - Unresolved points → Open Questions. Do not fabricate answers.
   - Include "why this approach" rationale.
   - **On complete**: `sdd-forge flow set step spec done`

7. Run gate spec (BEFORE approval).
   - `sdd-forge flow run gate` (step status is automatically managed by hooks: pre sets gate to in_progress, post sets done on PASS)
   - If FAIL (`data.result === "fail"`): show ALL failures from `data.artifacts.issues` and `data.artifacts.reasons`. AI fixes spec.md and re-runs gate.
   - **Retry limit: 20 attempts.** If gate does not PASS after 20 fix-and-rerun cycles, STOP and return control to the user.
   - Do not proceed until PASS (`data.result === "pass"`).

7b. Run spec review (AFTER gate PASS, BEFORE approval).
   - Run `sdd-forge flow run review --phase spec`.
   - The command performs an AI-powered review of spec.md against codebase context to detect oversights.
   - The command internally loops: detect oversights → validate proposals → apply approved fixes → re-detect (up to 3 iterations).
   - If PASS (`data.result === "ok"`, verdict PASS): proceed to gate re-validation (step 7c).
   - If FAIL: display the remaining issues and STOP. Return control to the user.
   - **autoApprove mode:** proceed automatically on PASS.

7c. Re-run gate spec (AFTER spec review, BEFORE approval).
   - Run `sdd-forge flow run gate` to re-validate that spec review's auto-corrections have not introduced guardrail violations.
   - If FAIL: AI fixes spec.md and re-runs gate (same retry limit as step 7).
   - If PASS: proceed to approval.

8. Get explicit user approval (AFTER gate PASS and spec review PASS).
   - **On start**: `sdd-forge flow set step approval in_progress`
   - **Do NOT re-run gate.** The gate already passed in step 7c.
   - Present the FULL spec text (the gate-PASS version) to the user.
   - The user reads the gate-passed final spec and approves.
   - Wait for approval before any implementation.
   - Run `sdd-forge flow get prompt plan.approval` and present the choices.
   - Update `## User Confirmation` with:
     - `- [x] User approved this spec`
     - Confirmation date and short note.
   - **On complete**: Save requirements list and mark step done:
     - Extract Requirements from spec.md and run: `sdd-forge flow set summary '["req 1", "req 2", ...]'`
     - `sdd-forge flow set step approval done`

9. Test phase (after approval).
   - **On start**: `sdd-forge flow set step test in_progress`
   - Run `sdd-forge flow get prompt plan.test-mode` and present the choices.
   - Load guardrail articles for the test phase: `sdd-forge flow get guardrail test`.
     If output is non-empty, follow these principles when writing tests.
   - If code changes exist, implementation verification test is required in principle.
   - AI decides the appropriate test type based on the project's test infrastructure (no separate test-type selection).
   - AI shares briefly which test framework will be used and what will be verified (not a separate approval gate).
   - **MUST: Decide test placement based on these criteria:**
     - **`tests/` (formal tests, run by `npm test`):** Public API / function interface contract tests, CLI command behavior specs, preset integrity checks — tests where breakage indicates a bug regardless of which spec introduced them.
     - **`specs/<spec>/tests/` (spec verification tests, NOT run by `npm test`):** Tests that only verify this spec's requirements are met, bug fix reproduction tests, temporary setup/integration verification. These are kept as history, not maintained long-term.
     - **Decision rule:** Ask "If a future change breaks this test, is that always a bug?" — YES → `tests/`, NO → `specs/<spec>/tests/`.
   - Write test code (tests should fail initially).
   - **MUST: If a test reveals a production code bug that is outside the current spec's scope**, record it in issue-log (`sdd-forge flow set issue-log --step test --reason "..."`) before adjusting the test to match current behavior. Do not silently fix or skip the test.
   - **MUST: Create `specs/<spec>/tests/README.md`** documenting:
     - What was tested and why
     - Where tests are located (formal test path or `specs/<spec>/tests/`)
     - How to run the tests
     - Expected results
   - **If no test environment**:
     - AI performs spec-implementation alignment check after coding.
     - Compare spec Requirements against actual code changes.
   - **If test environment needs to be set up**:
     - Treat as a separate spec (out of scope for current feature spec).
   - **After writing tests**, run test review to check test quality:
     - Run `sdd-forge flow run review --phase test`.
     - The command internally loops: generate test design → compare with test code → auto-fix (up to 3 iterations).
     - If PASS: proceed.
     - If FAIL: display remaining gaps and STOP. Return control to the user.
   - **On complete**: `sdd-forge flow set step test done`
   - **After test step is done**:
     - Run `sdd-forge flow get prompt plan.complete` and present the choices.
     - **autoApprove transition:** If `autoApprove: true`, treat [1] as selected and invoke `/sdd-forge.flow-impl` using the Skill tool.

## Worktree Mode

<!-- include("@templates/partials/worktree-mode.md") -->
- Before merge, consider running `git rebase <baseBranch>` in the worktree to incorporate upstream changes and avoid post-merge test failures.

## Hard Stops

- Do not implement before user approval.
- Do not implement when gate FAIL.
- Do not advance to approval before gate PASS.
- Do not skip implementation verification when code changes exist.
- In draft phase, do not end a turn without a question.
- Do not proceed to next step without user confirmation.

**autoApprove exception:** When `autoApprove: true`, the rules "do not end a turn without a question" and "do not proceed to next step without user confirmation" do NOT apply. All other hard stops remain in effect.

## Issue Log Recording

<!-- include("@templates/partials/issue-log-recording.md") -->

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
sdd-forge flow set issue-log --step <id> --reason "<text>" [--trigger "<text>"] [--resolution "<text>"] [--guardrail-candidate "<text>"]
sdd-forge flow prepare --title "..." [--base branch] [--worktree] [--no-branch] [--issue N] [--request "..."]
sdd-forge flow run gate
sdd-forge snapshot check
```
