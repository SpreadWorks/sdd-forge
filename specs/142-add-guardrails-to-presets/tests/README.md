# Spec Verification Tests: 142-add-guardrails-to-presets

## What was tested and why

Verifies that the guardrail additions specified in Issue #93 are correctly implemented:
- R0: `VALID_PHASES` includes "review"
- R1: webapp has 6 new guardrails with correct phases (en/ja)
- R2: php-webapp has 1 new guardrail (en/ja)
- R3: laravel has 6 new guardrails with correct phases (en/ja)
- R4: no-unguarded-mass-assignment updated with review phase and migration text
- R5: NOTICE files exist for webapp, php-webapp, laravel
- R6: en/ja guardrail IDs are symmetric

## Where tests are located

`specs/142-add-guardrails-to-presets/tests/verify-guardrails.test.js`

## How to run

```bash
node --test specs/142-add-guardrails-to-presets/tests/verify-guardrails.test.js
```

## Expected results

All tests should pass after implementation is complete. Tests will fail before implementation (expected).
