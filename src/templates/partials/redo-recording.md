**MUST: When a fix, correction, or workaround is needed (e.g., a command fails, a gate check reveals an issue, a test reveals a bug, a design assumption turns out wrong), record it immediately:**

```
sdd-forge flow set redo --step <current-step> --reason "<what went wrong>" --trigger "<what triggered the issue>" --resolution "<how it was fixed>" --guardrail-candidate "<principle to prevent recurrence>"
```

- Do not defer recording — record as soon as the fix is applied.
- `--reason` and `--step` are required. `--trigger`, `--resolution`, `--guardrail-candidate` are optional but recommended.
- This creates `specs/<spec>/redolog.json`. The file persists with the spec.