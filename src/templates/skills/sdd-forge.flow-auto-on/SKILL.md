---
name: sdd-forge.flow-auto-on
description: Enable autoApprove mode for the current SDD flow. The AI will automatically select default choices (id=1) and proceed without user confirmation.
---

# SDD Flow Auto ON

Enable autoApprove mode and continue the current flow automatically.

## Procedure

1. Enable autoApprove.
   - Run `sdd-forge flow set auto on`.
   - If it fails (e.g. no active flow), display the error message and STOP.

2. Check current flow state.
   - Run `sdd-forge flow get status`.
   - Note the current `phase` and `steps` to determine where to resume.

3. Resume the appropriate flow skill.
   - Determine which skill to invoke based on the current phase:
     - If any plan-phase steps (approach, branch, prepare-spec, draft, spec, gate, approval, test) are not `done` → invoke `/sdd-forge.flow-plan`
     - If plan is complete but impl-phase steps (implement, review) are not `done` → invoke `/sdd-forge.flow-impl`
     - If impl is complete but finalize-phase steps (commit, push, merge, pr-create, branch-cleanup) are not `done` → invoke `/sdd-forge.flow-finalize`
     - If all steps are done → display "All steps are already complete."
   - Use the Skill tool to invoke the determined skill.
