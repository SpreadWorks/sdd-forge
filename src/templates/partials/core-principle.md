**Confirm with the user before proceeding to the next action at every step of the SDD flow.**
The AI must not advance to the next step on its own.

**Exception — autoApprove mode:**
At the start of each step, run `sdd-forge flow get status`. If `autoApprove: true`:
- Do NOT present choices to the user. Treat choice id=1 as selected and proceed immediately.
- Display progress briefly (e.g. "auto: approach → [1] Q&A" ) so the user can follow along in the console.
- Continue to the next step without waiting for user input.
- If a step fails (command error, gate FAIL, test failure), apply the retry limits defined in each skill. If the retry limit is reached, STOP and return control to the user.
