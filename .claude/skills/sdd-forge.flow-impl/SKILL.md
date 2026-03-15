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

2. Review implementation.
   - **On start**: `sdd-forge flow status --step review --status in_progress`
   - コードレビューを実行します:

     | # | Label |
     |---|---|
     | 1 | はい |
     | 2 | いいえ |
     | 3 | その他 |

     - 2 → `sdd-forge flow status --step review --status skipped` → Step 3 へ
   - Run `sdd-forge flow review` to perform AI-powered code review.
   - **If proposals exist** (APPROVED items in review.md):
     1. Display the approved proposals to the user.
     2. 改善を適用します:

        | # | Label |
        |---|---|
        | 1 | はい |
        | 2 | いいえ |
        | 3 | その他 |

     3. If 1 → Apply fixes based on proposals → Re-run tests to confirm no regressions.
     4. If 2 → Skip fixes, proceed to Step 3.
   - **If no proposals** (NO_PROPOSALS):
     - Display: "レビューの結果、修正の必要はありませんでした"
     - Proceed directly to Step 3 (no user confirmation needed).
   - **On complete**: `sdd-forge flow status --step review --status done`

3. Ask user about finalization.
   - **On start**: `sdd-forge flow status --step finalize --status in_progress`
   - 終了処理を行います:

     | # | Label |
     |---|---|
     | 1 | はい |
     | 2 | いいえ（修正する） |
     | 3 | その他 |

   - 1 → immediately invoke `/sdd-forge.flow-merge` using the Skill tool (do not wait for additional user input).
   - 2 → go back to step 2.
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
sdd-forge flow review
sdd-forge snapshot check
```
