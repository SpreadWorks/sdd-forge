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

## Context Recording (Compaction Resilience)

**MUST: Record key decisions for compaction recovery.**

- After each user choice, record: `sdd-forge flow status --note "<step>: <choice summary>"`

## Choice Format

選択肢は以下の形式で表示すること:
```
━━━━━━━━━━━━━━━━━━━━━━━━
  説明文（質問や状況の説明）
━━━━━━━━━━━━━━━━━━━━━━━━

  [1] ラベル
  [2] ラベル
  [3] その他

```
- 説明文と選択肢を一文にまとめない。説明文は罫線の中、選択肢は罫線の外。
- 選択肢の前後に空行を入れる。

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
   - Present:
     ```
     ━━━━━━━━━━━━━━━━━━━━━━━━
       実装が完了しました。
       コードレビューを実行します。
     ━━━━━━━━━━━━━━━━━━━━━━━━

       [1] はい
       [2] スキップ
       [3] その他

     ```
     - 2 → `sdd-forge flow status --step review --status skipped` → Step 3 へ
   - Run `sdd-forge flow review` to perform AI-powered code review.
   - **If proposals exist** (APPROVED items in review.md):
     1. Display review summary in this format:
        ```
        レビュー結果: N件の提案があります。

        承認（修正推奨）:
        - #2: <title> — <1行の説明>
        - #5: <title> — <1行の説明>

        却下（対応不要）:
        - #1: <title> — <却下理由>
        - #3: <title> — <却下理由>
        ```
     2. Present:
        ```
        ━━━━━━━━━━━━━━━━━━━━━━━━
          承認された提案を適用します。
        ━━━━━━━━━━━━━━━━━━━━━━━━

          [1] 適用する
          [2] スキップ
          [3] その他

        ```
     3. If 1 → Apply fixes based on approved proposals → Re-run tests to confirm no regressions.
     4. If 2 → Skip fixes, proceed to Step 3.
   - **If no proposals** (NO_PROPOSALS):
     - Display: "レビューの結果、修正の必要はありませんでした"
     - Proceed directly to Step 3 (no user confirmation needed).
   - **On complete**: `sdd-forge flow status --step review --status done`

3. Ask user about finalization.
   - **On start**: `sdd-forge flow status --step finalize --status in_progress`
   - Present:
     ```
     ━━━━━━━━━━━━━━━━━━━━━━━━
       実装とレビューが完了しました。
       次の操作を選択してください。
     ━━━━━━━━━━━━━━━━━━━━━━━━

       [1] 終了処理を開始する
       [2] 修正に戻る
       [3] その他

     ```
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
sdd-forge flow status --note "<text>"
sdd-forge flow review
sdd-forge snapshot check
```
