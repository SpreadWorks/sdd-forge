---
name: sdd-forge.flow-impl
description: Run the SDD implementation workflow. Use for coding, review iteration, and finalization after planning is complete.
---

# SDD Flow Impl

Run this workflow after the planning phase (flow-plan) is complete. This skill covers implementation, review iteration, and finalization.

## Core Principle

<!-- include("@templates/partials/core-principle.md") -->

## Flow Progress Tracking

<!-- include("@templates/partials/flow-tracking.md") -->

Available step IDs (this skill): `implement`, `review`, `finalize`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## Context Recording (Compaction Resilience)

<!-- include("@templates/partials/context-recording.md") -->

## Choice Format

<!-- include("@templates/partials/choice-format.md") -->

## Prerequisites

Before starting, run `sdd-forge flow get check impl` to verify prerequisites.
- If PASS, proceed to step 1.
- If FAIL, inform the user which steps are incomplete and stop.

## Required Sequence

1. Implement changes.
   - **On start**: `sdd-forge flow set step implement in_progress`
   - Read the spec to understand requirements.
   - Run `sdd-forge flow get context --raw` to understand the project structure. For files needing deeper understanding, use `sdd-forge flow get context <path> --raw`.
   - Load guardrail articles for the implementation phase: `sdd-forge flow get guardrail impl`.
     If output is non-empty, follow these principles during implementation.
   - Code only after confirming gate PASS and test phase completion.
   - Aim to make tests pass.
   - **Update requirements as you go**: `sdd-forge flow set req <index> done` for each completed requirement.
   - Run tests to verify: use the test command from `package.json` scripts or the project's test runner.
   - **Retry limit for test fixes: 5 attempts.** If tests do not pass after 5 fix-and-rerun cycles, STOP and return control to the user.
   - **On complete**: `sdd-forge flow set step implement done`

2. Review implementation.
   - **On start**: `sdd-forge flow set step review in_progress`
   - Present review policy:
     ```
     ──────────────────────────────────────────────────────────
       コードレビューの方針を選択してください。
     ──────────────────────────────────────────────────────────

       [1] コードレビューを行い改善を自動で行う
       [2] コードレビューのみ
       [3] しない

     ```
     - 3 → `sdd-forge flow set step review skipped` → Step 3

   **Option 1 (auto-fix):**
   - Run `sdd-forge flow run review` to perform AI-powered code review.
   - **If proposals exist** (APPROVED items in review.md):
     1. Display review summary:
        ```
        コードレビューの結果、N 件の修正案が見つかりました。
        うち N 件を適用すべきと判断しました。

        適用する修正案:
          #2: <title>
              問題: <なぜこれが問題なのか>
              修正: <どう修正するか>

        対応不要と判断:
          #1: <title>
              理由: <対応不要な理由>
        ```
     2. Apply approved fixes automatically.
     3. Re-run tests to confirm no regressions.
   - **If no proposals** (NO_PROPOSALS):
     - Display: "レビューの結果、修正の必要はありませんでした。"
   - **Retry limit for review: 3 rounds.** If review keeps producing new proposals after 3 review-fix-review cycles, STOP and return control to the user.
   - Proceed to Step 3.

   **Option 2 (review-only):**
   - Run `sdd-forge flow run review` to get all proposals.
   - Present each proposal **one at a time** with `(n/N)` progress display.
   - For each proposal, show concisely:
     - Problem
     - Proposed fix
     - Whether it is needed for this spec
   - End each proposal with a question:
     ```
     ──────────────────────────────────────────────────────────
       (n/N) この指摘に対する対応を選択してください。
     ──────────────────────────────────────────────────────────

       [1] 適用する
       [2] 適用しない
       [3] 修正方針を変える

     ```
   - **Do NOT apply fixes yet** — collect all user responses first.
   - After all proposals are reviewed, apply only the approved ones in bulk.
   - Re-run tests to confirm no regressions.
   - Proceed to Step 3.

   - **On complete**: `sdd-forge flow set step review done`

3. Final confirmation before finalize.
   - **On start**: `sdd-forge flow set step finalize in_progress`
   - Present:
     ```
     ──────────────────────────────────────────────────────────
       実装とレビューが完了しました。次の操作を選択してください。
     ──────────────────────────────────────────────────────────

       [1] 承認する
       [2] 実装内容の概要を確認する
       [3] 実装内容を詳細に確認する
       [4] その他

     ```
   - **Option 1 (approve):** Immediately invoke `/sdd-forge.flow-finalize` using the Skill tool.
   - **Option 2 (overview):** Run `sdd-forge flow run impl-confirm --mode overview`. Display:
     - Changed files list
     - Summary of major changes
     - Whether any changes are outside spec scope
     - Test/verification results
     Then return to this choice prompt.
   - **Option 3 (detail):** Run `sdd-forge flow run impl-confirm --mode detail`. Present requirement-by-requirement:
     - Which spec requirement it addresses
     - Changed files
     - Implementation summary
     - Whether any changes are outside spec scope
     Then return to this choice prompt.
   - **Option 4 (other):** Ask what the user wants to do.
   - **On complete**: `sdd-forge flow set step finalize done`

## Worktree Mode

<!-- include("@templates/partials/worktree-mode.md") -->
- Before merge, consider running `git rebase <baseBranch>` in the worktree to incorporate upstream changes and avoid post-merge test failures.

## Hard Stops

- Do not implement before gate PASS and test phase completion.
- Do not finalize without asking the user.
- Do not proceed to next step without user confirmation.

**autoApprove exception:** When `autoApprove: true`, the rules "do not finalize without asking the user" and "do not proceed to next step without user confirmation" do NOT apply. All other hard stops remain in effect.

## Redo Recording

<!-- include("@templates/partials/redo-recording.md") -->

## Test Maintenance

- If new tests break existing tests, inform the user and ask how to proceed.
- Do not modify or delete existing tests without user approval.
- If past tests become irrelevant due to feature changes, flag them to the user.

## Commands

```bash
sdd-forge flow get guardrail <draft|spec|impl|lint>
sdd-forge flow get status
sdd-forge flow get check impl
sdd-forge flow set step <id> <val>
sdd-forge flow set req <index> <val>
sdd-forge flow set note "<text>"
sdd-forge flow set redo --step <id> --reason "<text>" [--trigger "<text>"] [--resolution "<text>"] [--guardrail-candidate "<text>"]
sdd-forge flow set metric <phase> <counter>
sdd-forge flow run review
sdd-forge flow run impl-confirm --mode <overview|detail>
sdd-forge snapshot check
```
