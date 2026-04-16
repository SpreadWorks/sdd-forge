---
name: sdd-forge.flow-plan
description: Run the SDD planning workflow. Use for spec creation, gate check, and test writing. Covers draft through test phases.
---

# SDD Flow Plan

Run this workflow for any feature or fix request. This skill covers the planning phase: from requirements gathering through test writing.

## Core Principle

<!-- include("@templates/partials/core-principle.md") -->

## Flow Progress Tracking

<!-- include("@templates/partials/flow-tracking.md") -->

Available step IDs (this skill): `branch`, `prepare-spec`, `draft`, `gate-draft`, `spec`, `gate`, `approval`, `test`
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

0. Initialize flow state.
   - **Input parsing rules** — apply these rules to the user's raw input before running `set init`:
     - `#<number>` → always interpret as a GitHub Issue. Capture the number for `--issue`.
     - `issue <number>` or similar explicit forms → treat as a GitHub Issue.
     - `spec <number>` or `specs/<number>-...` → treat as a local spec reference (do not pass as `--issue`).
     - A bare number (e.g., `133`) → ambiguous input. Do not pass as `--issue`; include in the request text so draft Q1 can disambiguate.
   - Run `sdd-forge flow set init [--issue N] [--request "<user raw text>"]` to create a preparing state file (`.active-flow.<runId>`).
   - Save the returned `runId` from `data.runId` for use in step 4.
   - Issue number and request text are stored in the preparing file and will be inherited by `flow prepare --run-id <runId>` in step 4.
   - Do NOT run `sdd-forge flow set` commands that require `flow.json` (step/metric/note/summary/req) until after step 4.

1. Choose work environment.
   - **Auto-detect**: Check if `.git` is a file (not directory) in the project root.
     - If yes → already in a worktree. Skip choice, use `--no-branch` automatically.
   - **User choice** (if not in a worktree):
     - Run `sdd-forge flow get prompt plan.work-environment` and present the choices.

2. Choose base branch.
   - For work-environment options 1 (worktree) and 2 (branch):
     - Run `sdd-forge flow get prompt plan.base-branch` and present the choices. Append `` (`<current-branch>`) `` to the description.
     - 1 → use `--base <current-branch>`.
     - 2 → ask which branch and use `--base <user-specified-branch>`.

3. Draft Q1 — intent confirmation (first user-facing content question).
   - **autoApprove skip**: If `autoApprove: true`, skip this interactive step. Use the Issue content / request text directly as the draft source.
   - If an Issue number was captured in step 0, run `sdd-forge flow get issue <number>` to fetch the title and body.
   - Present a concise summary of the AI's interpretation (from Issue content and/or request text).
   - Ask the user with the Choice Format: `[1] はい [2] 修正する [3] その他`.
   - **Retry limit: 1 round.** If `[3] その他` is selected, ask once more for clarification. If `[3]` is selected again, STOP and return control to the user.
   - If `[2] 修正する`: incorporate the user's correction and re-ask with the Choice Format until `[1]` is selected (within the retry limit).
   - Derive the spec `--title` from the confirmed intent: short, max 30 characters, lowercase English, hyphen-separated (e.g. "fix-scan-parser-bugs").

4. Prepare spec (`prepare-spec`) — internal execution after Q1 approval.
   - This step is not a user prompt; run it silently once Q1 is approved.
   - Commands (based on step 1 choice). The `--run-id <runId>` from step 0 inherits `--issue` and `--request` from the preparing file:
     - Worktree: `sdd-forge flow prepare --title "..." --base <branch> --worktree --run-id <runId>`
     - Branch: `sdd-forge flow prepare --title "..." --base <branch> --run-id <runId>`
     - No branch: `sdd-forge flow prepare --title "..." --no-branch --run-id <runId>`
   - If it returns `{ok: false, code: "DIRTY_WORKTREE"}`, run `sdd-forge flow get prompt plan.dirty-worktree` and present the choices. Do not retry until the worktree is clean. The preparing file is preserved on failure so Q1 state is retained.
   - This creates the branch, `specs/NNN-xxx/` directory, `spec.md` skeleton, and `specs/NNN-xxx/flow.json`.
   - Steps branch/prepare-spec are automatically set to done by prepare-spec.

5. Draft phase (remaining Q&A after Q1).
   - **On start**: `sdd-forge flow set step draft in_progress`

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
     6. Alternatives considered — What other approaches were evaluated? Why was this one chosen?
     7. Future extensibility — How does this change affect future modifications or extensions?
   - **Deep-read trigger:** If the linked Issue body is under 200 characters, read the relevant source code files directly (via Read tool or `sdd-forge flow get context <path> --raw`) to build sufficient understanding before answering the checklist questions.
   - **MUST: draft.md に以下の必須フィールドを含めること（gate-draft で検証される）:**
     - `**開発種別:** ...` — ラベル+コロンの太字形式。見出し形式（`## 開発種別`）では検出されない。英語の場合は `**Development Type:** ...`
     - `**目的:** ...` — ラベル+コロンの太字形式。見出し形式（`## 目的`）では検出されない。英語の場合は `**Goal:** ...`
     - `## Q&A` — `##` レベルの見出し。`###` やインラインテキストでは検出されない。
     - `- [x] User approved this draft` — チェック済みチェックボックスの正確な構文。
   - Write the completed draft to `draft.md` and proceed to spec.
   - Mark draft as approved: `- [x] User approved this draft (autoApprove)`

   **Communication rules for the draft phase (when NOT autoApprove):**
   - **ALL turns MUST end with a question.** The AI must never end a turn without asking the user something.
   - Add progress display `(n/N)` at the start of each question. Get `n` from `sdd-forge flow get qa-count`. `N` is the AI's estimate of remaining questions.
   - After each question: `sdd-forge flow set metric draft question`
   - **MUST: Every question to the user — including confirmations after applying user-requested changes — MUST use the Choice Format. No free-form questions. No exceptions.**
   - **Requirements category checklist** (AI uses internally to check coverage):
     1. Goal & Scope — Is the goal clear? Is scope bounded?
     2. Impact on existing — What existing features/code/tests are affected?
     3. Constraints — Non-functional requirements, guardrails, project rules?
     4. Edge cases — Boundary conditions, error cases?
     5. Test strategy — What to test and how?
     6. Alternatives considered — What other approaches were evaluated? Why was this one chosen?
     7. Future extensibility — How does this change affect future modifications or extensions?
   - **Before starting draft discussion**:
     1. **If a GitHub Issue number is linked** (saved in flow.json via `--issue`):
        Fetch the issue content with `sdd-forge flow get issue <number>` and display the title and body before the first question.
        Use the issue content as context for the draft discussion.
     2. **Context gathering (supplement-first):** Build understanding in tiers — stop as soon as sufficient. Do NOT re-read material already in context.
        - If target files/modules are not yet in context: `sdd-forge flow get context --search "<request text or issue title>" --raw` using the request or issue title as the query.
        - If project structure is still unclear after search: `sdd-forge flow get context --raw` for a broad overview.
     3. If guardrail articles have NOT been loaded in this session: `sdd-forge flow get guardrail draft`. If output is non-empty, consider these principles as constraints. Skip if already present in context.
   - Create `specs/NNN-xxx/draft.md` in the spec directory created in step 4. Record the Q1 exchange (AI summary + user's `[1]` confirmation) as the first Q&A entry.
   - AI presents choices/proposals → user selects with short answers.
   - Ask ONE question at a time (do not batch questions, do not self-answer).
   - If a question leads to digression:
     1. Try to resolve in ONE exchange.
     2. If unresolved, record in Open Questions and move on.
     3. Open Questions are resolved during spec filling or implementation.
   - **MUST: draft.md に以下の必須フィールドを含めること（gate-draft で検証される）:**
     - `**開発種別:** ...` or `**Development Type:** ...` — ラベル+コロン太字形式
     - `**目的:** ...` or `**Goal:** ...` — ラベル+コロン太字形式
     - `## Q&A` — `##` レベルの見出し
     - `- [x] User approved this draft` — チェック済みチェックボックス
   - When requirements are sufficiently defined, ask the user for approval.
   - Update draft.md with `- [x] User approved this draft` and confirmation date.
   - Transfer Q&A and decisions to spec (step 7).
   - Keep `draft.md` in `specs/` (do not delete).
   - **On complete**: `sdd-forge flow set step draft done`

6. Run gate draft (after draft approval, BEFORE spec).
   - `sdd-forge flow run gate --phase draft` (step status is automatically managed by hooks: pre sets gate-draft to in_progress, post sets done on PASS)
   - Checks draft.md for: Q&A section, user approval, development type, goal + guardrail AI compliance.
   - If FAIL (`data.result === "fail"`): show ALL failures from `data.artifacts.issues` and `data.artifacts.reasons`. AI fixes draft.md and re-runs gate.
   - **Retry limit: 10 attempts.** If gate does not PASS after 10 fix-and-rerun cycles, STOP and return control to the user.
   - Do not proceed until PASS (`data.result === "pass"`).

7. Fill spec (`spec`).
   - **On start**: `sdd-forge flow set step spec in_progress`
   - **Before writing spec**:
     - Read draft (if exists) and linked GitHub issue content. If draft was completed, treat it as the primary input — do NOT re-read context already gathered in the draft phase.
     - **Context gathering (supplement-first):** Only read additional context when draft + issue are insufficient.
       - If specific target files are unclear: `sdd-forge flow get context --search "<request text or issue title>" --raw`.
       - If project structure is still unclear: `sdd-forge flow get context <path> --raw` for specific files; `sdd-forge flow get context --raw` only as a last resort.
     - If guardrail articles for spec have NOT been loaded in this session: `sdd-forge flow get guardrail spec`. If output is non-empty, follow these principles. Skip if already present in context.
   - Fill Goal, Scope, Out of Scope, Requirements, Acceptance Criteria, Alternatives Considered (if applicable).
   - If draft phase was done, reflect draft Q&A and decisions in spec.md.
   - **On complete**: `sdd-forge flow set step spec done`

8. Run gate spec (BEFORE approval).
   - `sdd-forge flow run gate` (step status is automatically managed by hooks: pre sets gate to in_progress, post sets done on PASS)
   - If FAIL (`data.result === "fail"`): show ALL failures from `data.artifacts.issues` and `data.artifacts.reasons`. AI fixes spec.md and re-runs gate.
   - **Retry limit: 20 attempts.** If gate does not PASS after 20 fix-and-rerun cycles, STOP and return control to the user.
   - Do not proceed until PASS (`data.result === "pass"`).

9. Get explicit user approval (AFTER gate PASS).
   - **On start**: `sdd-forge flow set step approval in_progress`
   - **Do NOT re-run gate.** The gate already passed in step 8.
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

## CRITICAL: Test Phase — Present Options FIRST

**STOP. Do NOT write tests, choose a test framework, or decide on test strategy. You MUST run `sdd-forge flow get prompt plan.test-mode`, present the choices to the user, and wait for their response before doing anything else in the test phase.**

10. Test phase (after approval).
   - **On start**: `sdd-forge flow set step test in_progress`
   - Run `sdd-forge flow get prompt plan.test-mode` and present the choices.
   - If guardrail articles for the test phase have NOT been loaded in this session: `sdd-forge flow get guardrail test`. If output is non-empty, follow these principles when writing tests. Skip if already present in context.
   - If code changes exist, implementation verification test is required in principle.
   - AI decides the appropriate test type based on the project's test infrastructure (no separate test-type selection).
   - AI shares briefly which test framework will be used and what will be verified (not a separate approval gate).
   - **MUST: Decide test placement based on these criteria:**
     - **`tests/` (formal tests, run by `npm test`):** Public API / function interface contract tests, CLI command behavior specs, preset integrity checks — tests where breakage indicates a bug regardless of which spec introduced them.
     - **`specs/<spec>/tests/` (spec verification tests, NOT run by `npm test`):** Tests that only verify this spec's requirements are met, bug fix reproduction tests, temporary setup/integration verification. These are kept as history, not maintained long-term.
     - **Decision rule:** Ask "If a future change breaks this test, is that always a bug?" — YES → `tests/`, NO → `specs/<spec>/tests/`.
   - **MUST: When running tests, save output to a log file** under the resolved work directory (priority: `SDD_FORGE_WORK_DIR` env > `config.agent.workDir` > `.tmp`): `node tests/run.js ... > <workDir>/logs/test-output.log 2>&1`. This enables `sdd-forge flow get test-result` to retrieve execution evidence for gate-impl.
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
   - **On complete**:
     - Record test counts: `sdd-forge flow set test-summary --unit N --integration N --acceptance N` (use actual counts for each test type written; omit flags for types with zero tests).
     - `sdd-forge flow set step test done`
   - **After test step is done**:
     - Run `sdd-forge flow get prompt plan.complete` and present the choices.
     - **autoApprove transition:** If `autoApprove: true`, treat [1] as selected and invoke `/sdd-forge.flow-impl` using the Skill tool.
     - **Note:** For test-only specs (no production code changes), the impl phase will be automatically skipped in autoApprove mode. See flow-impl SKILL.md for details.

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

When requirements are ambiguous, ask concise Q&A before step 7.
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
