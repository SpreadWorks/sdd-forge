---
name: sdd-forge.flow-auto-off
description: Disable autoApprove mode for the current SDD flow. The AI will resume asking the user for confirmation at each step.
---

# SDD Flow Auto OFF

Disable autoApprove mode.

## Procedure

1. Disable autoApprove.
   - Run `sdd-forge flow set auto off`.
   - If it fails (e.g. no active flow), display the error message and STOP.

2. Confirm.
   - Display: "autoApprove mode has been disabled. The AI will ask for confirmation at each step."
