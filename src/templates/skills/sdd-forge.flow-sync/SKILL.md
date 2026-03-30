---
name: sdd-forge.flow-sync
description: Sync documentation with code. Use for docs generation, review, and commit.
---

# SDD Flow Sync

Sync documentation with the current codebase. Can be invoked from flow-finalize or run standalone.

## Behavior

- **When invoked from flow-finalize**: Updates documentation and records progress in the spec's flow.json.
- **When run standalone**: Updates documentation only. No flow.json updates.

## Required Sequence

1. Run documentation sync.
   - Display: "ドキュメントを同期しています..."
   - Run `sdd-forge flow run sync`.
   - Display the JSON result to the user.

2. Handle errors.
   - If the result contains an error, display the error message and stop.
   - If the result indicates review failure, inform the user and stop.

## Hard Stops

- Do not proceed if `sdd-forge flow run sync` reports an error.

## Commands

```bash
sdd-forge flow run sync
```
