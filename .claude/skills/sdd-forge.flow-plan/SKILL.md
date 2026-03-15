---
name: sdd-forge.flow-plan
description: Run the SDD planning workflow. Use for spec creation, gate check, and test writing. Covers approach through test phases.
---

# SDD Flow Plan

Run this workflow for any feature or fix request. This skill covers the planning phase: from requirements gathering through test writing.

## Core Principle

**SDD フロー中のすべてのステップで、次の行動について必ずユーザーに確認する。**
AI が勝手に次のステップに進まない。

## Flow Progress Tracking

**MUST: 各ステップの完了時に `sdd-forge flow status --step <id> --status <val>` を実行してフロー進捗を記録する。**

Available step IDs (this skill): `approach`, `branch`, `spec`, `draft`, `fill-spec`, `approval`, `gate`, `test`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## Required Sequence

1. Choose approach.
   - **Note**: `flow.json` does not exist yet at this point. Do NOT run `flow status --step` commands until after step 3.
   - Present EXACTLY these 2 options:

     | # | Label |
     |---|---|
     | 1 | 要件を整理してから仕様書を作成する |
     | 2 | 仕様書を作成する |

   - Remember the choice for later. Proceed to step 2 regardless.

2. Choose branching strategy.
   - **Auto-detect**: Check if `.git` is a file (not directory) in the project root.
     - If yes → already in a worktree. Skip choice, use `--no-branch` automatically.
   - **User choice** (if not in a worktree): Present EXACTLY these 3 options:

     | # | Label | Command |
     |---|---|---|
     | 1 | Branch（デフォルト） | `sdd-forge spec init --title "..." --base <current-branch>` |
     | 2 | Worktree | `sdd-forge spec init --title "..." --base <current-branch> --worktree` |
     | 3 | Spec only | `sdd-forge spec init --title "..." --no-branch` |

   - For options 1 and 2, ask: "現在のブランチ (`<current-branch>`) から分岐します"

     | # | Label |
     |---|---|
     | 1 | はい |
     | 2 | いいえ（ブランチを指定する） |
     | 3 | その他 |

     - 1 → use `--base <current-branch>`.
     - 2 → ask which branch to use as base and use `--base <user-specified-branch>`.
     - 3 → free input.

3. Create or select spec.
   - If no spec exists, run `sdd-forge spec init --title "<short-title>"` (with appropriate flags from step 2).
   - This creates the branch, `specs/NNN-xxx/` directory, `spec.md` skeleton, and `.sdd-forge/flow.json`.
   - The base branch is automatically recorded by `sdd-forge spec init`.
   - **After flow.json is created**, mark steps 1-3 as done:
     - `sdd-forge flow status --step approach --status done`
     - `sdd-forge flow status --step branch --status done`
     - `sdd-forge flow status --step spec --status done`

4. Draft phase (if step 1 chose option 1).
   - **On start**: `sdd-forge flow status --step draft --status in_progress`
   - **If skipped** (step 1 chose option 2): `sdd-forge flow status --step draft --status skipped`
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
   - Fill Goal, Scope, Out of Scope, Requirements, Acceptance Criteria.
   - If draft phase was done, reflect draft Q&A and decisions in spec.md.
   - Include "why this approach" rationale.
   - Keep Open Questions only when clarification is still needed.
   - **On complete**: `sdd-forge flow status --step fill-spec --status done`

6. Get explicit user approval.
   - **On start**: `sdd-forge flow status --step approval --status in_progress`
   - Summarize the spec and ask the user for confirmation.
   - Wait for approval before any implementation.
   - Present EXACTLY these options:

     | # | Label |
     |---|---|
     | 1 | 実装する |
     | 2 | 仕様書を修正する |
     | 3 | その他 |

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
     1. Ask user for test type:

        | # | Label |
        |---|---|
        | 1 | ユニットテスト |
        | 2 | E2Eテスト |
        | 3 | 両方 |
        | 4 | 任せる |

     2. Present test observations (medium granularity — what to verify, not how):
        ```
        以下のテストを実施します:
        1. <observation 1>
        2. <observation 2>
        3. <observation 3>
        ```

        | # | Label |
        |---|---|
        | 1 | はい |
        | 2 | いいえ（変更する） |
        | 3 | その他 |

     3. If 2, iterate until approved.
     4. Write test code (tests should fail initially).
   - **If no test environment**:
     - AI performs spec-implementation alignment check after coding.
     - Compare spec Requirements against actual code changes.
   - **If test environment needs to be set up**:
     - Treat as a separate spec (out of scope for current feature spec).
   - **On complete**: `sdd-forge flow status --step test --status done`
   - **After test step is done**: Tell the user that the planning phase is complete and they can start implementation with `/sdd-forge.flow-impl`.

## Hard Stops

- Do not implement before user approval.
- Do not implement when gate FAIL.
- Do not skip test observation review when test environment exists.
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
sdd-forge spec gate --spec specs/NNN-xxx/spec.md
sdd-forge flow status
sdd-forge flow status --step <id> --status <val>
sdd-forge flow status --summary '<JSON array>'
sdd-forge flow status --req <index> --status <val>
sdd-forge snapshot check
```
