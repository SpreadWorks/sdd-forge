### Backward-Compatible CLI Interface
Removing or changing the meaning of existing commands or options shall include a migration plan in the spec.

### Exit Code Contract
Commands shall not return exit code 0 on failure. Errors shall be signaled via non-zero exit codes.

### Destructive Operations Require Confirmation
Destructive operations (data deletion, overwriting) shall require a `--force` flag or interactive user confirmation.
