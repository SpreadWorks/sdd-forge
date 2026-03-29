When `worktree: true` in flow.json:
- **All file operations (editing, creating, reading) MUST be done inside the worktree directory.** Do not edit files in the main repository.
- Run `sdd-forge flow get status` to see the worktree path. Use absolute paths if needed.
- The worktree is an isolated copy — changes in the main repo are NOT visible in the worktree and vice versa.
