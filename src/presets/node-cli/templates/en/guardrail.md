<!-- {%guardrail {phase: [impl]}%} -->
### No Synchronous I/O in Hot Paths
Synchronous I/O (e.g. `readFileSync`) shall not be used inside loops or bulk-processing paths. Use streams or async APIs instead.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### Validate User Input at Entry Point
CLI arguments and stdin input shall be validated at the entry point. Do not pass unvalidated input to internal functions.
<!-- {%/guardrail%} -->
