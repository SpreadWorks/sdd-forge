**Confirm with the user before proceeding to the next action at every step of the SDD flow.**
The AI must not advance to the next step on its own.

**autoApprove check (MANDATORY):**
Before presenting any choice to the user, you MUST run `sdd-forge flow get status` and display the `autoApprove` field value. This is not optional — skipping this check is a protocol violation.
- If `autoApprove: false` (or field is missing): present the choice to the user and wait for input.
- If `autoApprove: true`: treat choice id=1 as selected and proceed immediately. Display progress briefly (e.g. "auto: approach → [1] Q&A").
- Continue to the next step without waiting for user input only when `autoApprove: true`.
- If a step fails (command error, gate FAIL, test failure), apply the retry limits defined in each skill. If the retry limit is reached, STOP and return control to the user.

**NEVER run `sdd-forge flow set auto on` yourself.** Only the user can enable autoApprove mode (via `/sdd-forge.flow-auto-on` or explicit instruction). The AI reads `autoApprove` from flow.json but never writes it.

**NEVER chain or background `sdd-forge` commands.** Each `sdd-forge` command must be run as a separate, foreground Bash invocation. Do not use `&&`, `||`, `;`, pipes, or `run_in_background`. Every command's result determines the next action, so it must complete and be read before proceeding.
