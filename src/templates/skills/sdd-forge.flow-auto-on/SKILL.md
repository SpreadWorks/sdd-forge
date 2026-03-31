---
name: sdd-forge.flow-auto-on
description: Enable autoApprove mode for the current SDD flow. The AI will automatically select default choices (id=1) and proceed without user confirmation.
---

# SDD Flow Auto ON

Enable autoApprove mode and continue the current flow automatically.

## Procedure

1. Check flow state.
   - Run `sdd-forge flow get status`.
   - If the command fails or returns `ok: false`, display: "No active flow. Start a flow first with `/sdd-forge.flow-plan`." and STOP.

2. Verify requirements exist.
   - Check the status response for `request` and `issue` fields.
   - If BOTH `request` is null AND `issue` is null, display: "No request or issue is set. Set one with `sdd-forge flow set request \"...\"` or `sdd-forge flow set issue <number>` before enabling auto mode." and STOP.

3. Enable autoApprove.
   - Run `sdd-forge flow set auto on`.
   - If it fails (`ok: false` or command error), display the error message and STOP.
   - All command failures in this procedure should display the error content and STOP (never swallow errors).

4. Resume the appropriate flow skill.
   - Determine which skill to invoke based on the steps in the status response:
     - If any plan-phase steps (approach, branch, prepare-spec, draft, spec, gate, approval, test) are not `done` → invoke `/sdd-forge.flow-plan`
     - If all plan-phase steps are `done` but impl-phase steps (implement, review, finalize) have any not `done` → invoke `/sdd-forge.flow-impl`
     - If all plan and impl steps are `done` but finalize-phase steps (commit, push, merge, pr-create, branch-cleanup) have any not `done` → invoke `/sdd-forge.flow-finalize`
     - If all steps are `done` → display "All steps are already complete." and STOP.
   - Use the Skill tool to invoke the determined skill.
