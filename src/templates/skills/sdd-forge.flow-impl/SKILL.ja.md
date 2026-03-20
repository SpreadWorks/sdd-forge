---
name: sdd-forge.flow-impl
description: Run the SDD implementation workflow. Use for coding, review iteration, and finalization after planning is complete.
---

# SDD Flow Impl

Run this workflow after the planning phase (flow-plan) is complete. This skill covers implementation, review iteration, and finalization.

## Core Principle

**Confirm with the user before proceeding to the next action at every step of the SDD flow.**
The AI must not advance to the next step on its own.

## Flow Progress Tracking

**MUST: Run `sdd-forge flow status --step <id> --status <val>` upon completion of each step to record flow progress.**

Available step IDs (this skill): `implement`, `review`, `finalize`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## Context Recording (Compaction Resilience)

**MUST: Record key decisions for compaction recovery.**

- After each user choice, record: `sdd-forge flow status --note "<step>: <choice summary>"`

## Choice Format

Present choices in the following format:
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

## Prerequisites

Before starting, run `sdd-forge flow status --check impl` to verify prerequisites.
- If PASS, proceed to step 1.
- If FAIL, inform the user which steps are incomplete and stop.

## Required Sequence

1. Implement changes.
   - **On start**: `sdd-forge flow status --step implement --status in_progress`
   - Read the spec to understand requirements.
   - Load guardrail articles for the implementation phase: `sdd-forge spec guardrail show --phase impl`.
     If output is non-empty, follow these principles during implementation.
   - Code only after confirming gate PASS and test phase completion.
   - Aim to make tests pass.
   - **Update requirements as you go**: `sdd-forge flow status --req <index> --status done` for each completed requirement.
   - Run tests to verify: use the test command from `package.json` scripts or the project's test runner.
   - **On complete**: `sdd-forge flow status --step implement --status done`

2. Review implementation.
   - **On start**: `sdd-forge flow status --step review --status in_progress`
   - Present:
     ```
     ──────────────────────────────────────────────────────────
       実装が完了しました。
       コードレビューを実行します。
     ──────────────────────────────────────────────────────────

       [1] はい
       [2] スキップ
       [3] その他

     ```
     - 2 → `sdd-forge flow status --step review --status skipped` → Step 3
   - Run `sdd-forge flow review` to perform AI-powered code review.
   - **If proposals exist** (APPROVED items in review.md):
     1. Display review summary in this format:
        ```
        レビュー結果: N件の提案があります。

        承認（修正推奨）:
        - #2: <title> — <one-line description>
        - #5: <title> — <one-line description>

        却下（対応不要）:
        - #1: <title> — <rejection reason>
        - #3: <title> — <rejection reason>
        ```
     2. Present:
        ```
        ──────────────────────────────────────────────────────────
          承認された提案を適用します。
        ──────────────────────────────────────────────────────────

          [1] 適用する
          [2] スキップ
          [3] その他

        ```
     3. If 1 → Apply fixes based on approved proposals → Re-run tests to confirm no regressions.
     4. If 2 → Skip fixes, proceed to Step 3.
   - **If no proposals** (NO_PROPOSALS):
     - Display: "レビューの結果、修正の必要はありませんでした。"
     - Proceed directly to Step 3 (no user confirmation needed).
   - **On complete**: `sdd-forge flow status --step review --status done`

3. Ask user about finalization.
   - **On start**: `sdd-forge flow status --step finalize --status in_progress`
   - Present:
     ```
     ──────────────────────────────────────────────────────────
       実装とレビューが完了しました。
       次の操作を選択してください。
     ──────────────────────────────────────────────────────────

       [1] 終了処理を開始する
       [2] 修正に戻る
       [3] その他

     ```
   - 1 → immediately invoke `/sdd-forge.flow-merge` using the Skill tool (do not wait for additional user input).
   - 2 → go back to step 2.
   - **On complete**: `sdd-forge flow status --step finalize --status done`

## Worktree Mode

When `worktree: true` in flow.json:
- **All file operations (editing, creating, reading) MUST be done inside the worktree directory.** Do not edit files in the main repository.
- Run `sdd-forge flow status` to see the worktree path. Use absolute paths if needed.
- The worktree is an isolated copy — changes in the main repo are NOT visible in the worktree and vice versa.
- Before merge, consider running `git rebase <baseBranch>` in the worktree to incorporate upstream changes and avoid post-merge test failures.

## Hard Stops

- Do not implement before gate PASS and test phase completion.
- Do not finalize without asking the user.
- Do not proceed to next step without user confirmation.

## Test Maintenance

- If new tests break existing tests, inform the user and ask how to proceed.
- Do not modify or delete existing tests without user approval.
- If past tests become irrelevant due to feature changes, flag them to the user.

## Commands

```bash
sdd-forge spec guardrail show --phase <draft|spec|impl|lint>
sdd-forge flow status
sdd-forge flow status --check impl
sdd-forge flow status --step <id> --status <val>
sdd-forge flow status --req <index> --status <val>
sdd-forge flow status --note "<text>"
sdd-forge flow review
sdd-forge snapshot check
```
