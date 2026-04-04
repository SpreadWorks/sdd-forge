/**
 * src/flow/lib/phases.js
 *
 * Canonical list of valid flow phases.
 * Imported by get-guardrail, set-metric, review, etc.
 */

export const VALID_PHASES = Object.freeze(["draft", "spec", "gate", "impl", "test", "lint"]);
