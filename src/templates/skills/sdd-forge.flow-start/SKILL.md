---
name: sdd-forge.flow-start
description: Run the SDD workflow for any feature or fix request. Use for spec creation, gate check, implementation, and finalization.
---

# SDD Flow Start

Run this workflow for any feature or fix request.

## Core Principle

**SDD フロー中のすべてのステップで、次の行動について必ずユーザーに確認する。**
AI が勝手に次のステップに進まない。

## Flow Progress Tracking

**MUST: 各ステップの完了時に `sdd-forge flow status --step <id> --status <val>` を実行してフロー進捗を記録する。**

Available step IDs: `approach`, `branch`, `spec`, `draft`, `fill-spec`, `approval`, `gate`, `test`, `implement`, `finalize`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## Required Sequence

1. Choose approach.
   - **On start**: `sdd-forge flow status --step approach --status in_progress`
   - Present EXACTLY these 2 options:

     | # | Label | Description |
     |---|---|---|
     | 1 | 要件を整理してから仕様書を作成する | 対話で方針を詰めてから spec を作成します |
     | 2 | 仕様書を作成する | 要件が明確な場合。従来通り spec から開始します |

   - Remember the choice for later. Proceed to step 2 regardless.
   - **On complete**: `sdd-forge flow status --step approach --status done`

2. Choose branching strategy.
   - **On start**: `sdd-forge flow status --step branch --status in_progress`
   - **Auto-detect**: Check if `.git` is a file (not directory) in the project root.
     - If yes → already in a worktree. Skip choice, use `--no-branch` automatically.
   - **User choice** (if not in a worktree): Present EXACTLY these 3 options:

     | # | Label | Description | Command |
     |---|---|---|---|
     | 1 | Branch（デフォルト） | `<current-branch>` から feature ブランチを作成して作業する | `sdd-forge spec --title "..." --base <current-branch>` |
     | 2 | Worktree | git worktree を作成して隔離環境で作業する（`.sdd-forge/worktree/` 配下に自動配置） | `sdd-forge spec --title "..." --base <current-branch> --worktree` |
     | 3 | Spec only | ブランチを作成せず spec ファイルのみ作成する | `sdd-forge spec --title "..." --no-branch` |

   - Ask the user: "現在のブランチ (`<current-branch>`) から分岐してよいですか？" (skip for spec-only mode)
     - If yes → use `--base <current-branch>`.
     - If no → ask which branch to use as base and use `--base <user-specified-branch>`.
   - **On complete**: `sdd-forge flow status --step branch --status done`

3. Create or select spec.
   - **On start**: `sdd-forge flow status --step spec --status in_progress`
   - If no spec exists, run `sdd-forge spec --title "<short-title>"` (with appropriate flags from step 2).
   - This creates the branch, `specs/NNN-xxx/` directory, `spec.md` skeleton, and `.sdd-forge/flow.json`.
   - The base branch is automatically recorded by `sdd-forge spec`.
   - **On complete**: `sdd-forge flow status --step spec --status done`

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

     | # | Label | Description |
     |---|---|---|
     | 1 | 実装する | 手順 7 へ進む |
     | 2 | 仕様書を修正する | フィードバックを受け取り spec.md を修正 → 再度手順 6 へ |
     | 3 | その他 | 自由入力を受け付ける |

   - Update `## User Confirmation` with:
     - `- [x] User approved this spec`
     - Confirmation date and short note.
   - **On complete**: Save requirements list and mark step done:
     - Extract Requirements from spec.md and run: `sdd-forge flow status --summary '["req 1", "req 2", ...]'`
     - `sdd-forge flow status --step approval --status done`

7. Run gate.
   - **On start**: `sdd-forge flow status --step gate --status in_progress`
   - `sdd-forge gate --spec specs/NNN-xxx/spec.md`
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

        よろしいですか？
        ```
     3. Wait for user approval. If user requests changes, iterate until approved.
     4. Write test code (tests should fail initially).
     5. Proceed to implementation (step 9).
   - **If no test environment**:
     - AI performs spec-implementation alignment check after coding.
     - Compare spec Requirements against actual code changes.
   - **If test environment needs to be set up**:
     - Treat as a separate spec (out of scope for current feature spec).
   - **On complete**: `sdd-forge flow status --step test --status done`

9. Implement changes.
   - **On start**: `sdd-forge flow status --step implement --status in_progress`
   - Code only after gate PASS and test phase completion.
   - Aim to make tests pass.
   - **Update requirements as you go**: `sdd-forge flow status --req <index> --status done` for each completed requirement.
   - **On complete**: `sdd-forge flow status --step implement --status done`

10. Ask user about finalization.
    - **On start**: `sdd-forge flow status --step finalize --status in_progress`
    - Ask: "実装内容に問題がなければ終了処理を行いますか？"
    - If approved, immediately invoke `/sdd-flow-close` using the Skill tool (do not wait for additional user input).
    - If the user wants changes, continue implementation.
    - **On complete**: `sdd-forge flow status --step finalize --status done`

## Hard Stops

- Do not implement before user approval.
- Do not implement when gate FAIL.
- Do not finalize without asking the user.
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
sdd-forge spec --title "<short-title>" --base <branch>
sdd-forge spec --title "<short-title>" --no-branch
sdd-forge spec --title "<short-title>" --base <branch> --worktree
sdd-forge gate --spec specs/NNN-xxx/spec.md
sdd-forge flow status
sdd-forge flow status --step <id> --status <val>
sdd-forge flow status --summary '<JSON array>'
sdd-forge flow status --req <index> --status <val>
sdd-forge snapshot check
```
