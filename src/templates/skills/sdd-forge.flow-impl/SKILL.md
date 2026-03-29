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
   - Load guardrail articles for the implementation phase: `sdd-forge flow get guardrail impl`.
     If output is non-empty, follow these principles during implementation.
   - Code only after confirming gate PASS and test phase completion.
   - Aim to make tests pass.
   - **Update requirements as you go**: `sdd-forge flow set req <index> done` for each completed requirement.
   - Run tests to verify: use the test command from `package.json` scripts or the project's test runner.
   - **On complete**: `sdd-forge flow set step implement done`

2. Review implementation.
   - **On start**: `sdd-forge flow set step review in_progress`
   - Present:
     ```
     ──────────────────────────────────────────────────────────
       Implementation is complete. Run code review?
     ──────────────────────────────────────────────────────────

       [1] Yes
       [2] Skip
       [3] Other

     ```
     - 2 → `sdd-forge flow set step review skipped` → Step 3
   - Run `sdd-forge flow run review` to perform AI-powered code review.
   - **If proposals exist** (APPROVED items in review.md):
     1. Display review summary in this format:
        ```
        Code review found N proposal(s).
        N are recommended for application.

        Proposals to apply:
          #2: <title>
              Issue: <why this is a problem>
              Fix: <what to change>

          #5: <title>
              Issue: <why this is a problem>
              Fix: <what to change>

        No action needed:
          #1: <title>
              Reason: <why no action is needed>
        ```
     2. Present:
        ```
        ──────────────────────────────────────────────────────────
          Apply the recommended proposals?
        ──────────────────────────────────────────────────────────

          [1] Apply recommended
          [2] Apply all proposals
          [3] Skip
          [4] Other

        ```
     3. If 1 → Apply fixes based on recommended proposals → Re-run tests to confirm no regressions.
     4. If 2 → Apply all proposals (including those marked as no action needed) → Re-run tests.
     5. If 3 → Skip fixes, proceed to Step 3.
   - **If no proposals** (NO_PROPOSALS):
     - Display: "Review found no issues requiring changes."
     - Proceed directly to Step 3 (no user confirmation needed).
   - **On complete**: `sdd-forge flow set step review done`

3. Ask user about finalization.
   - **On start**: `sdd-forge flow set step finalize in_progress`
   - Present:
     ```
     ──────────────────────────────────────────────────────────
       Implementation and review are complete.
       Choose next action.
     ──────────────────────────────────────────────────────────

       [1] Start finalization
       [2] Return to modifications
       [3] Other

     ```
   - 1 → immediately invoke `/sdd-forge.flow-finalize` using the Skill tool (do not wait for additional user input).
   - 2 → go back to step 2.
   - **On complete**: `sdd-forge flow set step finalize done`

## Worktree Mode

<!-- include("@templates/partials/worktree-mode.md") -->
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
sdd-forge flow get guardrail <draft|spec|impl|lint>
sdd-forge flow get status
sdd-forge flow get check impl
sdd-forge flow set step <id> <val>
sdd-forge flow set req <index> <val>
sdd-forge flow set note "<text>"
sdd-forge flow run review
sdd-forge snapshot check
```
