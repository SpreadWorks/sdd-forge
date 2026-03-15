---
name: sdd-forge.flow-impl
description: Run the SDD implementation workflow. Use for coding, review iteration, and finalization after planning is complete.
---

# SDD Flow Impl

Run this workflow after the planning phase (flow-plan) is complete. This skill covers implementation, review iteration, and finalization.

## Core Principle

**SDD フロー中のすべてのステップで、次の行動について必ずユーザーに確認する。**
AI が勝手に次のステップに進まない。

## Flow Progress Tracking

**MUST: 各ステップの完了時に `sdd-forge flow status --step <id> --status <val>` を実行してフロー進捗を記録する。**

Available step IDs (this skill): `implement`, `review`, `finalize`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## Prerequisites

Before starting, run `sdd-forge flow status --check impl` to verify prerequisites.
- If PASS, proceed to step 1.
- If FAIL, inform the user which steps are incomplete and stop.

## Required Sequence

1. Implement changes.
   - **On start**: `sdd-forge flow status --step implement --status in_progress`
   - Read the spec to understand requirements.
   - Code only after confirming gate PASS and test phase completion.
   - Aim to make tests pass.
   - **Update requirements as you go**: `sdd-forge flow status --req <index> --status done` for each completed requirement.
   - Run tests to verify: use the test command from `package.json` scripts or the project's test runner.
   - **On complete**: `sdd-forge flow status --step implement --status done`

2. Review implementation (refine iteration).
   - **On start**: `sdd-forge flow status --step review --status in_progress`
   - Present the implementation diff to the user for review:
     - `git diff HEAD` (unstaged changes) or `git diff <base-branch>...HEAD` (all changes on feature branch)
   - Run all tests and report results.
   - Read generated documentation if applicable and check quality.
   - Ask: "実装内容を確認してください。問題はありますか？"
   - Present EXACTLY these options:

     | # | Label | Description |
     |---|---|---|
     | 1 | 問題なし | 手順 3 へ進む |
     | 2 | 修正が必要 | フィードバックを受け取り修正 → 再度手順 2 へ |

   - If the user requests changes:
     1. Apply fixes.
     2. Re-run tests to confirm no regressions.
     3. Re-present diff for review (iterate until approved).
   - **On complete**: `sdd-forge flow status --step review --status done`

3. Ask user about finalization.
   - **On start**: `sdd-forge flow status --step finalize --status in_progress`
   - Ask: "実装内容に問題がなければ終了処理を行いますか？"
   - If approved, immediately invoke `/sdd-forge.flow-merge` using the Skill tool (do not wait for additional user input).
   - If the user wants changes, go back to step 2.
   - **On complete**: `sdd-forge flow status --step finalize --status done`

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
sdd-forge flow status
sdd-forge flow status --check impl
sdd-forge flow status --step <id> --status <val>
sdd-forge flow status --req <index> --status <val>
sdd-forge snapshot check
```
