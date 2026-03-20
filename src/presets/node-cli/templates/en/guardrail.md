### No Synchronous I/O in Hot Paths
<!-- {%meta: {phase: [impl]}%} -->
Synchronous I/O (e.g. `readFileSync`) shall not be used inside loops or bulk-processing paths. Use streams or async APIs instead.

### Validate User Input at Entry Point
<!-- {%meta: {phase: [impl]}%} -->
CLI arguments and stdin input shall be validated at the entry point. Do not pass unvalidated input to internal functions.
