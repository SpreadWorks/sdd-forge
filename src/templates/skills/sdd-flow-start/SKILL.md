# SDD Flow Start

Run this workflow for any feature or fix request.

## Required Sequence

1. Create or select spec.
   - If no spec exists, run `sdd-forge spec --title "<short-title>"`.
   - Use the resulting `specs/NNN-xxx/spec.md`.
   - The spec path is saved to `.sdd-forge/current-spec`.

2. Create feature branch.
   - Ask the user: "現在のブランチ (`<current-branch>`) から分岐してよいですか？"
   - On approval, create and checkout the feature branch.
   - The base branch is recorded in `.sdd-forge/current-spec` for close.

3. Draft spec before coding.
   - Fill Goal, Scope, Out of Scope, Requirements, Acceptance Criteria.
   - Keep Open Questions only when clarification is still needed.

4. Get explicit user approval.
   - Summarize the spec and ask the user for confirmation.
   - Wait for approval before any implementation.
   - Update `## User Confirmation` with:
     - `- [x] User approved this spec`
     - Confirmation date and short note.

5. Run gate.
   - `sdd-forge gate --spec specs/NNN-xxx/spec.md`
   - If FAIL, resolve issues one by one via Q&A with the user.
   - If you cannot resolve an issue yourself, ask the user directly.
   - Do not proceed until PASS.

6. Implement changes.
   - Code only after gate PASS.

7. Ask user about finalization.
   - Ask: "実装内容に問題がなければ終了処理を行いますか？"
   - If approved, run `/sdd-flow-close`.
   - If the user wants changes, continue implementation.

## Hard Stops

- Do not implement before user approval.
- Do not implement when gate FAIL.
- Do not finalize without asking the user.

## Clarification Rule

When requirements are ambiguous, ask concise Q&A before step 5.
Record clarifications in `spec.md` under `## Clarifications (Q&A)` and `## Open Questions`.

## Commands

```bash
sdd-forge spec --title "<short-title>"
sdd-forge gate --spec specs/NNN-xxx/spec.md
```
