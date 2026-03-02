# SDD Flow Close

Use this skill when implementation is complete and the user approved finalization.

## Required Sequence

1. Load context.
   - Read `.sdd-forge/current-spec` to get spec path and base branch.

2. Check current state.
   - `git rev-parse --abbrev-ref HEAD` — confirm on feature branch.
   - `git status --short` — check uncommitted changes.

3. Update documentation.
   - If `docs/` has no chapter files (`NN_*.md`):
     - Run `sdd-forge build`.
   - If `docs/` already has chapter files:
     - Run `sdd-forge forge --prompt "<change summary>" --spec <spec-path>`.

4. Review documentation.
   - `sdd-forge review`
   - If FAIL, fix issues and re-run. Do not proceed until PASS.

5. Commit all changes on feature branch.
   - Stage relevant files with `git add`.
   - Commit with a clear message describing the changes.

6. Merge into base branch.
   - `git checkout <base-branch>`
   - `git merge --squash <feature-branch>`
   - `git commit`

7. Clean up.
   - Delete the feature branch.
   - Remove `.sdd-forge/current-spec`.

8. Final verification.
   - `git status --short` — confirm tree is clean.
   - Report result to user.

## Hard Stops

- Do not merge if `sdd-forge review` FAIL.
- Do not merge if working tree is not clean.
- Do not use destructive git commands (`reset --hard`, `push --force`).

## Commands

```bash
sdd-forge build
sdd-forge forge --prompt "<change summary>" --spec <spec-path>
sdd-forge review
```
