---
name: sdd-forge.flow-resume
description: Resume SDD flow after context compaction. Outputs a context summary and guides to the appropriate flow skill.
---

# SDD Flow Resume

Use this skill when context has been lost (e.g. after compaction) and you need to resume an in-progress SDD flow.

## Procedure

1. Run `sdd-forge flow resume` and read the output.
   - If it reports "no active flow", tell the user there is no flow to resume and stop.

2. Display the resume summary to the user in a concise format:
   - What was being worked on (Request)
   - Current progress (phase, step, completed steps)
   - Key notes/decisions made so far

3. Read the spec file (path shown in the summary) to understand full requirements.

4. Determine which skill to invoke based on the current phase:
   - `plan` → Tell the user to run `/sdd-forge.flow-plan`
   - `impl` → Tell the user to run `/sdd-forge.flow-impl`
   - `merge` → Tell the user to run `/sdd-forge.flow-merge`

5. Tell the user which step to continue from and suggest invoking the appropriate skill.

## Notes

- This skill is read-only. It does not modify any files or state.
- The resume command reads flow.json, spec.md, and draft.md to reconstruct context.
- After running this skill, the user should invoke the appropriate flow skill to continue.
